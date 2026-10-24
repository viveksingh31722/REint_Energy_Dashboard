import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { GitCommit, History, Sliders, Play, CheckCircle } from 'lucide-react';

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
    { label: 'Jan 15 · 18:00 GMT (Storm Dudley Evening Peak)', value: '2026-01-15T18:00:00Z' },
    { label: 'Jan 01 · 00:00 GMT (New Year SP 1 Baseline)', value: '2026-01-01T00:00:00Z' },
    { label: 'Jan 10 · 12:00 GMT (Mid-Month Noon Ramp)', value: '2026-01-10T12:00:00Z' },
    { label: 'Jan 20 · 08:00 GMT (Morning Demand Ramp)', value: '2026-01-20T08:00:00Z' },
    { label: 'Jan 28 · 20:00 GMT (Late Month Gale Event)', value: '2026-01-28T20:00:00Z' },
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

  // ECharts Step-Chart Configuration: Emerald Actual, Coral Forecast Trajectory
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
      grid: { top: 35, right: 25, bottom: 40, left: 65 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        borderColor: '#E4E8EC',
        borderWidth: 1,
        extraCssText: 'box-shadow: 0 12px 32px rgba(23, 32, 42, 0.10); backdrop-filter: blur(18px); border-radius: 10px;',
        textStyle: { color: '#17202A', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const idx = params[0].dataIndex;
          const s = evolution.evolutionSeries[idx];
          return `
            <div style="font-family:'Geist Mono',monospace;">
              <div style="font-weight:600; color:#17202A; margin-bottom:4px;">Published: ${s.publishTime.substring(0, 10)} ${s.publishTime.substring(11, 16)} UTC</div>
              <div style="color:#66717C; font-size:10px;">Lead Horizon: ${s.horizonHours} hours ahead</div>
              <div style="color:#E27D4F; font-weight:700; margin-top:4px;">Forecast: ${s.forecastMW.toLocaleString()} MW</div>
              <div style="color:#8D98A3; font-size:10px;">Revision Delta: ${s.deltaFromPreviousMW > 0 ? '+' : ''}${s.deltaFromPreviousMW.toLocaleString()} MW</div>
              ${s.deltaFromActualMW !== null && s.deltaFromActualMW !== undefined ? `<div style="color:#168F79; font-size:10px; font-weight:600;">Gap to Final Actual: ${s.deltaFromActualMW > 0 ? '+' : ''}${s.deltaFromActualMW.toLocaleString()} MW</div>` : ''}
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: pubs,
        axisLine: { lineStyle: { color: '#E4E8EC' } },
        axisTick: { show: false },
        axisLabel: { color: '#8D98A3', fontSize: 10, fontFamily: 'Geist Mono, monospace' },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#EEF1F4', type: 'dashed' } },
        axisLabel: { color: '#8D98A3', fontSize: 10, formatter: (v: number) => `${(v / 1000).toFixed(0)}k MW` },
      },
      series: [
        {
          name: 'Forecast Trajectory',
          type: 'line',
          step: 'end',
          data: forecasts,
          lineStyle: { color: '#E27D4F', width: 2.2 },
          itemStyle: { color: '#E27D4F' },
          markPoint: activeRun ? {
            symbol: 'pin',
            symbolSize: 32,
            data: [
              {
                coord: [pubs[currentRunIndex], activeRun.forecastMW],
                value: `${activeRun.forecastMW.toLocaleString()} MW`,
                itemStyle: { color: '#E6B84F' },
              }
            ]
          } : undefined,
          markLine: actual !== null && actual !== undefined ? {
            symbol: 'none',
            data: [
              {
                yAxis: actual,
                lineStyle: { color: '#168F79', type: 'dashed', width: 2 },
                label: {
                  formatter: `Actual Outturn (${actual.toLocaleString()} MW)`,
                  position: 'insideStartTop',
                  color: '#168F79',
                  fontSize: 10,
                  fontFamily: 'Geist Mono, monospace',
                  fontWeight: 'bold',
                },
              },
            ],
          } : undefined,
        },
      ],
    };
  }, [evolution, activeRun, currentRunIndex]);

  return (
    <div className="solid-data-surface rounded-2xl p-6 sm:p-7 shadow-glass-md space-y-6">
      {/* Top Header & Presets */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E4E8EC] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <GitCommit className="w-4 h-4 text-[#E27D4F]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#17202A]">
              Forecast Evolution Trajectory (Time-Machine)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-[#E27D4F] border border-[#E4E8EC] shadow-glass-sm font-semibold">
              Multi-Run Convergence
            </span>
          </div>
          <p className="text-xs text-[#66717C] mt-1 font-mono">
            Scrub across consecutive National Grid ESO forecast cycles to observe how estimates converged
          </p>
        </div>

        {/* Delivery Timestamp Preset Selector */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="text-[#8D98A3]">Target Delivery:</span>
          <select
            value={deliveryTime}
            onChange={(e) => {
              setDeliveryTime(e.target.value);
              setActiveCycleIndex(null);
            }}
            className="bg-[#F4F6F8] border border-[#E4E8EC] rounded-lg px-3 py-1.5 text-[#17202A] font-semibold focus:outline-none focus:border-[#E27D4F] cursor-pointer shadow-glass-sm"
          >
            {presets.map((p) => (
              <option key={p.value} value={p.value} className="bg-white text-[#17202A]">
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[320px] flex items-center justify-center text-xs font-mono text-[#8D98A3]">
          Reconstructing publication trajectory from Elexon BMRS...
        </div>
      ) : evolution && evolution.evolutionSeries.length > 0 ? (
        <>
          {/* Interactive Scrubber Control Bar */}
          <div className="glass-panel rounded-xl p-4 border border-white/80 shadow-glass-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono gap-2">
              <div className="flex items-center space-x-2 text-[#17202A] font-semibold">
                <Sliders className="w-3.5 h-3.5 text-[#E27D4F]" />
                <span>Active Model Run: Cycle {currentRunIndex + 1} of {evolution.evolutionSeries.length}</span>
              </div>
              <div className="text-[11px] text-[#66717C] font-mono">
                Published: <strong className="text-[#17202A]">{activeRun?.publishTime.substring(0, 10)} {activeRun?.publishTime.substring(11, 16)} UTC</strong> ({activeRun?.horizonHours}h ahead of delivery)
              </div>
            </div>

            {/* Range Scrubber */}
            <input
              type="range"
              min={0}
              max={evolution.evolutionSeries.length - 1}
              value={currentRunIndex}
              onChange={(e) => setActiveCycleIndex(Number(e.target.value))}
              className="w-full accent-[#E27D4F] h-2 bg-[#EEF1F4] rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[10px] font-mono text-[#8D98A3]">
              <span>Earliest Forecast (Long-Range)</span>
              <span>Gate Closure Commitment</span>
            </div>
          </div>

          {/* Dynamic Scrubber Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-[#F4F6F8] rounded-xl p-4 font-mono text-xs border border-[#E4E8EC]">
            <div>
              <span className="text-[#8D98A3] block text-[10px] uppercase">Final Metered Outturn</span>
              <span className="text-xl font-bold text-[#168F79] tabular-nums">
                {evolution.actualGenerationMW !== null && evolution.actualGenerationMW !== undefined
                  ? `${evolution.actualGenerationMW.toLocaleString()} MW`
                  : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[#8D98A3] block text-[10px] uppercase">Predicted in Active Run</span>
              <motion.span
                key={activeRun?.forecastMW}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-bold text-[#E27D4F] tabular-nums"
              >
                {activeRun?.forecastMW.toLocaleString()} MW
              </motion.span>
            </div>
            <div>
              <span className="text-[#8D98A3] block text-[10px] uppercase">Revision from Prior Run</span>
              <span
                className={`text-xl font-bold tabular-nums ${
                  (activeRun?.deltaFromPreviousMW ?? 0) > 0
                    ? 'text-[#3D9B76]'
                    : (activeRun?.deltaFromPreviousMW ?? 0) < 0
                    ? 'text-[#D95C55]'
                    : 'text-[#66717C]'
                }`}
              >
                {(activeRun?.deltaFromPreviousMW ?? 0) > 0 ? '+' : ''}
                {activeRun?.deltaFromPreviousMW.toLocaleString()} MW
              </span>
            </div>
            <div>
              <span className="text-[#8D98A3] block text-[10px] uppercase">Gap to Final Outturn</span>
              <span className="text-xl font-bold text-[#17202A] tabular-nums">
                {activeRun?.deltaFromActualMW !== null && activeRun?.deltaFromActualMW !== undefined
                  ? `${activeRun.deltaFromActualMW > 0 ? '+' : ''}${activeRun.deltaFromActualMW.toLocaleString()} MW`
                  : 'N/A'}
              </span>
            </div>
          </div>

          {/* ECharts Step Trajectory Chart */}
          <div className="h-[340px] w-full">
            <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
          </div>

          {/* Terminal Audit Table */}
          <div className="border border-[#E4E8EC] rounded-xl overflow-hidden shadow-glass-sm">
            <div className="bg-[#F4F6F8] px-4 py-2.5 border-b border-[#E4E8EC] flex items-center justify-between text-[11px] font-mono">
              <span className="font-semibold text-[#17202A] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#E27D4F]" />
                Full Publication Revision History
              </span>
              <span className="text-[#8D98A3]">{evolution.revisionCount} model cycles</span>
            </div>
            <div className="max-h-52 overflow-y-auto font-mono text-xs">
              <table className="w-full text-left">
                <thead className="bg-white text-[#8D98A3] sticky top-0 border-b border-[#E4E8EC]">
                  <tr>
                    <th className="py-2.5 px-3.5 text-[10px] uppercase">Publish Time (UTC)</th>
                    <th className="py-2.5 px-3.5 text-[10px] uppercase">Lead Time</th>
                    <th className="py-2.5 px-3.5 text-[10px] uppercase text-right">Predicted MW</th>
                    <th className="py-2.5 px-3.5 text-[10px] uppercase text-right">Revision Δ</th>
                    <th className="py-2.5 px-3.5 text-[10px] uppercase text-right">Gap to Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E8EC] text-[#66717C]">
                  {evolution.evolutionSeries.map((rev, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setActiveCycleIndex(idx)}
                      className={`cursor-pointer transition-colors ${
                        idx === currentRunIndex ? 'bg-[#E27D4F]/10 font-medium' : 'hover:bg-[#F4F6F8]'
                      }`}
                    >
                      <td className="py-2 px-3.5 text-[#17202A]">
                        {rev.publishTime.substring(0, 10)} {rev.publishTime.substring(11, 16)}
                      </td>
                      <td className="py-2 px-3.5 text-[#8D98A3]">{rev.horizonHours}h ahead</td>
                      <td className="py-2 px-3.5 text-right text-[#E27D4F] font-semibold tabular-nums">
                        {rev.forecastMW.toLocaleString()} MW
                      </td>
                      <td className="py-2 px-3.5 text-right tabular-nums">
                        <span
                          className={
                            rev.deltaFromPreviousMW > 0
                              ? 'text-[#3D9B76]'
                              : rev.deltaFromPreviousMW < 0
                              ? 'text-[#D95C55]'
                              : 'text-[#8D98A3]'
                          }
                        >
                          {rev.deltaFromPreviousMW > 0 ? '+' : ''}
                          {rev.deltaFromPreviousMW.toLocaleString()} MW
                        </span>
                      </td>
                      <td className="py-2 px-3.5 text-right text-[#66717C] tabular-nums">
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
        <div className="h-[200px] flex items-center justify-center text-xs font-mono text-[#8D98A3]">
          No forecast history records found for this timestamp.
        </div>
      )}
    </div>
  );
};
