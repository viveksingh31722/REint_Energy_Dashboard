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
    const sampled = series.filter((_, i) => i % 2 === 0);
    const times = sampled.map((s) => `${s.deliveryTime.substring(8, 10)} Jan ${s.deliveryTime.substring(11, 16)}`);
    const errors = sampled.map((s) => s.errorMW ?? 0);

    return {
      backgroundColor: 'transparent',
      grid: { top: 30, right: 20, bottom: 40, left: 60 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        borderColor: '#E4E8EC',
        textStyle: { color: '#17202A', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
        extraCssText: 'box-shadow: 0 12px 32px rgba(23, 32, 42, 0.10); backdrop-filter: blur(18px); border-radius: 10px;',
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const p = params[0];
          const val = p.value;
          const isOver = val < 0;
          return `
            <div style="font-family:'Geist Mono',monospace;">
              <div style="color:#66717C; font-size:10px; margin-bottom:4px;">${p.name} GMT</div>
              <div style="font-weight:700; color:${isOver ? '#D95C55' : '#168F79'};">
                Error: ${val > 0 ? '+' : ''}${val.toLocaleString()} MW
              </div>
              <div style="font-size:10px; color:#8D98A3; margin-top:2px;">
                ${isOver ? 'Forecast was higher than actual (shortfall)' : 'Forecast was lower than actual (surplus)'}
              </div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#E4E8EC' } },
        axisTick: { show: false },
        axisLabel: { color: '#8D98A3', fontSize: 10, interval: Math.floor(times.length / 7) },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#EEF1F4', type: 'dashed' } },
        axisLabel: {
          color: '#8D98A3',
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
              color: err >= 0 ? '#168F79' : '#D95C55', // Emerald for surplus, Soft Red for shortfall
              opacity: 0.85,
            },
          })),
        },
      ],
    };
  }, [series]);

  // 2. Error Distribution Histogram with Warm Yellow Marker
  const distributionOption = useMemo(() => {
    if (!distribution || !distribution.histogram) return {};
    const binLabels = distribution.histogram.map((b) => b.binMidpoint);
    const counts = distribution.histogram.map((b) => b.count);

    return {
      backgroundColor: 'transparent',
      grid: { top: 35, right: 25, bottom: 40, left: 45 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        borderColor: '#E4E8EC',
        textStyle: { color: '#17202A', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
        extraCssText: 'box-shadow: 0 12px 32px rgba(23, 32, 42, 0.10); backdrop-filter: blur(18px); border-radius: 10px;',
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const idx = params[0].dataIndex;
          const bin = distribution.histogram[idx];
          return `
            <div style="font-family:'Geist Mono',monospace;">
              <div style="font-weight:600; color:#17202A;">Range: ${bin.binRange}</div>
              <div style="color:#E27D4F; margin-top:3px; font-weight:600;">${bin.count} Settlement Periods (${bin.percentage}%)</div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: binLabels,
        axisLine: { lineStyle: { color: '#E4E8EC' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#8D98A3',
          fontSize: 10,
          formatter: (v: number) => `${v > 0 ? '+' : ''}${Math.round(v / 1000)}k`,
        },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#EEF1F4', type: 'dashed' } },
        axisLabel: { color: '#8D98A3', fontSize: 10 },
      },
      series: [
        {
          name: 'Frequency',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: '#E27D4F', // Soft Coral
            borderRadius: [3, 3, 0, 0],
            opacity: 0.85,
          },
          markLine: {
            symbol: 'none',
            data: [
              {
                xAxis: Math.floor(binLabels.length / 2),
                lineStyle: { color: '#E6B84F', type: 'dashed', width: 2 },
                label: { formatter: 'P50 (Median)', color: '#17202A', fontSize: 10, fontWeight: 'bold' },
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
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        borderColor: '#E4E8EC',
        textStyle: { color: '#17202A', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
        extraCssText: 'box-shadow: 0 12px 32px rgba(23, 32, 42, 0.10); backdrop-filter: blur(18px); border-radius: 10px;',
      },
      legend: {
        top: 0,
        right: 10,
        textStyle: { color: '#66717C', fontSize: 10, fontFamily: 'Geist Mono, monospace' },
      },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: { lineStyle: { color: '#E4E8EC' } },
        axisTick: { show: false },
        axisLabel: { color: '#8D98A3', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#EEF1F4', type: 'dashed' } },
        axisLabel: { color: '#8D98A3', fontSize: 10, formatter: (v: number) => `${(v / 1000).toFixed(0)}k MW` },
      },
      series: [
        {
          name: 'Mean Absolute Error (MAE)',
          type: 'line',
          smooth: 0.3,
          data: maes,
          lineStyle: { color: '#E27D4F', width: 2.2 },
          itemStyle: { color: '#E27D4F' },
        },
        {
          name: 'Systematic Bias',
          type: 'line',
          smooth: 0.3,
          data: biases,
          lineStyle: { color: '#D95C55', width: 1.8, type: 'dashed' },
          itemStyle: { color: '#D95C55' },
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
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        borderColor: '#E4E8EC',
        textStyle: { color: '#17202A', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
        extraCssText: 'box-shadow: 0 12px 32px rgba(23, 32, 42, 0.10); backdrop-filter: blur(18px); border-radius: 10px;',
      },
      xAxis: {
        type: 'category',
        data: buckets,
        axisLine: { lineStyle: { color: '#E4E8EC' } },
        axisTick: { show: false },
        axisLabel: { color: '#8D98A3', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#EEF1F4', type: 'dashed' } },
        axisLabel: { color: '#8D98A3', fontSize: 10 },
      },
      series: [
        {
          name: 'MAE (MW)',
          type: 'bar',
          data: maes,
          itemStyle: {
            color: '#168F79',
            opacity: 0.85,
            borderRadius: [3, 3, 0, 0],
          },
        },
      ],
    };
  }, [horizon]);

  return (
    <div className="space-y-6">
      {/* Top Editorial Metric Strip */}
      <div className="solid-data-surface rounded-2xl p-6 shadow-glass-md">
        <div className="flex items-center justify-between border-b border-[#E4E8EC] pb-3 mb-5">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold tracking-widest text-[#17202A] uppercase">
              Forecast Accuracy & Error Architecture
            </span>
            <span className="text-[#CBD2D9]">·</span>
            <span className="text-xs font-mono text-[#66717C]">Statistical Distribution & Diurnal Profiles</span>
          </div>
          <span className="text-[11px] font-mono text-[#E27D4F] font-semibold">N = {summary.sampleCount} SETTLEMENT PERIODS</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 divide-x divide-[#E4E8EC]">
          <div className="pl-0">
            <span className="text-[10px] font-mono text-[#8D98A3] uppercase tracking-widest block">MAE (Primary)</span>
            <div className="text-2xl font-mono font-bold text-[#17202A] my-1 tabular-nums">
              ±{summary.maeMW.toLocaleString()} <span className="text-sm font-normal text-[#8D98A3]">MW</span>
            </div>
            <span className="text-[11px] text-[#66717C]">Mean expected deviation</span>
          </div>

          <div className="pl-6">
            <span className="text-[10px] font-mono text-[#8D98A3] uppercase tracking-widest block">RMSE (Outlier Misses)</span>
            <div className="text-2xl font-mono font-bold text-[#17202A] my-1 tabular-nums">
              {summary.rmseMW.toLocaleString()} <span className="text-sm font-normal text-[#8D98A3]">MW</span>
            </div>
            <span className="text-[11px] text-[#66717C]">Quadratic ratio: {(summary.rmseMW / summary.maeMW).toFixed(2)}x</span>
          </div>

          <div className="pl-6">
            <span className="text-[10px] font-mono text-[#8D98A3] uppercase tracking-widest block">Systematic Bias</span>
            <div className="text-2xl font-mono font-bold text-[#D95C55] my-1 tabular-nums">
              {summary.biasMW.toLocaleString()} <span className="text-sm font-normal text-[#8D98A3]">MW</span>
            </div>
            <span className="text-[11px] text-[#66717C]">Over-forecast state</span>
          </div>

          <div className="pl-6">
            <span className="text-[10px] font-mono text-[#8D98A3] uppercase tracking-widest block">Volume WAPE</span>
            <div className="text-2xl font-mono font-bold text-[#E27D4F] my-1 tabular-nums">
              {summary.wapePercent}%
            </div>
            <span className="text-[11px] text-[#66717C]">Weighted error</span>
          </div>

          <div className="pl-6">
            <span className="text-[10px] font-mono text-[#8D98A3] uppercase tracking-widest block">P90 VaR Buffer</span>
            <div className="text-2xl font-mono font-bold text-[#E6B84F] my-1 tabular-nums">
              {summary.quantiles?.p90.toLocaleString()} <span className="text-sm font-normal text-[#8D98A3]">MW</span>
            </div>
            <span className="text-[11px] text-[#66717C]">90% variance bound</span>
          </div>
        </div>
      </div>

      {/* Row 1: Signed Error Timeline & Distribution Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Signed Error Timeline */}
        <div className="solid-data-surface rounded-2xl p-5 shadow-glass-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#17202A] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#168F79]" />
                Signed Error Chronology (Actual - Forecast)
              </span>
              <p className="text-[11px] text-[#66717C] font-mono mt-0.5">
                Emerald = Surplus wind delivered | Soft Red = Shortfall vs. day-ahead expectation
              </p>
            </div>
          </div>
          <div className="h-[280px]">
            <ReactECharts option={signedErrorOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Chart 2: Error Distribution */}
        <div className="solid-data-surface rounded-2xl p-5 shadow-glass-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#17202A] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#E27D4F]" />
                Error Distribution & Empirical Quantiles
              </span>
              <p className="text-[11px] text-[#66717C] font-mono mt-0.5">
                Binned frequency with P50 median quantile marker
              </p>
            </div>
            {distribution && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F4F6F8] text-[#66717C] border border-[#E4E8EC] font-semibold">
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
        <div className="solid-data-surface rounded-2xl p-5 shadow-glass-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#17202A] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E27D4F]" />
                Diurnal Error Profile (24-Hour Settlement Cycle)
              </span>
              <p className="text-[11px] text-[#66717C] font-mono mt-0.5">
                Evaluation of morning ramp (07:00–09:00) vs. evening peak (17:00–20:00) volatility
              </p>
            </div>
          </div>
          <div className="h-[280px]">
            <ReactECharts option={diurnalOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Chart 4: Horizon Degradation */}
        <div className="solid-data-surface rounded-2xl p-5 shadow-glass-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#17202A] flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-[#168F79]" />
                Forecast Error vs. Lead Time (Horizon)
              </span>
              <p className="text-[11px] text-[#66717C] font-mono mt-0.5">
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
