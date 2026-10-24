export interface Quantiles {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface WorstErrorEvent {
  deliveryTime: string;
  settlementPeriod?: number;
  actualMW: number;
  forecastMW: number;
  errorMW: number;
  absoluteErrorMW: number;
}

export interface TradingInsight {
  category: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning' | 'info' | 'danger';
  title: string;
  message: string;
}

export interface AccuracySummary {
  sampleCount: number;
  maeMW: number;
  rmseMW: number;
  biasMW: number;
  wapePercent: number;
  nmaePercent: number;
  peakActualMW: number;
  minActualMW: number;
  cutoffHour: number;
  resolution: string;
  quantiles: Quantiles;
  worstErrorEvent?: WorstErrorEvent;
  insights: TradingInsight[];
}

export interface TimeSeriesPoint {
  deliveryTime: string;
  settlementDate: string;
  settlementPeriod: number;
  actualGenerationMW: number;
  forecastGenerationMW?: number;
  forecastPublishTime?: string;
  forecastHorizonHours?: number;
  errorMW?: number;
  absoluteErrorMW?: number;
  percentageError?: number;
}

export interface HistogramBin {
  binRange: string;
  binMidpoint: number;
  count: number;
  percentage: number;
}

export interface ErrorDistribution {
  sampleCount: number;
  meanError: number;
  stdError: number;
  histogram: HistogramBin[];
  quantiles: Record<string, number>;
}

export interface DiurnalHourPoint {
  hourOfDay: number;
  hourLabel: string;
  sampleCount: number;
  meanActualMW: number;
  meanForecastMW: number;
  maeMW: number;
  rmseMW: number;
  biasMW: number;
}

export interface HorizonBucketPoint {
  horizonBucket: string;
  sampleCount: number;
  maeMW: number;
  rmseMW: number;
  biasMW: number;
}

export interface EvolutionRevisionPoint {
  publishTime: string;
  forecastMW: number;
  horizonHours: number;
  deltaFromPreviousMW: number;
  deltaFromActualMW?: number;
}

export interface ForecastEvolution {
  deliveryTime: string;
  actualGenerationMW?: number;
  revisionCount: number;
  evolutionSeries: EvolutionRevisionPoint[];
}

export interface TablePaginatedResponse {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  records: TimeSeriesPoint[];
}
