import axios from 'axios';

// --- DATA MODELS ---
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

export interface DemandForecast {
  productId: string;
  productName: string;
  currentStock: number;
  predictedUnitsNextMonth: number;
  dailyRunRate: number;
  stockoutInDays: number | null;
  stockoutWarning: boolean;
  recommendedReorderQty: number;
  confidenceScore: number;
}

export interface IngestionResult {
  success: boolean;
  totalRowsProcessed: number;
  successfulSalesInserted: number;
  productsCreatedOrUpdated: number;
  totalRevenueImported: number;
  validationErrors: string[];
}

// --- API CLIENT (Using Vite Proxy) ---
const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await apiClient.get<DashboardSummary>('/analytics/summary');
  return response.data;
};

export const getSalesTrend = async (days: number = 30): Promise<SalesTrend[]> => {
  const response = await apiClient.get<SalesTrend[]>(`/analytics/sales-trend?days=${days}`);
  return response.data;
};

export const getTopProducts = async (limit: number = 5): Promise<TopProduct[]> => {
  const response = await apiClient.get<TopProduct[]>(`/analytics/top-products?limit=${limit}`);
  return response.data;
};

export const getBusinessAlerts = async (): Promise<BusinessAlert[]> => {
  const response = await apiClient.get<BusinessAlert[]>('/analytics/alerts');
  return response.data;
};

export const getProductForecasts = async (): Promise<DemandForecast[]> => {
  const response = await apiClient.get<DemandForecast[]>('/analytics/forecasts');
  return response.data;
};

export const uploadSalesFile = async (file: File): Promise<IngestionResult> => {
  const formData = new FormData();
  formData.append('file', file);

  // Let browser automatically calculate multipart/form-data boundary
  const response = await apiClient.post<IngestionResult>('/ingestion/upload-sales', formData);
  return response.data;
};