using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AfriBizInsights.Core.DTOs.Analytics;

public class DeadStockDto
{
    public Guid ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public decimal CostPrice { get; set; }
    public decimal TrappedCapital { get; set; }
    public int DaysSinceLastSale { get; set; }
    public string Recommendation { get; set; } = string.Empty;
}