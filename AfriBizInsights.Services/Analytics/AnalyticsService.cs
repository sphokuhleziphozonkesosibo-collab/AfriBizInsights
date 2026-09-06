using AfriBizInsights.Core.DTOs.Analytics;
using AfriBizInsights.Core.DTOs.Expenses;
using AfriBizInsights.Core.DTOs.Products;
using AfriBizInsights.Core.Entities;
using AfriBizInsights.Core.Interfaces;
using AfriBizInsights.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AfriBizInsights.Services.Analytics;

public class AnalyticsService : IAnalyticsService
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;
    private readonly IMlServiceClient _mlServiceClient;

    public AnalyticsService(
        ApplicationDbContext context,
        ITenantProvider tenantProvider,
        IMlServiceClient mlServiceClient)
    {
        _context = context;
        _tenantProvider = tenantProvider;
        _mlServiceClient = mlServiceClient;
    }

    private Guid GetAuthenticatedTenantId()
    {
        var tenantId = _tenantProvider.GetCurrentTenantId();
        if (!tenantId.HasValue || tenantId.Value == Guid.Empty)
        {
            throw new UnauthorizedAccessException("Authentication required. No valid business tenant context found.");
        }
        return tenantId.Value;
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var tenantId = GetAuthenticatedTenantId();

        var salesQuery = _context.Sales.Where(s => s.TenantId == tenantId);
        var expenseQuery = _context.Expenses.Where(e => e.TenantId == tenantId);
        var saleItemsQuery = _context.SaleItems.Include(si => si.Product).Include(si => si.Sale).Where(si => si.TenantId == tenantId);

        if (startDate.HasValue)
        {
            salesQuery = salesQuery.Where(s => s.SaleDate >= startDate.Value);
            expenseQuery = expenseQuery.Where(e => e.ExpenseDate >= startDate.Value);
            saleItemsQuery = saleItemsQuery.Where(si => si.Sale.SaleDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
            salesQuery = salesQuery.Where(s => s.SaleDate <= endOfDay);
            expenseQuery = expenseQuery.Where(e => e.ExpenseDate <= endOfDay);
            saleItemsQuery = saleItemsQuery.Where(si => si.Sale.SaleDate <= endOfDay);
        }

        var sales = await salesQuery.ToListAsync();
        var totalRevenue = sales.Sum(s => s.TotalAmount);
        var totalOrders = sales.Count;
        var aov = totalOrders > 0 ? Math.Round(totalRevenue / totalOrders, 2) : 0;

        var saleItems = await saleItemsQuery.ToListAsync();

        decimal cogs = 0;
        foreach (var item in saleItems)
        {
            var unitCost = item.Product != null && item.Product.CostPrice > 0
                ? item.Product.CostPrice
                : item.UnitPrice * 0.7m;
            cogs += unitCost * item.Quantity;
        }

        var expenses = await expenseQuery.ToListAsync();
        var totalExpenses = expenses.Sum(e => e.Amount);
        var grossProfit = totalRevenue - cogs;
        var netProfit = grossProfit - totalExpenses;

        decimal grossMargin = totalRevenue > 0 ? Math.Round((grossProfit / totalRevenue) * 100, 1) : 0;
        decimal netMargin = totalRevenue > 0 ? Math.Round((netProfit / totalRevenue) * 100, 1) : 0;

        // Customer Retention Analytics
        var identifiedCustomers = sales
            .Where(s => !string.IsNullOrWhiteSpace(s.CustomerIdentifier))
            .Select(s => s.CustomerIdentifier!.Trim())
            .ToList();

        var uniqueCustomers = identifiedCustomers.Distinct().Count();
        decimal repeatCustomerPct = 0;

        if (uniqueCustomers > 0)
        {
            var repeatCount = identifiedCustomers
                .GroupBy(c => c)
                .Count(g => g.Count() > 1);

            repeatCustomerPct = Math.Round(((decimal)repeatCount / uniqueCustomers) * 100, 1);
        }

        // Payment Channels Telemetry
        var paymentBreakdown = sales
            .GroupBy(s => string.IsNullOrWhiteSpace(s.PaymentMethod) ? "Cash" : s.PaymentMethod.Trim())
            .Select(g => new PaymentMethodBreakdownDto
            {
                PaymentMethod = g.Key,
                TotalRevenue = g.Sum(x => x.TotalAmount),
                TransactionCount = g.Count(),
                PercentageOfTotal = totalRevenue > 0 ? Math.Round((g.Sum(x => x.TotalAmount) / totalRevenue) * 100, 1) : 0
            })
            .OrderByDescending(p => p.TotalRevenue)
            .ToList();

        var bestSeller = saleItems
            .GroupBy(si => si.ProductId)
            .Select(g => new { ProductId = g.Key, TotalUnits = g.Sum(x => x.Quantity) })
            .OrderByDescending(x => x.TotalUnits)
            .FirstOrDefault();

        string bestSellerName = "None";
        if (bestSeller != null)
        {
            var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == bestSeller.ProductId && p.TenantId == tenantId);
            if (product != null)
            {
                bestSellerName = product.Name;
            }
        }

        var lowStockCount = await _context.Products
            .Where(p => p.TenantId == tenantId && p.CurrentStock <= p.ReorderLevel)
            .CountAsync();

        // Month-over-Month Growth Calculation
        var now = DateTime.UtcNow;
        var currentMonthStart = new DateTime(now.Year, now.Month, 1);
        var prevMonthStart = currentMonthStart.AddMonths(-1);

        var thisMonthRev = await _context.Sales
            .Where(s => s.TenantId == tenantId && s.SaleDate >= currentMonthStart)
            .SumAsync(s => s.TotalAmount);

        var prevMonthRev = await _context.Sales
            .Where(s => s.TenantId == tenantId && s.SaleDate >= prevMonthStart && s.SaleDate < currentMonthStart)
            .SumAsync(s => s.TotalAmount);

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
            RevenueGrowthPercentage = growthPct,
            UniqueCustomerCount = uniqueCustomers,
            RepeatCustomerPercentage = repeatCustomerPct,
            PaymentChannels = paymentBreakdown
        };
    }

    public async Task<List<SalesTrendDto>> GetSalesTrendAsync(int days = 30, DateTime? startDate = null, DateTime? endDate = null)
    {
        var tenantId = GetAuthenticatedTenantId();

        var query = _context.Sales.Where(s => s.TenantId == tenantId);

        if (startDate.HasValue)
        {
            query = query.Where(s => s.SaleDate >= startDate.Value);
        }
        else
        {
            var cutoffDate = DateTime.UtcNow.Date.AddDays(-days);
            query = query.Where(s => s.SaleDate >= cutoffDate);
        }

        if (endDate.HasValue)
        {
            var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(s => s.SaleDate <= endOfDay);
        }

        var sales = await query.OrderBy(s => s.SaleDate).ToListAsync();

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

    public async Task<List<TopProductDto>> GetTopProductsAsync(int limit = 5, DateTime? startDate = null, DateTime? endDate = null)
    {
        var tenantId = GetAuthenticatedTenantId();

        var query = _context.SaleItems
            .Include(si => si.Product)
            .Include(si => si.Sale)
            .Where(si => si.TenantId == tenantId);

        if (startDate.HasValue)
        {
            query = query.Where(si => si.Sale.SaleDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(si => si.Sale.SaleDate <= endOfDay);
        }

        return await query
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

    public async Task<List<TopCustomerDto>> GetTopCustomersAsync(int limit = 10, DateTime? startDate = null, DateTime? endDate = null)
    {
        var tenantId = GetAuthenticatedTenantId();

        var query = _context.Sales
            .Where(s => s.TenantId == tenantId && !string.IsNullOrWhiteSpace(s.CustomerIdentifier));

        if (startDate.HasValue)
        {
            query = query.Where(s => s.SaleDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            var endOfDay = endDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(s => s.SaleDate <= endOfDay);
        }

        var sales = await query.ToListAsync();

        return sales
            .GroupBy(s => s.CustomerIdentifier!.Trim())
            .Select(g => new TopCustomerDto
            {
                CustomerIdentifier = g.Key,
                TotalOrders = g.Count(),
                TotalSpend = g.Sum(x => x.TotalAmount),
                AverageBasketSize = Math.Round(g.Average(x => x.TotalAmount), 2),
                LastPurchaseDate = g.Max(x => x.SaleDate)
            })
            .OrderByDescending(c => c.TotalSpend)
            .Take(limit)
            .ToList();
    }

    public async Task<List<DeadStockDto>> GetDeadStockProductsAsync(int inactiveDays = 30)
    {
        var tenantId = GetAuthenticatedTenantId();
        var cutoff = DateTime.UtcNow.AddDays(-inactiveDays);

        var products = await _context.Products
            .Where(p => p.TenantId == tenantId && p.CurrentStock > 0)
            .ToListAsync();

        var recentSales = await _context.SaleItems
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

    public async Task<List<DemandForecastDto>> GetProductDemandForecastsAsync()
    {
        var tenantId = GetAuthenticatedTenantId();
        return await _mlServiceClient.GetProductDemandForecastsAsync(tenantId);
    }

    public async Task<ExpenseDto> AddExpenseAsync(CreateExpenseDto dto)
    {
        var tenantId = GetAuthenticatedTenantId();

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
        var tenantId = GetAuthenticatedTenantId();

        return await _context.Expenses
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

    public async Task<List<ProductDto>> GetAllProductsAsync()
    {
        var tenantId = GetAuthenticatedTenantId();

        return await _context.Products
            .Where(p => p.TenantId == tenantId)
            .OrderBy(p => p.Name)
            .Select(p => new ProductDto
            {
                ProductId = p.ProductId,
                SKU = p.SKU,
                Name = p.Name,
                Category = p.Category,
                CostPrice = p.CostPrice,
                SellingPrice = p.SellingPrice,
                CurrentStock = p.CurrentStock,
                ReorderLevel = p.ReorderLevel
            })
            .ToListAsync();
    }

    public async Task<ProductDto> UpdateProductStockAsync(Guid productId, UpdateProductStockDto dto)
    {
        var tenantId = GetAuthenticatedTenantId();

        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.ProductId == productId && p.TenantId == tenantId);

        if (product == null)
        {
            throw new KeyNotFoundException("Product not found in this business catalog.");
        }

        product.CurrentStock = dto.CurrentStock;
        if (dto.ReorderLevel.HasValue) product.ReorderLevel = dto.ReorderLevel.Value;
        if (dto.SellingPrice.HasValue) product.SellingPrice = dto.SellingPrice.Value;
        if (dto.CostPrice.HasValue) product.CostPrice = dto.CostPrice.Value;

        await _context.SaveChangesAsync();

        return new ProductDto
        {
            ProductId = product.ProductId,
            SKU = product.SKU,
            Name = product.Name,
            Category = product.Category,
            CostPrice = product.CostPrice,
            SellingPrice = product.SellingPrice,
            CurrentStock = product.CurrentStock,
            ReorderLevel = product.ReorderLevel
        };
    }

    public async Task<List<BusinessAlertDto>> GetBusinessAlertsAsync()
    {
        var tenantId = GetAuthenticatedTenantId();
        var alerts = new List<BusinessAlertDto>();

        // 1. Low Stock Alert
        var lowStockProducts = await _context.Products
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
                Message = $"Only {p.CurrentStock} units remaining (Threshold: {p.ReorderLevel}). Reorder soon to maintain sales momentum.",
                CreatedAt = DateTime.UtcNow
            });
        }

        // 2. Dead Stock Alert
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

        // 3. Profit Margin Alert
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