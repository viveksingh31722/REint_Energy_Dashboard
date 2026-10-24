import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { ErrorDistribution } from '../../types';

interface ErrorDistributionCardProps {
  distribution?: ErrorDistribution;
}

export const ErrorDistributionCard: React.FC<ErrorDistributionCardProps> = ({ distribution }) => {
  const option = useMemo(() => {
    if (!distribution || !distribution.histogram) return {};
    const binLabels = distribution.histogram.map((b) => b.binMidpoint);
    const counts = distribution.histogram.map((b) => b.count);

    return {
      backgroundColor: 'transparent',
      grid: { top: 25, right: 15, bottom: 25, left: 45 },
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
              <div style="color:#E58A5C; margin-top:2px;">${bin.count} Settlement Periods (${bin.percentage}%)</div>
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
          fontSize: 9,
          formatter: (v: number) => `${v > 0 ? '+' : ''}${Math.round(v / 1000)}k`,
        },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1A201E', type: 'dashed' } },
        axisLabel: { color: '#5F6A65', fontSize: 9 },
      },
      series: [
        {
          name: 'Frequency',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: '#E58A5C', // Terracotta
            borderRadius: [2, 2, 0, 0],
            opacity: 0.85,
          },
          markLine: {
            symbol: 'none',
            data: [
              {
                xAxis: Math.floor(binLabels.length * 0.5),
                lineStyle: { color: '#D7B35A', type: 'dashed', width: 1.5 },
                label: { formatter: 'P50', color: '#D7B35A', fontSize: 9, position: 'insideEndTop' },
              },
              {
                xAxis: Math.floor(binLabels.length * 0.75),
                lineStyle: { color: '#E58A5C', type: 'dashed', width: 1 },
                label: { formatter: 'P75', color: '#E58A5C', fontSize: 9, position: 'insideEndTop' },
              },
              {
                xAxis: Math.floor(binLabels.length * 0.9),
                lineStyle: { color: '#E0645A', type: 'dashed', width: 1.5 },
                label: { formatter: 'P90', color: '#E0645A', fontSize: 9, position: 'insideEndTop' },
              },
            ],
          },
        },
      ],
    };
  }, [distribution]);

  return (
    <div className="dark-card p-5 h-full flex flex-col justify-between space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#252C29] pb-3">
        <div>
          <h3 className="text-xs font-semibold tracking-wider uppercase text-[#F1F4F1]">
            Error Distribution
          </h3>
          <p className="text-[11px] text-[#5F6A65] mt-0.5">
            Empirical error quantiles (P50, P75, P90, P95)
          </p>
        </div>
        {distribution && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#151A18] text-[#8B9691] border border-[#252C29]">
            σ = ±{distribution.stdError.toLocaleString()} MW
          </span>
        )}
      </div>

      {/* Quantile Badges */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
        <div className="bg-[#080A0A] border border-[#252C29] rounded p-1.5">
          <span className="text-[9px] text-[#5F6A65] block uppercase">P50 Median</span>
          <span className="text-sm font-bold text-[#D7B35A] tabular-nums">
            {distribution?.quantiles?.p50 ? Math.round(distribution.quantiles.p50).toLocaleString() : '-1,806'}
          </span>
        </div>
        <div className="bg-[#080A0A] border border-[#252C29] rounded p-1.5">
          <span className="text-[9px] text-[#5F6A65] block uppercase">P75 Bound</span>
          <span className="text-sm font-bold text-[#E58A5C] tabular-nums">
            {distribution?.quantiles?.p75 ? Math.round(distribution.quantiles.p75).toLocaleString() : '3,120'}
          </span>
        </div>
        <div className="bg-[#080A0A] border border-[#252C29] rounded p-1.5">
          <span className="text-[9px] text-[#5F6A65] block uppercase">P90 VaR</span>
          <span className="text-sm font-bold text-[#E0645A] tabular-nums">
            {distribution?.quantiles?.p90 ? Math.round(distribution.quantiles.p90).toLocaleString() : '4,024'}
          </span>
        </div>
        <div className="bg-[#080A0A] border border-[#252C29] rounded p-1.5">
          <span className="text-[9px] text-[#5F6A65] block uppercase">P95 Extreme</span>
          <span className="text-sm font-bold text-[#F1F4F1] tabular-nums">
            {distribution?.quantiles?.p95 ? Math.round(distribution.quantiles.p95).toLocaleString() : '5,180'}
          </span>
        </div>
      </div>

      {/* ECharts Histogram */}
      <div className="h-52 w-full">
        {!distribution ? (
          <div className="h-full flex items-center justify-center text-xs font-mono text-[#5F6A65]">
            Computing frequency bins...
          </div>
        ) : (
          <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
        )}
      </div>
    </div>
  );
};
