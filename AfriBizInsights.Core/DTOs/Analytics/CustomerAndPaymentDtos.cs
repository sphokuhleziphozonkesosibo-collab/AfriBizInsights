using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AfriBizInsights.Core.DTOs.Analytics;

public class PaymentMethodBreakdownDto
{
    public string PaymentMethod { get; set; } = "Cash";
    public decimal TotalRevenue { get; set; }
    public int TransactionCount { get; set; }
    public decimal PercentageOfTotal { get; set; }
}

public class TopCustomerDto
{
    public string CustomerIdentifier { get; set; } = string.Empty;
    public int TotalOrders { get; set; }
    public decimal TotalSpend { get; set; }
    public decimal AverageBasketSize { get; set; }
    public DateTime LastPurchaseDate { get; set; }
}