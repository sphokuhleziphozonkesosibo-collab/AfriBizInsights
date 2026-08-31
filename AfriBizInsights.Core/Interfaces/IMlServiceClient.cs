using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using AfriBizInsights.Core.DTOs.Analytics;

namespace AfriBizInsights.Core.Interfaces;

public interface IMlServiceClient
{
    Task<List<DemandForecastDto>> GetProductDemandForecastsAsync(Guid tenantId);
}