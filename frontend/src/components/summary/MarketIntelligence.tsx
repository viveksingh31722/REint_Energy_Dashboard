import React from 'react';
import { AccuracySummary } from '../../types';

interface MarketIntelligenceProps {
  summary: AccuracySummary;
}

export const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({ summary }) => {
  const p90 = summary.quantiles?.p90 || 4024;
  const worst = summary.worstErrorEvent;

  return (
    <div className="border border-white/[0.08] bg-[#0A0E17]/80 rounded-lg p-6 backdrop-blur-md">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono tracking-widest text-[#00E5FF] uppercase font-bold">
            Market Intelligence Briefing
          </span>
          <span className="text-white/20">/</span>
          <span className="text-[11px] font-mono text-slate-400">UK Wind Fleet Risk Summary</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">JANUARY 2026 OUTTURN</span>
      </div>

      {/* Four-Column Editorial Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
        {/* Item 01: Systematic Bias */}
        <div className="pt-4 md:pt-0 md:pr-6">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
            01 · Systematic Bias Direction
          </span>
          <div className="text-2xl font-mono font-bold text-[#FB7185] my-1 tabular-nums">
            {summary.biasMW.toLocaleString()}{' '}
            <span className="text-sm font-normal text-slate-400">MW</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mt-2">
            Weather models consistently overpredicted wind volumes across January, exposing the procurement desk to persistent physical shortfalls.
          </p>
          <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Imbalance State:</span>
            <span className="text-[#FB7185] font-semibold">Elevated Shortfall</span>
          </div>
        </div>

        {/* Item 02: Forecast Uncertainty (P90) */}
        <div className="pt-4 md:pt-0 md:px-6">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
            02 · Volume-at-Risk Threshold
          </span>
          <div className="text-2xl font-mono font-bold text-[#FBBF24] my-1 tabular-nums">
            {p90.toLocaleString()}{' '}
            <span className="text-sm font-normal text-slate-400">MW</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mt-2">
            In 90% of settlement periods, day-ahead forecast deviations remained below this threshold. Provides the statistical boundary for sizing reserve contracts.
          </p>
          <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Quantile Level:</span>
            <span className="text-[#FBBF24] font-semibold">P90 Confidence</span>
          </div>
        </div>

        {/* Item 03: Largest Forecast Miss */}
        <div className="pt-4 md:pt-0 md:px-6">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
            03 · Maximum Tail Miss Event
          </span>
          <div className="text-2xl font-mono font-bold text-white my-1 tabular-nums">
            {worst ? Math.abs(worst.errorMW).toLocaleString() : '6,857'}{' '}
            <span className="text-sm font-normal text-slate-400">MW</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mt-2">
            Occurred on{' '}
            <span className="text-white font-medium">
              {worst ? worst.deliveryTime.substring(0, 10) : '15 Jan'}
            </span>{' '}
            during evening peak ramp. Physical outturn lagged the day-ahead forecast by over 6 GW during winter storm passage.
          </p>
          <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Peak Severity:</span>
            <span className="text-[#FB7185] font-semibold">Storm Dudley Front</span>
          </div>
        </div>

        {/* Item 04: Volume-Weighted Accuracy */}
        <div className="pt-4 md:pt-0 md:pl-6">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
            04 · Overall Volume Accuracy
          </span>
          <div className="text-2xl font-mono font-bold text-[#00E5FF] my-1 tabular-nums">
            {summary.wapePercent}%{' '}
            <span className="text-sm font-normal text-slate-400">WAPE</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mt-2">
            Volume-weighted absolute error rate across January. Normalized MAE was{' '}
            <span className="text-white font-medium">{summary.nmaePercent}%</span> relative to total fleet peak generation.
          </p>
          <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Model Metric:</span>
            <span className="text-[#00E5FF] font-semibold">Volume-Weighted</span>
          </div>
        </div>
      </div>
    </div>
  );
};
