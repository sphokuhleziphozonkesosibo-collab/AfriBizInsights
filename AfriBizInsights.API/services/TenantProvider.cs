using System.Security.Claims;
using AfriBizInsights.Core.Interfaces;

namespace AfriBizInsights.API.Services;

public class TenantProvider : ITenantProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? GetCurrentTenantId()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null) return null;

        // 1. Read from JWT Claim
        var tenantClaim = httpContext.User?.FindFirst("TenantId")?.Value;
        if (!string.IsNullOrEmpty(tenantClaim) && Guid.TryParse(tenantClaim, out var tenantIdFromClaim))
        {
            return tenantIdFromClaim;
        }

        // 2. Read from Header "X-Tenant-Id"
        if (httpContext.Request.Headers.TryGetValue("X-Tenant-Id", out var tenantHeader))
        {
            if (Guid.TryParse(tenantHeader, out var tenantIdFromHeader))
            {
                return tenantIdFromHeader;
            }
        }

        return null;
    }
}