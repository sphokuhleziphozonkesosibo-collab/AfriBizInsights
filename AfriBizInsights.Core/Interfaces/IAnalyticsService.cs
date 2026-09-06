using AfriBizInsights.Core.DTOs.Analytics;
using AfriBizInsights.Core.DTOs.Expenses;
using AfriBizInsights.Core.DTOs.Products;

namespace AfriBizInsights.Core.Interfaces;

public interface IAnalyticsService
{
    Task<DashboardSummaryDto> GetDashboardSummaryAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task<List<SalesTrendDto>> GetSalesTrendAsync(int days = 30, DateTime? startDate = null, DateTime? endDate = null);
    Task<List<TopProductDto>> GetTopProductsAsync(int limit = 5, DateTime? startDate = null, DateTime? endDate = null);
    Task<List<TopCustomerDto>> GetTopCustomersAsync(int limit = 10, DateTime? startDate = null, DateTime? endDate = null);
    Task<List<BusinessAlertDto>> GetBusinessAlertsAsync();
    Task<List<DeadStockDto>> GetDeadStockProductsAsync(int inactiveDays = 30);
    Task<List<DemandForecastDto>> GetProductDemandForecastsAsync();
    Task<ExpenseDto> AddExpenseAsync(CreateExpenseDto dto);
    Task<List<ExpenseDto>> GetRecentExpensesAsync(int limit = 10);
    Task<List<ProductDto>> GetAllProductsAsync();
    Task<ProductDto> UpdateProductStockAsync(Guid productId, UpdateProductStockDto dto);
}