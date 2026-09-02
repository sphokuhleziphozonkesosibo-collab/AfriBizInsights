using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using System.ComponentModel.DataAnnotations;

namespace AfriBizInsights.Core.DTOs.Suppliers;

public class CreateSupplierDto
{
    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(100)]
    public string ContactPerson { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Phone { get; set; } = string.Empty;

    [EmailAddress, MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Address { get; set; } = string.Empty;

    [Range(1, 90)]
    public int LeadTimeDays { get; set; } = 3;
}

public class SupplierDto
{
    public Guid SupplierId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int LeadTimeDays { get; set; }
}

public class GeneratePoRequestDto
{
    [Required]
    public Guid ProductId { get; set; }

    [Required]
    public Guid SupplierId { get; set; }

    [Range(1, 100000)]
    public int OrderQuantity { get; set; }

    public string Notes { get; set; } = string.Empty;
}

public class PurchaseOrderDto
{
    public string PoNumber { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string SupplierEmail { get; set; } = string.Empty;
    public string SupplierPhone { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal EstimatedUnitCost { get; set; }
    public decimal EstimatedTotalCost { get; set; }
    public int ExpectedDeliveryDays { get; set; }
    public DateTime OrderDate { get; set; }
    public string Notes { get; set; } = string.Empty;
}
