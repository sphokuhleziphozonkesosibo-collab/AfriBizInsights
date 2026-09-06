using AfriBizInsights.Core.DTOs.Auth;
using AfriBizInsights.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
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

    [AllowAnonymous]
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

    [AllowAnonymous]
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

    [Authorize(Roles = "Owner,Manager")]
    [HttpGet("staff")]
    public async Task<IActionResult> GetStaffUsers()
    {
        try
        {
            var staff = await _authService.GetStaffUsersAsync();
            return Ok(staff);
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

    [Authorize(Roles = "Owner,Manager")]
    [HttpPost("staff")]
    public async Task<IActionResult> CreateStaffUser([FromBody] CreateStaffUserDto dto)
    {
        try
        {
            var staff = await _authService.CreateStaffUserAsync(dto);
            return Ok(staff);
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

    [Authorize(Roles = "Owner")]
    [HttpDelete("staff/{userId:guid}")]
    public async Task<IActionResult> DeleteStaffUser(Guid userId)
    {
        try
        {
            await _authService.DeleteStaffUserAsync(userId);
            return Ok(new { message = "Staff account removed successfully." });
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