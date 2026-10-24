from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class QuantilesModel(BaseModel):
    p10: float
    p25: float
    p50: float
    p75: float
    p90: float
    p95: float
    p99: float

class WorstErrorEventModel(BaseModel):
    deliveryTime: str
    settlementPeriod: Optional[int]
    actualMW: float
    forecastMW: float
    errorMW: float
    absoluteErrorMW: float

class TradingInsightModel(BaseModel):
    category: str
    type: str
    title: str
    message: str

class AccuracySummaryResponse(BaseModel):
    sampleCount: int
    maeMW: float
    rmseMW: float
    biasMW: float
    wapePercent: float
    nmaePercent: float
    peakActualMW: float
    minActualMW: float
    cutoffHour: int
    resolution: str
    quantiles: Dict[str, float]
    worstErrorEvent: Optional[WorstErrorEventModel]
    insights: List[TradingInsightModel]

class TimeSeriesPoint(BaseModel):
    deliveryTime: str
    settlementDate: str
    settlementPeriod: int
    actualGenerationMW: float
    forecastGenerationMW: Optional[float]
    forecastPublishTime: Optional[str]
    forecastHorizonHours: Optional[float]
    errorMW: Optional[float]
    absoluteErrorMW: Optional[float]
    percentageError: Optional[float]

class HistogramBin(BaseModel):
    binRange: str
    binMidpoint: float
    count: int
    percentage: float

class ErrorDistributionResponse(BaseModel):
    sampleCount: int
    meanError: float
    stdError: float
    histogram: List[HistogramBin]
    quantiles: Dict[str, float]

class DiurnalHourPoint(BaseModel):
    hourOfDay: int
    hourLabel: str
    sampleCount: int
    meanActualMW: float
    meanForecastMW: float
    maeMW: float
    rmseMW: float
    biasMW: float

class HorizonBucketPoint(BaseModel):
    horizonBucket: str
    sampleCount: int
    maeMW: float
    rmseMW: float
    biasMW: float

class EvolutionRevisionPoint(BaseModel):
    publishTime: str
    forecastMW: float
    horizonHours: float
    deltaFromPreviousMW: float
    deltaFromActualMW: Optional[float]

class ForecastEvolutionResponse(BaseModel):
    deliveryTime: str
    actualGenerationMW: Optional[float]
    revisionCount: int
    evolutionSeries: List[EvolutionRevisionPoint]

class TablePaginatedResponse(BaseModel):
    totalCount: int
    page: int
    pageSize: int
    totalPages: int
    records: List[TimeSeriesPoint]
