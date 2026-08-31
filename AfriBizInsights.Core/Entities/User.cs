using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
    public string Role { get; set; } = "Owner"; // Owner, Manager, Staff

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
