import React from 'react';
import { motion } from 'motion/react';
import { AccuracySummary, TimeSeriesPoint } from '../../types';
import { ShieldCheck, TrendingDown, Activity, AlertTriangle } from 'lucide-react';

interface DecisionCockpitProps {
  summary: AccuracySummary;
  latestPoint?: TimeSeriesPoint;
}

export const DecisionCockpit: React.FC<DecisionCockpitProps> = ({ summary, latestPoint }) => {
  const p90 = summary.quantiles?.p90 || 4024;
  const forecastMW = latestPoint?.forecastGenerationMW ?? 10109;
  const actualMW = latestPoint?.actualGenerationMW ?? 9420;
  const currentError = latestPoint?.errorMW ?? (actualMW - forecastMW);

  return (
    <div className="space-y-4">
      {/* 1. Main Integrated Hero: Day-Ahead Wind Position */}
      <div className="glass-panel-elevated rounded-2xl p-6 sm:p-8 border border-white/90 shadow-glass-md relative overflow-hidden">
        {/* Subtle light reflection sheen */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#168F79]/5 via-[#E27D4F]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-[#E4E8EC]/80 pb-6">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E27D4F]" />
              <span className="text-xs font-mono font-semibold tracking-wider uppercase text-[#66717C]">
                Day-Ahead Wind Position
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/90 text-[#66717C] border border-[#E4E8EC] shadow-glass-sm">
                Target {latestPoint ? `SP ${latestPoint.settlementPeriod} · 31 Jan` : 'SP 48 · 31 Jan'}
              </span>
            </div>

            {/* Dominant Primary Number */}
            <div className="flex items-baseline space-x-3 my-1">
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 25 }}
                className="text-5xl sm:text-6xl font-mono font-bold text-[#17202A] tracking-tight tabular-nums"
              >
                {forecastMW.toLocaleString()}
              </motion.span>
              <span className="text-2xl font-mono text-[#E27D4F] font-semibold">MW</span>
            </div>

            <p className="text-xs text-[#66717C] max-w-xl leading-relaxed mt-1">
              National Grid ESO Day-Ahead WINDFOR generation baseline locked at D-1 12:00 UTC auction gate closure.
            </p>
          </div>

          {/* Integrated Contextual Metrics Strip */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 bg-white/70 backdrop-blur-md rounded-xl p-4 border border-white shadow-glass-sm w-full lg:w-auto">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#8D98A3] block">Actual Outturn</span>
              <div className="text-lg sm:text-xl font-mono font-bold text-[#168F79] mt-0.5 tabular-nums">
                {actualMW.toLocaleString()} <span className="text-xs font-normal text-[#66717C]">MW</span>
              </div>
              <span className="text-[10px] text-[#8D98A3] font-mono">BMRS metered</span>
            </div>

            <div className="border-l border-[#E4E8EC] pl-4 sm:pl-6">
              <span className="text-[10px] font-mono uppercase text-[#8D98A3] block">Expected Bias</span>
              <div className="text-lg sm:text-xl font-mono font-bold text-[#D95C55] mt-0.5 tabular-nums">
                {summary.biasMW.toLocaleString()} <span className="text-xs font-normal text-[#66717C]">MW</span>
              </div>
              <span className="text-[10px] text-[#8D98A3] font-mono">Over-forecast</span>
            </div>

            <div className="border-l border-[#E4E8EC] pl-4 sm:pl-6">
              <span className="text-[10px] font-mono uppercase text-[#8D98A3] block">P90 Uncertainty</span>
              <div className="text-lg sm:text-xl font-mono font-bold text-[#E6B84F] mt-0.5 tabular-nums">
                ±{p90.toLocaleString()} <span className="text-xs font-normal text-[#66717C]">MW</span>
              </div>
              <span className="text-[10px] text-[#8D98A3] font-mono">90% variance</span>
            </div>
          </div>
        </div>

        {/* Bottom Editorial Context */}
        <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono text-[#66717C] gap-2">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#168F79]" />
            <span>Auction procurement position: hedge with <strong className="text-[#17202A]">{p90.toLocaleString()} MW</strong> reserve buffer</span>
          </div>
          <div className="text-[#8D98A3] text-[11px]">
            Peak January Generation: <strong className="text-[#17202A] font-semibold">{summary.peakActualMW.toLocaleString()} MW</strong>
          </div>
        </div>
      </div>

      {/* 2. Four Elegant Floating Glass KPI Modules with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: MAE */}
        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="glass-panel rounded-xl p-5 border border-white/80 shadow-glass-sm hover:shadow-glass-md transition-all cursor-default"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8D98A3] font-semibold">
              Mean Absolute Error
            </span>
            <Activity className="w-3.5 h-3.5 text-[#168F79]" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#17202A] tabular-nums">
              ±{summary.maeMW.toLocaleString()} <span className="text-xs font-normal text-[#8D98A3]">MW</span>
            </div>
            {/* Micro Sparkline */}
            <svg className="w-16 h-7 text-[#168F79]" viewBox="0 0 60 25" fill="none">
              <path
                d="M 2,18 Q 15,22 25,12 T 45,14 T 58,6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mt-2 text-[11px] text-[#66717C] font-mono flex items-center justify-between">
            <span>Primary volume accuracy</span>
            <span className="text-[#3D9B76] font-semibold">Normalized {summary.nmaePercent}%</span>
          </div>
        </motion.div>

        {/* KPI 2: RMSE */}
        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="glass-panel rounded-xl p-5 border border-white/80 shadow-glass-sm hover:shadow-glass-md transition-all cursor-default"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8D98A3] font-semibold">
              Root Mean Square Error
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#E27D4F]" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#17202A] tabular-nums">
              {summary.rmseMW.toLocaleString()} <span className="text-xs font-normal text-[#8D98A3]">MW</span>
            </div>
            {/* Micro Sparkline */}
            <svg className="w-16 h-7 text-[#E27D4F]" viewBox="0 0 60 25" fill="none">
              <path
                d="M 2,20 Q 18,24 28,8 T 48,16 T 58,4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mt-2 text-[11px] text-[#66717C] font-mono flex items-center justify-between">
            <span>Outlier sensitivity</span>
            <span className="text-[#17202A] font-medium">{(summary.rmseMW / summary.maeMW).toFixed(2)}x penalty</span>
          </div>
        </motion.div>

        {/* KPI 3: WAPE */}
        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="glass-panel rounded-xl p-5 border border-white/80 shadow-glass-sm hover:shadow-glass-md transition-all cursor-default"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8D98A3] font-semibold">
              Volume-Weighted WAPE
            </span>
            <TrendingDown className="w-3.5 h-3.5 text-[#E27D4F]" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#17202A] tabular-nums">
              {summary.wapePercent}%
            </div>
            {/* Micro Sparkline */}
            <svg className="w-16 h-7 text-[#E27D4F]" viewBox="0 0 60 25" fill="none">
              <path
                d="M 2,8 Q 16,14 28,10 T 46,18 T 58,12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mt-2 text-[11px] text-[#66717C] font-mono flex items-center justify-between">
            <span>Wholesale market standard</span>
            <span className="text-[#D95C55] font-semibold">Bias {summary.biasMW > 0 ? '+' : ''}{summary.biasMW} MW</span>
          </div>
        </motion.div>

        {/* KPI 4: P90 Reserve Buffer */}
        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="glass-panel rounded-xl p-5 border border-white/80 shadow-glass-sm hover:shadow-glass-md transition-all cursor-default"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8D98A3] font-semibold">
              P90 Uncertainty Buffer
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#E6B84F]" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-mono font-bold text-[#17202A] tabular-nums">
              {p90.toLocaleString()} <span className="text-xs font-normal text-[#8D98A3]">MW</span>
            </div>
            {/* Micro Sparkline */}
            <svg className="w-16 h-7 text-[#E6B84F]" viewBox="0 0 60 25" fill="none">
              <path
                d="M 2,16 Q 14,8 26,14 T 44,6 T 58,10"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mt-2 text-[11px] text-[#66717C] font-mono flex items-center justify-between">
            <span>Imbalance hedge sizing</span>
            <span className="text-[#17202A] font-medium">90% safety margin</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
