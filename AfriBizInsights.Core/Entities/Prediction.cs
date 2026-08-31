using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using AfriBizInsights.Core.Interfaces;

namespace AfriBizInsights.Core.Entities;

public class Prediction : ITenantEntity
{
    [Key]
    public Guid PredictionId { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    public Guid? ProductId { get; set; }
    public Product? Product { get; set; }

    [Required]
    [MaxLength(30)]
    public string TargetPeriod { get; set; } = string.Empty; // e.g., "September 2026", "Week 36"

    [Column(TypeName = "decimal(12,2)")]
    public decimal PredictedUnitsOrValue { get; set; }

    [MaxLength(50)]
    public string MetricType { get; set; } = "ProductDemand"; // ProductDemand, MonthlyRevenue

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}