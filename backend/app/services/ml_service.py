import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.schema import EnergyConsumption, EmissionFactor, SolarGeneration
from sklearn.ensemble import RandomForestRegressor
from statsmodels.tsa.arima.model import ARIMA
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from datetime import datetime, date, timedelta
import warnings

warnings.filterwarnings("ignore")

MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

def get_grid_factor(db: Session) -> float:
    try:
        from app.models.emission_factor import EmissionFactor as EFModel
        ef = db.query(EFModel).filter(
            EFModel.category.ilike("%Scope 2%") | 
            EFModel.subcategory.ilike("%Grid%") |
            EFModel.category.ilike("%Electricity%")
        ).first()
        if ef:
            return float(ef.factor_value)
    except:
        pass
    return 0.82

def get_vesit_carbon_forecast(db: Session, months_ahead: int = 6, wing_filter: str = "ALL") -> dict:
    """
    6-Month Time-Series Machine Learning Forecaster using actual VESIT historical data (2022-2026).
    Evaluates and compares the research paper models:
    1. ARIMA (AutoRegressive Integrated Moving Average)
    2. Random Forest Regressor
    using chronological holdout validation.
    """
    # 1. Query historical aggregated monthly data
    query = db.query(
        EnergyConsumption.date,
        EnergyConsumption.year,
        EnergyConsumption.month_number,
        EnergyConsumption.month,
        func.sum(EnergyConsumption.units_consumed_kwh).label("total_kwh")
    ).filter(
        EnergyConsumption.data_source_type == "VESIT_ACTUAL"
    )

    if wing_filter != "ALL":
        query = query.filter(EnergyConsumption.wing == wing_filter)

    records = query.group_by(
        EnergyConsumption.date,
        EnergyConsumption.year,
        EnergyConsumption.month_number,
        EnergyConsumption.month
    ).order_by(EnergyConsumption.date.asc()).all()

    if not records or len(records) < 12:
        return {"error": "Insufficient historical VESIT electricity records for time-series ML training."}

    factor = get_grid_factor(db)

    # Build raw time-series DataFrame
    data = []
    for idx, r in enumerate(records):
        rec_dt = r.date if isinstance(r.date, date) else datetime.strptime(str(r.date)[:10], "%Y-%m-%d").date()
        kwh = float(r.total_kwh or 0.0)
        data.append({
            "idx": idx,
            "date": rec_dt,
            "year": r.year or rec_dt.year,
            "month_num": r.month_number or rec_dt.month,
            "month_label": f"{MONTH_ABBR[rec_dt.month - 1]} {rec_dt.year}",
            "kwh": kwh,
            "co2e_kg": round(kwh * factor, 2)
        })

    df = pd.DataFrame(data)

    # Feature Engineering for Random Forest
    df["sin_month"] = np.sin(2 * np.pi * df["month_num"] / 12.0)
    df["cos_month"] = np.cos(2 * np.pi * df["month_num"] / 12.0)
    df["trend"] = df["idx"]
    df["lag_1"] = df["kwh"].shift(1).fillna(df["kwh"].iloc[0])
    df["lag_12"] = df["kwh"].shift(12).fillna(df["kwh"])
    df["rolling_mean_3"] = df["kwh"].rolling(window=3, min_periods=1).mean()

    feature_cols = ["trend", "month_num", "sin_month", "cos_month", "lag_1", "lag_12", "rolling_mean_3"]

    # Chronological Train-Test Split (Last 12 months as out-of-sample holdout)
    test_size = min(12, max(4, int(len(df) * 0.2)))
    train_df = df.iloc[:-test_size]
    test_df = df.iloc[-test_size:]

    model_benchmarks = []

    # Model 1: ARIMA (AutoRegressive Integrated Moving Average)
    train_series = train_df["kwh"].values
    test_series = test_df["kwh"].values

    arima_order = (2, 0, 2)
    try:
        arima_model = ARIMA(train_series, order=arima_order).fit()
        arima_preds = arima_model.forecast(steps=test_size)
    except:
        arima_order = (1, 1, 1)
        arima_model = ARIMA(train_series, order=arima_order).fit()
        arima_preds = arima_model.forecast(steps=test_size)

    arima_mae = float(mean_absolute_error(test_series, arima_preds))
    arima_rmse = float(np.sqrt(mean_squared_error(test_series, arima_preds)))
    arima_r2 = float(r2_score(test_series, arima_preds))
    arima_mape = float(np.mean(np.abs((test_series - arima_preds) / np.maximum(test_series, 1.0))) * 100)

    model_benchmarks.append({
        "model_name": f"ARIMA{arima_order} (AutoRegressive Integrated Moving Average)",
        "short_name": "ARIMA",
        "mae_kwh": round(arima_mae, 1),
        "rmse_kwh": round(arima_rmse, 1),
        "r2_score": round(max(-1.0, arima_r2), 3),
        "mape_pct": round(arima_mape, 2),
        "model_type": "Statistical Time-Series Model"
    })

    # Model 2: Random Forest Regressor
    X_train = train_df[feature_cols]
    y_train = train_df["kwh"]
    X_test = test_df[feature_cols]
    y_test = test_df["kwh"]

    rf_model = RandomForestRegressor(n_estimators=150, max_depth=5, random_state=42)
    rf_model.fit(X_train, y_train)
    rf_preds = rf_model.predict(X_test)

    rf_mae = float(mean_absolute_error(y_test, rf_preds))
    rf_rmse = float(np.sqrt(mean_squared_error(y_test, rf_preds)))
    rf_r2 = float(r2_score(y_test, rf_preds))
    rf_mape = float(np.mean(np.abs((y_test - rf_preds) / np.maximum(y_test, 1.0))) * 100)

    model_benchmarks.append({
        "model_name": "Random Forest Regressor (Ensemble Trees)",
        "short_name": "Random Forest",
        "mae_kwh": round(rf_mae, 1),
        "rmse_kwh": round(rf_rmse, 1),
        "r2_score": round(max(-1.0, rf_r2), 3),
        "mape_pct": round(rf_mape, 2),
        "model_type": "Non-linear Machine Learning Ensemble"
    })

    # Select best model based on out-of-sample validation RMSE
    best_benchmark = min(model_benchmarks, key=lambda b: b["rmse_kwh"])
    selected_model_name = best_benchmark["model_name"]
    selected_short_name = best_benchmark["short_name"]
    best_rmse = best_benchmark["rmse_kwh"]

    # Generate 6-Month Multi-step Forecast using Random Forest retrained on full dataset
    # (or ARIMA on full series)
    rf_full = RandomForestRegressor(n_estimators=150, max_depth=5, random_state=42)
    rf_full.fit(df[feature_cols], df["kwh"])

    try:
        arima_full = ARIMA(df["kwh"].values, order=arima_order).fit()
        arima_future_preds = arima_full.forecast(steps=months_ahead)
    except:
        arima_future_preds = None

    last_row = df.iloc[-1]
    last_date = last_row["date"]
    current_trend = last_row["idx"]
    last_kwh = last_row["kwh"]
    rolling_buffer = list(df["kwh"].iloc[-3:])

    forecast_records = []
    historical_series = []

    for _, r in df.iterrows():
        historical_series.append({
            "date": str(r["date"]),
            "month": r["month_label"],
            "historical_kwh": round(r["kwh"], 1),
            "historical_co2e": round(r["co2e_kg"], 1),
            "forecast_kwh": None,
            "forecast_co2e": None,
            "lower_bound_co2e": None,
            "upper_bound_co2e": None,
            "is_forecast": False
        })

    # Bridge between history and forecast
    historical_series[-1]["forecast_kwh"] = historical_series[-1]["historical_kwh"]
    historical_series[-1]["forecast_co2e"] = historical_series[-1]["historical_co2e"]
    historical_series[-1]["lower_bound_co2e"] = historical_series[-1]["historical_co2e"]
    historical_series[-1]["upper_bound_co2e"] = historical_series[-1]["historical_co2e"]

    curr_year = last_date.year
    curr_month = last_date.month

    ci_margin = best_rmse * 1.25

    total_pred_kwh = 0.0
    total_pred_co2e = 0.0

    for step in range(1, months_ahead + 1):
        curr_month += 1
        if curr_month > 12:
            curr_month = 1
            curr_year += 1

        next_date = date(curr_year, curr_month, 1)
        next_trend = current_trend + step

        prev_year_match = df[(df["month_num"] == curr_month) & (df["year"] == curr_year - 1)]
        lag_12_val = float(prev_year_match["kwh"].values[0]) if len(prev_year_match) > 0 else last_kwh

        sin_m = np.sin(2 * np.pi * curr_month / 12.0)
        cos_m = np.cos(2 * np.pi * curr_month / 12.0)
        roll_mean = np.mean(rolling_buffer[-3:])

        feat_vector = pd.DataFrame([{
            "trend": next_trend,
            "month_num": curr_month,
            "sin_month": sin_m,
            "cos_month": cos_m,
            "lag_1": last_kwh,
            "lag_12": lag_12_val,
            "rolling_mean_3": roll_mean
        }])[feature_cols]

        if selected_short_name == "ARIMA" and arima_future_preds is not None:
            pred_kwh = float(arima_future_preds[step - 1])
        else:
            pred_kwh = float(rf_full.predict(feat_vector)[0])

        pred_kwh = max(1000.0, pred_kwh)
        pred_co2e = pred_kwh * factor

        step_ci = ci_margin * (1.0 + step * 0.08)
        lower_co2e = max(0.0, (pred_kwh - step_ci) * factor)
        upper_co2e = (pred_kwh + step_ci) * factor

        month_label = f"{MONTH_ABBR[curr_month - 1]} {curr_year}"

        forecast_item = {
            "month": month_label,
            "predicted_energy_kwh": round(pred_kwh, 1),
            "predicted_co2e_kg": round(pred_co2e, 1),
            "lower_bound_co2e_kg": round(lower_co2e, 1),
            "upper_bound_co2e_kg": round(upper_co2e, 1),
            "trend_direction": "UP" if pred_kwh > last_kwh else "DOWN"
        }
        forecast_records.append(forecast_item)

        historical_series.append({
            "date": str(next_date),
            "month": month_label,
            "historical_kwh": None,
            "historical_co2e": None,
            "forecast_kwh": round(pred_kwh, 1),
            "forecast_co2e": round(pred_co2e, 1),
            "lower_bound_co2e": round(lower_co2e, 1),
            "upper_bound_co2e": round(upper_co2e, 1),
            "is_forecast": True
        })

        total_pred_kwh += pred_kwh
        total_pred_co2e += pred_co2e

        last_kwh = pred_kwh
        rolling_buffer.append(pred_kwh)

    rationale = (
        f"{selected_model_name} demonstrated superior predictive accuracy on the research paper benchmark with "
        f"lower out-of-sample RMSE ({best_benchmark['rmse_kwh']} kWh) and MAE ({best_benchmark['mae_kwh']} kWh) "
        f"across chronological holdout validation compared to alternative time-series formulations."
    )

    return {
        "model_selection": {
            "selected_model": selected_model_name,
            "short_name": selected_short_name,
            "rmse_kwh": best_benchmark["rmse_kwh"],
            "mae_kwh": best_benchmark["mae_kwh"],
            "r2_score": best_benchmark["r2_score"],
            "mape_pct": best_benchmark["mape_pct"],
            "rationale": rationale,
            "benchmarks": model_benchmarks,
            "validation_strategy": "Chronological Holdout Validation (Research Paper Specification: ARIMA vs Random Forest)"
        },
        "forecast_summary": {
            "months_ahead": months_ahead,
            "total_predicted_energy_kwh": round(total_pred_kwh, 1),
            "total_predicted_co2e_kg": round(total_pred_co2e, 1),
            "grid_emission_factor": factor,
            "peak_month": max(forecast_records, key=lambda x: x["predicted_energy_kwh"])["month"] if forecast_records else "N/A"
        },
        "forecast_breakdown": forecast_records,
        "chart_data": historical_series
    }


