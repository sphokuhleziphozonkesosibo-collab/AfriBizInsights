using AfriBizInsights.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AfriBizInsights.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class IngestionController : ControllerBase
{
    private readonly IIngestionService _ingestionService;

    public IngestionController(IIngestionService ingestionService)
    {
        _ingestionService = ingestionService;
    }

    [HttpPost("upload-sales")]
    public async Task<IActionResult> UploadSales(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Please select a valid CSV or Excel file." });
        }

        try
        {
            using var stream = file.OpenReadStream();
            var result = await _ingestionService.ProcessSalesFileAsync(stream, file.FileName);

            if (!result.Success && result.ValidationErrors.Any())
            {
                return BadRequest(result);
            }

            return Ok(result);
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
}