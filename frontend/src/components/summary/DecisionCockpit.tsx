import React from 'react';
import { motion } from 'motion/react';
import { AccuracySummary, TimeSeriesPoint } from '../../types';

interface DecisionHeroProps {
  summary: AccuracySummary;
  latestPoint?: TimeSeriesPoint;
}

export const DecisionCockpit: React.FC<DecisionHeroProps> = ({ summary, latestPoint }) => {
  const p90 = summary.quantiles?.p90 || 4024;
  const forecastMW = latestPoint?.forecastGenerationMW ?? 10109;
  const actualMW = latestPoint?.actualGenerationMW ?? 8849;
  const errorMW = summary.biasMW ?? -1806;
  const spNumber = latestPoint?.settlementPeriod ?? 48;
  const dateLabel = latestPoint?.settlementDate ? '31 JAN' : '31 JAN';

  return (
    <section className="pt-2 pb-6 border-b border-[#DCE3E0]">
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8">
        {/* Left: Dominant Editorial Number */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center space-x-2 text-xs font-medium tracking-wider uppercase text-[#8B9692]">
            <span>Day-Ahead Wind</span>
            <span className="text-[#DCE3E0]">/</span>
            <span className="text-[#687370]">National Grid ESO Baseline</span>
          </div>

          <div className="flex items-baseline space-x-3">
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="text-6xl sm:text-7xl font-mono font-bold text-[#18201F] tracking-tight tabular-nums"
            >
              {forecastMW.toLocaleString()}
            </motion.span>
            <span className="text-3xl font-mono text-[#C96A3D] font-semibold">
              MW
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#687370]">
            <span className="font-mono font-semibold text-[#18201F]">SP {spNumber} · {dateLabel}</span>
            <span className="text-[#DCE3E0]">·</span>
            <span>National Grid ESO day-ahead forecast at the D-1 auction gate.</span>
          </div>
        </div>

        {/* Right: Integrated Analytical Context Strip (Thin Dividers, Zero Card Boxes) */}
        <div className="grid grid-cols-3 gap-6 sm:gap-10 border-t lg:border-t-0 lg:border-l border-[#DCE3E0] pt-4 lg:pt-0 lg:pl-10 w-full lg:w-auto">
          {/* Actual */}
          <div>
            <span className="text-[11px] font-medium tracking-wider uppercase text-[#8B9692] block">
              Actual
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-semibold text-[#087F6A] mt-1 tabular-nums">
              {actualMW.toLocaleString()}{' '}
              <span className="text-sm font-normal text-[#8B9692]">MW</span>
            </div>
            <span className="text-[11px] text-[#8B9692] mt-0.5 block">
              Metered transmission
            </span>
          </div>

          {/* Forecast Error */}
          <div className="border-l border-[#DCE3E0] pl-6 sm:pl-10">
            <span className="text-[11px] font-medium tracking-wider uppercase text-[#8B9692] block">
              Forecast Error
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-semibold text-[#C96A3D] mt-1 tabular-nums">
              {errorMW > 0 ? `+${errorMW.toLocaleString()}` : errorMW.toLocaleString()}{' '}
              <span className="text-sm font-normal text-[#8B9692]">MW</span>
            </div>
            <span className="text-[11px] text-[#8B9692] mt-0.5 block">
              Mean systematic bias
            </span>
          </div>

          {/* P90 Uncertainty */}
          <div className="border-l border-[#DCE3E0] pl-6 sm:pl-10">
            <span className="text-[11px] font-medium tracking-wider uppercase text-[#8B9692] block">
              P90 Uncertainty
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-semibold text-[#D5A83E] mt-1 tabular-nums">
              ±{p90.toLocaleString()}{' '}
              <span className="text-sm font-normal text-[#8B9692]">MW</span>
            </div>
            <span className="text-[11px] text-[#8B9692] mt-0.5 block">
              Standby reserve buffer
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
