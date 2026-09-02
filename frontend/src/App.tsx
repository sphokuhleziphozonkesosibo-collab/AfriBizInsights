import { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
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
import { RefreshCw, AlertCircle } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

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

  const fetchDashboardData = async (days = selectedDays) => {
    if (!currentUser) return;
    try {
      setLoading(true);
      setError(null);

      const [sumData, trendData, prodData, custData, alertData, deadData, forecastData] =
        await Promise.all([
          getDashboardSummary(),
          getSalesTrend(days),
          getTopProducts(5),
          getTopCustomers(10),
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
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to fetch data for this business account. Verify backend API is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData(selectedDays);
    }
  }, [currentUser, selectedDays]);

  const handleLogout = () => {
    localStorage.removeItem('afribiz_token');
    localStorage.removeItem('afribiz_user');
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
        onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
        onDownloadBackup={handleDownloadBackup}
        onExportReport={handleExportReport}
        onLogout={handleLogout}
      />

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Title & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Financial Telemetry & Profitability Radar
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Gross sales, operational expenses, True Net Profit & ML demand forecasts
            </p>
          </div>

          <button
            onClick={() => fetchDashboardData(selectedDays)}
            disabled={loading || !currentUser}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Connection Warning</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* 1. Profitability & Financial Health Cards + Payment Channels Breakdown */}
        <KpiCards summary={summary} currency={currentUser?.currency || 'ZAR'} />

        {/* 2. Dead Stock & Trapped Cash Radar */}
        <DeadStockCard products={deadStock} currency={currentUser?.currency || 'ZAR'} />

        {/* 3. AI Machine Learning Demand Forecasting Section */}
        <ForecastCards forecasts={forecasts} />

        {/* 4. Middle Row: Sales Trend Chart & Smart Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SalesChart
              data={trends}
              currency={currentUser?.currency || 'ZAR'}
              selectedDays={selectedDays}
              onDaysChange={(d) => setSelectedDays(d)}
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

      {/* Smart Ingestion Wizard Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          fetchDashboardData(selectedDays);
        }}
      />

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        onSuccess={() => {
          fetchDashboardData(selectedDays);
        }}
        currency={currentUser?.currency || 'ZAR'}
      />

      {/* Stock & Price Manager Modal */}
      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        onSuccess={() => {
          fetchDashboardData(selectedDays);
        }}
        currency={currentUser?.currency || 'ZAR'}
      />

      {/* WhatsApp Summary Modal */}
      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        messageText={generateWhatsAppSummary(currentUser, summary, forecasts)}
      />
    </div>
  );
}

export default App;