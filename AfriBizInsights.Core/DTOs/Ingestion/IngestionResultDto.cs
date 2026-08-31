using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AfriBizInsights.Core.DTOs.Ingestion;

public class IngestionResultDto
{
    public bool Success { get; set; }
    public int TotalRowsProcessed { get; set; }
    public int SuccessfulSalesInserted { get; set; }
    public int ProductsCreatedOrUpdated { get; set; }
    public decimal TotalRevenueImported { get; set; }
    public List<string> ValidationErrors { get; set; } = new();
}