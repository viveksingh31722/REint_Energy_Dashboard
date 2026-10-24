import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { GitCommit, History, Sliders, ChevronRight } from 'lucide-react';

interface ScrubberProps {
  initialDeliveryTime?: string;
}

export const ForecastEvolutionScrubber: React.FC<ScrubberProps> = ({
  initialDeliveryTime = '2026-01-15T18:00:00Z',
}) => {
  const [deliveryTime, setDeliveryTime] = useState<string>(initialDeliveryTime);
  const [activeCycleIndex, setActiveCycleIndex] = useState<number | null>(null);

  const { data: evolution, isLoading } = useQuery({
    queryKey: ['evolution', deliveryTime],
    queryFn: () => api.getEvolution(deliveryTime),
    enabled: !!deliveryTime,
  });

  const presets = [
    { label: '15 Jan · 18:00 GMT (Storm Dudley Peak)', value: '2026-01-15T18:00:00Z' },
    { label: '01 Jan · 00:00 GMT (New Year SP 1 Baseline)', value: '2026-01-01T00:00:00Z' },
    { label: '10 Jan · 12:00 GMT (Mid-Month Noon Ramp)', value: '2026-01-10T12:00:00Z' },
    { label: '20 Jan · 08:00 GMT (Morning Demand Ramp)', value: '2026-01-20T08:00:00Z' },
    { label: '28 Jan · 20:00 GMT (Late Month Gale Event)', value: '2026-01-28T20:00:00Z' },
  ];

  // Active run calculation for the scrubber
  const currentRunIndex = useMemo(() => {
    if (!evolution || !evolution.evolutionSeries.length) return 0;
    if (activeCycleIndex !== null && activeCycleIndex >= 0 && activeCycleIndex < evolution.evolutionSeries.length) {
      return activeCycleIndex;
    }
    return evolution.evolutionSeries.length - 1; // Default to gate closure run
  }, [evolution, activeCycleIndex]);

  const activeRun = evolution?.evolutionSeries?.[currentRunIndex];

  // ECharts Step-Chart: Terracotta Trajectory + Emerald Actual Outturn
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
      animation: true,
      animationDuration: 300,
      grid: { top: 30, right: 20, bottom: 40, left: 55 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#DCE3E0',
        borderWidth: 1,
        extraCssText: 'box-shadow: 0 8px 24px rgba(24, 32, 31, 0.08); backdrop-filter: blur(16px); border-radius: 8px;',
        textStyle: { color: '#18201F', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const idx = params[0].dataIndex;
          const s = evolution.evolutionSeries[idx];
          return `
            <div style="font-family:'Geist Mono',monospace;">
              <div style="font-weight:600; color:#18201F; margin-bottom:4px;">Published: ${s.publishTime.substring(0, 10)} ${s.publishTime.substring(11, 16)} UTC</div>
              <div style="color:#687370; font-size:10px;">Lead Horizon: ${s.horizonHours} hours ahead</div>
              <div style="color:#C96A3D; font-weight:700; margin-top:3px;">Forecast: ${s.forecastMW.toLocaleString()} MW</div>
              <div style="color:#8B9692; font-size:10px;">Revision Delta: ${s.deltaFromPreviousMW > 0 ? '+' : ''}${s.deltaFromPreviousMW.toLocaleString()} MW</div>
              ${s.deltaFromActualMW !== null && s.deltaFromActualMW !== undefined ? `<div style="color:#087F6A; font-size:10px; font-weight:600;">Gap to Final Actual: ${s.deltaFromActualMW > 0 ? '+' : ''}${s.deltaFromActualMW.toLocaleString()} MW</div>` : ''}
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: pubs,
        axisLine: { lineStyle: { color: '#DCE3E0' } },
        axisTick: { show: false },
        axisLabel: { color: '#8B9692', fontSize: 10, fontFamily: 'Geist Mono, monospace' },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#E8EDEA', type: 'dashed' } },
        axisLabel: { color: '#8B9692', fontSize: 10, formatter: (v: number) => `${(v / 1000).toFixed(0)}k MW` },
      },
      series: [
        {
          name: 'Forecast Trajectory',
          type: 'line',
          step: 'end',
          data: forecasts,
          lineStyle: { color: '#C96A3D', width: 2 },
          itemStyle: { color: '#C96A3D' },
          markPoint: activeRun ? {
            symbol: 'pin',
            symbolSize: 30,
            data: [
              {
                coord: [pubs[currentRunIndex], activeRun.forecastMW],
                value: `${activeRun.forecastMW.toLocaleString()} MW`,
                itemStyle: { color: '#D5A83E' },
              }
            ]
          } : undefined,
          markLine: actual !== null && actual !== undefined ? {
            symbol: 'none',
            data: [
              {
                yAxis: actual,
                lineStyle: { color: '#087F6A', type: 'dashed', width: 2 },
                label: {
                  formatter: `Actual Metered (${actual.toLocaleString()} MW)`,
                  position: 'insideStartTop',
                  color: '#087F6A',
                  fontSize: 10,
                  fontFamily: 'Geist Mono, monospace',
                  fontWeight: '600',
                },
              },
            ],
          } : undefined,
        },
      ],
    };
  }, [evolution, activeRun, currentRunIndex]);

  return (
    <div className="terminal-surface rounded-xl p-6 shadow-terminal-sm space-y-6">
      {/* Top Header & Delivery Period Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#DCE3E0] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C96A3D]" />
            <h3 className="text-xs font-semibold tracking-wider uppercase text-[#18201F]">
              Forecast Evolution Timeline
            </h3>
            <span className="text-[#DCE3E0]">·</span>
            <span className="text-xs text-[#8B9692]">Time-Machine Scrubber</span>
          </div>
          <p className="text-xs text-[#687370] mt-0.5">
            Track how rolling National Grid ESO weather updates converged before final gate closure
          </p>
        </div>

        {/* Target Delivery Selector */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[#8B9692]">Target Delivery:</span>
          <select
            value={deliveryTime}
            onChange={(e) => {
              setDeliveryTime(e.target.value);
              setActiveCycleIndex(null);
            }}
            className="bg-white border border-[#DCE3E0] rounded-md px-2.5 py-1 text-[#18201F] font-medium focus:outline-none cursor-pointer shadow-terminal-sm"
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
        <div className="h-[280px] flex items-center justify-center text-xs font-mono text-[#8B9692]">
          Reconstructing publication trajectory from Elexon BMRS...
        </div>
      ) : evolution && evolution.evolutionSeries.length > 0 ? (
        <>
          {/* Timeline Stages: D-2 -> D-1 -> Gate Closure -> Delivery */}
          <div className="flex items-center justify-between text-xs text-[#687370] border-b border-[#DCE3E0] pb-3">
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-[#18201F]">D-2 Long Range</span>
              <span className="text-[11px] text-[#8B9692]">(48h–72h)</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#DCE3E0]" />
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-[#18201F]">D-1 Day-Ahead</span>
              <span className="text-[11px] text-[#8B9692]">(24h–36h)</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#DCE3E0]" />
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-[#C96A3D]">Gate Closure</span>
              <span className="text-[11px] text-[#8B9692]">(12:00 UTC)</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#DCE3E0]" />
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-[#087F6A]">Metered Outturn</span>
              <span className="text-[11px] text-[#8B9692]">(Actual)</span>
            </div>
          </div>

          {/* Interactive Timeline Scrubber Control */}
          <div className="bg-[#EEF2F1] rounded-lg p-4 border border-[#DCE3E0] space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
              <div className="flex items-center space-x-2 text-[#18201F] font-semibold">
                <Sliders className="w-3.5 h-3.5 text-[#C96A3D]" />
                <span>Publication Run: Cycle {currentRunIndex + 1} of {evolution.evolutionSeries.length}</span>
              </div>
              <div className="text-[11px] text-[#687370]">
                Published: <strong className="text-[#18201F]">{activeRun?.publishTime.substring(0, 10)} {activeRun?.publishTime.substring(11, 16)} UTC</strong> ({activeRun?.horizonHours}h ahead of delivery)
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={0}
              max={evolution.evolutionSeries.length - 1}
              value={currentRunIndex}
              onChange={(e) => setActiveCycleIndex(Number(e.target.value))}
              className="w-full accent-[#C96A3D] h-2 bg-white rounded-lg cursor-pointer"
            />
          </div>

          {/* Dynamic Scrubber Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-2 border-b border-[#DCE3E0]">
            <div>
              <span className="text-[11px] font-medium uppercase text-[#8B9692] block">Final Metered Outturn</span>
              <span className="text-2xl font-mono font-bold text-[#087F6A] tabular-nums mt-1 block">
                {evolution.actualGenerationMW !== null && evolution.actualGenerationMW !== undefined
                  ? `${evolution.actualGenerationMW.toLocaleString()} MW`
                  : '—'}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium uppercase text-[#8B9692] block">Predicted in Active Run</span>
              <motion.span
                key={activeRun?.forecastMW}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="text-2xl font-mono font-bold text-[#C96A3D] tabular-nums mt-1 block"
              >
                {activeRun?.forecastMW.toLocaleString()} MW
              </motion.span>
            </div>
            <div>
              <span className="text-[11px] font-medium uppercase text-[#8B9692] block">Revision from Prior Run</span>
              <span
                className={`text-2xl font-mono font-bold tabular-nums mt-1 block ${
                  (activeRun?.deltaFromPreviousMW ?? 0) > 0
                    ? 'text-[#087F6A]'
                    : (activeRun?.deltaFromPreviousMW ?? 0) < 0
                    ? 'text-[#C96A3D]'
                    : 'text-[#687370]'
                }`}
              >
                {(activeRun?.deltaFromPreviousMW ?? 0) > 0 ? '+' : ''}
                {activeRun?.deltaFromPreviousMW.toLocaleString()} MW
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium uppercase text-[#8B9692] block">Gap to Final Outturn</span>
              <span className="text-2xl font-mono font-bold text-[#18201F] tabular-nums mt-1 block">
                {activeRun?.deltaFromActualMW !== null && activeRun?.deltaFromActualMW !== undefined
                  ? `${activeRun.deltaFromActualMW > 0 ? '+' : ''}${activeRun.deltaFromActualMW.toLocaleString()} MW`
                  : '—'}
              </span>
            </div>
          </div>

          {/* ECharts Step Trajectory Chart */}
          <div className="h-[320px] w-full">
            <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
          </div>

          {/* Publication Audit Table */}
          <div className="border border-[#DCE3E0] rounded-lg overflow-hidden">
            <div className="bg-[#EEF2F1] px-4 py-2 border-b border-[#DCE3E0] flex items-center justify-between text-xs">
              <span className="font-semibold text-[#18201F] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#C96A3D]" />
                Complete Publication Revision Audit
              </span>
              <span className="text-[#8B9692]">{evolution.revisionCount} cycles</span>
            </div>
            <div className="max-h-48 overflow-y-auto font-mono text-xs">
              <table className="w-full text-left">
                <thead className="bg-white text-[#8B9692] sticky top-0 border-b border-[#DCE3E0]">
                  <tr>
                    <th className="py-2 px-3 text-[10px] uppercase">Publish Time (UTC)</th>
                    <th className="py-2 px-3 text-[10px] uppercase">Lead Time</th>
                    <th className="py-2 px-3 text-[10px] uppercase text-right">Predicted MW</th>
                    <th className="py-2 px-3 text-[10px] uppercase text-right">Revision Δ</th>
                    <th className="py-2 px-3 text-[10px] uppercase text-right">Gap to Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EDEA] text-[#687370]">
                  {evolution.evolutionSeries.map((rev, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setActiveCycleIndex(idx)}
                      className={`cursor-pointer transition-colors ${
                        idx === currentRunIndex ? 'bg-[#C96A3D]/10 font-semibold' : 'hover:bg-[#EEF2F1]'
                      }`}
                    >
                      <td className="py-2 px-3 text-[#18201F]">
                        {rev.publishTime.substring(0, 10)} {rev.publishTime.substring(11, 16)}
                      </td>
                      <td className="py-2 px-3 text-[#8B9692]">{rev.horizonHours}h ahead</td>
                      <td className="py-2 px-3 text-right text-[#C96A3D] font-semibold tabular-nums">
                        {rev.forecastMW.toLocaleString()} MW
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        <span
                          className={
                            rev.deltaFromPreviousMW > 0
                              ? 'text-[#087F6A]'
                              : rev.deltaFromPreviousMW < 0
                              ? 'text-[#C84B4B]'
                              : 'text-[#8B9692]'
                          }
                        >
                          {rev.deltaFromPreviousMW > 0 ? '+' : ''}
                          {rev.deltaFromPreviousMW.toLocaleString()} MW
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-[#687370] tabular-nums">
                        {rev.deltaFromActualMW !== null && rev.deltaFromActualMW !== undefined
                          ? `${rev.deltaFromActualMW > 0 ? '+' : ''}${rev.deltaFromActualMW.toLocaleString()} MW`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-xs font-mono text-[#8B9692]">
          No forecast history records found for this timestamp.
        </div>
      )}
    </div>
  );
};
