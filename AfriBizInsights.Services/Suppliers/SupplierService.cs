using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AfriBizInsights.Core.DTOs.Suppliers;
using AfriBizInsights.Core.Entities;
using AfriBizInsights.Core.Interfaces;
using AfriBizInsights.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AfriBizInsights.Services.Suppliers;

public class SupplierService : ISupplierService
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public SupplierService(ApplicationDbContext context, ITenantProvider tenantProvider)
    {
        _context = context;
        _tenantProvider = tenantProvider;
    }

    private Guid GetAuthenticatedTenantId()
    {
        var tenantId = _tenantProvider.GetCurrentTenantId();
        if (!tenantId.HasValue || tenantId.Value == Guid.Empty)
        {
            throw new UnauthorizedAccessException("Authentication required. No valid business tenant context found.");
        }
        return tenantId.Value;
    }

    public async Task<List<SupplierDto>> GetAllSuppliersAsync()
    {
        var tenantId = GetAuthenticatedTenantId();

        return await _context.Suppliers
            .Where(s => s.TenantId == tenantId)
            .OrderBy(s => s.Name)
            .Select(s => new SupplierDto
            {
                SupplierId = s.SupplierId,
                Name = s.Name,
                ContactPerson = s.ContactPerson,
                Phone = s.Phone,
                Email = s.Email,
                Address = s.Address,
                LeadTimeDays = s.LeadTimeDays
            })
            .ToListAsync();
    }

    public async Task<SupplierDto> CreateSupplierAsync(CreateSupplierDto dto)
    {
        var tenantId = GetAuthenticatedTenantId();

        var supplier = new Supplier
        {
            SupplierId = Guid.NewGuid(),
            TenantId = tenantId,
            Name = dto.Name.Trim(),
            ContactPerson = dto.ContactPerson.Trim(),
            Phone = dto.Phone.Trim(),
            Email = dto.Email.Trim().ToLower(),
            Address = dto.Address.Trim(),
            LeadTimeDays = Math.Max(1, dto.LeadTimeDays),
            CreatedAt = DateTime.UtcNow
        };

        await _context.Suppliers.AddAsync(supplier);
        await _context.SaveChangesAsync();

        return new SupplierDto
        {
            SupplierId = supplier.SupplierId,
            Name = supplier.Name,
            ContactPerson = supplier.ContactPerson,
            Phone = supplier.Phone,
            Email = supplier.Email,
            Address = supplier.Address,
            LeadTimeDays = supplier.LeadTimeDays
        };
    }

    public async Task<PurchaseOrderDto> GeneratePurchaseOrderAsync(GeneratePoRequestDto request)
    {
        var tenantId = GetAuthenticatedTenantId();

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.TenantId == tenantId);
        var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == request.ProductId && p.TenantId == tenantId);
        var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.SupplierId == request.SupplierId && s.TenantId == tenantId);

        if (product == null) throw new KeyNotFoundException("Product not found in this store catalog.");
        if (supplier == null) throw new KeyNotFoundException("Supplier not found in this store directory.");

        var unitCost = product.CostPrice > 0 ? product.CostPrice : product.SellingPrice * 0.7m;
        var totalCost = unitCost * request.OrderQuantity;
        var randomSuffix = new Random().Next(1000, 9999);
        var poNumber = $"PO-{DateTime.UtcNow:yyyyMMdd}-{randomSuffix}";

        return new PurchaseOrderDto
        {
            PoNumber = poNumber,
            BusinessName = tenant?.BusinessName ?? "My Store",
            SupplierName = supplier.Name,
            SupplierEmail = supplier.Email,
            SupplierPhone = supplier.Phone,
            ProductName = product.Name,
            Quantity = request.OrderQuantity,
            EstimatedUnitCost = Math.Round(unitCost, 2),
            EstimatedTotalCost = Math.Round(totalCost, 2),
            ExpectedDeliveryDays = supplier.LeadTimeDays,
            OrderDate = DateTime.UtcNow,
            Notes = request.Notes
        };
    }
}