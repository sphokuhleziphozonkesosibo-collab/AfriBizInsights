using AfriBizInsights.Core.DTOs.Expenses;
using AfriBizInsights.Core.DTOs.Products;
using AfriBizInsights.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AfriBizInsights.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;

    public AnalyticsController(IAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetDashboardSummary()
    {
        try
        {
            var summary = await _analyticsService.GetDashboardSummaryAsync();
            return Ok(summary);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
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
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
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
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("top-customers")]
    public async Task<IActionResult> GetTopCustomers([FromQuery] int limit = 10)
    {
        try
        {
            var customers = await _analyticsService.GetTopCustomersAsync(limit);
            return Ok(customers);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
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
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
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
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
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
            var forecasts = await _analyticsService.GetProductDemandForecastsAsync();
            return Ok(forecasts);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
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
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
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
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("products")]
    public async Task<IActionResult> GetAllProducts()
    {
        try
        {
            var products = await _analyticsService.GetAllProductsAsync();
            return Ok(products);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("products/{productId:guid}/stock")]
    public async Task<IActionResult> UpdateProductStock(Guid productId, [FromBody] UpdateProductStockDto dto)
    {
        try
        {
            var updated = await _analyticsService.UpdateProductStockAsync(productId, dto);
            return Ok(updated);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}