def get_solar_forecast(db: Session, days_ahead: int = 30):
    """
    Preserved solar forecast endpoint for backward compatibility.
    """
    records = db.query(SolarGeneration.month, SolarGeneration.average_generation).all()
    if not records:
        return {"error": "No historical solar data available for training"}
        
    data = []
    for r in records:
        try:
            dt = datetime.strptime(r.month, "%b-%y")
            data.append({"date_ordinal": dt.toordinal(), "generation": r.average_generation})
        except:
            continue
            
    if len(data) < 5:
        return {"error": "Insufficient data points for ML forecasting. Need at least 5 months."}
        
    df = pd.DataFrame(data).sort_values("date_ordinal")
    X = df[["date_ordinal"]]
    y = df["generation"]
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    last_date = df["date_ordinal"].max()
    future_dates = [last_date + i*30 for i in range(1, 4)]
    
    X_future = pd.DataFrame({"date_ordinal": future_dates})
    predictions = model.predict(X_future)
    
    forecast = []
    for i, pred in enumerate(predictions):
        future_dt = datetime.fromordinal(future_dates[i])
        forecast.append({
            "month": future_dt.strftime("%b-%y"),
            "predicted_generation_kwh": round(pred, 2)
        })
        
    return {
        "model": "RandomForestRegressor",
        "historical_data_points": len(df),
        "forecast": forecast
    }

