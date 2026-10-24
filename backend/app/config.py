import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.getenv("DATA_DIR", str(BASE_DIR / "app" / "data")))
DATA_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    app_name: str = "UK Day-Ahead Wind Forecast & Uncertainty Dashboard"
    app_version: str = "1.0.0"
    environment: str = os.getenv("ENVIRONMENT", "development")
    port: int = int(os.getenv("PORT", "8000"))
    cors_origins: list[str] = [
        origin.strip() 
        for origin in os.getenv(
            "CORS_ORIGINS", 
            "http://localhost:3000,http://localhost:5173,https://frontend-theta-pied-26.vercel.app"
        ).split(",")
        if origin.strip()
    ]
    data_dir: Path = DATA_DIR
    
    # Elexon API Endpoints
    elexon_fuelhh_url: str = "https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream"
    elexon_windfor_url: str = "https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream"

settings = Settings()
