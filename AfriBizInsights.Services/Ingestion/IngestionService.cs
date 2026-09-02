using System.Data;
using System.Globalization;
using System.Text.RegularExpressions;
using AfriBizInsights.Core.DTOs.Ingestion;
using AfriBizInsights.Core.Entities;
using AfriBizInsights.Core.Interfaces;
using AfriBizInsights.Infrastructure.Data;
using CsvHelper;
using CsvHelper.Configuration;
using ExcelDataReader;
using Microsoft.EntityFrameworkCore;

namespace AfriBizInsights.Services.Ingestion;

public class IngestionService : IIngestionService
{
    private readonly ApplicationDbContext _context;
    private readonly ITenantProvider _tenantProvider;

    public IngestionService(ApplicationDbContext context, ITenantProvider tenantProvider)
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

    public async Task<IngestionResultDto> ProcessSalesFileAsync(Stream fileStream, string fileName)
    {
        var tenantId = GetAuthenticatedTenantId();

        // 1. File Size Protection (Max 10MB)
        if (fileStream == null || fileStream.Length == 0)
        {
            return new IngestionResultDto
            {
                Success = false,
                ValidationErrors = new List<string> { "Uploaded file stream is empty." }
            };
        }

        if (fileStream.Length > 10 * 1024 * 1024)
        {
            return new IngestionResultDto
            {
                Success = false,
                ValidationErrors = new List<string> { "File size exceeds the 10MB limit." }
            };
        }

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        List<RawSalesRecordDto> rawRecords = new();

        try
        {
            if (extension == ".csv")
            {
                rawRecords = ReadCsvFile(fileStream);
            }
            else if (extension == ".xlsx" || extension == ".xls")
            {
                rawRecords = ReadExcelFile(fileStream);
            }
            else
            {
                return new IngestionResultDto
                {
                    Success = false,
                    ValidationErrors = new List<string> { "Unsupported format. Please upload a .csv or .xlsx file." }
                };
            }
        }
        catch (Exception ex)
        {
            return new IngestionResultDto
            {
                Success = false,
                ValidationErrors = new List<string> { $"File parse error: {ex.Message}" }
            };
        }

        // 2. Row Count Protection (Max 10,000 rows)
        if (rawRecords.Count > 10000)
        {
            return new IngestionResultDto
            {
                Success = false,
                ValidationErrors = new List<string> { "File exceeds the 10,000 row maximum batch limit." }
            };
        }

        return await ProcessRecordsAsync(rawRecords, tenantId);
    }

    private List<RawSalesRecordDto> ReadCsvFile(Stream fileStream)
    {
        using var reader = new StreamReader(fileStream);
        var config = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HeaderValidated = null,
            MissingFieldFound = null,
            TrimOptions = TrimOptions.Trim,
            IgnoreBlankLines = true
        };

