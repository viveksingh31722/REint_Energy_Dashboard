import React from 'react';
import { AccuracySummary } from '../../types';

interface MetricsStripProps {
  summary: AccuracySummary;
}

export const MetricsStrip: React.FC<MetricsStripProps> = ({ summary }) => {
  const p90 = summary.quantiles?.p90 || 4024;
  const rmseRatio = (summary.rmseMW / (summary.maeMW || 1)).toFixed(2);

  return (
    <div className="terminal-surface rounded-xl p-5 shadow-terminal-sm">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#DCE3E0]">
        {/* MAE */}
        <div className="pb-3 md:pb-0 md:pr-6">
          <span className="text-[11px] font-medium tracking-wider uppercase text-[#8B9692] block">
            MAE
          </span>
          <div className="text-3xl font-mono font-bold text-[#18201F] my-1 tabular-nums">
            {summary.maeMW.toLocaleString()}{' '}
            <span className="text-base font-normal text-[#8B9692]">MW</span>
          </div>
          <span className="text-xs text-[#687370]">
            Primary forecast accuracy
          </span>
        </div>

        {/* RMSE */}
        <div className="pt-3 md:pt-0 md:px-6">
          <span className="text-[11px] font-medium tracking-wider uppercase text-[#8B9692] block">
            RMSE
          </span>
          <div className="text-3xl font-mono font-bold text-[#18201F] my-1 tabular-nums">
            {summary.rmseMW.toLocaleString()}{' '}
            <span className="text-base font-normal text-[#8B9692]">MW</span>
          </div>
          <span className="text-xs text-[#687370]">
            Outlier sensitivity ({rmseRatio}x penalty)
          </span>
        </div>

        {/* WAPE */}
        <div className="pt-3 md:pt-0 md:px-6">
          <span className="text-[11px] font-medium tracking-wider uppercase text-[#8B9692] block">
            WAPE
          </span>
          <div className="text-3xl font-mono font-bold text-[#18201F] my-1 tabular-nums">
            {summary.wapePercent}%
          </div>
          <span className="text-xs text-[#687370]">
            Volume-weighted wholesale error
          </span>
        </div>

        {/* P90 ERROR */}
        <div className="pt-3 md:pt-0 md:pl-6">
          <span className="text-[11px] font-medium tracking-wider uppercase text-[#8B9692] block">
            P90 Error
          </span>
          <div className="text-3xl font-mono font-bold text-[#18201F] my-1 tabular-nums">
            {p90.toLocaleString()}{' '}
            <span className="text-base font-normal text-[#8B9692]">MW</span>
          </div>
          <span className="text-xs text-[#687370]">
            90% confidence reserve buffer
          </span>
        </div>
      </div>
    </div>
  );
};
