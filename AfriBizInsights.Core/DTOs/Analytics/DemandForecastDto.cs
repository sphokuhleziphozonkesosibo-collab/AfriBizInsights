using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AfriBizInsights.Core.DTOs.Analytics;

public class DemandForecastDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public int PredictedUnitsNextMonth { get; set; }
    public decimal DailyRunRate { get; set; }
    public int? StockoutInDays { get; set; }
    public bool StockoutWarning { get; set; }
    public int RecommendedReorderQty { get; set; }
    public decimal ConfidenceScore { get; set; }
}
