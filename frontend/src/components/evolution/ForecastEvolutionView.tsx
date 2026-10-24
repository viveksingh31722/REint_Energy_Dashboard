import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts';
import { api } from '../../services/api';
import { GitCommit, History } from 'lucide-react';

interface EvolutionProps {
  initialDeliveryTime?: string;
}

export const ForecastEvolutionView: React.FC<EvolutionProps> = ({
  initialDeliveryTime = '2026-01-15T18:00:00Z',
}) => {
  const [deliveryTime, setDeliveryTime] = useState<string>(initialDeliveryTime);

  const { data: evolution, isLoading } = useQuery({
    queryKey: ['evolution', deliveryTime],
    queryFn: () => api.getEvolution(deliveryTime),
    enabled: !!deliveryTime,
  });

  const presets = [
    { label: 'Jan 15 18:00 (Storm Dudley Evening Peak)', value: '2026-01-15T18:00:00Z' },
    { label: 'Jan 01 00:00 (New Year SP 1 Baseline)', value: '2026-01-01T00:00:00Z' },
    { label: 'Jan 10 12:00 (Mid-Month Noon Ramp)', value: '2026-01-10T12:00:00Z' },
    { label: 'Jan 20 08:00 (Morning Demand Peak)', value: '2026-01-20T08:00:00Z' },
    { label: 'Jan 28 20:00 (Late Month Winter Gale)', value: '2026-01-28T20:00:00Z' },
  ];

  return (
    <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-5 shadow-lg space-y-6">
      {/* View Header & Preset Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-wind-violet" />
            <span>Forecast Evolution Tracker</span>
            <span className="text-xs px-2 py-0.5 rounded bg-wind-violet/10 border border-wind-violet/30 text-wind-violet font-medium">
              Multi-Run Trajectory
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Trace how rolling NESO weather updates converged before physical gate closure
          </p>
        </div>

        {/* Delivery Period Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Target Delivery:</span>
          <select
            value={deliveryTime}
            onChange={(e) => setDeliveryTime(e.target.value)}
            className="bg-navy-900 border border-navy-700 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-wind-violet cursor-pointer font-medium"
          >
            {presets.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[320px] flex items-center justify-center text-xs text-slate-500">
          Reconstructing publication trajectory...
        </div>
      ) : evolution && evolution.evolutionSeries.length > 0 ? (
        <>
          {/* Summary Strip for Selected Period */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-navy-900/80 border border-navy-700/60 rounded-lg p-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Physical Outturn:</span>
              <span className="text-base font-mono font-bold text-wind-teal">
                {evolution.actualGenerationMW !== undefined && evolution.actualGenerationMW !== null
                  ? `${evolution.actualGenerationMW.toLocaleString()} MW`
                  : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Total Published Revisions:</span>
              <span className="text-base font-mono font-bold text-white">
                {evolution.revisionCount} cycles
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Final Day-Ahead Forecast:</span>
              <span className="text-base font-mono font-bold text-wind-violet">
                {evolution.evolutionSeries[evolution.evolutionSeries.length - 1].forecastMW.toLocaleString()} MW
              </span>
            </div>
          </div>

          {/* Evolution Chart */}
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={evolution.evolutionSeries}
                margin={{ top: 15, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.6} />
                <XAxis
                  dataKey="publishTime"
                  stroke="#64748B"
                  fontSize={11}
                  tickFormatter={(val) => (val ? `${val.substring(8, 10)} Jan ${val.substring(11, 16)}` : '')}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  unit=" MW"
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-navy-900 border border-navy-700 rounded-lg p-3 text-xs font-mono shadow-xl space-y-1">
                          <div className="font-sans font-bold text-white">
                            Published: {item.publishTime.substring(0, 10)} {item.publishTime.substring(11, 16)} UTC
                          </div>
                          <div className="text-slate-400">Horizon: {item.horizonHours} hours ahead</div>
                          <div className="text-wind-violet font-semibold">
                            Forecast: {item.forecastMW.toLocaleString()} MW
                          </div>
                          <div className="text-slate-300">
                            Change: {item.deltaFromPreviousMW > 0 ? '+' : ''}{item.deltaFromPreviousMW.toLocaleString()} MW
                          </div>
                          {item.deltaFromActualMW !== null && item.deltaFromActualMW !== undefined && (
                            <div className="text-wind-teal">
                              Delta to Final Actual: {item.deltaFromActualMW > 0 ? '+' : ''}{item.deltaFromActualMW.toLocaleString()} MW
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px' }} />
                {/* Horizontal Reference Line for Final Actual */}
                {evolution.actualGenerationMW !== null && evolution.actualGenerationMW !== undefined && (
                  <ReferenceLine
                    y={evolution.actualGenerationMW}
                    stroke="#06B6D4"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{
                      value: `Final Actual (${evolution.actualGenerationMW.toLocaleString()} MW)`,
                      fill: '#06B6D4',
                      fontSize: 11,
                      position: 'insideTopLeft',
                    }}
                  />
                )}
                <Line
                  type="stepAfter"
                  dataKey="forecastMW"
                  name="Forecast Published (MW)"
                  stroke="#A855F7"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#A855F7' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revision History Audit Table */}
          <div className="border border-navy-700/80 rounded-lg overflow-hidden">
            <div className="bg-navy-900 px-4 py-2 border-b border-navy-700/80 flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-wind-violet" />
                Publication Revision Audit Trail
              </span>
              <span className="text-slate-400 font-mono">{evolution.revisionCount} successive updates</span>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-navy-900/60 text-slate-400 sticky top-0 border-b border-navy-800">
                  <tr>
                    <th className="py-2 px-3">Publish Time (UTC)</th>
                    <th className="py-2 px-3">Lead Time</th>
                    <th className="py-2 px-3">Forecast</th>
                    <th className="py-2 px-3">Revision Delta</th>
                    <th className="py-2 px-3">Delta to Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800/60 text-slate-300">
                  {evolution.evolutionSeries.map((rev, idx) => (
                    <tr key={idx} className="hover:bg-navy-700/30">
                      <td className="py-2 px-3 text-white">
                        {rev.publishTime.substring(0, 10)} {rev.publishTime.substring(11, 16)}
                      </td>
                      <td className="py-2 px-3 text-slate-400">{rev.horizonHours}h ahead</td>
                      <td className="py-2 px-3 text-wind-violet font-semibold">
                        {rev.forecastMW.toLocaleString()} MW
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={
                            rev.deltaFromPreviousMW > 0
                              ? 'text-wind-emerald'
                              : rev.deltaFromPreviousMW < 0
                              ? 'text-wind-rose'
                              : 'text-slate-500'
                          }
                        >
                          {rev.deltaFromPreviousMW > 0 ? '+' : ''}
                          {rev.deltaFromPreviousMW.toLocaleString()} MW
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {rev.deltaFromActualMW !== null && rev.deltaFromActualMW !== undefined
                          ? `${rev.deltaFromActualMW > 0 ? '+' : ''}${rev.deltaFromActualMW.toLocaleString()} MW`
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-xs text-slate-500">
          No forecast history records found for this timestamp.
        </div>
      )}
    </div>
  );
};
