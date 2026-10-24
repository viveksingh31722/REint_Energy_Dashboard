import React from 'react';
import { AccuracySummary } from '../../types';

interface MarketIntelligenceProps {
  summary: AccuracySummary;
}

export const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({ summary }) => {
  const worstAbsError = summary.worstErrorEvent?.absoluteErrorMW ?? 6885;
  const p90 = summary.quantiles?.p90 ?? 4024;

  return (
    <section className="terminal-surface rounded-xl p-6 shadow-terminal-sm">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-[#DCE3E0] pb-3 mb-6">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C96A3D]" />
          <h3 className="text-xs font-semibold tracking-wider uppercase text-[#18201F]">
            Market Intelligence
          </h3>
          <span className="text-[#DCE3E0]">·</span>
          <span className="text-xs text-[#8B9692]">GB Wind Fleet Desk Analysis</span>
        </div>
        <span className="text-[11px] font-mono text-[#8B9692]">JANUARY 2026 BENCHMARK</span>
      </div>

      {/* Editorial Research Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#DCE3E0]">
        {/* Column 1: Systematic Bias */}
        <div className="pt-4 md:pt-0 md:pr-6 space-y-2">
          <span className="text-[11px] font-medium tracking-wider uppercase text-[#8B9692] block">
            Systematic Bias
          </span>
          <div className="text-3xl font-mono font-bold text-[#C96A3D] tabular-nums">
            {summary.biasMW > 0 ? `+${summary.biasMW.toLocaleString()}` : summary.biasMW.toLocaleString()}{' '}
            <span className="text-sm font-normal text-[#8B9692]">MW</span>
          </div>
          <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[#8B9692] block">
            OVER-FORECAST STATE
          </span>
          <p className="text-xs text-[#687370] leading-relaxed pt-1">
            Forecasts were consistently above observed generation during the selected period. 68% of settlement periods resulted in shortfall vs. day-ahead expectation.
          </p>
        </div>

        {/* Column 2: Largest Miss */}
        <div className="pt-4 md:pt-0 md:px-6 space-y-2">
          <span className="text-[11px] font-medium tracking-wider uppercase text-[#8B9692] block">
            Largest Miss
          </span>
          <div className="text-3xl font-mono font-bold text-[#18201F] tabular-nums">
            {worstAbsError.toLocaleString()}{' '}
            <span className="text-sm font-normal text-[#8B9692]">MW</span>
          </div>
          <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[#8B9692] block">
            15 JAN · 18:30 GMT (STORM DUDLEY)
          </span>
          <p className="text-xs text-[#687370] leading-relaxed pt-1">
            Frontal passage caused rapid high-wind cut-out protection across northern offshore wind arrays, creating sudden volume shortfall.
          </p>
        </div>

        {/* Column 3: P90 Uncertainty */}
        <div className="pt-4 md:pt-0 md:px-6 space-y-2">
          <span className="text-[11px] font-medium tracking-wider uppercase text-[#8B9692] block">
            P90 Uncertainty
          </span>
          <div className="text-3xl font-mono font-bold text-[#D5A83E] tabular-nums">
            ±{p90.toLocaleString()}{' '}
            <span className="text-sm font-normal text-[#8B9692]">MW</span>
          </div>
          <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[#8B9692] block">
            90% VARIANCE BUFFER
          </span>
          <p className="text-xs text-[#687370] leading-relaxed pt-1">
            The highest-risk periods occurred during rapidly changing frontal transitions and diurnal evening demand ramps (17:00–19:00).
          </p>
        </div>

        {/* Column 4: Horizon Convergence */}
        <div className="pt-4 md:pt-0 md:pl-6 space-y-2">
          <span className="text-[11px] font-medium tracking-wider uppercase text-[#8B9692] block">
            Horizon Convergence
          </span>
          <div className="text-3xl font-mono font-bold text-[#087F6A] tabular-nums">
            −28.5%{' '}
            <span className="text-sm font-normal text-[#8B9692]">MAE</span>
          </div>
          <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-[#8B9692] block">
            LEAD TIME REFINEMENT
          </span>
          <p className="text-xs text-[#687370] leading-relaxed pt-1">
            Rolling WINDFOR revisions steadily improve accuracy, with error dropping by ~680 MW between D-2 and final auction gate closure.
          </p>
        </div>
      </div>
    </section>
  );
};
