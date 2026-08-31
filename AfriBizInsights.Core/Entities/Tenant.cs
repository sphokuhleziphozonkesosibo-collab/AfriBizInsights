using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using System.ComponentModel.DataAnnotations;

namespace AfriBizInsights.Core.Entities;

public class Tenant
{
    [Key]
    public Guid TenantId { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(150)]
    public string BusinessName { get; set; } = string.Empty;

    [MaxLength(10)]
    public string Currency { get; set; } = "ZAR"; // e.g. ZAR, KES, NGN, USD

    [MaxLength(100)]
    public string Country { get; set; } = "South Africa";

    [MaxLength(100)]
    public string Industry { get; set; } = "Retail"; // Retail, Wholesale, Services, etc.

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<Sale> Sales { get; set; } = new List<Sale>();
}
