using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using AfriBizInsights.Core.DTOs.Analytics;
using AfriBizInsights.Core.DTOs.Expenses;

namespace AfriBizInsights.Core.Interfaces;

public interface IAnalyticsService
{
    Task<DashboardSummaryDto> GetDashboardSummaryAsync();
    Task<List<SalesTrendDto>> GetSalesTrendAsync(int days = 30);
    Task<List<TopProductDto>> GetTopProductsAsync(int limit = 5);
    Task<List<BusinessAlertDto>> GetBusinessAlertsAsync();
    Task<List<DeadStockDto>> GetDeadStockProductsAsync(int inactiveDays = 30);
    Task<ExpenseDto> AddExpenseAsync(CreateExpenseDto dto);
    Task<List<ExpenseDto>> GetRecentExpensesAsync(int limit = 10);
}