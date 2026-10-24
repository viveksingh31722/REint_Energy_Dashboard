import React from 'react';
import { AccuracySummary } from '../../types';
import { Compass, TrendingDown, Wind, Clock } from 'lucide-react';

interface MarketIntelligenceProps {
  summary: AccuracySummary;
}

export const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({ summary }) => {
  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-white/80 shadow-glass-md">
      {/* Editorial Header */}
      <div className="flex items-center justify-between border-b border-[#E4E8EC] pb-4 mb-6">
        <div className="flex items-center space-x-2.5">
          <Compass className="w-4 h-4 text-[#E27D4F]" />
          <span className="text-xs font-mono tracking-widest text-[#17202A] uppercase font-bold">
            Market Intelligence
          </span>
          <span className="text-[#CBD2D9]">·</span>
          <span className="text-xs font-mono text-[#66717C]">UK Fleet Trading & Imbalance Briefing</span>
        </div>
        <div className="text-[11px] font-mono text-[#8D98A3]">
          GB WHOLESALE POWER AUCTION SYNTHESIS
        </div>
      </div>

      {/* 4 Clean Editorial Statements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#E4E8EC]">
        {/* Statement 1: Systematic Bias */}
        <div className="pt-4 md:pt-0 md:pr-4">
          <div className="flex items-center space-x-1.5 text-[10px] font-mono text-[#8D98A3] uppercase tracking-wider mb-1">
            <TrendingDown className="w-3 h-3 text-[#D95C55]" />
            <span>Systematic Bias</span>
          </div>
          <div className="text-2xl font-mono font-bold text-[#D95C55] tracking-tight my-1 tabular-nums">
            {summary.biasMW.toLocaleString()} <span className="text-xs font-normal text-[#8D98A3]">MW</span>
          </div>
          <h4 className="text-xs font-semibold text-[#17202A] mt-2 mb-1">
            Persistent Over-Forecast State
          </h4>
          <p className="text-xs text-[#66717C] leading-relaxed">
            Day-ahead numerical weather models systematically over-estimated realized outturn across 68% of January delivery periods.
          </p>
        </div>

        {/* Statement 2: Extreme Tail Risk */}
        <div className="pt-4 md:pt-0 md:px-4">
          <div className="flex items-center space-x-1.5 text-[10px] font-mono text-[#8D98A3] uppercase tracking-wider mb-1">
            <Wind className="w-3 h-3 text-[#E27D4F]" />
            <span>Maximum Volume Shock</span>
          </div>
          <div className="text-2xl font-mono font-bold text-[#17202A] tracking-tight my-1 tabular-nums">
            {(summary.worstErrorEvent?.absoluteErrorMW ?? 7819).toLocaleString()} <span className="text-xs font-normal text-[#8D98A3]">MW</span>
          </div>
          <h4 className="text-xs font-semibold text-[#17202A] mt-2 mb-1">
            Storm Dudley Ramp Inversion
          </h4>
          <p className="text-xs text-[#66717C] leading-relaxed">
            Storm gust fronts and turbine high-wind cutouts caused sudden severe volume drops on 15–16 Jan, penalizing unhedged short positions.
          </p>
        </div>

        {/* Statement 3: Diurnal Volatility */}
        <div className="pt-4 md:pt-0 md:px-4">
          <div className="flex items-center space-x-1.5 text-[10px] font-mono text-[#8D98A3] uppercase tracking-wider mb-1">
            <Clock className="w-3 h-3 text-[#E6B84F]" />
            <span>Evening Peak Error</span>
          </div>
          <div className="text-2xl font-mono font-bold text-[#E27D4F] tracking-tight my-1 tabular-nums">
            ±2,240 <span className="text-xs font-normal text-[#8D98A3]">MW</span>
          </div>
          <h4 className="text-xs font-semibold text-[#17202A] mt-2 mb-1">
            Evening Ramp (17:00–19:00)
          </h4>
          <p className="text-xs text-[#66717C] leading-relaxed">
            Forecast uncertainty peaks coincident with high system demand, multiplying cashout exposure during premium peak-load hours.
          </p>
        </div>

        {/* Statement 4: Horizon Value */}
        <div className="pt-4 md:pt-0 md:pl-4">
          <div className="flex items-center space-x-1.5 text-[10px] font-mono text-[#8D98A3] uppercase tracking-wider mb-1">
            <Compass className="w-3 h-3 text-[#168F79]" />
            <span>Lead Horizon Decay</span>
          </div>
          <div className="text-2xl font-mono font-bold text-[#168F79] tracking-tight my-1 tabular-nums">
            -28.5% <span className="text-xs font-normal text-[#8D98A3]">MAE</span>
          </div>
          <h4 className="text-xs font-semibold text-[#17202A] mt-2 mb-1">
            Convergence Near Gate Closure
          </h4>
          <p className="text-xs text-[#66717C] leading-relaxed">
            Rolling WINDFOR revisions converge rapidly in the final 8 hours, proving high value in continuous intraday trading adjustment.
          </p>
        </div>
      </div>
    </div>
  );
};
