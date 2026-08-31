using AfriBizInsights.Core.DTOs.Expenses;
using AfriBizInsights.Core.Interfaces;
using AfriBizInsights.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AfriBizInsights.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;
    private readonly IMlServiceClient _mlServiceClient;
    private readonly ITenantProvider _tenantProvider;
    private readonly ApplicationDbContext _context;

    public AnalyticsController(
        IAnalyticsService analyticsService,
        IMlServiceClient mlServiceClient,
        ITenantProvider tenantProvider,
        ApplicationDbContext context)
    {
        _analyticsService = analyticsService;
        _mlServiceClient = mlServiceClient;
        _tenantProvider = tenantProvider;
        _context = context;
    }

    private async Task<Guid> ResolveTenantIdAsync()
    {
        var tenantId = _tenantProvider.GetCurrentTenantId();
        if (tenantId.HasValue && tenantId.Value != Guid.Empty)
        {
            return tenantId.Value;
        }

        var defaultTenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync();
        if (defaultTenant == null)
        {
            throw new Exception("No business registered in database yet.");
        }
        return defaultTenant.TenantId;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetDashboardSummary()
    {
        try
        {
            var summary = await _analyticsService.GetDashboardSummaryAsync();
            return Ok(summary);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("sales-trend")]
    public async Task<IActionResult> GetSalesTrend([FromQuery] int days = 30)
    {
        try
        {
            var trend = await _analyticsService.GetSalesTrendAsync(days);
            return Ok(trend);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("top-products")]
    public async Task<IActionResult> GetTopProducts([FromQuery] int limit = 5)
    {
        try
        {
            var top = await _analyticsService.GetTopProductsAsync(limit);
            return Ok(top);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("alerts")]
    public async Task<IActionResult> GetBusinessAlerts()
    {
        try
        {
            var alerts = await _analyticsService.GetBusinessAlertsAsync();
            return Ok(alerts);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("dead-stock")]
    public async Task<IActionResult> GetDeadStock([FromQuery] int days = 30)
    {
        try
        {
            var deadStock = await _analyticsService.GetDeadStockProductsAsync(days);
            return Ok(deadStock);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("forecasts")]
    public async Task<IActionResult> GetProductDemandForecasts()
    {
        try
        {
            var tenantId = await ResolveTenantIdAsync();
            var forecasts = await _mlServiceClient.GetProductDemandForecastsAsync(tenantId);
            return Ok(forecasts);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("expenses")]
    public async Task<IActionResult> AddExpense([FromBody] CreateExpenseDto dto)
    {
        try
        {
            var expense = await _analyticsService.AddExpenseAsync(dto);
            return Ok(expense);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("expenses")]
    public async Task<IActionResult> GetRecentExpenses([FromQuery] int limit = 10)
    {
        try
        {
            var expenses = await _analyticsService.GetRecentExpensesAsync(limit);
            return Ok(expenses);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}