using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AfriBizInsights.Core.Interfaces;

namespace AfriBizInsights.Core.Entities;

public class Product : ITenantEntity
{
    [Key]
    public Guid ProductId { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    [MaxLength(50)]
    public string? SKU { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Category { get; set; } = "General";

    [Column(TypeName = "decimal(12,2)")]
    public decimal CostPrice { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal SellingPrice { get; set; }

    public int CurrentStock { get; set; } = 0;

    public int ReorderLevel { get; set; } = 10;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}