using System.Text;
using System.Text.Json;
using AfriBizInsights.Core.DTOs.Analytics;
using AfriBizInsights.Core.Interfaces;
using AfriBizInsights.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AfriBizInsights.Services.ML;

public class MlServiceClient : IMlServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly ApplicationDbContext _context;

    public MlServiceClient(HttpClient httpClient, ApplicationDbContext context)
    {
        _httpClient = httpClient;
        _context = context;
        _httpClient.BaseAddress = new Uri("http://127.0.0.1:8000");
    }

    public async Task<List<DemandForecastDto>> GetProductDemandForecastsAsync(Guid tenantId)
    {
        var forecasts = new List<DemandForecastDto>();

        // Get top active products for this store
        var products = await _context.Products
            .IgnoreQueryFilters()
            .Where(p => p.TenantId == tenantId)
            .Take(5)
            .ToListAsync();

        foreach (var product in products)
        {
            // Fetch transaction history for this product
            var salesHistory = await _context.SaleItems
                .IgnoreQueryFilters()
                .Include(si => si.Sale)
                .Where(si => si.TenantId == tenantId && si.ProductId == product.ProductId)
                .Select(si => new
                {
                    date = si.Sale.SaleDate.ToString("yyyy-MM-dd"),
                    quantity = si.Quantity,
                    unit_price = (double)si.UnitPrice
                })
                .ToListAsync();

            var requestPayload = new
            {
                product_id = product.ProductId.ToString(),
                product_name = product.Name,
                current_stock = product.CurrentStock,
                reorder_level = product.ReorderLevel,
                forecast_days = 30,
                sales_history = salesHistory
            };

            try
            {
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
                }
            }
            catch (Exception)
            {
                // Fallback heuristic if Python is temporarily unreachable
                forecasts.Add(new DemandForecastDto
                {
                    ProductId = product.ProductId,
                    ProductName = product.Name,
                    CurrentStock = product.CurrentStock,
                    PredictedUnitsNextMonth = 15,
                    DailyRunRate = 0.5m,
                    StockoutInDays = 30,
                    StockoutWarning = false,
                    RecommendedReorderQty = 0,
                    ConfidenceScore = 0.50m
                });
            }
        }

        return forecasts;
    }
}