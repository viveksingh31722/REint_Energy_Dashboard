import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  AccuracySummary,
  ErrorDistribution,
  DiurnalHourPoint,
  HorizonBucketPoint,
  TimeSeriesPoint,
} from '../../types';
import { BarChart3, AlertCircle, Clock, TrendingDown } from 'lucide-react';

interface AccuracyWorkspaceProps {
  summary: AccuracySummary;
  series: TimeSeriesPoint[];
  distribution?: ErrorDistribution;
  diurnal?: DiurnalHourPoint[];
  horizon?: HorizonBucketPoint[];
}

export const AccuracyWorkspace: React.FC<AccuracyWorkspaceProps> = ({
  summary,
  series,
  distribution,
  diurnal,
  horizon,
}) => {
  // 1. Signed Error Bar Chart
  const signedErrorOption = useMemo(() => {
    const sampled = series.filter((_, i) => i % 2 === 0);
    const times = sampled.map((s) => `${s.deliveryTime.substring(8, 10)} Jan ${s.deliveryTime.substring(11, 16)}`);
    const errors = sampled.map((s) => s.errorMW ?? 0);

    return {
      backgroundColor: 'transparent',
      grid: { top: 24, right: 18, bottom: 35, left: 55 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#111514',
        borderColor: '#252C29',
        textStyle: { color: '#F1F4F1', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const p = params[0];
          const val = p.value;
          const isOver = val < 0;
          return `
            <div style="font-family:'Geist Mono',monospace;">
              <div style="color:#8B9691; font-size:10px; margin-bottom:4px;">${p.name} GMT</div>
              <div style="font-weight:700; color:${isOver ? '#E58A5C' : '#35B89A'};">
                Error: ${val > 0 ? '+' : ''}${val.toLocaleString()} MW
              </div>
              <div style="font-size:10px; color:#5F6A65; margin-top:2px;">
                ${isOver ? 'Forecast was higher than actual (shortfall)' : 'Forecast was lower than actual (surplus)'}
              </div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#252C29' } },
        axisTick: { show: false },
        axisLabel: { color: '#5F6A65', fontSize: 10, interval: Math.floor(times.length / 7) },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1A201E', type: 'dashed' } },
        axisLabel: {
          color: '#5F6A65',
          fontSize: 10,
          formatter: (v: number) => `${v > 0 ? '+' : ''}${(v / 1000).toFixed(0)}k MW`,
        },
      },
      series: [
        {
          name: 'Signed Error',
          type: 'bar',
          data: errors.map((err) => ({
            value: err,
            itemStyle: {
              color: err >= 0 ? '#35B89A' : '#E58A5C', // Emerald for surplus, Terracotta for shortfall
              opacity: 0.85,
            },
          })),
        },
      ],
    };
  }, [series]);

  // 2. Error Distribution Histogram with Ochre P50 Line
  const distributionOption = useMemo(() => {
    if (!distribution || !distribution.histogram) return {};
    const binLabels = distribution.histogram.map((b) => b.binMidpoint);
    const counts = distribution.histogram.map((b) => b.count);

    return {
      backgroundColor: 'transparent',
      grid: { top: 30, right: 18, bottom: 35, left: 45 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#111514',
        borderColor: '#252C29',
        textStyle: { color: '#F1F4F1', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const idx = params[0].dataIndex;
          const bin = distribution.histogram[idx];
          return `
            <div style="font-family:'Geist Mono',monospace;">
              <div style="font-weight:600; color:#F1F4F1;">Range: ${bin.binRange}</div>
              <div style="color:#E58A5C; margin-top:3px; font-weight:600;">${bin.count} Settlement Periods (${bin.percentage}%)</div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: binLabels,
        axisLine: { lineStyle: { color: '#252C29' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#5F6A65',
          fontSize: 10,
          formatter: (v: number) => `${v > 0 ? '+' : ''}${Math.round(v / 1000)}k`,
        },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1A201E', type: 'dashed' } },
        axisLabel: { color: '#5F6A65', fontSize: 10 },
      },
      series: [
        {
          name: 'Frequency',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: '#E58A5C',
            borderRadius: [2, 2, 0, 0],
            opacity: 0.85,
          },
          markLine: {
            symbol: 'none',
            data: [
              {
                xAxis: Math.floor(binLabels.length / 2),
                lineStyle: { color: '#D7B35A', type: 'dashed', width: 2 },
                label: { formatter: 'P50 Median', color: '#D7B35A', fontSize: 10, fontWeight: 'bold' },
              },
            ],
          },
        },
      ],
    };
  }, [distribution]);

  // 3. Diurnal 24-Hour Profile Option
  const diurnalOption = useMemo(() => {
    if (!diurnal || !diurnal.length) return {};
    const hours = diurnal.map((d) => d.hourLabel);
    const maes = diurnal.map((d) => d.maeMW);
    const biases = diurnal.map((d) => d.biasMW);

    return {
      backgroundColor: 'transparent',
      grid: { top: 30, right: 18, bottom: 35, left: 55 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#111514',
        borderColor: '#252C29',
        textStyle: { color: '#F1F4F1', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
      },
      legend: {
        top: 0,
        right: 10,
        textStyle: { color: '#8B9691', fontSize: 10, fontFamily: 'Geist Mono, monospace' },
      },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: { lineStyle: { color: '#252C29' } },
        axisTick: { show: false },
        axisLabel: { color: '#5F6A65', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1A201E', type: 'dashed' } },
        axisLabel: { color: '#5F6A65', fontSize: 10, formatter: (v: number) => `${(v / 1000).toFixed(0)}k MW` },
      },
      series: [
        {
          name: 'Mean Absolute Error (MAE)',
          type: 'line',
          smooth: 0.3,
          data: maes,
          lineStyle: { color: '#E58A5C', width: 2 },
          itemStyle: { color: '#E58A5C' },
        },
        {
          name: 'Systematic Bias',
          type: 'line',
          smooth: 0.3,
          data: biases,
          lineStyle: { color: '#E0645A', width: 1.6, type: 'dashed' },
          itemStyle: { color: '#E0645A' },
        },
      ],
    };
  }, [diurnal]);

  // 4. Horizon Degradation Option
  const horizonOption = useMemo(() => {
    if (!horizon || !horizon.length) return {};
    const buckets = horizon.map((h) => h.horizonBucket);
    const maes = horizon.map((h) => h.maeMW);

    return {
      backgroundColor: 'transparent',
      grid: { top: 25, right: 18, bottom: 35, left: 55 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#111514',
        borderColor: '#252C29',
        textStyle: { color: '#F1F4F1', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
      },
      xAxis: {
        type: 'category',
        data: buckets,
        axisLine: { lineStyle: { color: '#252C29' } },
        axisTick: { show: false },
        axisLabel: { color: '#5F6A65', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1A201E', type: 'dashed' } },
        axisLabel: { color: '#5F6A65', fontSize: 10 },
      },
      series: [
        {
          name: 'MAE (MW)',
          type: 'bar',
          data: maes,
          itemStyle: {
            color: '#35B89A',
            opacity: 0.85,
            borderRadius: [2, 2, 0, 0],
          },
        },
      ],
    };
  }, [horizon]);

  return (
    <div className="space-y-6">
      {/* Row 1: Signed Error Timeline & Distribution Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Signed Error Timeline */}
        <div className="dark-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#F1F4F1] flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-[#35B89A]" />
                Signed Error Chronology (Actual - Forecast)
              </span>
              <p className="text-[11px] text-[#5F6A65] mt-0.5">
                Emerald = Surplus wind delivered | Terracotta = Shortfall vs. expectation
              </p>
            </div>
          </div>
          <div className="h-[280px]">
            <ReactECharts option={signedErrorOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Chart 2: Error Distribution */}
        <div className="dark-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#F1F4F1] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[#E58A5C]" />
                Error Distribution & Empirical Quantiles
              </span>
              <p className="text-[11px] text-[#5F6A65] mt-0.5">
                Binned frequency with P50 median quantile marker
              </p>
            </div>
            {distribution && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#151A18] text-[#8B9691] border border-[#252C29] font-semibold">
                σ = ±{distribution.stdError.toLocaleString()} MW
              </span>
            )}
          </div>
          <div className="h-[280px]">
            <ReactECharts option={distributionOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Row 2: Diurnal 24-Hour Profile & Horizon Degradation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Diurnal 24h Profile */}
        <div className="dark-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#F1F4F1] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#E58A5C]" />
                Diurnal Error Profile (24-Hour Settlement Cycle)
              </span>
              <p className="text-[11px] text-[#5F6A65] mt-0.5">
                Morning ramp (07:00–09:00) vs. evening peak (17:00–20:00) volatility
              </p>
            </div>
          </div>
          <div className="h-[280px]">
            <ReactECharts option={diurnalOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Chart 4: Horizon Degradation */}
        <div className="dark-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#F1F4F1] flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-[#35B89A]" />
                Forecast Error vs. Lead Horizon
              </span>
              <p className="text-[11px] text-[#5F6A65] mt-0.5">
                Error progression as gate closure advances from 36h to 12h
              </p>
            </div>
          </div>
          <div className="h-[280px]">
            <ReactECharts option={horizonOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
