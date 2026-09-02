using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using System.ComponentModel.DataAnnotations;
using AfriBizInsights.Core.Interfaces;

namespace AfriBizInsights.Core.Entities;

public class Supplier : ITenantEntity
{
    [Key]
    public Guid SupplierId { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(100)]
    public string ContactPerson { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Phone { get; set; } = string.Empty;

    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Address { get; set; } = string.Empty;

    public int LeadTimeDays { get; set; } = 3; // Estimated supplier delivery time

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}