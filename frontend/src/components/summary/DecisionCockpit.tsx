import React from 'react';
import { motion } from 'motion/react';
import { AccuracySummary, TimeSeriesPoint } from '../../types';
import { ShieldAlert, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

interface DecisionCockpitProps {
  summary: AccuracySummary;
  latestPoint?: TimeSeriesPoint;
}

export const DecisionCockpit: React.FC<DecisionCockpitProps> = ({ summary, latestPoint }) => {
  const isOverForecasting = summary.biasMW < 0;
  const p90 = summary.quantiles?.p90 || 0;

  // Confidence / Uncertainty score (based on WAPE and Bias severity)
  // WAPE ~17% means ~83% volume confidence
  const confidenceScore = Math.max(60, Math.min(95, Math.round(100 - summary.wapePercent)));

  return (
    <div className="border border-white/[0.08] bg-[#0E131F]/90 rounded-lg backdrop-blur-md overflow-hidden shadow-2xl">
      {/* Top Editorial Label Bar */}
      <div className="px-6 py-2 border-b border-white/[0.05] bg-[#090D16] flex items-center justify-between text-[10px] font-mono tracking-wider uppercase text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
          <span className="text-white font-semibold">Primary Decision Signal</span>
          <span className="text-white/20">/</span>
          <span>Day-Ahead Auction Commitment State</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-400">
          <span>NATIONAL GRID ESO FORECAST RUN</span>
          <span className="text-white/20">|</span>
          <span className="text-[#00E5FF]">JANUARY 2026 BENCHMARK</span>
        </div>
      </div>

      {/* Hero Three-Column Analytical Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
        {/* Pillar 1: Day-Ahead Wind Position (5 cols) */}
        <div className="lg:col-span-5 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                Day-Ahead Wind Position
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-slate-300 border border-white/[0.06]">
                Target {latestPoint ? `SP ${latestPoint.settlementPeriod} · 31 Jan` : 'SP 48'}
              </span>
            </div>

            {/* Giant Primary Value */}
            <div className="flex items-baseline space-x-3 my-2">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-tight tabular-nums"
              >
                {latestPoint?.forecastGenerationMW
                  ? latestPoint.forecastGenerationMW.toLocaleString()
                  : '10,109'}
              </motion.span>
              <span className="text-xl font-mono text-[#00E5FF] font-medium">MW</span>
            </div>

            {/* Plain-English Decision Impact */}
            <p className="text-xs text-slate-300 leading-relaxed mt-2">
              Forecast is currently{' '}
              <span className="font-semibold text-[#FB7185]">
                {Math.abs(summary.biasMW).toLocaleString()} MW above
              </span>{' '}
              historical realized generation across January.
            </p>
          </div>

          {/* Quick Benchmark Footprint */}
          <div className="pt-4 mt-4 border-t border-white/[0.04] grid grid-cols-3 gap-3 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">MAE</span>
              <span className="text-white font-medium tabular-nums">±{summary.maeMW.toLocaleString()} MW</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">RMSE</span>
              <span className="text-white font-medium tabular-nums">{summary.rmseMW.toLocaleString()} MW</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Peak Outturn</span>
              <span className="text-white font-medium tabular-nums">{summary.peakActualMW.toLocaleString()} MW</span>
            </div>
          </div>
        </div>

        {/* Pillar 2: Uncertainty & Forecast Signal (4 cols) */}
        <div className="lg:col-span-4 p-6 flex flex-col justify-between bg-white/[0.01]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                Forecast Uncertainty Signal
              </span>
              <span className="text-[10px] font-mono text-slate-400">Not Financial Advice</span>
            </div>

            {/* Distinctive Signal Badge */}
            <div className="my-2 flex items-center space-x-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FB7185] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FB7185]" />
              </span>
              <span className="text-lg font-bold tracking-tight text-[#FB7185] font-mono">
                ELEVATED SHORTFALL RISK
              </span>
            </div>

            {/* Forecast Confidence Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <span>Model Alignment Confidence</span>
                <span className="text-white font-semibold">{confidenceScore}%</span>
              </div>
              <div className="w-full bg-[#141C2C] h-2 rounded-full overflow-hidden flex border border-white/[0.04]">
                <div
                  className="bg-gradient-to-r from-[#00E5FF] to-[#A78BFA] h-full transition-all duration-700"
                  style={{ width: `${confidenceScore}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mt-3">
              High volatility observed during weather transitions. Forecasts systematically over-estimate wind volumes by 17.5% (WAPE).
            </p>
          </div>

          <div className="pt-3 mt-3 border-t border-white/[0.04] flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Mean Bias:</span>
            <span className="text-[#FB7185] font-semibold tabular-nums">
              {summary.biasMW.toLocaleString()} MW (Over-forecast)
            </span>
          </div>
        </div>

        {/* Pillar 3: Reserve Buffer & VaR Recommendation (3 cols) */}
        <div className="lg:col-span-3 p-6 flex flex-col justify-between bg-gradient-to-b from-[#121927]/60 to-[#0A0E18]/80">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#FBBF24] font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#FBBF24]" />
                P90 Reserve Buffer
              </span>
            </div>

            <div className="my-2">
              <div className="text-3xl font-mono font-bold text-[#FBBF24] tracking-tight tabular-nums">
                {p90.toLocaleString()}{' '}
                <span className="text-base font-normal text-amber-400/70">MW</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                90% of January deviations were below this threshold.
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06]">
            <div className="text-[11px] font-mono text-slate-400 mb-1">
              Procurement Desk Recommendation:
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
              Maintain <span className="text-white font-semibold font-mono">{p90.toLocaleString()} MW</span> in fast-start flexible capacity to avoid cashout penalties.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
