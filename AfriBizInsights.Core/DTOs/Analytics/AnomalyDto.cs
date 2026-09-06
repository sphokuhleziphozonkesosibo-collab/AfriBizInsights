using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AfriBizInsights.Core.DTOs.Analytics;

public class AnomalyItemDto
{
    public string Date { get; set; } = string.Empty;
    public decimal ActualRevenue { get; set; }
    public decimal ExpectedRevenue { get; set; }
    public decimal PercentageDeviation { get; set; }
    public string Severity { get; set; } = "High";
    public string Message { get; set; } = string.Empty;
}