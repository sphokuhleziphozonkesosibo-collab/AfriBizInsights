using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
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
    private readonly ITenantProvider _tenantProvider;
    private readonly IEmailService _emailService;

    public AuthService(
        ApplicationDbContext context,
        IConfiguration configuration,
        ITenantProvider tenantProvider,
        IEmailService emailService)
    {
        _context = context;
        _configuration = configuration;
        _tenantProvider = tenantProvider;
        _emailService = emailService;
    }

    private Guid GetAuthenticatedTenantId()
    {
        var tenantId = _tenantProvider.GetCurrentTenantId();
        if (!tenantId.HasValue || tenantId.Value == Guid.Empty)
        {
            throw new UnauthorizedAccessException("Authentication required. No valid business tenant context found.");
        }
        return tenantId.Value;
    }

    private static string GenerateSixDigitCode()
    {
        return RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
    }

    public async Task<AuthResponseDto> RegisterBusinessAsync(RegisterBusinessDto dto)
    {
        var emailExists = await _context.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower().Trim());

        if (emailExists)
        {
            throw new Exception("An account with this email address already exists.");
        }

        var tenant = new Tenant
        {
            TenantId = Guid.NewGuid(),
            BusinessName = dto.BusinessName.Trim(),
            Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "ZAR" : dto.Currency.Trim().ToUpper(),
            Country = string.IsNullOrWhiteSpace(dto.Country) ? "South Africa" : dto.Country.Trim(),
            Industry = string.IsNullOrWhiteSpace(dto.Industry) ? "Retail" : dto.Industry.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        var verificationCode = GenerateSixDigitCode();

        var user = new User
        {
            UserId = Guid.NewGuid(),
            TenantId = tenant.TenantId,
            FullName = dto.OwnerFullName.Trim(),
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "Owner",
            IsEmailVerified = false,
            EmailVerificationCode = verificationCode,
            VerificationCodeExpiresAt = DateTime.UtcNow.AddMinutes(15),
            CreatedAt = DateTime.UtcNow
        };

        await _context.Tenants.AddAsync(tenant);
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        await _emailService.SendVerificationCodeAsync(user.Email, user.FullName, verificationCode);

        return new AuthResponseDto
        {
            Token = string.Empty,
            TenantId = tenant.TenantId,
            BusinessName = tenant.BusinessName,
            Currency = tenant.Currency,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            IsEmailVerified = false,
            DebugCode = verificationCode
        };
    }

    public async Task<AuthResponseDto> VerifyEmailAsync(VerifyEmailDto dto)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower().Trim());

        if (user == null)
        {
            throw new Exception("No account found with this email address.");
        }

        if (user.IsEmailVerified)
        {
            var existingToken = GenerateJwtToken(user, user.Tenant!);
            return new AuthResponseDto
            {
                Token = existingToken,
                TenantId = user.TenantId,
                BusinessName = user.Tenant!.BusinessName,
                Currency = user.Tenant.Currency,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                IsEmailVerified = true
            };
        }

        if (string.IsNullOrWhiteSpace(user.EmailVerificationCode) || user.EmailVerificationCode != dto.Code.Trim())
        {
            throw new Exception("Invalid 6-digit verification code. Please check your email or click 'Resend'.");
        }

        if (!user.VerificationCodeExpiresAt.HasValue || user.VerificationCodeExpiresAt.Value < DateTime.UtcNow)
        {
            throw new Exception("This verification code has expired (15-minute limit). Please click 'Resend'.");
        }

        user.IsEmailVerified = true;
        user.EmailVerificationCode = null;
        user.VerificationCodeExpiresAt = null;
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user, user.Tenant!);

        return new AuthResponseDto
        {
            Token = token,
            TenantId = user.TenantId,
            BusinessName = user.Tenant!.BusinessName,
            Currency = user.Tenant.Currency,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            IsEmailVerified = true
        };
    }

    public async Task ResendVerificationCodeAsync(ResendCodeDto dto)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower().Trim());

        if (user == null || user.IsEmailVerified) return;

        var newCode = GenerateSixDigitCode();
        user.EmailVerificationCode = newCode;
        user.VerificationCodeExpiresAt = DateTime.UtcNow.AddMinutes(15);
        await _context.SaveChangesAsync();

        await _emailService.SendVerificationCodeAsync(user.Email, user.FullName, newCode);
    }

    public async Task ForgotPasswordAsync(ForgotPasswordDto dto)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower().Trim());

        if (user == null) return;

        var resetCode = GenerateSixDigitCode();
        user.PasswordResetCode = resetCode;
        user.ResetCodeExpiresAt = DateTime.UtcNow.AddMinutes(15);
        await _context.SaveChangesAsync();

        await _emailService.SendPasswordResetCodeAsync(user.Email, user.FullName, resetCode);
    }

    public async Task ResetPasswordAsync(ResetPasswordDto dto)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower().Trim());

        if (user == null)
        {
            throw new Exception("Invalid request. User account not found.");
        }

        if (string.IsNullOrWhiteSpace(user.PasswordResetCode) || user.PasswordResetCode != dto.Code.Trim())
        {
            throw new Exception("Invalid 6-digit recovery code.");
        }

        if (!user.ResetCodeExpiresAt.HasValue || user.ResetCodeExpiresAt.Value < DateTime.UtcNow)
        {
            throw new Exception("This recovery code has expired. Please request a new one.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.PasswordResetCode = null;
        user.ResetCodeExpiresAt = null;
        await _context.SaveChangesAsync();
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower().Trim());

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return null;
        }

        if (user.Tenant == null)
        {
            throw new Exception("User account is not linked to an active business.");
        }

        if (!user.IsEmailVerified)
        {
            throw new InvalidOperationException("EmailNotVerified");
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
            Role = user.Role,
            IsEmailVerified = true
        };
    }

    public async Task<List<StaffUserDto>> GetStaffUsersAsync()
    {
        var tenantId = GetAuthenticatedTenantId();

        return await _context.Users
            .Where(u => u.TenantId == tenantId)
            .OrderBy(u => u.FullName)
            .Select(u => new StaffUserDto
            {
                UserId = u.UserId,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<StaffUserDto> CreateStaffUserAsync(CreateStaffUserDto dto)
    {
        var tenantId = GetAuthenticatedTenantId();

        var emailExists = await _context.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower().Trim());

        if (emailExists)
        {
            throw new Exception("A user with this email address already exists.");
        }

        var validRole = dto.Role switch
        {
            "Manager" => "Manager",
            "Staff" => "Staff",
            _ => "Cashier"
        };

        var staff = new User
        {
            UserId = Guid.NewGuid(),
            TenantId = tenantId,
            FullName = dto.FullName.Trim(),
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = validRole,
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow
        };

        await _context.Users.AddAsync(staff);
        await _context.SaveChangesAsync();

        return new StaffUserDto
        {
            UserId = staff.UserId,
            FullName = staff.FullName,
            Email = staff.Email,
            Role = staff.Role,
            CreatedAt = staff.CreatedAt
        };
    }

    public async Task DeleteStaffUserAsync(Guid userId)
    {
        var tenantId = GetAuthenticatedTenantId();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == userId && u.TenantId == tenantId);

        if (user == null)
        {
            throw new KeyNotFoundException("Staff user not found.");
        }

        if (user.Role == "Owner")
        {
            throw new InvalidOperationException("Cannot delete the primary store Owner account.");
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
    }

    private string GenerateJwtToken(User user, Tenant tenant)
    {
        var jwtSecret = _configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
        {
            throw new InvalidOperationException("JWT Secret Key is missing or too short. Configure 'Jwt:Key' in application settings.");
        }

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