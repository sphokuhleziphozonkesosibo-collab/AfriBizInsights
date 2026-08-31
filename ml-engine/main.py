from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.linear_model import Ridge

app = FastAPI(
    title="AfriBiz Insights ML Engine",
    description="Predictive Machine Learning Microservice for African SMEs",
    version="1.0.0"
)

# ----------------------------------------------------
# DATA SCHEMAS
# ----------------------------------------------------
class DailySaleRecord(BaseModel):
    date: str  # YYYY-MM-DD
    quantity: int
    unit_price: float

class DemandForecastRequest(BaseModel):
    product_id: str
    product_name: str
    current_stock: int
    reorder_level: int = 10
    forecast_days: int = 30
    sales_history: List[DailySaleRecord]

class DemandForecastResponse(BaseModel):
    product_id: str
    product_name: str
    current_stock: int
    predicted_units_next_month: int
    daily_run_rate: float
    stockout_in_days: Optional[int]
    stockout_warning: bool
    recommended_reorder_qty: int
    confidence_score: float

class RevenueRecord(BaseModel):
    date: str
    total_revenue: float
    order_count: int

class AnomalyDetectionRequest(BaseModel):
    revenue_history: List[RevenueRecord]

class AnomalyItem(BaseModel):
    date: str
    actual_revenue: float
    expected_revenue: float
    percentage_deviation: float
    severity: str
    message: str

# ----------------------------------------------------
# 1. HEALTH CHECK ENDPOINT
# ----------------------------------------------------
@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "AfriBiz ML Intelligence Service",
        "timestamp": datetime.utcnow().isoformat()
    }

# ----------------------------------------------------
# 2. DEMAND FORECASTING ALGORITHM
# ----------------------------------------------------
@app.post("/predict/demand", response_model=DemandForecastResponse)
def predict_product_demand(req: DemandForecastRequest):
    if not req.sales_history:
        # Fallback if product has zero history
        return DemandForecastResponse(
            product_id=req.product_id,
            product_name=req.product_name,
            current_stock=req.current_stock,
            predicted_units_next_month=0,
            daily_run_rate=0.0,
            stockout_in_days=None,
            stockout_warning=False,
            recommended_reorder_qty=0,
            confidence_score=0.0
        )

    # Convert to Pandas DataFrame
    df = pd.DataFrame([s.dict() for s in req.sales_history])
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')

    # Aggregate daily units sold
    daily_df = df.groupby('date')['quantity'].sum().reset_index()

    # Time feature engineering
    daily_df['day_index'] = (daily_df['date'] - daily_df['date'].min()).dt.days
    daily_df['day_of_week'] = daily_df['date'].dt.dayofweek

    # Train Machine Learning Model (Ridge Regression with regularized trend)
    X = daily_df[['day_index', 'day_of_week']]
    y = daily_df['quantity']

    if len(daily_df) >= 2:
        model = Ridge(alpha=1.0)
        model.fit(X, y)

        # Generate forecast for the next 30 days
        last_day = daily_df['day_index'].max()
        future_indices = np.arange(last_day + 1, last_day + 1 + req.forecast_days)
        last_date = daily_df['date'].max()
        future_dates = [last_date + timedelta(days=int(i - last_day)) for i in future_indices]
        future_dow = [d.dayofweek for d in future_dates]

        future_X = pd.DataFrame({'day_index': future_indices, 'day_of_week': future_dow})
        raw_predictions = model.predict(future_X)
        predicted_units = int(max(0, np.sum(np.clip(raw_predictions, 0, None))))
        confidence = 0.82
    else:
        # Simple baseline run-rate if only 1 data point exists
        avg_units = daily_df['quantity'].mean()
        predicted_units = int(avg_units * req.forecast_days)
        confidence = 0.50

    # Calculate Velocity & Stockout Risk
    daily_run_rate = round(predicted_units / req.forecast_days, 2)
    
    if daily_run_rate > 0:
        days_until_empty = int(req.current_stock / daily_run_rate)
    else:
        days_until_empty = 999

    stockout_warning = days_until_empty < req.forecast_days
    reorder_qty = max(0, predicted_units - req.current_stock + req.reorder_level)

    return DemandForecastResponse(
        product_id=req.product_id,
        product_name=req.product_name,
        current_stock=req.current_stock,
        predicted_units_next_month=predicted_units,
        daily_run_rate=daily_run_rate,
        stockout_in_days=days_until_empty if days_until_empty < 365 else None,
        stockout_warning=stockout_warning,
        recommended_reorder_qty=reorder_qty,
        confidence_score=confidence
    )

# ----------------------------------------------------
# 3. REVENUE ANOMALY DETECTION ALGORITHM
# ----------------------------------------------------
@app.post("/detect/anomalies", response_model=List[AnomalyItem])
def detect_sales_anomalies(req: AnomalyDetectionRequest):
    if len(req.revenue_history) < 3:
        return []

    df = pd.DataFrame([r.dict() for r in req.revenue_history])
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')

    # Rolling statistical baseline (mean and standard deviation)
    mean_rev = df['total_revenue'].mean()
    std_rev = df['total_revenue'].std()

    if std_rev == 0 or np.isnan(std_rev):
        return []

    anomalies = []
    for _, row in df.iterrows():
        rev = row['total_revenue']
        z_score = (rev - mean_rev) / std_rev
        
        # Flag anything with |z-score| > 1.5 as anomalous
        if z_score < -1.5:
            pct_drop = round(((mean_rev - rev) / mean_rev) * 100, 1)
            anomalies.append(AnomalyItem(
                date=row['date'].strftime('%Y-%m-%d'),
                actual_revenue=rev,
                expected_revenue=round(mean_rev, 2),
                percentage_deviation=-pct_drop,
                severity="Critical" if pct_drop > 50 else "High",
                message=f"Unusual sales drop detected: Revenue was {pct_drop}% below the expected daily baseline."
            ))
        elif z_score > 2.0:
            pct_spike = round(((rev - mean_rev) / mean_rev) * 100, 1)
            anomalies.append(AnomalyItem(
                date=row['date'].strftime('%Y-%m-%d'),
                actual_revenue=rev,
                expected_revenue=round(mean_rev, 2),
                percentage_deviation=pct_spike,
                severity="Medium",
                message=f"Unusual demand spike: Revenue was +{pct_spike}% higher than average."
            ))

    return anomalies