using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using System.ComponentModel.DataAnnotations;

namespace AfriBizInsights.Core.DTOs.Products;

public class ProductDto
{
    public Guid ProductId { get; set; }
    public string? SKU { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }
    public int CurrentStock { get; set; }
    public int ReorderLevel { get; set; }
}

public class UpdateProductStockDto
{
    [Required, Range(0, 1000000)]
    public int CurrentStock { get; set; }

    [Range(0, 1000000)]
    public int? ReorderLevel { get; set; }

    [Range(0.01, 1000000.00)]
    public decimal? SellingPrice { get; set; }

    [Range(0.01, 1000000.00)]
    public decimal? CostPrice { get; set; }
}