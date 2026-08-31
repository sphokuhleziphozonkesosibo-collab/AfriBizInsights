using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AfriBizInsights.Core.Interfaces;

namespace AfriBizInsights.Core.Entities;

public class Expense : ITenantEntity
{
    [Key]
    public Guid ExpenseId { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    [Required]
    [MaxLength(100)]
    public string Category { get; set; } = "General"; // Rent, Utilities, Staff Wages, Transport/Fuel, Packaging, Other

    [Required]
    [MaxLength(250)]
    public string Description { get; set; } = string.Empty;

    [Column(TypeName = "decimal(12,2)")]
    public decimal Amount { get; set; }

    public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}