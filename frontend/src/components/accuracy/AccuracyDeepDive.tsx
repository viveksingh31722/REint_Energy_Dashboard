import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
  Legend,
} from 'recharts';
import { ErrorDistribution, DiurnalHourPoint, HorizonBucketPoint, TimeSeriesPoint } from '../../types';
import { BarChart3, Clock, AlertCircle } from 'lucide-react';

interface AccuracyDeepDiveProps {
  series: TimeSeriesPoint[];
  distribution?: ErrorDistribution;
  diurnal?: DiurnalHourPoint[];
  horizon?: HorizonBucketPoint[];
}

export const AccuracyDeepDive: React.FC<AccuracyDeepDiveProps> = ({
  series,
  distribution,
  diurnal,
  horizon,
}) => {
  // Subsample series for error bar chart to keep performance crisp
  const errorBars = series.filter((_, idx) => idx % 2 === 0);

  return (
    <div className="space-y-6">
      {/* Top Row: Signed Error Timeline & Error Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Signed Error Timeline */}
        <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-wind-teal" />
                Signed Error Timeline (Actual - Forecast)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Green = Under-predicted (Surplus wind) | Red = Over-predicted (Shortfall risk)
              </p>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorBars} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.6} />
                <XAxis
                  dataKey="deliveryTime"
                  tickFormatter={(val) => (val ? `${val.substring(8, 10)} Jan` : '')}
                  stroke="#64748B"
                  fontSize={11}
                  minTickGap={40}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  unit=" MW"
                  tickLine={false}
                />
                <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const d: TimeSeriesPoint = payload[0].payload;
                      const isOver = (d.errorMW ?? 0) < 0;
                      return (
                        <div className="bg-navy-900 border border-navy-700 rounded p-2 text-xs font-mono shadow-md">
                          <div className="font-sans font-bold text-white mb-1">
                            {d.settlementDate} SP {d.settlementPeriod}
                          </div>
                          <div>Error: <span className={isOver ? 'text-wind-rose font-bold' : 'text-wind-emerald font-bold'}>
                            {d.errorMW !== undefined ? `${d.errorMW > 0 ? '+' : ''}${d.errorMW.toLocaleString()} MW` : 'N/A'}
                          </span></div>
                          <div className="text-slate-400 text-[10px]">Actual: {d.actualGenerationMW.toLocaleString()} MW</div>
                          <div className="text-slate-400 text-[10px]">Forecast: {d.forecastGenerationMW?.toLocaleString()} MW</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="errorMW" name="Error MW">
                  {errorBars.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={(entry.errorMW ?? 0) >= 0 ? '#10B981' : '#F43F5E'}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Error Distribution Histogram */}
        <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-wind-violet" />
                Error Distribution & Quantile Sizing
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Empirical distribution of forecast deviations with P50 and P90 risk bounds
              </p>
            </div>
            {distribution && (
              <span className="text-xs px-2 py-0.5 rounded bg-wind-violet/10 border border-wind-violet/30 text-wind-violet font-mono">
                σ = ±{distribution.stdError.toLocaleString()} MW
              </span>
            )}
          </div>

          <div className="h-[280px]">
            {distribution && distribution.histogram ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution.histogram} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.6} />
                  <XAxis
                    dataKey="binMidpoint"
                    stroke="#64748B"
                    fontSize={10}
                    tickFormatter={(v) => `${v > 0 ? '+' : ''}${Math.round(v / 1000)}k`}
                    tickLine={false}
                  />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit=" SPs" />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const b = payload[0].payload;
                        return (
                          <div className="bg-navy-900 border border-navy-700 rounded p-2 text-xs font-mono shadow-md">
                            <div className="font-sans font-bold text-white">{b.binRange}</div>
                            <div className="text-wind-violet font-semibold">{b.count} Settlement Periods ({b.percentage}%)</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" fillOpacity={0.8} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Loading distribution data...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Diurnal Error Profile & Forecast Horizon Degradation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Diurnal Error Profile */}
        <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-wind-amber" />
                Diurnal Error Profile (24-Hour Settlement Cycle)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Mean generation, MAE, and Bias across hours of the day
              </p>
            </div>
          </div>

          <div className="h-[280px]">
            {diurnal ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={diurnal} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.6} />
                  <XAxis dataKey="hourLabel" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748B"
                    fontSize={11}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    unit=" MW"
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-navy-900 border border-navy-700 rounded p-2.5 text-xs font-mono shadow-md space-y-1">
                            <div className="font-sans font-bold text-white">{d.hourLabel} UTC</div>
                            <div className="text-wind-teal">Mean Actual: {d.meanActualMW.toLocaleString()} MW</div>
                            <div className="text-wind-violet">Mean Forecast: {d.meanForecastMW.toLocaleString()} MW</div>
                            <div className="text-amber-300 font-semibold">MAE: ±{d.maeMW.toLocaleString()} MW</div>
                            <div className={d.biasMW < 0 ? 'text-wind-rose' : 'text-wind-emerald'}>
                              Bias: {d.biasMW > 0 ? '+' : ''}{d.biasMW.toLocaleString()} MW
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="maeMW" name="Mean Absolute Error (MAE)" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="biasMW" name="Systematic Bias" stroke="#F43F5E" strokeWidth={1.5} strokeDasharray="3 3" dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Loading diurnal profile...
              </div>
            )}
          </div>
        </div>

        {/* 4. Forecast Horizon Degradation */}
        <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-wind-teal" />
                Forecast Degradation vs. Lead Time (Horizon)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluation of forecast error growth as auction gate closure advances
              </p>
            </div>
          </div>

          <div className="h-[280px]">
            {horizon ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={horizon} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.6} />
                  <XAxis dataKey="horizonBucket" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} unit=" MW" tickLine={false} />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const h = payload[0].payload;
                        return (
                          <div className="bg-navy-900 border border-navy-700 rounded p-2 text-xs font-mono shadow-md">
                            <div className="font-sans font-bold text-white">{h.horizonBucket}</div>
                            <div className="text-wind-teal font-semibold">MAE: ±{h.maeMW.toLocaleString()} MW</div>
                            <div className="text-slate-400">Sample Count: {h.sampleCount} periods</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="maeMW" name="MAE (MW)" fill="#06B6D4" fillOpacity={0.85} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Loading horizon analysis...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
