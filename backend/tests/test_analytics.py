import pytest
import numpy as np
from app.services.matching import select_day_ahead_records, get_forecast_evolution, load_cached_datasets
from app.services.analytics import compute_accuracy_summary, compute_error_distribution, compute_diurnal_profile

def test_mathematical_metrics():
    # Synthetic test records
    records = [
        {"actualGenerationMW": 1000.0, "forecastGenerationMW": 800.0, "errorMW": 200.0, "absoluteErrorMW": 200.0, "deliveryTime": "2026-01-01T00:00:00Z"},
        {"actualGenerationMW": 1200.0, "forecastGenerationMW": 1500.0, "errorMW": -300.0, "absoluteErrorMW": 300.0, "deliveryTime": "2026-01-01T01:00:00Z"},
        {"actualGenerationMW": 800.0, "forecastGenerationMW": 800.0, "errorMW": 0.0, "absoluteErrorMW": 0.0, "deliveryTime": "2026-01-01T02:00:00Z"},
    ]
    summary = compute_accuracy_summary(records)
    
    # Expected:
    # MAE = (200 + 300 + 0) / 3 = 166.67
    # RMSE = sqrt((40000 + 90000 + 0) / 3) = sqrt(130000 / 3) = 208.17
    # Bias = (200 - 300 + 0) / 3 = -33.33
    # Total Actual = 3000, Total Abs Error = 500 => WAPE = 500 / 3000 * 100 = 16.67%
    assert summary["sampleCount"] == 3
    assert summary["maeMW"] == 166.67
    assert summary["rmseMW"] == 208.17
    assert summary["biasMW"] == -33.33
    assert summary["wapePercent"] == 16.67
    assert summary["peakActualMW"] == 1200.0
    assert summary["minActualMW"] == 800.0

def test_quantiles_ordering():
    actuals, forecasts = load_cached_datasets()
    records = select_day_ahead_records(actuals, forecasts, cutoff_hour=12, resolution="30min")
    summary = compute_accuracy_summary(records)
    q = summary["quantiles"]
    
    assert q["p10"] <= q["p25"]
    assert q["p25"] <= q["p50"]
    assert q["p50"] <= q["p75"]
    assert q["p75"] <= q["p90"]
    assert q["p90"] <= q["p95"]
    assert q["p95"] <= q["p99"]

def test_causality_invariance():
    """Verify that no forecast published after cutoff is selected."""
    actuals, forecasts = load_cached_datasets()
    # Test for Cutoff = 12:00 UTC
    records = select_day_ahead_records(actuals, forecasts, cutoff_hour=12, resolution="30min")
    
    from dateutil import parser
    from datetime import timedelta
    for r in records:
        if r["forecastPublishTime"] is not None:
            del_dt = parser.isoparse(r["deliveryTime"])
            pub_dt = parser.isoparse(r["forecastPublishTime"])
            
            # Cutoff was previous calendar day at 12:00 UTC
            del_date = del_dt.date()
            prev_date = del_date - timedelta(days=1)
            cutoff_dt = parser.isoparse(f"{prev_date.isoformat()}T12:00:00Z")
            
            # Invariant: publishTime must be <= cutoff_dt
            assert pub_dt <= cutoff_dt, f"Causality violation! {pub_dt} > {cutoff_dt} for delivery {del_dt}"

def test_january_1_boundary_coverage():
    """Verify that Jan 1 Settlement Period 1 has a valid day-ahead forecast from Dec 2025."""
    actuals, forecasts = load_cached_datasets()
    records = select_day_ahead_records(actuals, forecasts, cutoff_hour=12, resolution="30min")
    
    jan1_sp1 = next(r for r in records if r["deliveryTime"] == "2026-01-01T00:00:00Z")
    assert jan1_sp1["forecastGenerationMW"] is not None
    assert jan1_sp1["forecastPublishTime"] is not None
    assert jan1_sp1["forecastPublishTime"].startswith("2025-12-31")

def test_evolution_timeline():
    """Verify forecast evolution extraction for a delivery period."""
    actuals, forecasts = load_cached_datasets()
    evolution = get_forecast_evolution("2026-01-15T18:00:00Z", actuals, forecasts)
    
    assert evolution["deliveryTime"] == "2026-01-15T18:00:00Z"
    assert evolution["actualGenerationMW"] is not None
    assert evolution["revisionCount"] > 0
    # Revisions should be in chronological order
    pubs = [s["publishTime"] for s in evolution["evolutionSeries"]]
    assert pubs == sorted(pubs)
