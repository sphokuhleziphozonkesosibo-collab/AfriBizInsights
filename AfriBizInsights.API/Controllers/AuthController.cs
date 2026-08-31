using AfriBizInsights.Core.DTOs.Auth;
using AfriBizInsights.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AfriBizInsights.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register-business")]
    public async Task<IActionResult> RegisterBusiness([FromBody] RegisterBusinessDto dto)
    {
        try
        {
            var response = await _authService.RegisterBusinessAsync(dto);
            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var response = await _authService.LoginAsync(dto);
        if (response == null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        return Ok(response);
    }
}
