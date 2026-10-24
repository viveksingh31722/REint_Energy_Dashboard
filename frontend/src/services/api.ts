import axios from 'axios';
import {
  AccuracySummary,
  TimeSeriesPoint,
  ErrorDistribution,
  DiurnalHourPoint,
  HorizonBucketPoint,
  ForecastEvolution,
  TablePaginatedResponse,
} from '../types';

// Read backend URL from environment variables, defaulting to live Render deployment
const RENDER_BACKEND_URL = 'https://reint-energy-backend-5ko2.onrender.com';
const RAW_URL = import.meta.env.VITE_API_URL || RENDER_BACKEND_URL;
export const API_BASE_URL = RAW_URL.replace(/\/+$/, '');

const client = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getSummary: async (cutoffHour: number = 12, resolution: string = '30min'): Promise<AccuracySummary> => {
    const res = await client.get<AccuracySummary>('/summary', {
      params: { cutoff_hour: cutoffHour, resolution },
    });
    return res.data;
  },

  getSeries: async (cutoffHour: number = 12, resolution: string = '30min'): Promise<TimeSeriesPoint[]> => {
    const res = await client.get<TimeSeriesPoint[]>('/series', {
      params: { cutoff_hour: cutoffHour, resolution },
    });
    return res.data;
  },

  getDistribution: async (cutoffHour: number = 12, bins: number = 25): Promise<ErrorDistribution> => {
    const res = await client.get<ErrorDistribution>('/accuracy/distribution', {
      params: { cutoff_hour: cutoffHour, bins },
    });
    return res.data;
  },

  getDiurnal: async (cutoffHour: number = 12): Promise<DiurnalHourPoint[]> => {
    const res = await client.get<DiurnalHourPoint[]>('/accuracy/diurnal', {
      params: { cutoff_hour: cutoffHour },
    });
    return res.data;
  },

  getHorizon: async (cutoffHour: number = 12): Promise<HorizonBucketPoint[]> => {
    const res = await client.get<HorizonBucketPoint[]>('/accuracy/horizon', {
      params: { cutoff_hour: cutoffHour },
    });
    return res.data;
  },

  getEvolution: async (deliveryTime: string): Promise<ForecastEvolution> => {
    const res = await client.get<ForecastEvolution>('/evolution', {
      params: { delivery_time: deliveryTime },
    });
    return res.data;
  },

  getTable: async (params: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    order?: 'asc' | 'desc';
    minAbsError?: number;
    cutoffHour?: number;
    resolution?: string;
  }): Promise<TablePaginatedResponse> => {
    const res = await client.get<TablePaginatedResponse>('/table', {
      params: {
        page: params.page || 1,
        page_size: params.pageSize || 50,
        sort_by: params.sortBy || 'deliveryTime',
        order: params.order || 'asc',
        min_abs_error: params.minAbsError,
        cutoff_hour: params.cutoffHour || 12,
        resolution: params.resolution || '30min',
      },
    });
    return res.data;
  },

  getExportCsvUrl: (cutoffHour: number = 12, resolution: string = '30min'): string => {
    return `${API_BASE_URL}/api/export/csv?cutoff_hour=${cutoffHour}&resolution=${resolution}`;
  },
};
