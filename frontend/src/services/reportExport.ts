import type { DashboardSummary, TopProduct, DeadStockProduct, DemandForecast, AuthUser } from './api';

export const exportBusinessReport = (
  user: AuthUser | null,
  summary: DashboardSummary | null,
  topProducts: TopProduct[],
  deadStock: DeadStockProduct[],
  forecasts: DemandForecast[]
) => {
  const currencySymbol = user?.currency === 'ZAR' ? 'R' : user?.currency || 'R';
  const printDate = new Date().toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download the business report.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>AfriBiz Insights - Executive Business Summary</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #0f172a; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: 900; color: #0f172a; }
          .logo span { color: #4f46e5; font-weight: 300; }
          .badge { background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 30px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; rounded: 12px; border-radius: 12px; }
          .card-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; }
          .card-val { font-size: 22px; font-weight: 900; color: #0f172a; margin-top: 4px; }
          .profit-card { background: #0f172a; color: white; border-radius: 12px; padding: 16px; }
          .profit-card .card-title { color: #a5b4fc; }
          .profit-card .card-val { color: white; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { text-align: left; background: #f1f5f9; padding: 10px; font-weight: bold; color: #475569; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          .section-title { font-size: 15px; font-weight: bold; margin-top: 30px; margin-bottom: 10px; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
          .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">AfriBiz <span>Insights</span></div>
            <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">Store: <strong>${user?.businessName || 'Mzansi Trendz Store'}</strong> • Owner: ${user?.fullName || 'Sipho Khumalo'}</p>
          </div>
          <div style="text-align: right;">
            <span class="badge">${user?.currency || 'ZAR'} Telemetry</span>
            <p style="font-size: 11px; color: #64748b; margin-top: 6px;">Generated: ${printDate}</p>
          </div>
        </div>

        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer;">
            🖨️ Print / Save as PDF
          </button>
        </div>

        <div class="section-title">1. Financial Profitability Summary</div>
        <div class="grid">
          <div class="card">
            <div class="card-title">Gross Sales Revenue</div>
            <div class="card-val">${currencySymbol} ${summary ? summary.totalRevenue.toLocaleString() : '0'}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Transactions: ${summary?.totalOrders ?? 0} | AOV: ${currencySymbol} ${summary?.averageOrderValue ?? 0}</div>
          </div>

          <div class="card">
            <div class="card-title">Cost of Goods Sold (COGS)</div>
            <div class="card-val">${currencySymbol} ${summary ? summary.costOfGoodsSold.toLocaleString() : '0'}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Gross Margin: <strong>${summary?.grossMarginPercentage ?? 0}%</strong></div>
          </div>

          <div class="card">
            <div class="card-title">Operating Expenses</div>
            <div class="card-val" style="color: #e11d48;">- ${currencySymbol} ${summary ? summary.totalExpenses.toLocaleString() : '0'}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Rent, Utilities, Staff Wages</div>
          </div>

          <div class="profit-card">
            <div class="card-title">True Net Profit</div>
            <div class="card-val">${currencySymbol} ${summary ? summary.netProfit.toLocaleString() : '0'}</div>
            <div style="font-size: 11px; color: #c7d2fe; margin-top: 4px;">Net Margin: <strong>${summary?.netMarginPercentage ?? 0}%</strong></div>
          </div>
        </div>

        <div class="section-title">2. Top Revenue Driving Products</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product Name</th>
              <th>Category</th>
              <th style="text-align: right;">Units Sold</th>
              <th style="text-align: right;">Revenue Generated</th>
            </tr>
          </thead>
          <tbody>
            ${topProducts.map((p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.category || 'General'}</td>
                <td style="text-align: right;">${p.totalUnitsSold.toLocaleString()}</td>
                <td style="text-align: right; font-weight: bold; color: #4f46e5;">${currencySymbol} ${p.totalRevenueGenerated.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${deadStock.length > 0 ? `
          <div class="section-title">3. Dead Stock & Trapped Capital Risk</div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Unsold Stock</th>
                <th>Days Inactive</th>
                <th style="text-align: right;">Trapped Cash</th>
              </tr>
            </thead>
            <tbody>
              ${deadStock.map((d) => `
                <tr>
                  <td><strong>${d.name}</strong></td>
                  <td>${d.currentStock} units</td>
                  <td>${d.daysSinceLastSale}+ days</td>
                  <td style="text-align: right; font-weight: bold; color: #e11d48;">${currencySymbol} ${d.trappedCapital.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="section-title">4. AI Machine Learning 30-Day Demand Forecasts</div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Current Stock</th>
              <th>Predicted 30D Demand</th>
              <th>Stockout Risk</th>
              <th style="text-align: right;">Reorder Recommendation</th>
            </tr>
          </thead>
          <tbody>
            ${forecasts.map((f) => `
              <tr>
                <td><strong>${f.productName}</strong></td>
                <td>${f.currentStock} units</td>
                <td style="font-weight: bold; color: #4f46e5;">~${f.predictedUnitsNextMonth} units</td>
                <td>${f.stockoutWarning ? `<span style="color: #b45309; font-weight: bold;">⚠️ Runout in ~${f.stockoutInDays ?? 0} days</span>` : '<span style="color: #047857;">Healthy (30+ days)</span>'}</td>
                <td style="text-align: right; font-weight: bold;">${f.recommendedReorderQty > 0 ? `+${f.recommendedReorderQty} units` : 'No order needed'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated by AfriBiz Insights Intelligence Platform • Confidential Business Telemetry</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};