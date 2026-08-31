using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AfriBizInsights.Core.DTOs.Ingestion;

public class RawSalesRecordDto
{
    public string DateString { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string? SKU { get; set; }
    public string QuantityString { get; set; } = "1";
    public string UnitPriceString { get; set; } = "0";
    public string? CostPriceString { get; set; }
    public string? CustomerIdentifier { get; set; }
    public string? PaymentMethod { get; set; }
}
