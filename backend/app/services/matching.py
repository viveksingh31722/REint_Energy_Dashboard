import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dateutil import parser

from app.config import settings

def load_cached_datasets() -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Load cached FUELHH actuals and WINDFOR forecasts from disk."""
    actuals_file = settings.data_dir / "fuelhh_actuals_jan_2026.json"
    forecasts_file = settings.data_dir / "windfor_forecasts_jan_2026.json"
    
    if not actuals_file.exists() or not forecasts_file.exists():
        raise FileNotFoundError(
            f"Cached dataset missing in {settings.data_dir}. Run ingestion first."
        )
        
    with open(actuals_file, "r", encoding="utf-8") as f:
        actuals = json.load(f)
        
    with open(forecasts_file, "r", encoding="utf-8") as f:
        forecasts = json.load(f)
        
    return actuals, forecasts

def build_forecast_lookup(forecasts: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """
    Build an index mapping target startTime to all forecast runs published for that startTime.
    Each list is sorted chronologically by publishTime.
    """
    lookup: Dict[str, List[Dict[str, Any]]] = {}
    for f in forecasts:
        st = f["startTime"]
        if st not in lookup:
            lookup[st] = []
        lookup[st].append(f)
        
    for st in lookup:
        lookup[st].sort(key=lambda x: x["publishTime"])
        
    return lookup

def select_day_ahead_records(
    actuals: List[Dict[str, Any]],
    forecasts: List[Dict[str, Any]],
    cutoff_hour: int = 12,
    resolution: str = "30min",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Deterministic Day-Ahead Forecast Selection Engine.
    
    For each actual settlement period T_del:
      - Gate Closure Cutoff = Date(T_del) - 1 day at cutoff_hour:00:00Z (Default: 12:00:00 UTC)
      - Matches against WINDFOR runs published on or before Cutoff.
      - Selects the latest forecast run prior to Gate Closure.
      - If resolution == "30min": Forecast for Hour H applies to both H:00 (SP 2k-1) and H:30 (SP 2k).
      - If resolution == "hourly": Settlement periods SP 2k-1 and SP 2k are averaged into 1-hour blocks.
    """
    forecast_lookup = build_forecast_lookup(forecasts)
    
    # Optional date range filtering on actuals
    filtered_actuals = actuals
    if start_date:
        filtered_actuals = [a for a in filtered_actuals if a["settlementDate"] >= start_date]
    if end_date:
        filtered_actuals = [a for a in filtered_actuals if a["settlementDate"] <= end_date]
        
    if resolution == "hourly":
        return _aggregate_hourly(filtered_actuals, forecast_lookup, cutoff_hour)
    else:
        return _match_30min(filtered_actuals, forecast_lookup, cutoff_hour)

def _match_30min(
    actuals: List[Dict[str, Any]],
    forecast_lookup: Dict[str, List[Dict[str, Any]]],
    cutoff_hour: int,
) -> List[Dict[str, Any]]:
    matched_records = []
    
    for act in actuals:
        del_dt = parser.isoparse(act["startTime"])
        settlement_date = act["settlementDate"]
        settlement_period = act["settlementPeriod"]
        actual_mw = act["generation"]
        
        # Calculate D-1 Gate Closure Cutoff
        del_date = del_dt.date()
        d_minus_1 = del_date - timedelta(days=1)
        gate_cutoff = datetime(
            d_minus_1.year, d_minus_1.month, d_minus_1.day,
            cutoff_hour, 0, 0, tzinfo=timezone.utc
        )
        gate_cutoff_str = gate_cutoff.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # Determine target forecast key (Hourly in WINDFOR)
        target_hour_dt = datetime(
            del_dt.year, del_dt.month, del_dt.day, del_dt.hour, 0, 0, tzinfo=timezone.utc
        )
        target_hour_str = target_hour_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # Filter candidate forecasts published on or before cutoff
        candidates = forecast_lookup.get(target_hour_str, [])
        valid_candidates = [
            c for c in candidates 
            if c["publishTime"] <= gate_cutoff_str
        ]
        
        selected_forecast = None
        forecast_mw = None
        publish_time = None
        horizon_hours = None
        error_mw = None
        abs_error_mw = None
        pct_error = None
        
        if valid_candidates:
            # Select latest published run prior to cutoff
            selected_forecast = valid_candidates[-1]
            forecast_mw = selected_forecast["generation"]
            publish_time = selected_forecast["publishTime"]
            
            pub_dt = parser.isoparse(publish_time)
            horizon_hours = round((del_dt - pub_dt).total_seconds() / 3600.0, 2)
            
            error_mw = round(actual_mw - forecast_mw, 2)
            abs_error_mw = round(abs(error_mw), 2)
            
            # Guardband percentage error against division-by-near-zero
            if actual_mw >= 500.0:
                pct_error = round((abs_error_mw / actual_mw) * 100.0, 2)
                
        matched_records.append({
            "deliveryTime": act["startTime"],
            "settlementDate": settlement_date,
            "settlementPeriod": settlement_period,
            "actualGenerationMW": actual_mw,
            "forecastGenerationMW": forecast_mw,
            "forecastPublishTime": publish_time,
            "forecastHorizonHours": horizon_hours,
            "errorMW": error_mw,
            "absoluteErrorMW": abs_error_mw,
            "percentageError": pct_error,
            "cutoffHour": cutoff_hour,
            "resolution": "30min",
        })
        
    return matched_records

