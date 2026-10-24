import io
import csv
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException, Response
from fastapi.responses import StreamingResponse

from app.schemas.models import (
    AccuracySummaryResponse,
    TimeSeriesPoint,
    ErrorDistributionResponse,
    DiurnalHourPoint,
    HorizonBucketPoint,
    ForecastEvolutionResponse,
    TablePaginatedResponse,
)
from app.services.matching import (
    load_cached_datasets,
    select_day_ahead_records,
    get_forecast_evolution,
)
from app.services.analytics import (
    compute_accuracy_summary,
    compute_error_distribution,
    compute_diurnal_profile,
    compute_horizon_degradation,
    generate_trading_insights,
)
from app.services.ingestion import save_clean_datasets

router = APIRouter(prefix="/api", tags=["Analytics & Forecasts"])

# Singleton dataset cache for instant queries
_ACTUALS_CACHE = None
_FORECASTS_CACHE = None

def get_datasets():
    global _ACTUALS_CACHE, _FORECASTS_CACHE
    if _ACTUALS_CACHE is None or _FORECASTS_CACHE is None:
        _ACTUALS_CACHE, _FORECASTS_CACHE = load_cached_datasets()
    return _ACTUALS_CACHE, _FORECASTS_CACHE

@router.get("/summary", response_model=AccuracySummaryResponse)
def get_summary(
    cutoff_hour: int = Query(12, ge=0, le=23, description="Day-ahead gate cutoff hour on D-1 in UTC"),
    resolution: str = Query("30min", pattern="^(30min|hourly)$"),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
):
    """
    Get top-level KPI metrics, empirical error quantiles, and plain-English trading desk insights.
    """
    actuals, forecasts = get_datasets()
    records = select_day_ahead_records(
        actuals, forecasts,
        cutoff_hour=cutoff_hour,
        resolution=resolution,
        start_date=start_date,
        end_date=end_date,
    )
    summary = compute_accuracy_summary(records)
    insights = generate_trading_insights(summary, summary.get("worstErrorEvent"))
    
    return {
        **summary,
        "cutoffHour": cutoff_hour,
        "resolution": resolution,
        "insights": insights,
    }

