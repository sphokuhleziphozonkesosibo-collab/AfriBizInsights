using System.ComponentModel.DataAnnotations;

namespace AfriBizInsights.Core.DTOs.Expenses;

public class CreateExpenseDto
{
    [Required, MaxLength(100)]
    public string Category { get; set; } = "General"; // Rent, Utilities/Generator, Staff Wages, Transport/Fuel, Packaging, Other

    [Required, MaxLength(250)]
    public string Description { get; set; } = string.Empty;

    [Required, Range(0.01, 10000000.00)]
    public decimal Amount { get; set; }

    public DateTime? ExpenseDate { get; set; }
}

public class ExpenseDto
{
    public Guid ExpenseId { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; }
}