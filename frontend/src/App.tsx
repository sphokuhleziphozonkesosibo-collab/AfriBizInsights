import { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { KpiCards } from './components/KpiCards';
import { SalesChart } from './components/SalesChart';
import { AlertsList } from './components/AlertsList';
import { TopProductsTable } from './components/TopProductsTable';
import { ForecastCards } from './components/ForecastCards';
import { UploadModal } from './components/UploadModal';
import {
  getDashboardSummary,
  getSalesTrend,
  getTopProducts,
  getBusinessAlerts,
  getProductForecasts,
  type DashboardSummary,
  type SalesTrend,
  type TopProduct,
  type BusinessAlert,
  type DemandForecast,
} from './services/api';
import { RefreshCw, AlertCircle } from 'lucide-react';

export function App() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<SalesTrend[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [alerts, setAlerts] = useState<BusinessAlert[]>([]);
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all telemetry & ML predictions in parallel
      const [sumData, trendData, prodData, alertData, forecastData] = await Promise.all([
        getDashboardSummary(),
        getSalesTrend(30),
        getTopProducts(5),
        getBusinessAlerts(),
        getProductForecasts(),
      ]);

      setSummary(sumData);
      setTrends(trendData);
      setTopProducts(prodData);
      setAlerts(alertData);
      setForecasts(forecastData);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(
        'Unable to connect to the AfriBiz Backend API. Please ensure Visual Studio is running the API on port 7011.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        onOpenUpload={() => setIsUploadOpen(true)}
        businessName="Mzansi Trendz Store"
        currency="ZAR"
      />

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Title & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Business Intelligence & Predictive Radar
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Descriptive financial telemetry & Python ML demand forecasting
            </p>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Connection Warning</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* 1. KPI Summary Cards */}
        <KpiCards summary={summary} currency="ZAR" />

        {/* 2. AI Machine Learning Demand Forecasting Section */}
        <ForecastCards forecasts={forecasts} />

        {/* 3. Middle Row: Sales Trend Chart & Smart Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SalesChart data={trends} currency="ZAR" />
          </div>
          <div className="lg:col-span-1">
            <AlertsList alerts={alerts} />
          </div>
        </div>

        {/* 4. Bottom Row: Top Products Table */}
        <div>
          <TopProductsTable products={topProducts} currency="ZAR" />
        </div>
      </main>

      {/* CSV / Excel Ingestion Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />
    </div>
  );
}

export default App;