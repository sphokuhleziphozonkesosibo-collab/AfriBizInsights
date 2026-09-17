using System.ComponentModel.DataAnnotations;
using AfriBizInsights.Core.Interfaces;

namespace AfriBizInsights.Core.Entities;

public class User : ITenantEntity
{
    [Key]
    public Guid UserId { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    [Required]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Role { get; set; } = "Owner"; // Owner, Manager, Cashier, Staff

    // --- EMAIL VERIFICATION (6-Digit OTP) ---
    public bool IsEmailVerified { get; set; } = true; // Default true so existing accounts aren't locked out!

    [MaxLength(10)]
    public string? EmailVerificationCode { get; set; }

    public DateTime? VerificationCodeExpiresAt { get; set; }

    // --- FORGOT PASSWORD RECOVERY (6-Digit OTP) ---
    [MaxLength(10)]
    public string? PasswordResetCode { get; set; }

    public DateTime? ResetCodeExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}