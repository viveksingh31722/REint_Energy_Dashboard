import React from 'react';
import { TradingInsight } from '../../types';
import { AlertTriangle, TrendingDown, TrendingUp, Info, CheckCircle2 } from 'lucide-react';

interface TradingInsightsProps {
  insights: TradingInsight[];
}

export const TradingInsights: React.FC<TradingInsightsProps> = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
      case 'danger':
        return <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-wind-rose mt-0.5 shrink-0" />;
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-wind-emerald mt-0.5 shrink-0" />;
      case 'info':
        return <Info className="w-4 h-4 text-wind-teal mt-0.5 shrink-0" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />;
    }
  };

  const getBgStyle = (type: string) => {
    switch (type) {
      case 'warning':
      case 'danger':
        return 'bg-amber-950/20 border-amber-500/30 text-amber-200';
      case 'negative':
        return 'bg-rose-950/20 border-rose-500/30 text-rose-200';
      case 'positive':
        return 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200';
      default:
        return 'bg-navy-800/60 border-navy-700 text-slate-300';
    }
  };

  return (
    <div className="bg-navy-800/40 border border-navy-700/80 rounded-xl p-4">
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Automated Trading Desk Insights (January 2026)
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {insights.map((item, idx) => (
          <div
            key={idx}
            className={`border rounded-lg p-3 text-xs flex flex-col justify-between ${getBgStyle(
              item.type
            )}`}
          >
            <div className="flex items-start space-x-2">
              {getIcon(item.type)}
              <div>
                <span className="font-semibold block text-white text-[13px]">{item.title}</span>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{item.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
