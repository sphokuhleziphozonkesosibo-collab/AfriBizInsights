using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AfriBizInsights.Core.DTOs.Analytics;

public class DashboardSummaryDto
{
    public decimal TotalRevenue { get; set; }
    public decimal CostOfGoodsSold { get; set; }
    public decimal GrossProfit { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal NetProfit { get; set; }
    public decimal GrossMarginPercentage { get; set; }
    public decimal NetMarginPercentage { get; set; }

    public int TotalOrders { get; set; }
    public decimal AverageOrderValue { get; set; }
    public string BestSellingProduct { get; set; } = "None";
    public int LowStockProductCount { get; set; }
    public decimal RevenueGrowthPercentage { get; set; }
}