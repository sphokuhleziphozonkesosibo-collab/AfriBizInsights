using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using AfriBizInsights.Core.DTOs.Suppliers;

namespace AfriBizInsights.Core.Interfaces;

public interface ISupplierService
{
    Task<List<SupplierDto>> GetAllSuppliersAsync();
    Task<SupplierDto> CreateSupplierAsync(CreateSupplierDto dto);
    Task<PurchaseOrderDto> GeneratePurchaseOrderAsync(GeneratePoRequestDto request);
}
