using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AfriBizInsights.Core.Interfaces;

namespace AfriBizInsights.Core.Entities;

public class SaleItem : ITenantEntity
{
    [Key]
    public Guid SaleItemId { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }

    public Guid SaleId { get; set; }
    public Sale Sale { get; set; } = null!;

    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int Quantity { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal UnitPrice { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal TotalPrice { get; set; }
}
