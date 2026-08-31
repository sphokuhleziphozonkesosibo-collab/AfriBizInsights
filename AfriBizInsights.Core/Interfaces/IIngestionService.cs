using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using AfriBizInsights.Core.DTOs.Ingestion;

namespace AfriBizInsights.Core.Interfaces;

public interface IIngestionService
{
    Task<IngestionResultDto> ProcessSalesFileAsync(Stream fileStream, string fileName);
}