@router.get("/series", response_model=List[TimeSeriesPoint])
def get_time_series(
    cutoff_hour: int = Query(12, ge=0, le=23),
    resolution: str = Query("30min", pattern="^(30min|hourly)$"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    """
    Get aligned time series comparing Actual Generation vs Day-Ahead Forecast.
    """
    actuals, forecasts = get_datasets()
    records = select_day_ahead_records(
        actuals, forecasts,
        cutoff_hour=cutoff_hour,
        resolution=resolution,
        start_date=start_date,
        end_date=end_date,
    )
    return records

@router.get("/accuracy/distribution", response_model=ErrorDistributionResponse)
def get_error_distribution(
    cutoff_hour: int = Query(12, ge=0, le=23),
    resolution: str = Query("30min", pattern="^(30min|hourly)$"),
    bins: int = Query(25, ge=10, le=50),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    """
    Get error histogram distribution data and quantile markers.
    """
    actuals, forecasts = get_datasets()
    records = select_day_ahead_records(
        actuals, forecasts,
        cutoff_hour=cutoff_hour,
        resolution=resolution,
        start_date=start_date,
        end_date=end_date,
    )
    return compute_error_distribution(records, num_bins=bins)

@router.get("/accuracy/diurnal", response_model=List[DiurnalHourPoint])
def get_diurnal_profile(
    cutoff_hour: int = Query(12, ge=0, le=23),
    resolution: str = Query("30min", pattern="^(30min|hourly)$"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    """
    Get 24-hour diurnal profile of actuals, forecasts, MAE, RMSE, and bias across hours of the day.
    """
    actuals, forecasts = get_datasets()
    records = select_day_ahead_records(
        actuals, forecasts,
        cutoff_hour=cutoff_hour,
        resolution=resolution,
        start_date=start_date,
        end_date=end_date,
    )
    return compute_diurnal_profile(records)

@router.get("/accuracy/horizon", response_model=List[HorizonBucketPoint])
def get_horizon_analysis(
    cutoff_hour: int = Query(12, ge=0, le=23),
    resolution: str = Query("30min", pattern="^(30min|hourly)$"),
):
    """
    Get forecast degradation metrics grouped by lead-time horizon brackets (12h-16h, 16h-20h, etc.).
    """
    actuals, forecasts = get_datasets()
    records = select_day_ahead_records(
        actuals, forecasts,
        cutoff_hour=cutoff_hour,
        resolution=resolution,
    )
    return compute_horizon_degradation(records)

@router.get("/evolution", response_model=ForecastEvolutionResponse)
def get_evolution(
    delivery_time: str = Query(..., description="Target delivery timestamp, e.g. 2026-01-15T18:00:00Z"),
):
    """
    Get all successive forecast iterations published by NESO leading up to delivery vs final actual.
    """
    actuals, forecasts = get_datasets()
    try:
        evolution = get_forecast_evolution(delivery_time, actuals, forecasts)
        return evolution
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/table", response_model=TablePaginatedResponse)
def get_table_records(
    cutoff_hour: int = Query(12, ge=0, le=23),
    resolution: str = Query("30min", pattern="^(30min|hourly)$"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    min_abs_error: Optional[float] = Query(None, description="Filter for errors greater than this threshold"),
    sort_by: str = Query("deliveryTime", description="deliveryTime, actualGenerationMW, forecastGenerationMW, errorMW, absoluteErrorMW"),
    order: str = Query("asc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=10, le=200),
):
    """
    Get paginated, filterable, sortable settlement period records.
    """
    actuals, forecasts = get_datasets()
    records = select_day_ahead_records(
        actuals, forecasts,
        cutoff_hour=cutoff_hour,
        resolution=resolution,
        start_date=start_date,
        end_date=end_date,
    )
    
    # Filter by minimum absolute error if requested
    if min_abs_error is not None:
        records = [
            r for r in records 
            if r["absoluteErrorMW"] is not None and r["absoluteErrorMW"] >= min_abs_error
        ]
        
    # Sort
    reverse = (order == "desc")
    records.sort(
        key=lambda x: (x.get(sort_by) is None, x.get(sort_by) if x.get(sort_by) is not None else 0),
        reverse=reverse,
    )
    
    total_count = len(records)
    total_pages = max(1, (total_count + page_size - 1) // page_size)
    
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    page_records = records[start_idx:end_idx]
    
    return {
        "totalCount": total_count,
        "page": page,
        "pageSize": page_size,
        "totalPages": total_pages,
        "records": page_records,
    }

@router.get("/export/csv")
def export_csv(
    cutoff_hour: int = Query(12, ge=0, le=23),
    resolution: str = Query("30min", pattern="^(30min|hourly)$"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    """
    Stream a clean CSV file containing matched settlement records and accuracy metrics.
    """
    actuals, forecasts = get_datasets()
    records = select_day_ahead_records(
        actuals, forecasts,
        cutoff_hour=cutoff_hour,
        resolution=resolution,
        start_date=start_date,
        end_date=end_date,
    )
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "deliveryTime",
        "settlementDate",
        "settlementPeriod",
        "actualGenerationMW",
        "dayAheadForecastMW",
        "forecastPublishTime",
        "forecastHorizonHours",
        "errorMW",
        "absoluteErrorMW",
        "percentageError",
        "cutoffHourUTC",
    ])
    
    for r in records:
        writer.writerow([
            r["deliveryTime"],
            r["settlementDate"],
            r["settlementPeriod"],
            r["actualGenerationMW"],
            r["forecastGenerationMW"],
            r["forecastPublishTime"],
            r["forecastHorizonHours"],
            r["errorMW"],
            r["absoluteErrorMW"],
            r["percentageError"],
            r["cutoffHour"],
        ])
        
    output.seek(0)
    filename = f"uk_wind_settlement_{resolution}_cutoff_{cutoff_hour}UTC.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

@router.post("/pipeline/refresh")
def refresh_data():
    """Trigger background re-ingestion from Elexon BMRS API."""
    global _ACTUALS_CACHE, _FORECASTS_CACHE
    try:
        metadata = save_clean_datasets()
        _ACTUALS_CACHE, _FORECASTS_CACHE = load_cached_datasets()
        return {"status": "success", "metadata": metadata}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refresh failed: {e}")
