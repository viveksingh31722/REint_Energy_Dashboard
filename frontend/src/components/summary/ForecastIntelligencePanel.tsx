import React from 'react';
import { AccuracySummary } from '../../types';

interface ForecastIntelligencePanelProps {
  summary: AccuracySummary;
}

export const ForecastIntelligencePanel: React.FC<ForecastIntelligencePanelProps> = ({ summary }) => {
  const worstAbsError = summary.worstErrorEvent?.absoluteErrorMW ?? 6885;
  const p90 = summary.quantiles?.p90 ?? 4024;

  return (
    <div className="dark-card p-5 h-full flex flex-col justify-between space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[#252C29] pb-3">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E58A5C]" />
          <h3 className="text-xs font-semibold tracking-wider uppercase text-[#F1F4F1]">
            Forecast Intelligence
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#5F6A65]">DESK CONTEXT</span>
      </div>

      {/* Item 1: Systematic Bias */}
      <div className="space-y-1">
        <span className="text-[10px] font-medium tracking-wider uppercase text-[#8B9691] block">
          Systematic Bias
        </span>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-mono font-bold text-[#E58A5C] tabular-nums">
            {summary.biasMW > 0 ? `+${summary.biasMW.toLocaleString()}` : summary.biasMW.toLocaleString()} MW
          </span>
          <span className="text-[10px] font-mono text-[#8B9691] uppercase">
            Over-forecast
          </span>
        </div>
        <p className="text-xs text-[#8B9691] leading-relaxed pt-0.5">
          Forecasts were consistently above observed generation during the selected period.
        </p>
      </div>

      <div className="h-[1px] bg-[#252C29]" />

      {/* Item 2: Largest Forecast Miss with Contextual Sparkline */}
      <div className="space-y-1">
        <span className="text-[10px] font-medium tracking-wider uppercase text-[#8B9691] block">
          Largest Forecast Miss
        </span>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-mono font-bold text-[#F1F4F1] tabular-nums">
              {worstAbsError.toLocaleString()}{' '}
              <span className="text-sm font-normal text-[#8B9691]">MW</span>
            </div>
            <span className="text-[10px] font-mono text-[#E0645A]">
              15 JAN · 18:30 GMT (STORM DUDLEY)
            </span>
          </div>

          {/* Contextual Miss Sparkline */}
          <svg className="w-16 h-7 text-[#E0645A]" viewBox="0 0 60 25" fill="none">
            <path
              d="M 2,6 Q 20,4 32,20 T 48,16 T 58,10"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <div className="h-[1px] bg-[#252C29]" />

      {/* Item 3: P90 Uncertainty with Mini Visual */}
      <div className="space-y-1">
        <span className="text-[10px] font-medium tracking-wider uppercase text-[#8B9691] block">
          P90 Uncertainty
        </span>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-mono font-bold text-[#D7B35A] tabular-nums">
              ±{p90.toLocaleString()}{' '}
              <span className="text-sm font-normal text-[#8B9691]">MW</span>
            </div>
            <span className="text-[10px] font-mono text-[#8B9691]">
              90% error envelope
            </span>
          </div>

          {/* Uncertainty mini bar visual */}
          <div className="w-16 flex items-center space-x-0.5 h-4">
            <div className="w-2 h-1 bg-[#D7B35A]/30 rounded-xs" />
            <div className="w-4 h-2 bg-[#D7B35A]/50 rounded-xs" />
            <div className="w-6 h-3 bg-[#D7B35A] rounded-xs" />
            <div className="w-4 h-2 bg-[#D7B35A]/50 rounded-xs" />
            <div className="w-2 h-1 bg-[#D7B35A]/30 rounded-xs" />
          </div>
        </div>
      </div>

      <div className="h-[1px] bg-[#252C29]" />

      {/* Item 4: Volatility */}
      <div className="space-y-1">
        <span className="text-[10px] font-medium tracking-wider uppercase text-[#8B9691] block">
          Volatility Regimes
        </span>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#E0645A]/15 text-[#E0645A] border border-[#E0645A]/30">
            HIGH
          </span>
          <span className="text-[11px] font-mono text-[#F1F4F1]">
            14–17 JAN
          </span>
        </div>
        <p className="text-xs text-[#8B9691] leading-relaxed pt-0.5">
          Storm period produced the largest forecast deviations due to turbine high-wind cutout protection.
        </p>
      </div>
    </div>
  );
};
