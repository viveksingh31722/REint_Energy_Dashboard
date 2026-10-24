import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Brush,
  CartesianGrid,
} from 'recharts';
import type { TimeSeriesPoint } from '../../types';

interface ChartProps {
  series: TimeSeriesPoint[];
  onSelectPeriod?: (deliveryTime: string) => void;
}

export const ActualVsForecastChart: React.FC<ChartProps> = ({ series, onSelectPeriod }) => {
  const [rangeFilter, setRangeFilter] = useState<'ALL' | 'W1' | 'W2' | 'W3' | 'W4' | 'STORM'>('ALL');

  // Filter series based on preset buttons
  const filteredData = useMemo(() => {
    switch (rangeFilter) {
      case 'W1':
        return series.filter((d) => d.settlementDate >= '2026-01-01' && d.settlementDate <= '2026-01-07');
      case 'W2':
        return series.filter((d) => d.settlementDate >= '2026-01-08' && d.settlementDate <= '2026-01-14');
      case 'W3':
        return series.filter((d) => d.settlementDate >= '2026-01-15' && d.settlementDate <= '2026-01-21');
      case 'W4':
        return series.filter((d) => d.settlementDate >= '2026-01-22' && d.settlementDate <= '2026-01-28');
      case 'STORM':
        return series.filter((d) => d.settlementDate >= '2026-01-14' && d.settlementDate <= '2026-01-17');
      default:
        return series;
    }
  }, [series, rangeFilter]);

  // Format date tick
  const formatTick = (val: string) => {
    if (!val) return '';
    return `${val.substring(8, 10)} Jan ${val.substring(11, 16)}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: TimeSeriesPoint = payload[0].payload;
      const isOver = (data.errorMW ?? 0) < 0;

      return (
        <div className="bg-navy-900/95 border border-navy-700 rounded-lg p-3 shadow-xl backdrop-blur-md text-xs font-sans min-w-[220px]">
          <div className="flex items-center justify-between border-b border-navy-700/80 pb-1.5 mb-2">
            <span className="font-semibold text-white">
              {data.settlementDate} ({data.deliveryTime.substring(11, 16)} GMT)
            </span>
            <span className="bg-navy-700 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-mono">
              SP {data.settlementPeriod}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-wind-teal font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-wind-teal inline-block" />
                Actual Outturn:
              </span>
              <span className="font-mono font-bold text-white">
                {data.actualGenerationMW.toLocaleString()} MW
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-wind-violet font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-wind-violet inline-block" />
                Day-Ahead Forecast:
              </span>
              <span className="font-mono font-bold text-white">
                {data.forecastGenerationMW ? `${data.forecastGenerationMW.toLocaleString()} MW` : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-navy-800">
              <span className="text-slate-400">Error (Act - Fore):</span>
              <span
                className={`font-mono font-bold ${
                  isOver ? 'text-wind-rose' : 'text-wind-emerald'
                }`}
              >
                {data.errorMW !== undefined
                  ? `${data.errorMW > 0 ? '+' : ''}${data.errorMW.toLocaleString()} MW`
                  : 'N/A'}
              </span>
            </div>

            {data.forecastHorizonHours !== undefined && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span>Forecast Horizon:</span>
                <span className="font-mono text-slate-300">{data.forecastHorizonHours} hrs</span>
              </div>
            )}
          </div>

          {onSelectPeriod && (
            <div className="mt-2.5 pt-1.5 border-t border-navy-800 text-center">
              <button
                onClick={() => onSelectPeriod(data.deliveryTime)}
                className="text-[11px] text-wind-teal hover:underline font-medium"
              >
                Inspect Forecast Evolution →
              </button>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-5 shadow-lg">
      {/* Chart Header & Range Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Actual Wind Generation vs. Day-Ahead Forecast</span>
            <span className="text-xs px-2 py-0.5 rounded bg-wind-teal/10 border border-wind-teal/30 text-wind-teal font-medium">
              January 2026
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Elexon FUELHH 30-min outturn vs. National Grid ESO WINDFOR gate closure prediction
          </p>
        </div>

        {/* Preset Range Selectors */}
        <div className="flex items-center space-x-1 bg-navy-900 border border-navy-700/80 rounded-lg p-1 text-xs">
          <button
            onClick={() => setRangeFilter('ALL')}
            className={`px-2.5 py-1 rounded transition-colors ${
              rangeFilter === 'ALL' ? 'bg-navy-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Full Month
          </button>
          <button
            onClick={() => setRangeFilter('W1')}
            className={`px-2.5 py-1 rounded transition-colors ${
              rangeFilter === 'W1' ? 'bg-navy-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Week 1
          </button>
          <button
            onClick={() => setRangeFilter('W2')}
            className={`px-2.5 py-1 rounded transition-colors ${
              rangeFilter === 'W2' ? 'bg-navy-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Week 2
          </button>
          <button
            onClick={() => setRangeFilter('W3')}
            className={`px-2.5 py-1 rounded transition-colors ${
              rangeFilter === 'W3' ? 'bg-navy-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Week 3
          </button>
          <button
            onClick={() => setRangeFilter('W4')}
            className={`px-2.5 py-1 rounded transition-colors ${
              rangeFilter === 'W4' ? 'bg-navy-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Week 4
          </button>
          <button
            onClick={() => setRangeFilter('STORM')}
            className={`px-2.5 py-1 rounded transition-colors ${
              rangeFilter === 'STORM'
                ? 'bg-amber-600/80 text-white font-semibold'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            Storm Peak (14-17 Jan)
          </button>
        </div>
      </div>

      {/* Main Interactive Chart */}
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={filteredData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length && onSelectPeriod) {
                onSelectPeriod(state.activePayload[0].payload.deliveryTime);
              }
            }}
          >
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.6} />
            <XAxis
              dataKey="deliveryTime"
              tickFormatter={formatTick}
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              minTickGap={45}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              unit=" MW"
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
              iconType="circle"
            />
            {/* Shaded Area for Actuals */}
            <Area
              type="monotone"
              dataKey="actualGenerationMW"
              name="Actual Wind Outturn"
              stroke="#06B6D4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#actualGradient)"
            />
            {/* Day-Ahead Forecast Line */}
            <Line
              type="monotone"
              dataKey="forecastGenerationMW"
              name="Day-Ahead Forecast (Gate Closure)"
              stroke="#A855F7"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 5, fill: '#A855F7' }}
            />
            {/* Interactive Brush Zoom */}
            <Brush
              dataKey="deliveryTime"
              height={26}
              stroke="#334155"
              fill="#0B132B"
              tickFormatter={formatTick}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
        <span>Tip: Drag the brush handles at the bottom to zoom into specific storm fronts or settlement hours.</span>
        <span className="font-mono text-slate-300">Showing {filteredData.length} Settlement Records</span>
      </div>
    </div>
  );
};
