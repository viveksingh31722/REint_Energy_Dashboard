from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_summary_endpoint():
    response = client.get("/api/summary?cutoff_hour=12&resolution=30min")
    assert response.status_code == 200
    data = response.json()
    assert data["sampleCount"] == 1488
    assert "maeMW" in data
    assert "rmseMW" in data
    assert "biasMW" in data
    assert "wapePercent" in data
    assert "quantiles" in data
    assert "insights" in data
    assert len(data["insights"]) > 0

def test_get_series_endpoint():
    response = client.get("/api/series?cutoff_hour=12&resolution=30min")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1488
    first = data[0]
    assert first["deliveryTime"] == "2026-01-01T00:00:00Z"
    assert first["actualGenerationMW"] is not None
    assert first["forecastGenerationMW"] is not None

def test_get_distribution_endpoint():
    response = client.get("/api/accuracy/distribution?cutoff_hour=12&bins=20")
    assert response.status_code == 200
    data = response.json()
    assert "histogram" in data
    assert len(data["histogram"]) == 20
    assert "quantiles" in data

def test_get_diurnal_endpoint():
    response = client.get("/api/accuracy/diurnal?cutoff_hour=12")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 24
    assert data[0]["hourLabel"] == "00:00"

def test_get_horizon_endpoint():
    response = client.get("/api/accuracy/horizon?cutoff_hour=12")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0

def test_get_evolution_endpoint():
    response = client.get("/api/evolution?delivery_time=2026-01-15T18:00:00Z")
    assert response.status_code == 200
    data = response.json()
    assert data["deliveryTime"] == "2026-01-15T18:00:00Z"
    assert data["revisionCount"] > 0
    assert "evolutionSeries" in data

def test_get_table_paginated():
    response = client.get("/api/table?page=1&page_size=25&order=desc")
    assert response.status_code == 200
    data = response.json()
    assert data["totalCount"] == 1488
    assert data["page"] == 1
    assert data["pageSize"] == 25
    assert len(data["records"]) == 25

def test_export_csv():
    response = client.get("/api/export/csv?cutoff_hour=12")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    content = response.text
    assert "deliveryTime" in content
    assert "actualGenerationMW" in content
