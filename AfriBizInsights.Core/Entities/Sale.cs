using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AfriBizInsights.Core.Interfaces;

namespace AfriBizInsights.Core.Entities;

public class Sale : ITenantEntity
{
    [Key]
    public Guid SaleId { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    public DateTime SaleDate { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "decimal(12,2)")]
    public decimal TotalAmount { get; set; }

    [MaxLength(50)]
    public string PaymentMethod { get; set; } = "Cash"; // Cash, Card, MobileMoney, EFT

    [MaxLength(150)]
    public string? CustomerIdentifier { get; set; } // Phone number, Name, or Customer ID

    // Navigation property
    public ICollection<SaleItem> Items { get; set; } = new List<SaleItem>();
}
