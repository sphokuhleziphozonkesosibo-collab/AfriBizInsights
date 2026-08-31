using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AfriBizInsights.Core.DTOs.Auth;
using AfriBizInsights.Core.Entities;
using AfriBizInsights.Core.Interfaces;
using AfriBizInsights.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace AfriBizInsights.Services.Auth;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto> RegisterBusinessAsync(RegisterBusinessDto dto)
    {
        // 1. Check if user email already exists across the platform
        var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower());
        if (emailExists)
        {
            throw new Exception("An account with this email already exists.");
        }

        // 2. Create the Business (Tenant)
        var tenant = new Tenant
        {
            TenantId = Guid.NewGuid(),
            BusinessName = dto.BusinessName,
            Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "ZAR" : dto.Currency.ToUpper(),
            Country = string.IsNullOrWhiteSpace(dto.Country) ? "South Africa" : dto.Country,
            Industry = string.IsNullOrWhiteSpace(dto.Industry) ? "Retail" : dto.Industry,
            CreatedAt = DateTime.UtcNow
        };

        // 3. Create the Owner User
        var user = new User
        {
            UserId = Guid.NewGuid(),
            TenantId = tenant.TenantId,
            FullName = dto.OwnerFullName,
            Email = dto.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "Owner",
            CreatedAt = DateTime.UtcNow
        };

        // 4. Save both in one single atomic transaction
        await _context.Tenants.AddAsync(tenant);
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        // 5. Generate JWT Token
        var token = GenerateJwtToken(user, tenant);

        return new AuthResponseDto
        {
            Token = token,
            TenantId = tenant.TenantId,
            BusinessName = tenant.BusinessName,
            Currency = tenant.Currency,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role
        };
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        // Find user by email (Disable tenant filter for login lookups)
        var user = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return null; // Invalid credentials
        }

        if (user.Tenant == null)
        {
            throw new Exception("User has no associated business tenant.");
        }

        var token = GenerateJwtToken(user, user.Tenant);

        return new AuthResponseDto
        {
            Token = token,
            TenantId = user.TenantId,
            BusinessName = user.Tenant.BusinessName,
            Currency = user.Tenant.Currency,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role
        };
    }

    private string GenerateJwtToken(User user, Tenant tenant)
    {
        var jwtSecret = _configuration["Jwt:Key"] ?? "AfriBiz_Super_Secret_Key_For_Development_Only_2026_Secure_Key_Longer_32chars";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("TenantId", user.TenantId.ToString()),
            new Claim("BusinessName", tenant.BusinessName),
            new Claim("Currency", tenant.Currency)
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "AfriBizInsights",
            audience: _configuration["Jwt:Audience"] ?? "AfriBizInsightsClient",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}