using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AfriBizInsights.Core.DTOs.Analytics;

public class DashboardSummaryDto
{
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public decimal AverageOrderValue { get; set; }
    public string BestSellingProduct { get; set; } = "N/A";
    public int LowStockProductCount { get; set; }
    public decimal RevenueGrowthPercentage { get; set; }
}