import math
from typing import Dict, List, Any, Optional
import numpy as np

def compute_accuracy_summary(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compute rigorous statistical metrics across matched records:
    - MAE, RMSE, Signed Bias
    - WAPE (Weighted Absolute Percentage Error)
    - Normalized MAE (NMAE)
    - Quantiles (P10, P25, P50, P75, P90, P95, P99)
    - Max Error Event
    """
    valid = [r for r in records if r["forecastGenerationMW"] is not None and r["actualGenerationMW"] is not None]
    if not valid:
        return {
            "sampleCount": 0,
            "maeMW": 0.0,
            "rmseMW": 0.0,
            "biasMW": 0.0,
            "wapePercent": 0.0,
            "nmaePercent": 0.0,
            "peakActualMW": 0.0,
            "minActualMW": 0.0,
            "quantiles": {},
            "worstErrorEvent": None,
        }
        
    actuals = np.array([r["actualGenerationMW"] for r in valid], dtype=float)
    forecasts = np.array([r["forecastGenerationMW"] for r in valid], dtype=float)
    errors = actuals - forecasts
    abs_errors = np.abs(errors)
    
    n = len(valid)
    mae = float(np.mean(abs_errors))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    bias = float(np.mean(errors))
    
    sum_actuals = float(np.sum(actuals))
    wape = float((np.sum(abs_errors) / sum_actuals) * 100.0) if sum_actuals > 0 else 0.0
    
    peak_actual = float(np.max(actuals))
    min_actual = float(np.min(actuals))
    nmae = float((mae / peak_actual) * 100.0) if peak_actual > 0 else 0.0
    
    # Quantiles of absolute error (MW)
    q_vals = [10, 25, 50, 75, 90, 95, 99]
    quantiles = {
        f"p{q}": round(float(np.percentile(abs_errors, q)), 2)
        for q in q_vals
    }
    
    # Worst single error event
    max_idx = int(np.argmax(abs_errors))
    worst_record = valid[max_idx]
    worst_event = {
        "deliveryTime": worst_record["deliveryTime"],
        "settlementPeriod": worst_record.get("settlementPeriod"),
        "actualMW": worst_record["actualGenerationMW"],
        "forecastMW": worst_record["forecastGenerationMW"],
        "errorMW": worst_record["errorMW"],
        "absoluteErrorMW": worst_record["absoluteErrorMW"],
    }
    
    return {
        "sampleCount": n,
        "maeMW": round(mae, 2),
        "rmseMW": round(rmse, 2),
        "biasMW": round(bias, 2),
        "wapePercent": round(wape, 2),
        "nmaePercent": round(nmae, 2),
        "peakActualMW": round(peak_actual, 2),
        "minActualMW": round(min_actual, 2),
        "quantiles": quantiles,
        "worstErrorEvent": worst_event,
    }

def compute_error_distribution(records: List[Dict[str, Any]], num_bins: int = 25) -> Dict[str, Any]:
    """
    Generate histogram distribution data for Signed Error and Absolute Error.
    """
    valid = [r for r in records if r["errorMW"] is not None]
    if not valid:
        return {"bins": [], "quantiles": {}}
        
    errors = np.array([r["errorMW"] for r in valid], dtype=float)
    abs_errors = np.abs(errors)
    
    counts, bin_edges = np.histogram(errors, bins=num_bins)
    
    bins_data = []
    for i in range(len(counts)):
        b_min = round(float(bin_edges[i]), 1)
        b_max = round(float(bin_edges[i + 1]), 1)
        bins_data.append({
            "binRange": f"{b_min} to {b_max} MW",
            "binMidpoint": round((b_min + b_max) / 2.0, 1),
            "count": int(counts[i]),
            "percentage": round((int(counts[i]) / len(valid)) * 100.0, 2),
        })
        
    return {
        "sampleCount": len(valid),
        "meanError": round(float(np.mean(errors)), 2),
        "stdError": round(float(np.std(errors)), 2),
        "histogram": bins_data,
        "quantiles": {
            "p50": round(float(np.percentile(abs_errors, 50)), 2),
            "p75": round(float(np.percentile(abs_errors, 75)), 2),
            "p90": round(float(np.percentile(abs_errors, 90)), 2),
            "p95": round(float(np.percentile(abs_errors, 95)), 2),
        }
    }

def compute_diurnal_profile(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Group performance by hour of day (0 to 23) to highlight diurnal biases
    (e.g., morning ramp up vs. evening peak demand hours).
    """
    from dateutil import parser
    
    hour_groups: Dict[int, List[Dict[str, Any]]] = {h: [] for h in range(24)}
    
    for r in records:
        if r["errorMW"] is not None:
            dt = parser.isoparse(r["deliveryTime"])
            hour_groups[dt.hour].append(r)
            
    diurnal_profile = []
    for h in range(24):
        items = hour_groups[h]
        if items:
            acts = [x["actualGenerationMW"] for x in items]
            fore = [x["forecastGenerationMW"] for x in items]
            errs = [x["errorMW"] for x in items]
            abs_errs = [x["absoluteErrorMW"] for x in items]
            
            diurnal_profile.append({
                "hourOfDay": h,
                "hourLabel": f"{h:02d}:00",
                "sampleCount": len(items),
                "meanActualMW": round(float(np.mean(acts)), 1),
                "meanForecastMW": round(float(np.mean(fore)), 1),
                "maeMW": round(float(np.mean(abs_errs)), 1),
                "rmseMW": round(float(np.sqrt(np.mean(np.array(errs) ** 2))), 1),
                "biasMW": round(float(np.mean(errs)), 1),
            })
        else:
            diurnal_profile.append({
                "hourOfDay": h,
                "hourLabel": f"{h:02d}:00",
                "sampleCount": 0,
                "meanActualMW": 0.0,
                "meanForecastMW": 0.0,
                "maeMW": 0.0,
                "rmseMW": 0.0,
                "biasMW": 0.0,
            })
            
    return diurnal_profile

def compute_horizon_degradation(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Group accuracy metrics by forecast horizon lead-time brackets:
    12-16h, 16-20h, 20-24h, 24-28h, 28-36h.
    """
    buckets = [
        {"label": "12h - 16h", "min": 12.0, "max": 16.0},
        {"label": "16h - 20h", "min": 16.0, "max": 20.0},
        {"label": "20h - 24h", "min": 20.0, "max": 24.0},
        {"label": "24h - 28h", "min": 24.0, "max": 28.0},
        {"label": "28h - 36h", "min": 28.0, "max": 36.5},
    ]
    
    result = []
    for b in buckets:
        matching = [
            r for r in records
            if r["forecastHorizonHours"] is not None
            and b["min"] <= r["forecastHorizonHours"] < b["max"]
            and r["errorMW"] is not None
        ]
        
        if matching:
            errs = [x["errorMW"] for x in matching]
            abs_errs = [x["absoluteErrorMW"] for x in matching]
            result.append({
                "horizonBucket": b["label"],
                "sampleCount": len(matching),
                "maeMW": round(float(np.mean(abs_errs)), 1),
                "rmseMW": round(float(np.sqrt(np.mean(np.array(errs) ** 2))), 1),
                "biasMW": round(float(np.mean(errs)), 1),
            })
            
    return result

def generate_trading_insights(summary: Dict[str, Any], worst: Optional[Dict[str, Any]]) -> List[Dict[str, str]]:
    """
    Translate statistical metrics into plain-English commercial decision insights.
    """
    insights = []
    bias = summary["biasMW"]
    mae = summary["maeMW"]
    p90 = summary.get("quantiles", {}).get("p90", 0.0)
    wape = summary["wapePercent"]
    
    # 1. Systematic Bias Direction
    if bias > 50:
        insights.append({
            "category": "Forecast Bias",
            "type": "positive",
            "title": "Systematic Under-Prediction (+ Bias)",
            "message": f"Forecasts underpredicted outturn wind by an average of {bias:,.0f} MW. The utility typically has surplus generation beyond day-ahead expectations.",
        })
    elif bias < -50:
        insights.append({
            "category": "Forecast Bias",
            "type": "negative",
            "title": "Systematic Over-Prediction (- Bias / Optimism)",
            "message": f"Forecasts overpredicted wind by an average of {abs(bias):,.0f} MW. The trading desk faces regular physical shortfalls and must secure backup dispatch.",
        })
    else:
        insights.append({
            "category": "Forecast Bias",
            "type": "neutral",
            "title": "Unbiased Forecast Center",
            "message": f"Mean forecast bias is negligible ({bias:,.0f} MW), indicating well-calibrated central tendency across the month.",
        })
        
    # 2. Volume Risk & Hedging Sizing (P90)
    insights.append({
        "category": "Procurement Risk",
        "type": "warning",
        "title": "P90 Volume-at-Risk Threshold",
        "message": f"In 90% of January settlement periods, forecast deviation remained under {p90:,.0f} MW. The procurement desk can hedge 90% of volume risk with a {p90:,.0f} MW flexible reserve buffer.",
    })
    
    # 3. Overall Reliability (WAPE)
    insights.append({
        "category": "Reliability",
        "type": "info",
        "title": "Volume-Weighted Accuracy (WAPE)",
        "message": f"The aggregate volume-weighted error is {wape:.1f}%. Historical mean absolute error was {mae:,.0f} MW against a monthly peak of {summary['peakActualMW']:,.0f} MW.",
    })
    
    # 4. Maximum Disruption Event
    if worst:
        insights.append({
            "category": "Tail Risk Event",
            "type": "danger",
            "title": "Largest Forecast Miss",
            "message": f"The maximum error occurred on {worst['deliveryTime'][:10]} at SP {worst.get('settlementPeriod', 'N/A')}, deviating by {worst['absoluteErrorMW']:,.0f} MW (Actual: {worst['actualMW']:,.0f} MW vs Forecast: {worst['forecastMW']:,.0f} MW).",
        })
        
    return insights
