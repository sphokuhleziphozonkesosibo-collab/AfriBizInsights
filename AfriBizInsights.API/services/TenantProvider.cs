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
        if (httpContext?.User == null) return null;

        // Extract TenantId strictly from verified JWT claim
        var tenantClaim = httpContext.User.FindFirst("TenantId")?.Value
                          ?? httpContext.User.FindFirst(ClaimTypes.GroupSid)?.Value;

        if (!string.IsNullOrEmpty(tenantClaim) && Guid.TryParse(tenantClaim, out var tenantId))
        {
            return tenantId;
        }

        return null;
    }
}