def _aggregate_hourly(
    actuals: List[Dict[str, Any]],
    forecast_lookup: Dict[str, List[Dict[str, Any]]],
    cutoff_hour: int,
) -> List[Dict[str, Any]]:
    """Aggregate adjacent half-hours (SP 2k-1 and SP 2k) into true 1-hour settlement blocks."""
    # Group actuals in pairs
    hourly_records = []
    
    # Process in chunks of 2 (SP 1 & 2, SP 3 & 4, etc.)
    for i in range(0, len(actuals), 2):
        sp1 = actuals[i]
        sp2 = actuals[i + 1] if i + 1 < len(actuals) else None
        
        st1_dt = parser.isoparse(sp1["startTime"])
        target_hour_dt = datetime(
            st1_dt.year, st1_dt.month, st1_dt.day, st1_dt.hour, 0, 0, tzinfo=timezone.utc
        )
        target_hour_str = target_hour_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # Mean actual MW across the hour
        if sp2:
            mean_actual_mw = round((sp1["generation"] + sp2["generation"]) / 2.0, 2)
        else:
            mean_actual_mw = sp1["generation"]
            
        del_date = st1_dt.date()
        d_minus_1 = del_date - timedelta(days=1)
        gate_cutoff = datetime(
            d_minus_1.year, d_minus_1.month, d_minus_1.day,
            cutoff_hour, 0, 0, tzinfo=timezone.utc
        )
        gate_cutoff_str = gate_cutoff.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        candidates = forecast_lookup.get(target_hour_str, [])
        valid_candidates = [
            c for c in candidates 
            if c["publishTime"] <= gate_cutoff_str
        ]
        
        forecast_mw = None
        publish_time = None
        horizon_hours = None
        error_mw = None
        abs_error_mw = None
        pct_error = None
        
        if valid_candidates:
            selected_forecast = valid_candidates[-1]
            forecast_mw = selected_forecast["generation"]
            publish_time = selected_forecast["publishTime"]
            
            pub_dt = parser.isoparse(publish_time)
            horizon_hours = round((target_hour_dt - pub_dt).total_seconds() / 3600.0, 2)
            
            error_mw = round(mean_actual_mw - forecast_mw, 2)
            abs_error_mw = round(abs(error_mw), 2)
            
            if mean_actual_mw >= 500.0:
                pct_error = round((abs_error_mw / mean_actual_mw) * 100.0, 2)
                
        hourly_records.append({
            "deliveryTime": target_hour_str,
            "settlementDate": sp1["settlementDate"],
            "settlementPeriod": sp1["settlementPeriod"], # Represents the starting SP
            "hourOfDay": st1_dt.hour,
            "actualGenerationMW": mean_actual_mw,
            "forecastGenerationMW": forecast_mw,
            "forecastPublishTime": publish_time,
            "forecastHorizonHours": horizon_hours,
            "errorMW": error_mw,
            "absoluteErrorMW": abs_error_mw,
            "percentageError": pct_error,
            "cutoffHour": cutoff_hour,
            "resolution": "hourly",
        })
        
    return hourly_records

def get_forecast_evolution(
    delivery_time: str,
    actuals: List[Dict[str, Any]],
    forecasts: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Reconstruct the full forecast evolution timeline for a specific delivery period.
    Shows all revisions produced by NESO leading up to physical delivery vs final actual.
    """
    del_dt = parser.isoparse(delivery_time)
    target_hour_dt = datetime(
        del_dt.year, del_dt.month, del_dt.day, del_dt.hour, 0, 0, tzinfo=timezone.utc
    )
    target_hour_str = target_hour_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    
    # Find matching actual outturn
    matching_actual = next((a for a in actuals if a["startTime"] == delivery_time), None)
    actual_mw = matching_actual["generation"] if matching_actual else None
    
    # Filter all forecast runs targeting this delivery hour
    evolution_runs = [
        f for f in forecasts
        if f["startTime"] == target_hour_str
    ]
    evolution_runs.sort(key=lambda x: x["publishTime"])
    
    series = []
    prev_forecast = None
    for run in evolution_runs:
        pub_dt = parser.isoparse(run["publishTime"])
        horizon_hours = round((del_dt - pub_dt).total_seconds() / 3600.0, 2)
        gen = run["generation"]
        
        delta_prev = round(gen - prev_forecast, 2) if prev_forecast is not None else 0.0
        delta_actual = round(actual_mw - gen, 2) if actual_mw is not None else None
        
        series.append({
            "publishTime": run["publishTime"],
            "forecastMW": gen,
            "horizonHours": horizon_hours,
            "deltaFromPreviousMW": delta_prev,
            "deltaFromActualMW": delta_actual,
        })
        prev_forecast = gen
        
    return {
        "deliveryTime": delivery_time,
        "actualGenerationMW": actual_mw,
        "revisionCount": len(series),
        "evolutionSeries": series,
    }
