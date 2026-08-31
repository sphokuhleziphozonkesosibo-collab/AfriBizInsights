using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AfriBizInsights.Core.DTOs.Analytics;

public class BusinessAlertDto
{
    public Guid AlertId { get; set; }
    public string AlertType { get; set; } = "StockWarning"; // StockWarning, FastMover, Opportunity, Anomaly
    public string Severity { get; set; } = "Medium"; // Low, Medium, High, Critical
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}