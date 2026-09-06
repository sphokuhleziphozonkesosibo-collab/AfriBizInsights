using System.Text;
using System.Text.Json;
using AfriBizInsights.Core.DTOs.Analytics;
using AfriBizInsights.Core.Interfaces;
using AfriBizInsights.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace AfriBizInsights.Services.ML;

public class MlServiceClient : IMlServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly ApplicationDbContext _context;

    public MlServiceClient(HttpClient httpClient, ApplicationDbContext context, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _context = context;
        var baseUrl = configuration["MlService:BaseUrl"] ?? "http://127.0.0.1:8000";
        _httpClient.BaseAddress = new Uri(baseUrl);
    }

    public async Task<List<DemandForecastDto>> GetProductDemandForecastsAsync(Guid tenantId)
    {
        var forecasts = new List<DemandForecastDto>();

        var products = await _context.Products
            .Where(p => p.TenantId == tenantId)
            .Take(10)
            .ToListAsync();

        foreach (var product in products)
        {
            var saleItems = await _context.SaleItems
                .Include(si => si.Sale)
                .Where(si => si.TenantId == tenantId && si.ProductId == product.ProductId)
                .ToListAsync();

            var totalUnitsSold = saleItems.Sum(si => si.Quantity);

            decimal dailyRunRate = 0.5m;
            int predicted30DDemand = 15;

            if (totalUnitsSold > 0)
            {
                dailyRunRate = Math.Max(0.2m, Math.Round((decimal)totalUnitsSold / 30m, 2));
                predicted30DDemand = Math.Max(totalUnitsSold, (int)Math.Ceiling(dailyRunRate * 30m));
            }

            int? stockoutInDays = null;
            if (dailyRunRate > 0)
            {
                stockoutInDays = (int)(product.CurrentStock / dailyRunRate);
            }

            bool isStockoutWarning = stockoutInDays.HasValue && stockoutInDays.Value < 30;

            int reorderQty = 0;
            if (isStockoutWarning || product.CurrentStock <= product.ReorderLevel)
            {
                reorderQty = Math.Max(0, predicted30DDemand - product.CurrentStock + product.ReorderLevel);
            }

            bool pythonSuccess = false;

            try
            {
                var salesHistory = saleItems.Select(si => new
                {
                    date = si.Sale.SaleDate.ToString("yyyy-MM-dd"),
                    quantity = si.Quantity,
                    unit_price = (double)si.UnitPrice
                }).ToList();

                var requestPayload = new
                {
                    product_id = product.ProductId.ToString(),
                    product_name = product.Name,
                    current_stock = product.CurrentStock,
                    reorder_level = product.ReorderLevel,
                    forecast_days = 30,
                    sales_history = salesHistory
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(requestPayload),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync("/predict/demand", content);
                if (response.IsSuccessStatusCode)
                {
                    var responseString = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(responseString);
                    var root = doc.RootElement;

                    forecasts.Add(new DemandForecastDto
                    {
                        ProductId = product.ProductId,
                        ProductName = product.Name,
                        CurrentStock = product.CurrentStock,
                        PredictedUnitsNextMonth = root.GetProperty("predicted_units_next_month").GetInt32(),
                        DailyRunRate = (decimal)root.GetProperty("daily_run_rate").GetDouble(),
                        StockoutInDays = root.TryGetProperty("stockout_in_days", out var sid) && sid.ValueKind != JsonValueKind.Null ? sid.GetInt32() : null,
                        StockoutWarning = root.GetProperty("stockout_warning").GetBoolean(),
                        RecommendedReorderQty = root.GetProperty("recommended_reorder_qty").GetInt32(),
                        ConfidenceScore = (decimal)root.GetProperty("confidence_score").GetDouble()
                    });
                    pythonSuccess = true;
                }
            }
            catch (Exception)
            {
                pythonSuccess = false;
            }

            if (!pythonSuccess)
            {
                forecasts.Add(new DemandForecastDto
                {
                    ProductId = product.ProductId,
                    ProductName = product.Name,
                    CurrentStock = product.CurrentStock,
                    PredictedUnitsNextMonth = predicted30DDemand,
                    DailyRunRate = dailyRunRate,
                    StockoutInDays = stockoutInDays,
                    StockoutWarning = isStockoutWarning,
                    RecommendedReorderQty = reorderQty,
                    ConfidenceScore = totalUnitsSold >= 10 ? 0.85m : 0.60m
                });
            }
        }

        return forecasts;
    }

    public async Task<List<AnomalyItemDto>> DetectSalesAnomaliesAsync(Guid tenantId)
    {
        var anomalies = new List<AnomalyItemDto>();

        var sales = await _context.Sales
            .Where(s => s.TenantId == tenantId)
            .OrderBy(s => s.SaleDate)
            .ToListAsync();

        if (sales.Count < 3) return anomalies;

        var dailyHistory = sales
            .GroupBy(s => s.SaleDate.ToString("yyyy-MM-dd"))
            .Select(g => new
            {
                date = g.Key,
                total_revenue = (double)g.Sum(x => x.TotalAmount),
                order_count = g.Count()
            })
            .ToList();

        // 1. Try Python ML Anomaly Detector over HTTP
        try
        {
            var requestPayload = new { revenue_history = dailyHistory };
            var content = new StringContent(
                JsonSerializer.Serialize(requestPayload),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync("/detect/anomalies", content);
            if (response.IsSuccessStatusCode)
            {
                var responseString = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseString);
                foreach (var item in doc.RootElement.EnumerateArray())
                {
                    anomalies.Add(new AnomalyItemDto
                    {
                        Date = item.GetProperty("date").GetString() ?? "",
                        ActualRevenue = (decimal)item.GetProperty("actual_revenue").GetDouble(),
                        ExpectedRevenue = (decimal)item.GetProperty("expected_revenue").GetDouble(),
                        PercentageDeviation = (decimal)item.GetProperty("percentage_deviation").GetDouble(),
                        Severity = item.GetProperty("severity").GetString() ?? "High",
                        Message = item.GetProperty("message").GetString() ?? ""
                    });
                }
                return anomalies;
            }
        }
        catch (Exception)
        {
            // Python service offline fallback: compute real C# Z-Score math locally
        }

        // 2. Real C# Statistical Z-Score Fallback
        var revenues = dailyHistory.Select(d => d.total_revenue).ToList();
        var avgRev = revenues.Average();
        var sumSquares = revenues.Sum(r => Math.Pow(r - avgRev, 2));
        var stdDev = Math.Sqrt(sumSquares / revenues.Count);

        if (stdDev > 0)
        {
            foreach (var day in dailyHistory)
            {
                var zScore = (day.total_revenue - avgRev) / stdDev;
                if (zScore < -1.5)
                {
                    var dropPct = Math.Round(((avgRev - day.total_revenue) / avgRev) * 100, 1);
                    anomalies.Add(new AnomalyItemDto
                    {
                        Date = day.date,
                        ActualRevenue = (decimal)day.total_revenue,
                        ExpectedRevenue = (decimal)Math.Round(avgRev, 2),
                        PercentageDeviation = (decimal)-dropPct,
                        Severity = dropPct > 50 ? "Critical" : "High",
                        Message = $"Unusual revenue drop detected on {day.date}: Sales were {dropPct}% below your daily baseline."
                    });
                }
            }
        }

        return anomalies;
    }
}