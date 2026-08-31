using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using System.ComponentModel.DataAnnotations;
using AfriBizInsights.Core.Interfaces;

namespace AfriBizInsights.Core.Entities;

public class BusinessAlert : ITenantEntity
{
    [Key]
    public Guid AlertId { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    [MaxLength(50)]
    public string AlertType { get; set; } = "StockWarning"; // StockWarning, RevenueDrop, Anomaly, FastMover

    [MaxLength(20)]
    public string Severity { get; set; } = "Medium"; // Low, Medium, High, Critical

    [Required]
    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}