import { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { DateRangeFilter } from './components/DateRangeFilter';
import { KpiCards } from './components/KpiCards';
import { SalesChart } from './components/SalesChart';
import { AlertsList } from './components/AlertsList';
import { TopProductsTable } from './components/TopProductsTable';
import { TopCustomersTable } from './components/TopCustomersTable';
import { DeadStockCard } from './components/DeadStockCard';
import { ForecastCards } from './components/ForecastCards';
import { UploadModal } from './components/UploadModal';
import { ExpenseModal } from './components/ExpenseModal';
import { InventoryModal } from './components/InventoryModal';
import { SupplierModal } from './components/SupplierModal';
import { PurchaseOrderModal } from './components/PurchaseOrderModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { AuthModal } from './components/AuthModal';
import {
  exportBusinessReport,
  generateWhatsAppSummary,
  downloadStoreBackupCsv,
} from './services/reportExport';
import {
  getDashboardSummary,
  getSalesTrend,
  getTopProducts,
  getTopCustomers,
  getBusinessAlerts,
  getDeadStockProducts,
  getProductForecasts,
  type DashboardSummary,
  type SalesTrend,
  type TopProduct,
  type TopCustomer,
  type BusinessAlert,
  type DeadStockProduct,
  type DemandForecast,
  type AuthUser,
} from './services/api';
import { RefreshCw, AlertCircle, WifiOff } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<SalesTrend[]>([]);
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [alerts, setAlerts] = useState<BusinessAlert[]>([]);
  const [deadStock, setDeadStock] = useState<DeadStockProduct[]>([]);
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<{
    startDate: string | null;
    endDate: string | null;
    label: string;
  }>({
    startDate: null,
    endDate: null,
    label: 'All Time',
  });

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [poModalData, setPoModalData] = useState<{
    isOpen: boolean;
    productId: string | null;
    productName: string;
    suggestedQty: number;
  }>({
    isOpen: false,
    productId: null,
    productName: '',
    suggestedQty: 0,
  });

  const isOwner = currentUser?.role === 'Owner' || !currentUser;

  useEffect(() => {
    const savedUser = localStorage.getItem('afribiz_user');
    const token = localStorage.getItem('afribiz_token');
    if (savedUser && token) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch {
        localStorage.clear();
      }
    }
  }, []);

  const fetchDashboardData = async (
    startDate: string | null = dateFilter.startDate,
    endDate: string | null = dateFilter.endDate,
    days: number = selectedDays
  ) => {
    if (!currentUser) return;
    try {
      setLoading(true);
      setError(null);
      setIsOffline(false);

      const [sumData, trendData, prodData, custData, alertData, deadData, forecastData] =
        await Promise.all([
          getDashboardSummary(startDate, endDate),
          getSalesTrend(days, startDate, endDate),
          getTopProducts(5, startDate, endDate),
          getTopCustomers(10, startDate, endDate),
          getBusinessAlerts(),
          getDeadStockProducts(30),
          getProductForecasts(),
        ]);

      setSummary(sumData);
      setTrends(trendData);
      setTopProducts(prodData);
      setTopCustomers(custData);
      setAlerts(alertData);
      setDeadStock(deadData);
      setForecasts(forecastData);

      sessionStorage.setItem('afribiz_cached_summary', JSON.stringify(sumData));
    } catch (err: any) {
      console.warn('Network error or offline mode. Loading cache...', err);
      const cachedSum = sessionStorage.getItem('afribiz_cached_summary');
      if (cachedSum) {
        setSummary(JSON.parse(cachedSum));
        setIsOffline(true);
      } else {
        setError('Unable to load telemetry. Please verify backend API connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData(dateFilter.startDate, dateFilter.endDate, selectedDays);
    }
  }, [currentUser]);

  // Instant real-time filter trigger
  const handleApplyDateFilter = (
    startDate: string | null,
    endDate: string | null,
    label: string
  ) => {
    setDateFilter({ startDate, endDate, label });
    fetchDashboardData(startDate, endDate, selectedDays);
  };

  const handleLogout = () => {
    localStorage.removeItem('afribiz_token');
    localStorage.removeItem('afribiz_user');
    sessionStorage.clear();
    setCurrentUser(null);
    setSummary(null);
    setTrends([]);
    setTopProducts([]);
    setTopCustomers([]);
    setAlerts([]);
    setDeadStock([]);
    setForecasts([]);
  };

  const handleExportReport = () => {
    exportBusinessReport(currentUser, summary, topProducts, deadStock, forecasts);
  };

  const handleDownloadBackup = () => {
    downloadStoreBackupCsv(currentUser, summary, topProducts, deadStock);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {!currentUser && (
        <AuthModal
          onSuccess={(user) => {
            setCurrentUser(user);
          }}
        />
      )}

      {/* Top Navigation */}
      <Navbar
        user={currentUser}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenExpense={() => setIsExpenseOpen(true)}
        onOpenInventory={() => setIsInventoryOpen(true)}
        onOpenSuppliers={() => setIsSupplierOpen(true)}
        onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
        onDownloadBackup={handleDownloadBackup}
        onExportReport={handleExportReport}
        onLogout={handleLogout}
      />

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Financial Telemetry & Profitability Radar
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time sales, operational expenses, True Net Profit & ML demand forecasts
            </p>
          </div>

          <button
            onClick={() => fetchDashboardData()}
            disabled={loading || !currentUser}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* Global Date Range Filter Bar */}
        <DateRangeFilter
          onApplyFilter={handleApplyDateFilter}
          activeLabel={dateFilter.label}
        />

        {/* Loadshedding / Offline Indicator */}
        {isOffline && (
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center gap-3 font-medium">
            <WifiOff className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>Loadshedding / Offline Mode: Displaying last saved telemetry cache.</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Connection Warning</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* 1. Profitability & Financial Health Cards */}
        {isOwner && <KpiCards summary={summary} currency={currentUser?.currency || 'ZAR'} />}

        {/* 2. Dead Stock & Trapped Cash Radar */}
        {isOwner && <DeadStockCard products={deadStock} currency={currentUser?.currency || 'ZAR'} />}

        {/* 3. AI Machine Learning Demand Forecasting with 1-Click PO Generator */}
        <ForecastCards
          forecasts={forecasts}
          onOrderProduct={(prodId, prodName, suggestedQty) => {
            setPoModalData({
              isOpen: true,
              productId: prodId,
              productName: prodName,
              suggestedQty,
            });
          }}
        />

        {/* 4. Middle Row: Sales Trend Chart & Smart Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SalesChart
              data={trends}
              currency={currentUser?.currency || 'ZAR'}
              selectedDays={selectedDays}
              onDaysChange={(d) => {
                setSelectedDays(d);
                fetchDashboardData(dateFilter.startDate, dateFilter.endDate, d);
              }}
            />
          </div>
          <div className="lg:col-span-1">
            <AlertsList alerts={alerts} />
          </div>
        </div>

        {/* 5. Bottom Row: Top Products Table & VIP Customers Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <TopProductsTable products={topProducts} currency={currentUser?.currency || 'ZAR'} />
          </div>
          <div>
            <TopCustomersTable customers={topCustomers} currency={currentUser?.currency || 'ZAR'} />
          </div>
        </div>
      </main>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />

      <ExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        onSuccess={() => fetchDashboardData()}
        currency={currentUser?.currency || 'ZAR'}
      />

      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        onSuccess={() => fetchDashboardData()}
        currency={currentUser?.currency || 'ZAR'}
      />

      <SupplierModal
        isOpen={isSupplierOpen}
        onClose={() => setIsSupplierOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />

      <PurchaseOrderModal
        isOpen={poModalData.isOpen}
        onClose={() => setPoModalData({ ...poModalData, isOpen: false })}
        productId={poModalData.productId}
        productName={poModalData.productName}
        suggestedQty={poModalData.suggestedQty}
        currency={currentUser?.currency || 'ZAR'}
      />

      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        messageText={generateWhatsAppSummary(currentUser, summary, forecasts)}
      />
    </div>
  );
}

export default App;