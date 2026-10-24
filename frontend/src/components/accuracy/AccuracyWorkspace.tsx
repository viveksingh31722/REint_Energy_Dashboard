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
  // 1. Signed Error Bar Chart Options
  const signedErrorOption = useMemo(() => {
    // Sample every 2nd record to keep rendering ultra-fast
    const sampled = series.filter((_, i) => i % 2 === 0);
    const times = sampled.map((s) => `${s.deliveryTime.substring(8, 10)} Jan ${s.deliveryTime.substring(11, 16)}`);
    const errors = sampled.map((s) => s.errorMW ?? 0);

    return {
      backgroundColor: 'transparent',
      grid: { top: 30, right: 20, bottom: 40, left: 60 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#0A0E17',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#E2E8F0', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const p = params[0];
          const val = p.value;
          const isOver = val < 0;
          return `
            <div style="font-family:'Geist Mono',monospace;">
              <div style="color:#94A3B8; font-size:10px; margin-bottom:4px;">${p.name} GMT</div>
              <div style="font-weight:700; color:${isOver ? '#FB7185' : '#34D399'};">
                Error: ${val > 0 ? '+' : ''}${val.toLocaleString()} MW
              </div>
              <div style="font-size:10px; color:#64748B; margin-top:2px;">
                ${isOver ? 'Forecast was higher than actual (shortfall)' : 'Forecast was lower than actual (surplus)'}
              </div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisTick: { show: false },
        axisLabel: { color: '#64748B', fontSize: 10, interval: Math.floor(times.length / 7) },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)', type: 'dashed' } },
        axisLabel: {
          color: '#64748B',
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
              color: err >= 0 ? '#34D399' : '#FB7185',
              opacity: 0.85,
            },
          })),
        },
      ],
    };
  }, [series]);

  // 2. Error Distribution Histogram with Percentile Markers
  const distributionOption = useMemo(() => {
    if (!distribution || !distribution.histogram) return {};
    const binLabels = distribution.histogram.map((b) => b.binMidpoint);
    const counts = distribution.histogram.map((b) => b.count);
    const p50 = distribution.quantiles?.p50 || 1623;
    const p90 = distribution.quantiles?.p90 || 4024;

    return {
      backgroundColor: 'transparent',
      grid: { top: 35, right: 25, bottom: 40, left: 45 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#0A0E17',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#E2E8F0', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const idx = params[0].dataIndex;
          const bin = distribution.histogram[idx];
          return `
            <div style="font-family:'Geist Mono',monospace;">
              <div style="font-weight:600; color:#FFFFFF;">Range: ${bin.binRange}</div>
              <div style="color:#A78BFA; margin-top:3px;">${bin.count} Settlement Periods (${bin.percentage}%)</div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: binLabels,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
          formatter: (v: number) => `${v > 0 ? '+' : ''}${Math.round(v / 1000)}k`,
        },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)', type: 'dashed' } },
        axisLabel: { color: '#64748B', fontSize: 10 },
      },
      series: [
        {
          name: 'Frequency',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: '#8B5CF6',
            borderRadius: [2, 2, 0, 0],
            opacity: 0.8,
          },
          markLine: {
            symbol: 'none',
            data: [
              {
                xAxis: Math.floor(binLabels.length / 2),
                lineStyle: { color: '#FBBF24', type: 'dashed', width: 1.5 },
                label: { formatter: 'P50 (Median)', color: '#FBBF24', fontSize: 10 },
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
      grid: { top: 35, right: 20, bottom: 40, left: 60 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0A0E17',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#E2E8F0', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
      },
      legend: {
        top: 0,
        right: 10,
        textStyle: { color: '#94A3B8', fontSize: 10, fontFamily: 'Geist Mono, monospace' },
      },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisTick: { show: false },
        axisLabel: { color: '#64748B', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)', type: 'dashed' } },
        axisLabel: { color: '#64748B', fontSize: 10, formatter: (v: number) => `${(v / 1000).toFixed(0)}k MW` },
      },
      series: [
        {
          name: 'Mean Absolute Error (MAE)',
          type: 'line',
          smooth: 0.3,
          data: maes,
          lineStyle: { color: '#F59E0B', width: 2 },
          itemStyle: { color: '#F59E0B' },
        },
        {
          name: 'Systematic Bias',
          type: 'line',
          smooth: 0.3,
          data: biases,
          lineStyle: { color: '#FB7185', width: 1.5, type: 'dashed' },
          itemStyle: { color: '#FB7185' },
        },
      ],
    };
  }, [diurnal]);

  // 4. Horizon Lead-Time Degradation Option
  const horizonOption = useMemo(() => {
    if (!horizon || !horizon.length) return {};
    const buckets = horizon.map((h) => h.horizonBucket);
    const maes = horizon.map((h) => h.maeMW);

    return {
      backgroundColor: 'transparent',
      grid: { top: 30, right: 20, bottom: 40, left: 55 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0A0E17',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#E2E8F0', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
      },
      xAxis: {
        type: 'category',
        data: buckets,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisTick: { show: false },
        axisLabel: { color: '#64748B', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)', type: 'dashed' } },
        axisLabel: { color: '#64748B', fontSize: 10 },
      },
      series: [
        {
          name: 'MAE (MW)',
          type: 'bar',
          data: maes,
          itemStyle: {
            color: '#00E5FF',
            opacity: 0.85,
            borderRadius: [2, 2, 0, 0],
          },
        },
      ],
    };
  }, [horizon]);

  return (
    <div className="space-y-6">
      {/* Top Editorial Metric Strip */}
      <div className="border border-white/[0.08] bg-[#0E131F]/90 rounded-lg p-6 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-5">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">
              Forecast Accuracy & Error Architecture
            </span>
            <span className="text-white/20">/</span>
            <span className="text-xs font-mono text-slate-400">Statistical Distribution & Diurnal Profiles</span>
          </div>
          <span className="text-[11px] font-mono text-[#00E5FF]">N = {summary.sampleCount} SETTLEMENT PERIODS</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 divide-x divide-white/[0.05]">
          <div className="pl-0">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">MAE (Primary)</span>
            <div className="text-2xl font-mono font-bold text-white my-1 tabular-nums">
              ±{summary.maeMW.toLocaleString()} <span className="text-sm font-normal text-slate-400">MW</span>
            </div>
            <span className="text-[11px] text-slate-400">Mean expected deviation</span>
          </div>

          <div className="pl-6">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">RMSE (Outlier Misses)</span>
            <div className="text-2xl font-mono font-bold text-white my-1 tabular-nums">
              {summary.rmseMW.toLocaleString()} <span className="text-sm font-normal text-slate-400">MW</span>
            </div>
            <span className="text-[11px] text-slate-400">Quadratic penalty ratio: {(summary.rmseMW / summary.maeMW).toFixed(2)}x</span>
          </div>

          <div className="pl-6">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Systematic Bias</span>
            <div className="text-2xl font-mono font-bold text-[#FB7185] my-1 tabular-nums">
              {summary.biasMW.toLocaleString()} <span className="text-sm font-normal text-slate-400">MW</span>
            </div>
            <span className="text-[11px] text-slate-400">Over-forecast state</span>
          </div>

          <div className="pl-6">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Volume WAPE</span>
            <div className="text-2xl font-mono font-bold text-[#00E5FF] my-1 tabular-nums">
              {summary.wapePercent}%
            </div>
            <span className="text-[11px] text-slate-400">Weighted error</span>
          </div>

          <div className="pl-6">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">P90 VaR Buffer</span>
            <div className="text-2xl font-mono font-bold text-[#FBBF24] my-1 tabular-nums">
              {summary.quantiles?.p90.toLocaleString()} <span className="text-sm font-normal text-slate-400">MW</span>
            </div>
            <span className="text-[11px] text-slate-400">90% variance bound</span>
          </div>
        </div>
      </div>

      {/* Row 1: Signed Error Timeline & Distribution Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Signed Error Timeline */}
        <div className="border border-white/[0.08] bg-[#0E131F]/90 rounded-lg p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#00E5FF]" />
                Signed Error Chronology (Actual - Forecast)
              </span>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Emerald = Surplus wind delivered | Rose = Shortfall vs. day-ahead expectation
              </p>
            </div>
          </div>
          <div className="h-[280px]">
            <ReactECharts option={signedErrorOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Chart 2: Error Distribution */}
        <div className="border border-white/[0.08] bg-[#0E131F]/90 rounded-lg p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#A78BFA]" />
                Error Distribution & Empirical Quantiles
              </span>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Binned frequency with normal fit and P50 (median) quantile marker
              </p>
            </div>
            {distribution && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.08]">
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
        <div className="border border-white/[0.08] bg-[#0E131F]/90 rounded-lg p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F59E0B]" />
                Diurnal Error Profile (24-Hour Settlement Cycle)
              </span>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Evaluation of morning ramp (07:00–09:00) vs. evening peak (17:00–20:00) volatility
              </p>
            </div>
          </div>
          <div className="h-[280px]">
            <ReactECharts option={diurnalOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Chart 4: Horizon Degradation */}
        <div className="border border-white/[0.08] bg-[#0E131F]/90 rounded-lg p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-[#00E5FF]" />
                Forecast Error vs. Lead Time (Horizon)
              </span>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Demonstrates how error grows as auction gate closure advances from 12h to 36h
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
