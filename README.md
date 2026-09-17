# 🌍 AfriBiz Insights

> **An African Business Intelligence & Predictive Analytics Platform for SMEs**  
> *Transforming raw point-of-sale exports, spreadsheets, and operational records into clear financial telemetry, stockout radars, and AI demand forecasting.*

---

## 📌 Executive Summary

Small and Medium Enterprises (SMEs) across African retail, wholesale, and trade handle thousands of transactions every month using paper logs, POS terminals, and fragmented Excel sheets. However, raw data alone does not tell a store owner what actions to take.

**AfriBiz Insights** acts as a digital CFO and inventory co-pilot. It ingests historical sales data, deducts operating expenses to calculate **True Net Profit**, scans for **Dead Stock (Trapped Capital)**, and runs **Machine Learning Time-Series Models** to forecast product demand 30 days into the future.

---

## 🏗️ System Architecture

AfriBiz Insights follows an enterprise multi-tier architecture with strict multi-tenant row-level data isolation:

```text
┌────────────────────────────────────────────────────────┐
│                   React + TypeScript                   │
│         (Vite • Tailwind CSS • Recharts • Lucide)      │
│  - Financial Profitability   - Smart Business Alerts   │
│  - Interactive Trend Charts  - Live CSV Wizard Preview │
│  - Stock & Price Manager     - Executive PDF Reports   │
└───────────────────────────▲────────────────────────────┘
                            │ HTTP / JSON (Port 5173 ➔ 7011)
┌───────────────────────────▼────────────────────────────┐
│                  ASP.NET Core 8 Web API                │
│  - Multi-Tenant Security     - CSV / Excel Ingestion   │
│  - JWT Authentication        - Auto-Startup Migration  │
│  - Financial Margins Engine  - Dead Stock Radar        │
└──────────────┬───────────────────────────┬─────────────┘
               │ EF Core (MySQL Driver)    │ HTTP (Port 8000)
┌──────────────▼─────────────┐ ┌──────────▼──────────────┐
│       MySQL Database       │ │  Python ML Microservice │
│  - Tenants & Users         │ │  (FastAPI • Scikit-Learn│
│  - Products & Inventory    │ │   • Pandas • NumPy)     │
│  - Sales & Line Items      │ │  - 30D Ridge Regression │
│  - Expenses & Operational  │ │  - Stockout Risk Engine │
│  - Multi-Tenant Indexes    │ │  - Anomaly Detection    │
└────────────────────────────┘ └──────────────────────────┘