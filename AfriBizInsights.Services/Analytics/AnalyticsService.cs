using AfriBizInsights.Core.DTOs.Analytics;
using AfriBizInsights.Core.DTOs.Expenses;
using AfriBizInsights.Core.Entities;
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

        var saleItems = await _context.SaleItems
            .IgnoreQueryFilters()
            .Include(si => si.Product)
            .Where(si => si.TenantId == tenantId)
            .ToListAsync();

        decimal cogs = 0;
        foreach (var item in saleItems)
        {
            var unitCost = item.Product != null && item.Product.CostPrice > 0
                ? item.Product.CostPrice
                : item.UnitPrice * 0.7m;
            cogs += unitCost * item.Quantity;
        }

        var expenses = await _context.Expenses
            .IgnoreQueryFilters()
            .Where(e => e.TenantId == tenantId)
            .ToListAsync();

        var totalExpenses = expenses.Sum(e => e.Amount);
        var grossProfit = totalRevenue - cogs;
        var netProfit = grossProfit - totalExpenses;

        decimal grossMargin = totalRevenue > 0 ? Math.Round((grossProfit / totalRevenue) * 100, 1) : 0;
        decimal netMargin = totalRevenue > 0 ? Math.Round((netProfit / totalRevenue) * 100, 1) : 0;

        var bestSeller = saleItems
            .GroupBy(si => si.ProductId)
            .Select(g => new { ProductId = g.Key, TotalUnits = g.Sum(x => x.Quantity) })
            .OrderByDescending(x => x.TotalUnits)
            .FirstOrDefault();

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

        var thisMonthRev = sales.Where(s => s.SaleDate >= currentMonthStart).Sum(s => s.TotalAmount);
        var prevMonthRev = sales.Where(s => s.SaleDate >= prevMonthStart && s.SaleDate < currentMonthStart).Sum(s => s.TotalAmount);

        decimal growthPct = 0;
        if (prevMonthRev > 0)
        {
            growthPct = Math.Round(((thisMonthRev - prevMonthRev) / prevMonthRev) * 100, 2);
        }

        return new DashboardSummaryDto
        {
            TotalRevenue = totalRevenue,
            CostOfGoodsSold = Math.Round(cogs, 2),
            GrossProfit = Math.Round(grossProfit, 2),
            TotalExpenses = Math.Round(totalExpenses, 2),
            NetProfit = Math.Round(netProfit, 2),
            GrossMarginPercentage = grossMargin,
            NetMarginPercentage = netMargin,
            TotalOrders = totalOrders,
            AverageOrderValue = aov,
            BestSellingProduct = bestSellerName,
            LowStockProductCount = lowStockCount,
            RevenueGrowthPercentage = growthPct
        };
    }

    public async Task<List<DeadStockDto>> GetDeadStockProductsAsync(int inactiveDays = 30)
    {
        var tenantId = await ResolveTenantIdAsync();
        var cutoff = DateTime.UtcNow.AddDays(-inactiveDays);

        var products = await _context.Products
            .IgnoreQueryFilters()
            .Where(p => p.TenantId == tenantId && p.CurrentStock > 0)
            .ToListAsync();

        var recentSales = await _context.SaleItems
            .IgnoreQueryFilters()
            .Include(si => si.Sale)
            .Where(si => si.TenantId == tenantId && si.Sale.SaleDate >= cutoff)
            .Select(si => si.ProductId)
            .Distinct()
            .ToListAsync();

        var deadStock = new List<DeadStockDto>();

        foreach (var p in products)
        {
            if (!recentSales.Contains(p.ProductId))
            {
                var trapped = p.CurrentStock * (p.CostPrice > 0 ? p.CostPrice : p.SellingPrice * 0.7m);
                deadStock.Add(new DeadStockDto
                {
                    ProductId = p.ProductId,
                    Name = p.Name,
                    Category = p.Category,
                    CurrentStock = p.CurrentStock,
                    CostPrice = p.CostPrice,
                    TrappedCapital = Math.Round(trapped, 2),
                    DaysSinceLastSale = inactiveDays,
                    Recommendation = trapped > 5000
                        ? "Run a 20-30% bundle discount or flash sale to unlock trapped cash flow."
                        : "Feature in store front or promote on WhatsApp / Social media."
                });
            }
        }

        return deadStock.OrderByDescending(d => d.TrappedCapital).ToList();
    }

    public async Task<ExpenseDto> AddExpenseAsync(CreateExpenseDto dto)
    {
        var tenantId = await ResolveTenantIdAsync();

        var expense = new Expense
        {
            ExpenseId = Guid.NewGuid(),
            TenantId = tenantId,
            Category = dto.Category,
            Description = dto.Description,
            Amount = dto.Amount,
            ExpenseDate = dto.ExpenseDate ?? DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Expenses.AddAsync(expense);
        await _context.SaveChangesAsync();

        return new ExpenseDto
        {
            ExpenseId = expense.ExpenseId,
            Category = expense.Category,
            Description = expense.Description,
            Amount = expense.Amount,
            ExpenseDate = expense.ExpenseDate
        };
    }

    public async Task<List<ExpenseDto>> GetRecentExpensesAsync(int limit = 10)
    {
        var tenantId = await ResolveTenantIdAsync();

        return await _context.Expenses
            .IgnoreQueryFilters()
            .Where(e => e.TenantId == tenantId)
            .OrderByDescending(e => e.ExpenseDate)
            .Take(limit)
            .Select(e => new ExpenseDto
            {
                ExpenseId = e.ExpenseId,
                Category = e.Category,
                Description = e.Description,
                Amount = e.Amount,
                ExpenseDate = e.ExpenseDate
            })
            .ToListAsync();
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

        return sales
            .GroupBy(s => s.SaleDate.ToString("yyyy-MM-dd"))
            .Select(g => new SalesTrendDto
            {
                Date = g.Key,
                TotalRevenue = g.Sum(x => x.TotalAmount),
                OrderCount = g.Count()
            })
            .OrderBy(t => t.Date)
            .ToList();
    }

    public async Task<List<TopProductDto>> GetTopProductsAsync(int limit = 5)
    {
        var tenantId = await ResolveTenantIdAsync();

        return await _context.SaleItems
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
    }

    public async Task<List<BusinessAlertDto>> GetBusinessAlertsAsync()
    {
        var tenantId = await ResolveTenantIdAsync();
        var alerts = new List<BusinessAlertDto>();

        // 1. Low Stock Alert
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
                Message = $"Only {p.CurrentStock} units remaining (Threshold: {p.ReorderLevel}). Reorder to avoid lost sales.",
                CreatedAt = DateTime.UtcNow
            });
        }

        // 2. Dead Stock / Trapped Cash Alert
        var deadStock = await GetDeadStockProductsAsync(30);
        if (deadStock.Any())
        {
            var totalTrapped = deadStock.Sum(d => d.TrappedCapital);
            alerts.Add(new BusinessAlertDto
            {
                AlertId = Guid.NewGuid(),
                AlertType = "DeadStock",
                Severity = totalTrapped > 10000 ? "Critical" : "High",
                Title = "Trapped Capital in Slow-Moving Stock",
                Message = $"{deadStock.Count} products have had zero sales in the last 30 days, locking up ~R {totalTrapped:N0} in inventory cash flow.",
                CreatedAt = DateTime.UtcNow
            });
        }

        // 3. Profit Margin Health Alert
        var summary = await GetDashboardSummaryAsync();
        if (summary.TotalRevenue > 0 && summary.NetMarginPercentage < 15.0m)
        {
            alerts.Add(new BusinessAlertDto
            {
                AlertId = Guid.NewGuid(),
                AlertType = "MarginAlert",
                Severity = summary.NetMarginPercentage < 5 ? "Critical" : "High",
                Title = "Tight Net Profit Margin",
                Message = $"Your Net Profit Margin is currently {summary.NetMarginPercentage}%. High operating expenses or inventory costs are eating into store earnings.",
                CreatedAt = DateTime.UtcNow
            });
        }

        return alerts;
    }
}