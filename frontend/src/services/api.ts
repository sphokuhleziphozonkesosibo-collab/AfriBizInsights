import axios from 'axios';

// --- DATA MODELS ---
export interface AuthUser {
  token: string;
  tenantId: string;
  businessName: string;
  currency: string;
  fullName: string;
  email: string;
  role: string;
}

export interface RegisterDto {
  businessName: string;
  currency: string;
  country: string;
  industry: string;
  ownerFullName: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface DashboardSummary {
  totalRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  grossMarginPercentage: number;
  netMarginPercentage: number;
  totalOrders: number;
  averageOrderValue: number;
  bestSellingProduct: string;
  lowStockProductCount: number;
  revenueGrowthPercentage: number;
}

export interface Expense {
  expenseId: string;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
}

export interface CreateExpenseDto {
  category: string;
  description: string;
  amount: number;
  expenseDate?: string;
}

export interface DeadStockProduct {
  productId: string;
  name: string;
  category: string;
  currentStock: number;
  costPrice: number;
  trappedCapital: number;
  daysSinceLastSale: number;
  recommendation: string;
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
  alertType: 'StockWarning' | 'FastMover' | 'Opportunity' | 'MarginAlert' | 'DeadStock' | 'Healthy' | string;
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

// --- API CLIENT ---
const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('afribiz_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- AUTH ---
export const registerBusiness = async (dto: RegisterDto): Promise<AuthUser> => {
  const response = await apiClient.post<AuthUser>('/auth/register-business', dto);
  return response.data;
};

export const loginUser = async (dto: LoginDto): Promise<AuthUser> => {
  const response = await apiClient.post<AuthUser>('/auth/login', dto);
  return response.data;
};

// --- ANALYTICS ---
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

export const getDeadStockProducts = async (days: number = 30): Promise<DeadStockProduct[]> => {
  const response = await apiClient.get<DeadStockProduct[]>(`/analytics/dead-stock?days=${days}`);
  return response.data;
};

export const getProductForecasts = async (): Promise<DemandForecast[]> => {
  const response = await apiClient.get<DemandForecast[]>('/analytics/forecasts');
  return response.data;
};

// --- EXPENSES ---
export const addExpense = async (dto: CreateExpenseDto): Promise<Expense> => {
  const response = await apiClient.post<Expense>('/analytics/expenses', dto);
  return response.data;
};

export const getRecentExpenses = async (limit: number = 10): Promise<Expense[]> => {
  const response = await apiClient.get<Expense[]>(`/analytics/expenses?limit=${limit}`);
  return response.data;
};

// --- INGESTION ---
export const uploadSalesFile = async (file: File): Promise<IngestionResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<IngestionResult>('/ingestion/upload-sales', formData);
  return response.data;
};