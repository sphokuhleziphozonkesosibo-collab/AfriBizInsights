export interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  bestSellingProduct: string;
  lowStockProductCount: number;
  revenueGrowthPercentage: number;
}

export interface SalesTrend {
  date: string;
  totalRevenue: number;
  orderCount: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  category: string;
  totalUnitsSold: number;
  totalRevenueGenerated: number;
}

export interface BusinessAlert {
  alertId: string;
  alertType: 'StockWarning' | 'FastMover' | 'Opportunity' | 'Healthy' | string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  title: string;
  message: string;
  createdAt: string;
}

export interface IngestionResult {
  success: boolean;
  totalRowsProcessed: number;
  successfulSalesInserted: number;
  productsCreatedOrUpdated: number;
  totalRevenueImported: number;
  validationErrors: string[];
}