        using var csv = new CsvReader(reader, config);
        csv.Context.RegisterClassMap<SalesRecordMap>();
        return csv.GetRecords<RawSalesRecordDto>().ToList();
    }

    private List<RawSalesRecordDto> ReadExcelFile(Stream fileStream)
    {
        System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
        var records = new List<RawSalesRecordDto>();

        using var reader = ExcelReaderFactory.CreateReader(fileStream);
        var result = reader.AsDataSet(new ExcelDataSetConfiguration()
        {
            ConfigureDataTable = (_) => new ExcelDataTableConfiguration() { UseHeaderRow = true }
        });

        if (result.Tables.Count == 0) return records;

        var table = result.Tables[0];
        foreach (DataRow row in table.Rows)
        {
            records.Add(new RawSalesRecordDto
            {
                DateString = GetColumnValue(row, "Date", "SaleDate", "Timestamp", "TransactionDate") ?? string.Empty,
                ProductName = GetColumnValue(row, "Product", "ProductName", "Item", "Description") ?? string.Empty,
                Category = GetColumnValue(row, "Category", "ProductCategory", "Dept"),
                SKU = GetColumnValue(row, "SKU", "ItemCode", "Barcode"),
                QuantityString = GetColumnValue(row, "Quantity", "Qty", "UnitsSold", "Count") ?? "1",
                UnitPriceString = GetColumnValue(row, "UnitPrice", "Price", "SellingPrice", "UnitAmount") ?? "0",
                CostPriceString = GetColumnValue(row, "CostPrice", "Cost", "UnitCost"),
                CustomerIdentifier = GetColumnValue(row, "Customer", "CustomerName", "CustomerPhone", "Phone"),
                PaymentMethod = GetColumnValue(row, "PaymentMethod", "PaymentType", "Payment") ?? "Cash"
            });
        }

        return records;
    }

    private string? GetColumnValue(DataRow row, params string[] possibleNames)
    {
        foreach (var name in possibleNames)
        {
            if (row.Table.Columns.Contains(name) && row[name] != DBNull.Value)
            {
                return row[name]?.ToString()?.Trim();
            }
        }
        return null;
    }

    private async Task<IngestionResultDto> ProcessRecordsAsync(List<RawSalesRecordDto> records, Guid tenantId)
    {
        var result = new IngestionResultDto { TotalRowsProcessed = records.Count };
        var validationErrors = new List<string>();

        var productsList = await _context.Products
            .Where(p => p.TenantId == tenantId)
            .ToListAsync();

        var existingProducts = productsList
            .GroupBy(p => p.Name.Trim().ToLowerInvariant())
            .ToDictionary(g => g.Key, g => g.First());

        var salesToInsert = new List<Sale>();
        int productsModified = 0;
        decimal totalRevenue = 0;

        for (int i = 0; i < records.Count; i++)
        {
            var rowNum = i + 2;
            var raw = records[i];

            if (string.IsNullOrWhiteSpace(raw.ProductName))
            {
                validationErrors.Add($"Row {rowNum}: Missing Product Name.");
                continue;
            }

            if (!TryParseDecimal(raw.UnitPriceString, out var unitPrice) || unitPrice < 0)
            {
                validationErrors.Add($"Row {rowNum}: Invalid Unit Price '{raw.UnitPriceString}'.");
                continue;
            }

            if (!TryParseInt(raw.QuantityString, out var quantity) || quantity <= 0)
            {
                validationErrors.Add($"Row {rowNum}: Invalid Quantity '{raw.QuantityString}'.");
                continue;
            }

            if (!DateTime.TryParse(raw.DateString, CultureInfo.InvariantCulture, DateTimeStyles.None, out var saleDate))
            {
                if (!DateTime.TryParse(raw.DateString, out saleDate))
                {
                    saleDate = DateTime.UtcNow;
                }
            }

            var productKey = raw.ProductName.Trim().ToLowerInvariant();
            if (!existingProducts.TryGetValue(productKey, out var product))
            {
                TryParseDecimal(raw.CostPriceString ?? "0", out var costPrice);

                product = new Product
                {
                    ProductId = Guid.NewGuid(),
                    TenantId = tenantId,
                    Name = raw.ProductName.Trim(),
                    Category = string.IsNullOrWhiteSpace(raw.Category) ? "General" : raw.Category.Trim(),
                    SKU = raw.SKU?.Trim(),
                    SellingPrice = unitPrice,
                    CostPrice = costPrice > 0 ? costPrice : unitPrice * 0.7m,
                    CurrentStock = Math.Max(0, 100 - quantity)
                };

                await _context.Products.AddAsync(product);
                existingProducts[productKey] = product;
                productsModified++;
            }
            else
            {
                product.CurrentStock = Math.Max(0, product.CurrentStock - quantity);
                productsModified++;
            }

            var lineTotal = unitPrice * quantity;
            totalRevenue += lineTotal;

            var sale = new Sale
            {
                SaleId = Guid.NewGuid(),
                TenantId = tenantId,
                SaleDate = saleDate,
                TotalAmount = lineTotal,
                PaymentMethod = string.IsNullOrWhiteSpace(raw.PaymentMethod) ? "Cash" : raw.PaymentMethod.Trim(),
                CustomerIdentifier = raw.CustomerIdentifier?.Trim(),
                Items = new List<SaleItem>
                {
                    new SaleItem
                    {
                        SaleItemId = Guid.NewGuid(),
                        TenantId = tenantId,
                        ProductId = product.ProductId,
                        Quantity = quantity,
                        UnitPrice = unitPrice,
                        TotalPrice = lineTotal
                    }
                }
            };

            salesToInsert.Add(sale);
        }

        if (salesToInsert.Any())
        {
            await _context.Sales.AddRangeAsync(salesToInsert);
            await _context.SaveChangesAsync();
        }

        result.Success = salesToInsert.Any();
        result.SuccessfulSalesInserted = salesToInsert.Count;
        result.ProductsCreatedOrUpdated = productsModified;
        result.TotalRevenueImported = totalRevenue;
        result.ValidationErrors = validationErrors;

        return result;
    }

    private static bool TryParseDecimal(string? value, out decimal result)
    {
        result = 0;
        if (string.IsNullOrWhiteSpace(value)) return false;
        var clean = Regex.Replace(value, @"[^\d.-]", "");
        return decimal.TryParse(clean, NumberStyles.Any, CultureInfo.InvariantCulture, out result);
    }

    private static bool TryParseInt(string? value, out int result)
    {
        result = 0;
        if (string.IsNullOrWhiteSpace(value)) return false;
        var clean = Regex.Replace(value, @"[^\d-]", "");
        return int.TryParse(clean, NumberStyles.Any, CultureInfo.InvariantCulture, out result);
    }
}

public sealed class SalesRecordMap : ClassMap<RawSalesRecordDto>
{
    public SalesRecordMap()
    {
        Map(m => m.DateString).Name("Date", "SaleDate", "Timestamp", "TransactionDate");
        Map(m => m.ProductName).Name("Product", "ProductName", "Item", "Description");
        Map(m => m.Category).Name("Category", "ProductCategory", "Dept").Optional();
        Map(m => m.SKU).Name("SKU", "ItemCode", "Barcode").Optional();
        Map(m => m.QuantityString).Name("Quantity", "Qty", "UnitsSold", "Count").Default("1");
        Map(m => m.UnitPriceString).Name("UnitPrice", "Price", "SellingPrice", "UnitAmount").Default("0");
        Map(m => m.CostPriceString).Name("CostPrice", "Cost", "UnitCost").Optional();
        Map(m => m.CustomerIdentifier).Name("Customer", "CustomerName", "CustomerPhone", "Phone").Optional();
        Map(m => m.PaymentMethod).Name("PaymentMethod", "PaymentType", "Payment").Default("Cash");
    }
}