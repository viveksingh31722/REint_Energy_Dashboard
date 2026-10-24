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
      grid: { top: 24, right: 20, bottom: 35, left: 55 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#DCE3E0',
        textStyle: { color: '#18201F', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
        extraCssText: 'box-shadow: 0 8px 24px rgba(24, 32, 31, 0.08); backdrop-filter: blur(16px); border-radius: 8px;',
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const p = params[0];
          const val = p.value;
          const isOver = val < 0;
          return `
            <div style="font-family:'Geist Mono',monospace;">
              <div style="color:#687370; font-size:10px; margin-bottom:4px;">${p.name} GMT</div>
              <div style="font-weight:700; color:${isOver ? '#C96A3D' : '#087F6A'};">
                Error: ${val > 0 ? '+' : ''}${val.toLocaleString()} MW
              </div>
              <div style="font-size:10px; color:#8B9692; margin-top:2px;">
                ${isOver ? 'Forecast was higher than actual (shortfall)' : 'Forecast was lower than actual (surplus)'}
              </div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#DCE3E0' } },
        axisTick: { show: false },
        axisLabel: { color: '#8B9692', fontSize: 10, interval: Math.floor(times.length / 7) },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#E8EDEA', type: 'dashed' } },
        axisLabel: {
          color: '#8B9692',
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
              color: err >= 0 ? '#087F6A' : '#C96A3D', // Emerald for surplus, Terracotta for shortfall
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
      grid: { top: 30, right: 20, bottom: 35, left: 45 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#DCE3E0',
        textStyle: { color: '#18201F', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
        extraCssText: 'box-shadow: 0 8px 24px rgba(24, 32, 31, 0.08); backdrop-filter: blur(16px); border-radius: 8px;',
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const idx = params[0].dataIndex;
          const bin = distribution.histogram[idx];
          return `
            <div style="font-family:'Geist Mono',monospace;">
              <div style="font-weight:600; color:#18201F;">Range: ${bin.binRange}</div>
              <div style="color:#C96A3D; margin-top:3px; font-weight:600;">${bin.count} Settlement Periods (${bin.percentage}%)</div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: binLabels,
        axisLine: { lineStyle: { color: '#DCE3E0' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#8B9692',
          fontSize: 10,
          formatter: (v: number) => `${v > 0 ? '+' : ''}${Math.round(v / 1000)}k`,
        },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#E8EDEA', type: 'dashed' } },
        axisLabel: { color: '#8B9692', fontSize: 10 },
      },
      series: [
        {
          name: 'Frequency',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: '#C96A3D',
            borderRadius: [2, 2, 0, 0],
            opacity: 0.85,
          },
          markLine: {
            symbol: 'none',
            data: [
              {
                xAxis: Math.floor(binLabels.length / 2),
                lineStyle: { color: '#D5A83E', type: 'dashed', width: 2 },
                label: { formatter: 'P50 Median', color: '#18201F', fontSize: 10, fontWeight: 'bold' },
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
      grid: { top: 30, right: 20, bottom: 35, left: 55 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#DCE3E0',
        textStyle: { color: '#18201F', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
        extraCssText: 'box-shadow: 0 8px 24px rgba(24, 32, 31, 0.08); backdrop-filter: blur(16px); border-radius: 8px;',
      },
      legend: {
        top: 0,
        right: 10,
        textStyle: { color: '#687370', fontSize: 10, fontFamily: 'Geist Mono, monospace' },
      },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: { lineStyle: { color: '#DCE3E0' } },
        axisTick: { show: false },
        axisLabel: { color: '#8B9692', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#E8EDEA', type: 'dashed' } },
        axisLabel: { color: '#8B9692', fontSize: 10, formatter: (v: number) => `${(v / 1000).toFixed(0)}k MW` },
      },
      series: [
        {
          name: 'Mean Absolute Error (MAE)',
          type: 'line',
          smooth: 0.3,
          data: maes,
          lineStyle: { color: '#C96A3D', width: 2 },
          itemStyle: { color: '#C96A3D' },
        },
        {
          name: 'Systematic Bias',
          type: 'line',
          smooth: 0.3,
          data: biases,
          lineStyle: { color: '#C84B4B', width: 1.6, type: 'dashed' },
          itemStyle: { color: '#C84B4B' },
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
      grid: { top: 25, right: 20, bottom: 35, left: 55 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#DCE3E0',
        textStyle: { color: '#18201F', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
        extraCssText: 'box-shadow: 0 8px 24px rgba(24, 32, 31, 0.08); backdrop-filter: blur(16px); border-radius: 8px;',
      },
      xAxis: {
        type: 'category',
        data: buckets,
        axisLine: { lineStyle: { color: '#DCE3E0' } },
        axisTick: { show: false },
        axisLabel: { color: '#8B9692', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#E8EDEA', type: 'dashed' } },
        axisLabel: { color: '#8B9692', fontSize: 10 },
      },
      series: [
        {
          name: 'MAE (MW)',
          type: 'bar',
          data: maes,
          itemStyle: {
            color: '#087F6A',
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
        <div className="terminal-surface rounded-xl p-5 shadow-terminal-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#18201F] flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-[#087F6A]" />
                Signed Error Chronology (Actual - Forecast)
              </span>
              <p className="text-[11px] text-[#8B9692] mt-0.5">
                Emerald = Surplus wind delivered | Terracotta = Shortfall vs. expectation
              </p>
            </div>
          </div>
          <div className="h-[280px]">
            <ReactECharts option={signedErrorOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Chart 2: Error Distribution */}
        <div className="terminal-surface rounded-xl p-5 shadow-terminal-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#18201F] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[#C96A3D]" />
                Error Distribution & Empirical Quantiles
              </span>
              <p className="text-[11px] text-[#8B9692] mt-0.5">
                Binned frequency with P50 median quantile marker
              </p>
            </div>
            {distribution && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EEF2F1] text-[#687370] border border-[#DCE3E0] font-semibold">
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
        <div className="terminal-surface rounded-xl p-5 shadow-terminal-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#18201F] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#C96A3D]" />
                Diurnal Error Profile (24-Hour Settlement Cycle)
              </span>
              <p className="text-[11px] text-[#8B9692] mt-0.5">
                Morning ramp (07:00–09:00) vs. evening peak (17:00–20:00) volatility
              </p>
            </div>
          </div>
          <div className="h-[280px]">
            <ReactECharts option={diurnalOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Chart 4: Horizon Degradation */}
        <div className="terminal-surface rounded-xl p-5 shadow-terminal-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#18201F] flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-[#087F6A]" />
                Forecast Error vs. Lead Horizon
              </span>
              <p className="text-[11px] text-[#8B9692] mt-0.5">
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
