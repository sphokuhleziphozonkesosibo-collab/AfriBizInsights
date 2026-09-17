import { useEffect, useState } from 'react';
import { Sidebar, type DashboardView } from './components/Sidebar';
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
import { StaffModal } from './components/StaffModal';
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
import { RefreshCw, AlertCircle, WifiOff, Lock } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentView, setCurrentView] = useState<DashboardView>('overview');

  // Telemetry State
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
  const [isStaffOpen, setIsStaffOpen] = useState(false);
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

  const isOwner = currentUser?.role === 'Owner' || currentUser?.role === 'Manager' || !currentUser;
  const isCashier = currentUser?.role === 'Cashier' || currentUser?.role === 'Staff';

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      {!currentUser && (
        <AuthModal
          onSuccess={(user) => {
            setCurrentUser(user);
          }}
        />
      )}

      {/* 1. Professional Enterprise Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v)}
        user={currentUser}
        onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
        onDownloadBackup={() => downloadStoreBackupCsv(currentUser, summary, topProducts, deadStock)}
        onExportReport={() => exportBusinessReport(currentUser, summary, topProducts, deadStock, forecasts)}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          user={currentUser}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenExpense={() => setIsExpenseOpen(true)}
          onOpenStaff={() => setIsStaffOpen(true)}
          onLogout={handleLogout}
        />

        {/* Workspace Canvas */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
          {/* Header & Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight capitalize">
                {currentView === 'overview'
                  ? 'Executive Financial Telemetry'
                  : currentView === 'financials'
                  ? 'Profitability & Margin Breakdown'
                  : currentView === 'inventory'
                  ? 'Inventory Control & Dead Stock Radar'
                  : currentView === 'forecasts'
                  ? 'AI Predictive Demand Engine'
                  : currentView === 'customers'
                  ? 'Customer CRM & Retention Analytics'
                  : 'Supplier & Vendor Directory'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time multi-tenant analytics and automated decision intelligence
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchDashboardData()}
                disabled={loading || !currentUser}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Cashier Guard Banner */}
          {isCashier && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5 font-medium">
              <Lock className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                <strong>Cashier Mode Active:</strong> Sensitive financial margins and executive reports are restricted by the Store Owner.
              </span>
            </div>
          )}

          {/* Global Date Filter */}
          <DateRangeFilter
            onApplyFilter={handleApplyDateFilter}
            activeLabel={dateFilter.label}
          />

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

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 1: EXECUTIVE OVERVIEW VIEW                              */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {currentView === 'overview' && (
            <div className="space-y-6">
              {isOwner && <KpiCards summary={summary} currency={currentUser?.currency || 'ZAR'} />}

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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopProductsTable products={topProducts} currency={currentUser?.currency || 'ZAR'} />
                <TopCustomersTable customers={topCustomers} currency={currentUser?.currency || 'ZAR'} />
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 2: FINANCIALS & PROFITABILITY VIEW                     */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {currentView === 'financials' && isOwner && (
            <div className="space-y-6">
              <KpiCards summary={summary} currency={currentUser?.currency || 'ZAR'} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SalesChart
                  data={trends}
                  currency={currentUser?.currency || 'ZAR'}
                  selectedDays={selectedDays}
                  onDaysChange={(d) => {
                    setSelectedDays(d);
                    fetchDashboardData(dateFilter.startDate, dateFilter.endDate, d);
                  }}
                />
                <TopProductsTable products={topProducts} currency={currentUser?.currency || 'ZAR'} />
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 3: INVENTORY & DEAD STOCK RADAR VIEW                   */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {currentView === 'inventory' && (
            <div className="space-y-6">
              {isOwner && <DeadStockCard products={deadStock} currency={currentUser?.currency || 'ZAR'} />}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Shelf Inventory & Price Management</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Quickly adjust live stock numbers and price tags</p>
                </div>
                <button
                  onClick={() => setIsInventoryOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Open Stock Editor
                </button>
              </div>
              <TopProductsTable products={topProducts} currency={currentUser?.currency || 'ZAR'} />
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 4: AI PREDICTIVE FORECASTS VIEW                        */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {currentView === 'forecasts' && (
            <div className="space-y-6">
              <ForecastCards
                forecasts={forecasts}
                onOrderProduct={
                  isOwner
                    ? (prodId, prodName, suggestedQty) => {
                        setPoModalData({
                          isOpen: true,
                          productId: prodId,
                          productName: prodName,
                          suggestedQty,
                        });
                      }
                    : undefined
                }
              />
              <AlertsList alerts={alerts} />
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 5: CUSTOMER CRM & RETENTION VIEW                       */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {currentView === 'customers' && (
            <div className="space-y-6">
              <TopCustomersTable customers={topCustomers} currency={currentUser?.currency || 'ZAR'} />
              {isOwner && <KpiCards summary={summary} currency={currentUser?.currency || 'ZAR'} />}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 6: SUPPLIERS & PURCHASE ORDERS VIEW                    */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {currentView === 'suppliers' && isOwner && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Vendor & Distributor Management</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Manage supplier directory, lead times, and dispatch POs</p>
                </div>
                <button
                  onClick={() => setIsSupplierOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Manage Suppliers
                </button>
              </div>

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
            </div>
          )}
        </main>
      </div>

      {/* Global Modals */}
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

      <StaffModal
        isOpen={isStaffOpen}
        onClose={() => setIsStaffOpen(false)}
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