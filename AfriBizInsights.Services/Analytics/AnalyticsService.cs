using AfriBizInsights.Core.DTOs.Analytics;
using AfriBizInsights.Core.Interfaces;
using AfriBizInsights.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AfriBizInsights.Services.Analytics;

public class AnalyticsService : IAnalyticsService
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public AnalyticsService(ApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    private async Task<Guid> ResolveTenantIdAsync()
    {
        var tenantId = _tenantProvider.GetCurrentTenantId();
        if (tenantId.HasValue && tenantId.Value != Guid.Empty)
        {
            return tenantId.Value;
        }

        var defaultTenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync();
        if (defaultTenant == null)
        {
            throw new Exception("No business registered in database yet.");
        }
        return defaultTenant.TenantId;
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync()
    {
        var tenantId = await ResolveTenantIdAsync();

        var sales = await _context.Sales
            .IgnoreQueryFilters()
            .Where(s => s.TenantId == tenantId)
            .ToListAsync();

        var totalRevenue = sales.Sum(s => s.TotalAmount);
        var totalOrders = sales.Count;
        var aov = totalOrders > 0 ? Math.Round(totalRevenue / totalOrders, 2) : 0;

        var bestSeller = await _context.SaleItems
            .IgnoreQueryFilters()
            .Where(si => si.TenantId == tenantId)
            .GroupBy(si => si.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                TotalUnits = g.Sum(x => x.Quantity)
            })
            .OrderByDescending(x => x.TotalUnits)
            .FirstOrDefaultAsync();

        string bestSellerName = "None";
        if (bestSeller != null)
        {
            var product = await _context.Products.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.ProductId == bestSeller.ProductId);
            if (product != null)
            {
                bestSellerName = product.Name;
            }
        }

        var lowStockCount = await _context.Products
            .IgnoreQueryFilters()
            .Where(p => p.TenantId == tenantId && p.CurrentStock <= p.ReorderLevel)
            .CountAsync();

        var now = DateTime.UtcNow;
        var currentMonthStart = new DateTime(now.Year, now.Month, 1);
        var prevMonthStart = currentMonthStart.AddMonths(-1);

        var thisMonthRev = sales
            .Where(s => s.SaleDate >= currentMonthStart)
            .Sum(s => s.TotalAmount);

        var prevMonthRev = sales
            .Where(s => s.SaleDate >= prevMonthStart && s.SaleDate < currentMonthStart)
            .Sum(s => s.TotalAmount);

        decimal growthPct = 0;
        if (prevMonthRev > 0)
        {
            growthPct = Math.Round(((thisMonthRev - prevMonthRev) / prevMonthRev) * 100, 2);
        }

        return new DashboardSummaryDto
        {
            TotalRevenue = totalRevenue,
            TotalOrders = totalOrders,
            AverageOrderValue = aov,
            BestSellingProduct = bestSellerName,
            LowStockProductCount = lowStockCount,
            RevenueGrowthPercentage = growthPct
        };
    }

    public async Task<List<SalesTrendDto>> GetSalesTrendAsync(int days = 30)
    {
        var tenantId = await ResolveTenantIdAsync();
        var cutoffDate = DateTime.UtcNow.Date.AddDays(-days);

        var sales = await _context.Sales
            .IgnoreQueryFilters()
            .Where(s => s.TenantId == tenantId && s.SaleDate >= cutoffDate)
            .OrderBy(s => s.SaleDate)
            .ToListAsync();

        var trends = sales
            .GroupBy(s => s.SaleDate.ToString("yyyy-MM-dd"))
            .Select(g => new SalesTrendDto
            {
                Date = g.Key,
                TotalRevenue = g.Sum(x => x.TotalAmount),
                OrderCount = g.Count()
            })
            .OrderBy(t => t.Date)
            .ToList();

        return trends;
    }

    public async Task<List<TopProductDto>> GetTopProductsAsync(int limit = 5)
    {
        var tenantId = await ResolveTenantIdAsync();

        var topItems = await _context.SaleItems
            .IgnoreQueryFilters()
            .Include(si => si.Product)
            .Where(si => si.TenantId == tenantId)
            .GroupBy(si => new { si.ProductId, si.Product.Name, si.Product.Category })
            .Select(g => new TopProductDto
            {
                ProductId = g.Key.ProductId,
                Name = g.Key.Name,
                Category = g.Key.Category,
                TotalUnitsSold = g.Sum(x => x.Quantity),
                TotalRevenueGenerated = g.Sum(x => x.TotalPrice)
            })
            .OrderByDescending(x => x.TotalRevenueGenerated)
            .Take(limit)
            .ToListAsync();

        return topItems;
    }

    public async Task<List<BusinessAlertDto>> GetBusinessAlertsAsync()
    {
        var tenantId = await ResolveTenantIdAsync();
        var alerts = new List<BusinessAlertDto>();

        // Rule 1: Check Low Stock Products
        var lowStockProducts = await _context.Products
            .IgnoreQueryFilters()
            .Where(p => p.TenantId == tenantId && p.CurrentStock <= p.ReorderLevel)
            .ToListAsync();

        foreach (var p in lowStockProducts)
        {
            alerts.Add(new BusinessAlertDto
            {
                AlertId = Guid.NewGuid(),
                AlertType = "StockWarning",
                Severity = p.CurrentStock == 0 ? "Critical" : "High",
                Title = $"Low Stock: {p.Name}",
                Message = $"Only {p.CurrentStock} units remaining (Reorder threshold is {p.ReorderLevel}). Reorder soon to avoid stockouts.",
                CreatedAt = DateTime.UtcNow
            });
        }

        // Rule 2: Identify Top Revenue Driver / Concentration Risk
        var totalRev = await _context.Sales
            .IgnoreQueryFilters()
            .Where(s => s.TenantId == tenantId)
            .SumAsync(s => s.TotalAmount);

        if (totalRev > 0)
        {
            var topProduct = await _context.SaleItems
                .IgnoreQueryFilters()
                .Include(si => si.Product)
                .Where(si => si.TenantId == tenantId)
                .GroupBy(si => new { si.ProductId, si.Product.Name })
                .Select(g => new
                {
                    g.Key.Name,
                    TotalSales = g.Sum(x => x.TotalPrice)
                })
                .OrderByDescending(x => x.TotalSales)
                .FirstOrDefaultAsync();

            if (topProduct != null && (topProduct.TotalSales / totalRev) >= 0.35m)
            {
                var percentage = Math.Round((topProduct.TotalSales / totalRev) * 100, 1);
                alerts.Add(new BusinessAlertDto
                {
                    AlertId = Guid.NewGuid(),
                    AlertType = "Opportunity",
                    Severity = "Medium",
                    Title = $"Top Revenue Driver: {topProduct.Name}",
                    Message = $"{topProduct.Name} generates {percentage}% of your total store revenue. Keep stock levels healthy to maintain sales momentum.",
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        // Rule 3: Positive Baseline Activity Insight
        if (!alerts.Any())
        {
            alerts.Add(new BusinessAlertDto
            {
                AlertId = Guid.NewGuid(),
                AlertType = "Healthy",
                Severity = "Low",
                Title = "Operations Normal",
                Message = "All inventory levels are healthy and no transaction anomalies were detected.",
                CreatedAt = DateTime.UtcNow
            });
        }

        return alerts;
    }
}