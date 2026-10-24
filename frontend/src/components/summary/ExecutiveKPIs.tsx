import React from 'react';
import { AccuracySummary, TimeSeriesPoint } from '../../types';
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Percent, 
  BarChart2, 
  Zap,
  Info 
} from 'lucide-react';

interface ExecutiveKPIsProps {
  summary: AccuracySummary;
  latestPoint?: TimeSeriesPoint;
}

export const ExecutiveKPIs: React.FC<ExecutiveKPIsProps> = ({ summary, latestPoint }) => {
  const isOverForecasting = summary.biasMW < 0;
  const p90 = summary.quantiles?.p90 || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      {/* 1. Latest Forecast */}
      <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-4 shadow-sm hover:border-wind-teal/50 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Latest DA Forecast</span>
          <Zap className="w-4 h-4 text-wind-teal" />
        </div>
        <div className="text-2xl font-bold font-mono text-white tracking-tight">
          {latestPoint?.forecastGenerationMW ? `${latestPoint.forecastGenerationMW.toLocaleString()} MW` : 'N/A'}
        </div>
        <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
          <span>Target: {latestPoint ? `SP ${latestPoint.settlementPeriod}` : 'Latest SP'}</span>
          <span className="text-wind-teal font-medium">Jan 2026</span>
        </div>
      </div>

      {/* 2. Mean Absolute Error (MAE) */}
      <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-4 shadow-sm hover:border-slate-500 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Mean Absolute Error</span>
          <BarChart2 className="w-4 h-4 text-slate-300" />
        </div>
        <div className="text-2xl font-bold font-mono text-white tracking-tight">
          ±{summary.maeMW.toLocaleString()} <span className="text-sm font-normal text-slate-400">MW</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Avg. expected deviation / period
        </div>
      </div>

      {/* 3. Root Mean Squared Error (RMSE) */}
      <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-4 shadow-sm hover:border-slate-500 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Root Mean Sq. Error</span>
          <Info className="w-4 h-4 text-slate-300" />
        </div>
        <div className="text-2xl font-bold font-mono text-white tracking-tight">
          {summary.rmseMW.toLocaleString()} <span className="text-sm font-normal text-slate-400">MW</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Penalizes extreme storm misses
        </div>
      </div>

      {/* 4. Systematic Bias */}
      <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-4 shadow-sm hover:border-slate-500 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Systematic Bias</span>
          {isOverForecasting ? (
            <TrendingDown className="w-4 h-4 text-wind-rose" />
          ) : (
            <TrendingUp className="w-4 h-4 text-wind-emerald" />
          )}
        </div>
        <div className={`text-2xl font-bold font-mono tracking-tight ${
          isOverForecasting ? 'text-wind-rose' : 'text-wind-emerald'
        }`}>
          {summary.biasMW > 0 ? `+${summary.biasMW.toLocaleString()}` : summary.biasMW.toLocaleString()} <span className="text-sm font-normal text-slate-400">MW</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          {isOverForecasting ? 'Over-predicting (Shortfall risk)' : 'Under-predicting (Surplus)'}
        </div>
      </div>

      {/* 5. WAPE */}
      <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-4 shadow-sm hover:border-wind-violet/50 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Volume Error (WAPE)</span>
          <Percent className="w-4 h-4 text-wind-violet" />
        </div>
        <div className="text-2xl font-bold font-mono text-white tracking-tight">
          {summary.wapePercent}%
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Weighted percentage error
        </div>
      </div>

      {/* 6. P90 Risk Hedge Buffer */}
      <div className="bg-gradient-to-br from-navy-800 to-navy-900 border border-amber-500/40 rounded-xl p-4 shadow-sm hover:border-amber-400 transition-colors">
        <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
          <span className="font-semibold">P90 Reserve Buffer</span>
          <ShieldAlert className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-amber-300 tracking-tight">
          {p90.toLocaleString()} <span className="text-sm font-normal text-amber-400/80">MW</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Hedges 90% of volume deviations
        </div>
      </div>
    </div>
  );
};
