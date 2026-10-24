import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import { motion } from 'motion/react';
import { api } from '../../services/api';
import { GitCommit, History, Clock } from 'lucide-react';

interface ScrubberProps {
  initialDeliveryTime?: string;
}

export const ForecastEvolutionScrubber: React.FC<ScrubberProps> = ({
  initialDeliveryTime = '2026-01-15T18:00:00Z',
}) => {
  const [deliveryTime, setDeliveryTime] = useState<string>(initialDeliveryTime);

  const { data: evolution, isLoading } = useQuery({
    queryKey: ['evolution', deliveryTime],
    queryFn: () => api.getEvolution(deliveryTime),
    enabled: !!deliveryTime,
  });

  const presets = [
    { label: 'Jan 15 · 18:00 GMT (Storm Dudley Evening Peak)', value: '2026-01-15T18:00:00Z' },
    { label: 'Jan 01 · 00:00 GMT (New Year SP 1 Baseline)', value: '2026-01-01T00:00:00Z' },
    { label: 'Jan 10 · 12:00 GMT (Mid-Month Noon Ramp)', value: '2026-01-10T12:00:00Z' },
    { label: 'Jan 20 · 08:00 GMT (Morning Demand Ramp)', value: '2026-01-20T08:00:00Z' },
    { label: 'Jan 28 · 20:00 GMT (Late Month Gale Event)', value: '2026-01-28T20:00:00Z' },
  ];

  // ECharts Step-Chart Configuration
  const option = useMemo(() => {
    if (!evolution || !evolution.evolutionSeries.length) return {};

    const pubs = evolution.evolutionSeries.map((s) => {
      const day = s.publishTime.substring(8, 10);
      const time = s.publishTime.substring(11, 16);
      return `${day} Jan ${time}`;
    });

    const forecasts = evolution.evolutionSeries.map((s) => s.forecastMW);
    const actual = evolution.actualGenerationMW;

    return {
      backgroundColor: 'transparent',
      grid: { top: 35, right: 25, bottom: 40, left: 65 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0A0E17',
        borderColor: 'rgba(255,255,255,0.12)',
        textStyle: { color: '#E2E8F0', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const idx = params[0].dataIndex;
          const s = evolution.evolutionSeries[idx];
          return `
            <div style="font-family:'Geist Mono',monospace;">
              <div style="font-weight:600; color:#FFFFFF; margin-bottom:4px;">Published: ${s.publishTime.substring(0, 10)} ${s.publishTime.substring(11, 16)} UTC</div>
              <div style="color:#94A3B8; font-size:10px;">Lead Time: ${s.horizonHours} hours ahead</div>
              <div style="color:#A78BFA; font-weight:700; margin-top:4px;">Forecast: ${s.forecastMW.toLocaleString()} MW</div>
              <div style="color:#64748B; font-size:10px;">Revision Delta: ${s.deltaFromPreviousMW > 0 ? '+' : ''}${s.deltaFromPreviousMW.toLocaleString()} MW</div>
              ${s.deltaFromActualMW !== null && s.deltaFromActualMW !== undefined ? `<div style="color:#00E5FF; font-size:10px;">Gap to Final Actual: ${s.deltaFromActualMW > 0 ? '+' : ''}${s.deltaFromActualMW.toLocaleString()} MW</div>` : ''}
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: pubs,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisTick: { show: false },
        axisLabel: { color: '#64748B', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)', type: 'dashed' } },
        axisLabel: { color: '#64748B', fontSize: 10, formatter: (v: number) => `${(v / 1000).toFixed(0)}k MW` },
      },
      series: [
        {
          name: 'Published Forecast',
          type: 'line',
          step: 'end',
          data: forecasts,
          lineStyle: { color: '#A78BFA', width: 2.5 },
          itemStyle: { color: '#A78BFA' },
          markLine: actual !== null && actual !== undefined ? {
            symbol: 'none',
            data: [
              {
                yAxis: actual,
                lineStyle: { color: '#00E5FF', type: 'dashed', width: 2 },
                label: {
                  formatter: `Actual Outturn (${actual.toLocaleString()} MW)`,
                  position: 'insideStartTop',
                  color: '#00E5FF',
                  fontSize: 10,
                  fontFamily: 'Geist Mono, monospace',
                },
              },
            ],
          } : undefined,
        },
      ],
    };
  }, [evolution]);

  return (
    <div className="border border-white/[0.08] bg-[#0E131F]/90 rounded-lg p-6 backdrop-blur-md space-y-6">
      {/* Top Header & Presets */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <GitCommit className="w-4 h-4 text-[#A78BFA]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Forecast Evolution Trajectory (Time-Machine)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/20">
              Multi-Run Audit
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Track how rolling National Grid ESO weather updates converged before gate closure
          </p>
        </div>

        {/* Delivery Timestamp Selector */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-slate-400">Target Delivery:</span>
          <select
            value={deliveryTime}
            onChange={(e) => setDeliveryTime(e.target.value)}
            className="bg-[#090D16] border border-white/[0.08] rounded px-3 py-1.5 text-white font-medium focus:outline-none focus:border-[#A78BFA] cursor-pointer"
          >
            {presets.map((p) => (
              <option key={p.value} value={p.value} className="bg-[#090D16]">
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[320px] flex items-center justify-center text-xs font-mono text-slate-500">
          Reconstructing publication trajectory from Elexon BMRS...
        </div>
      ) : evolution && evolution.evolutionSeries.length > 0 ? (
        <>
          {/* Quick Metrics Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-white/[0.06] bg-[#090D16]/80 rounded p-4 font-mono text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Final Metered Outturn:</span>
              <span className="text-xl font-bold text-[#00E5FF] tabular-nums">
                {evolution.actualGenerationMW !== null && evolution.actualGenerationMW !== undefined
                  ? `${evolution.actualGenerationMW.toLocaleString()} MW`
                  : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Published Revision Runs:</span>
              <span className="text-xl font-bold text-white tabular-nums">
                {evolution.revisionCount} cycles
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Final Forecast at Gate:</span>
              <span className="text-xl font-bold text-[#A78BFA] tabular-nums">
                {evolution.evolutionSeries[evolution.evolutionSeries.length - 1].forecastMW.toLocaleString()} MW
              </span>
            </div>
          </div>

          {/* ECharts Step Trajectory Chart */}
          <div className="h-[340px] w-full">
            <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
          </div>

          {/* Terminal-Grade Audit Table */}
          <div className="border border-white/[0.06] rounded overflow-hidden">
            <div className="bg-[#090D16] px-4 py-2 border-b border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#A78BFA]" />
                Publication Revision History
              </span>
              <span className="text-slate-400">{evolution.revisionCount} model iterations</span>
            </div>
            <div className="max-h-52 overflow-y-auto font-mono text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#0C101B] text-slate-400 sticky top-0 border-b border-white/[0.04]">
                  <tr>
                    <th className="py-2 px-3 text-[10px] uppercase">Publish Time (UTC)</th>
                    <th className="py-2 px-3 text-[10px] uppercase">Lead Time</th>
                    <th className="py-2 px-3 text-[10px] uppercase text-right">Predicted MW</th>
                    <th className="py-2 px-3 text-[10px] uppercase text-right">Revision Δ</th>
                    <th className="py-2 px-3 text-[10px] uppercase text-right">Gap to Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-slate-300">
                  {evolution.evolutionSeries.map((rev, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="py-2 px-3 text-white">
                        {rev.publishTime.substring(0, 10)} {rev.publishTime.substring(11, 16)}
                      </td>
                      <td className="py-2 px-3 text-slate-400">{rev.horizonHours}h ahead</td>
                      <td className="py-2 px-3 text-right text-[#A78BFA] font-semibold tabular-nums">
                        {rev.forecastMW.toLocaleString()} MW
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        <span
                          className={
                            rev.deltaFromPreviousMW > 0
                              ? 'text-[#34D399]'
                              : rev.deltaFromPreviousMW < 0
                              ? 'text-[#FB7185]'
                              : 'text-slate-500'
                          }
                        >
                          {rev.deltaFromPreviousMW > 0 ? '+' : ''}
                          {rev.deltaFromPreviousMW.toLocaleString()} MW
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400 tabular-nums">
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
        <div className="h-[200px] flex items-center justify-center text-xs font-mono text-slate-500">
          No forecast history records found for this timestamp.
        </div>
      )}
    </div>
  );
};
