using AfriBizInsights.Core.DTOs.Auth;

namespace AfriBizInsights.Core.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterBusinessAsync(RegisterBusinessDto dto);
    Task<AuthResponseDto?> LoginAsync(LoginDto dto);
    Task<AuthResponseDto> VerifyEmailAsync(VerifyEmailDto dto);
    Task ResendVerificationCodeAsync(ResendCodeDto dto);
    Task ForgotPasswordAsync(ForgotPasswordDto dto);
    Task ResetPasswordAsync(ResetPasswordDto dto);

    // Staff Management
    Task<List<StaffUserDto>> GetStaffUsersAsync();
    Task<StaffUserDto> CreateStaffUserAsync(CreateStaffUserDto dto);
    Task DeleteStaffUserAsync(Guid userId);
}