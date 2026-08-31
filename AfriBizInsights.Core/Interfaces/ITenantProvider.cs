using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AfriBizInsights.Core.Interfaces;

public interface ITenantProvider
{
    Guid? GetCurrentTenantId();
}