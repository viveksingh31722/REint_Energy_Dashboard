import json
import logging
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Any, Optional

from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ingestion")

def fetch_with_retry(url: str, retries: int = 3, backoff: float = 2.0) -> List[Dict[str, Any]]:
    """Fetch JSON data from Elexon API with retry logic and exponential backoff."""
    headers = {
        "User-Agent": "REint-Energy-Procurement-Dashboard/1.0 (Energy Analytics)",
        "Accept": "application/json",
    }
    req = urllib.request.Request(url, headers=headers)
    
    for attempt in range(1, retries + 1):
        try:
            logger.info(f"Fetching: {url} (Attempt {attempt}/{retries})")
            with urllib.request.urlopen(req, timeout=30) as resp:
                if resp.status == 200:
                    payload = json.loads(resp.read().decode("utf-8"))
                    if isinstance(payload, list):
                        return payload
                    elif isinstance(payload, dict) and "data" in payload:
                        return payload["data"]
                    else:
                        raise ValueError(f"Unexpected response format: {type(payload)}")
                else:
                    raise IOError(f"HTTP status {resp.status}")
        except Exception as e:
            logger.warning(f"Fetch failed on attempt {attempt}: {e}")
            if attempt == retries:
                raise
            time.sleep(backoff ** attempt)
    return []

def fetch_fuelhh_actuals(
    start_date: str = "2026-01-01",
    end_date: str = "2026-01-31",
    fuel_type: str = "WIND",
) -> List[Dict[str, Any]]:
    """
    Fetch FUELHH actual wind generation outturns for the specified settlement date range.
    Filters exclusively for the specified fuel_type (default: WIND).
    """
    url = f"{settings.elexon_fuelhh_url}?settlementDateFrom={start_date}&settlementDateTo={end_date}"
    raw_data = fetch_with_retry(url)
    
    wind_records = []
    for record in raw_data:
        if record.get("fuelType") == fuel_type:
            # Clean and validate record
            wind_records.append({
                "dataset": "FUELHH",
                "settlementDate": record.get("settlementDate"),
                "settlementPeriod": int(record.get("settlementPeriod")),
                "startTime": record.get("startTime"),
                "publishTime": record.get("publishTime"),
                "fuelType": record.get("fuelType"),
                "generation": float(record.get("generation", 0.0) or 0.0),
            })
            
    # Sort deterministically by startTime
    wind_records.sort(key=lambda x: x["startTime"])
    logger.info(f"Successfully processed {len(wind_records)} {fuel_type} actual records.")
    return wind_records

def fetch_windfor_forecasts(
    publish_from: str = "2025-12-30T00:00:00Z",
    publish_to: str = "2026-01-31T23:59:59Z",
    chunk_days: int = 8,
) -> List[Dict[str, Any]]:
    """
    Fetch rolling WINDFOR forecasts.
    Queries in chunks to prevent gateway timeouts on Elexon stream endpoints.
    Includes December 30-31, 2025 lookback to guarantee Jan 1-2 day-ahead coverage.
    """
    from datetime import timedelta
    from dateutil import parser

    start_dt = parser.isoparse(publish_from)
    end_dt = parser.isoparse(publish_to)
    
    all_forecasts: List[Dict[str, Any]] = []
    seen_keys = set()
    
    current_start = start_dt
    while current_start < end_dt:
        current_end = min(current_start + timedelta(days=chunk_days), end_dt)
        from_str = current_start.strftime("%Y-%m-%dT%H:%M:%SZ")
        to_str = current_end.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        url = f"{settings.elexon_windfor_url}?publishDateTimeFrom={from_str}&publishDateTimeTo={to_str}"
        chunk_data = fetch_with_retry(url)
        
        for item in chunk_data:
            pub = item.get("publishTime")
            st = item.get("startTime")
            gen = item.get("generation")
            
            if pub and st and gen is not None:
                key = (pub, st)
                if key not in seen_keys:
                    seen_keys.add(key)
                    all_forecasts.append({
                        "dataset": "WINDFOR",
                        "publishTime": pub,
                        "startTime": st,
                        "generation": float(gen),
                    })
                    
        current_start = current_end

    # Sort deterministically by publishTime then startTime
    all_forecasts.sort(key=lambda x: (x["publishTime"], x["startTime"]))
    logger.info(f"Successfully processed {len(all_forecasts)} distinct WINDFOR forecast points.")
    return all_forecasts

def save_clean_datasets(target_dir: Optional[Path] = None) -> Dict[str, Any]:
    """
    Ingest, validate, and serialize FUELHH actuals and WINDFOR forecasts into local storage.
    """
    dest_dir = target_dir or settings.data_dir
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    fuelhh_file = dest_dir / "fuelhh_actuals_jan_2026.json"
    windfor_file = dest_dir / "windfor_forecasts_jan_2026.json"
    metadata_file = dest_dir / "dataset_metadata.json"
    
    # 1. Fetch FUELHH Actuals
    actuals = fetch_fuelhh_actuals(start_date="2026-01-01", end_date="2026-01-31")
    
    # Validation
    assert len(actuals) == 1488, f"Expected 1488 settlement periods in January, got {len(actuals)}"
    assert all(a["generation"] is not None for a in actuals), "Found null generation in actuals"
    
    # 2. Fetch WINDFOR Forecasts
    forecasts = fetch_windfor_forecasts(
        publish_from="2025-12-30T00:00:00Z",
        publish_to="2026-01-31T23:59:59Z",
    )
    assert len(forecasts) > 0, "No forecast records retrieved"
    
    # 3. Write files
    with open(fuelhh_file, "w", encoding="utf-8") as f:
        json.dump(actuals, f, indent=2)
        
    with open(windfor_file, "w", encoding="utf-8") as f:
        json.dump(forecasts, f, indent=2)
        
    metadata = {
        "dataset_created_at": datetime.now(timezone.utc).isoformat(),
        "month": "January 2026",
        "fuel_type": "WIND",
        "actual_settlement_periods_count": len(actuals),
        "forecast_points_count": len(forecasts),
        "fuelhh_range": [actuals[0]["startTime"], actuals[-1]["startTime"]],
        "windfor_publish_range": [forecasts[0]["publishTime"], forecasts[-1]["publishTime"]],
    }
    
    with open(metadata_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    logger.info("Clean dataset persisted successfully to disk.")
    return metadata

if __name__ == "__main__":
    save_clean_datasets()
