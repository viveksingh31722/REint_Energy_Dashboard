import React from 'react';
import { AccuracySummary, TimeSeriesPoint } from '../../types';

interface KpiRowProps {
  summary: AccuracySummary;
  latestPoint?: TimeSeriesPoint;
}

export const KpiRow: React.FC<KpiRowProps> = ({ summary, latestPoint }) => {
  const p90 = summary.quantiles?.p90 || 4024;
  const forecastMW = latestPoint?.forecastGenerationMW ?? 10109;
  const spNumber = latestPoint?.settlementPeriod ?? 48;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: Day-Ahead Wind */}
      <div className="dark-card p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[11px] text-[#8B9691] font-medium tracking-wider uppercase">
          <span>Day-Ahead Wind</span>
          <span className="text-[10px] font-mono text-[#5F6A65]">BMRS WINDFOR</span>
        </div>

        <div className="my-2 flex items-baseline justify-between">
          <div className="text-3xl font-mono font-bold text-[#F1F4F1] tabular-nums">
            {forecastMW.toLocaleString()}{' '}
            <span className="text-sm font-normal text-[#E58A5C]">MW</span>
          </div>

          {/* Wind Trajectory Mini Sparkline */}
          <svg className="w-20 h-8 text-[#35B89A]" viewBox="0 0 70 28" fill="none">
            <path
              d="M 2,22 Q 15,6 28,14 T 50,8 T 68,18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 2,22 Q 15,6 28,14 T 50,8 T 68,18 L 68,28 L 2,28 Z"
              fill="rgba(53, 184, 154, 0.12)"
            />
          </svg>
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-[#8B9691]">
          <span>SP {spNumber} · 31 JAN</span>
          <span className="text-[#35B89A] font-medium">Locked Baseline</span>
        </div>
      </div>

      {/* Card 2: Forecast Accuracy (MAE) */}
      <div className="dark-card p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[11px] text-[#8B9691] font-medium tracking-wider uppercase">
          <span>Forecast Accuracy</span>
          <span className="text-[10px] font-mono text-[#5F6A65]">MAE</span>
        </div>

        <div className="my-2 flex items-baseline justify-between">
          <div className="text-3xl font-mono font-bold text-[#F1F4F1] tabular-nums">
            {summary.maeMW.toLocaleString()}{' '}
            <span className="text-sm font-normal text-[#8B9691]">MW</span>
          </div>

          {/* Rolling Error Mini Sparkline */}
          <svg className="w-20 h-8 text-[#E58A5C]" viewBox="0 0 70 28" fill="none">
            <path
              d="M 2,12 Q 18,22 32,10 T 52,18 T 68,6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 2,12 Q 18,22 32,10 T 52,18 T 68,6 L 68,28 L 2,28 Z"
              fill="rgba(229, 138, 92, 0.10)"
            />
          </svg>
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-[#8B9691]">
          <span>Normalized error: {summary.nmaePercent}%</span>
          <span className="text-[#F1F4F1] font-medium">WAPE {summary.wapePercent}%</span>
        </div>
      </div>

      {/* Card 3: Systematic Bias */}
      <div className="dark-card p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[11px] text-[#8B9691] font-medium tracking-wider uppercase">
          <span>Systematic Bias</span>
          <span className="text-[10px] font-mono text-[#E0645A]">OVER-FORECAST</span>
        </div>

        <div className="my-2 flex items-baseline justify-between">
          <div className="text-3xl font-mono font-bold text-[#E0645A] tabular-nums">
            {summary.biasMW > 0 ? `+${summary.biasMW.toLocaleString()}` : summary.biasMW.toLocaleString()}{' '}
            <span className="text-sm font-normal text-[#8B9691]">MW</span>
          </div>

          {/* Bias Trend Mini Sparkline */}
          <svg className="w-20 h-8 text-[#E0645A]" viewBox="0 0 70 28" fill="none">
            <line x1="2" y1="14" x2="68" y2="14" stroke="#252C29" strokeWidth="1" strokeDasharray="2 2" />
            <path
              d="M 2,18 Q 16,24 30,20 T 50,22 T 68,16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-[#8B9691]">
          <span>68% periods over-predicted</span>
          <span className="text-[#5F6A65]">Shortfall risk</span>
        </div>
      </div>

      {/* Card 4: P90 Uncertainty */}
      <div className="dark-card p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[11px] text-[#8B9691] font-medium tracking-wider uppercase">
          <span>P90 Uncertainty</span>
          <span className="text-[10px] font-mono text-[#D7B35A]">90% RANGE</span>
        </div>

        <div className="my-2 flex items-baseline justify-between">
          <div className="text-3xl font-mono font-bold text-[#D7B35A] tabular-nums">
            ±{p90.toLocaleString()}{' '}
            <span className="text-sm font-normal text-[#8B9691]">MW</span>
          </div>

          {/* Uncertainty Corridor Sparkline */}
          <svg className="w-20 h-8 text-[#D7B35A]" viewBox="0 0 70 28" fill="none">
            <path
              d="M 2,8 Q 20,4 35,10 T 68,6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            <path
              d="M 2,24 Q 20,20 35,22 T 68,20"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            <polygon
              points="2,8 35,10 68,6 68,20 35,22 2,24"
              fill="rgba(215, 179, 90, 0.12)"
            />
          </svg>
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-[#8B9691]">
          <span>Standby reserve sizing</span>
          <span className="text-[#F1F4F1] font-medium">90% buffer</span>
        </div>
      </div>
    </div>
  );
};
