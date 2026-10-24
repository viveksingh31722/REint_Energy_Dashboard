import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import { motion } from 'motion/react';
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
        backgroundColor: '#111514',
        borderColor: '#252C29',
        borderWidth: 1,
        textStyle: { color: '#F1F4F1', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const idx = params[0].dataIndex;
          const s = evolution.evolutionSeries[idx];
          return `
            <div style="font-family:'Geist Mono',monospace;">
              <div style="font-weight:600; color:#F1F4F1; margin-bottom:4px;">Published: ${s.publishTime.substring(0, 10)} ${s.publishTime.substring(11, 16)} UTC</div>
              <div style="color:#8B9691; font-size:10px;">Lead Horizon: ${s.horizonHours} hours ahead</div>
              <div style="color:#E58A5C; font-weight:700; margin-top:3px;">Forecast: ${s.forecastMW.toLocaleString()} MW</div>
              <div style="color:#5F6A65; font-size:10px;">Revision Delta: ${s.deltaFromPreviousMW > 0 ? '+' : ''}${s.deltaFromPreviousMW.toLocaleString()} MW</div>
              ${s.deltaFromActualMW !== null && s.deltaFromActualMW !== undefined ? `<div style="color:#35B89A; font-size:10px; font-weight:600;">Gap to Final Actual: ${s.deltaFromActualMW > 0 ? '+' : ''}${s.deltaFromActualMW.toLocaleString()} MW</div>` : ''}
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: pubs,
        axisLine: { lineStyle: { color: '#252C29' } },
        axisTick: { show: false },
        axisLabel: { color: '#5F6A65', fontSize: 10, fontFamily: 'Geist Mono, monospace' },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1A201E', type: 'dashed' } },
        axisLabel: { color: '#5F6A65', fontSize: 10, formatter: (v: number) => `${(v / 1000).toFixed(0)}k MW` },
      },
      series: [
        {
          name: 'Forecast Trajectory',
          type: 'line',
          step: 'end',
          data: forecasts,
          lineStyle: { color: '#E58A5C', width: 2 },
          itemStyle: { color: '#E58A5C' },
          markPoint: activeRun ? {
            symbol: 'pin',
            symbolSize: 30,
            data: [
              {
                coord: [pubs[currentRunIndex], activeRun.forecastMW],
                value: `${activeRun.forecastMW.toLocaleString()} MW`,
                itemStyle: { color: '#D7B35A' },
              }
            ]
          } : undefined,
          markLine: actual !== null && actual !== undefined ? {
            symbol: 'none',
            data: [
              {
                yAxis: actual,
                lineStyle: { color: '#35B89A', type: 'dashed', width: 2 },
                label: {
                  formatter: `Actual Metered (${actual.toLocaleString()} MW)`,
                  position: 'insideStartTop',
                  color: '#35B89A',
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
    <div className="dark-card p-6 space-y-6">
      {/* Top Header & Delivery Period Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#252C29] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E58A5C]" />
            <h3 className="text-xs font-semibold tracking-wider uppercase text-[#F1F4F1]">
              Forecast Evolution Timeline
            </h3>
            <span className="text-[#252C29]">·</span>
            <span className="text-xs text-[#8B9691]">Time-Machine Scrubber</span>
          </div>
          <p className="text-xs text-[#5F6A65] mt-0.5">
            Track how rolling National Grid ESO weather updates converged before final gate closure
          </p>
        </div>

        {/* Target Delivery Selector */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[#8B9691]">Target Delivery:</span>
          <select
            value={deliveryTime}
            onChange={(e) => {
              setDeliveryTime(e.target.value);
              setActiveCycleIndex(null);
            }}
            className="bg-[#080A0A] border border-[#252C29] rounded-md px-2.5 py-1 text-[#F1F4F1] font-medium focus:outline-none cursor-pointer"
          >
            {presets.map((p) => (
              <option key={p.value} value={p.value} className="bg-[#111514]">
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[280px] flex items-center justify-center text-xs font-mono text-[#5F6A65]">
          Reconstructing publication trajectory from Elexon BMRS...
        </div>
      ) : evolution && evolution.evolutionSeries.length > 0 ? (
        <>
          {/* Timeline Stages: D-2 -> D-1 -> Gate Closure -> Delivery */}
          <div className="flex items-center justify-between text-xs text-[#8B9691] border-b border-[#252C29] pb-3">
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-[#F1F4F1]">D-2 Long Range</span>
              <span className="text-[11px] text-[#5F6A65]">(48h–72h)</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#252C29]" />
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-[#F1F4F1]">D-1 Day-Ahead</span>
              <span className="text-[11px] text-[#5F6A65]">(24h–36h)</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#252C29]" />
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-[#E58A5C]">Gate Closure</span>
              <span className="text-[11px] text-[#5F6A65]">(12:00 UTC)</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#252C29]" />
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-[#35B89A]">Metered Outturn</span>
              <span className="text-[11px] text-[#5F6A65]">(Actual)</span>
            </div>
          </div>

          {/* Interactive Timeline Scrubber Control */}
          <div className="bg-[#080A0A] rounded-lg p-4 border border-[#252C29] space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
              <div className="flex items-center space-x-2 text-[#F1F4F1] font-semibold">
                <Sliders className="w-3.5 h-3.5 text-[#E58A5C]" />
                <span>Publication Run: Cycle {currentRunIndex + 1} of {evolution.evolutionSeries.length}</span>
              </div>
              <div className="text-[11px] text-[#8B9691]">
                Published: <strong className="text-[#F1F4F1]">{activeRun?.publishTime.substring(0, 10)} {activeRun?.publishTime.substring(11, 16)} UTC</strong> ({activeRun?.horizonHours}h ahead of delivery)
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={0}
              max={evolution.evolutionSeries.length - 1}
              value={currentRunIndex}
              onChange={(e) => setActiveCycleIndex(Number(e.target.value))}
              className="w-full accent-[#E58A5C] h-2 bg-[#111514] rounded-lg cursor-pointer"
            />
          </div>

          {/* Dynamic Scrubber Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-2 border-b border-[#252C29]">
            <div>
              <span className="text-[11px] font-medium uppercase text-[#5F6A65] block">Final Metered Outturn</span>
              <span className="text-2xl font-mono font-bold text-[#35B89A] tabular-nums mt-1 block">
                {evolution.actualGenerationMW !== null && evolution.actualGenerationMW !== undefined
                  ? `${evolution.actualGenerationMW.toLocaleString()} MW`
                  : '—'}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium uppercase text-[#5F6A65] block">Predicted in Active Run</span>
              <motion.span
                key={activeRun?.forecastMW}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="text-2xl font-mono font-bold text-[#E58A5C] tabular-nums mt-1 block"
              >
                {activeRun?.forecastMW.toLocaleString()} MW
              </motion.span>
            </div>
            <div>
              <span className="text-[11px] font-medium uppercase text-[#5F6A65] block">Revision from Prior Run</span>
              <span
                className={`text-2xl font-mono font-bold tabular-nums mt-1 block ${
                  (activeRun?.deltaFromPreviousMW ?? 0) > 0
                    ? 'text-[#35B89A]'
                    : (activeRun?.deltaFromPreviousMW ?? 0) < 0
                    ? 'text-[#E0645A]'
                    : 'text-[#8B9691]'
                }`}
              >
                {(activeRun?.deltaFromPreviousMW ?? 0) > 0 ? '+' : ''}
                {activeRun?.deltaFromPreviousMW.toLocaleString()} MW
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium uppercase text-[#5F6A65] block">Gap to Final Outturn</span>
              <span className="text-2xl font-mono font-bold text-[#F1F4F1] tabular-nums mt-1 block">
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
          <div className="border border-[#252C29] rounded-lg overflow-hidden">
            <div className="bg-[#080A0A] px-4 py-2 border-b border-[#252C29] flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F1F4F1] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#E58A5C]" />
                Complete Publication Revision Audit
              </span>
              <span className="text-[#5F6A65]">{evolution.revisionCount} cycles</span>
            </div>
            <div className="max-h-48 overflow-y-auto font-mono text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#111514] text-[#5F6A65] sticky top-0 border-b border-[#252C29]">
                  <tr>
                    <th className="py-2 px-3 text-[10px] uppercase">Publish Time (UTC)</th>
                    <th className="py-2 px-3 text-[10px] uppercase">Lead Time</th>
                    <th className="py-2 px-3 text-[10px] uppercase text-right">Predicted MW</th>
                    <th className="py-2 px-3 text-[10px] uppercase text-right">Revision Δ</th>
                    <th className="py-2 px-3 text-[10px] uppercase text-right">Gap to Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2220] text-[#8B9691]">
                  {evolution.evolutionSeries.map((rev, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setActiveCycleIndex(idx)}
                      className={`cursor-pointer transition-colors ${
                        idx === currentRunIndex ? 'bg-[#151A18] text-[#F1F4F1] font-semibold' : 'hover:bg-[#151A18]/60'
                      }`}
                    >
                      <td className="py-2 px-3 text-[#F1F4F1]">
                        {rev.publishTime.substring(0, 10)} {rev.publishTime.substring(11, 16)}
                      </td>
                      <td className="py-2 px-3 text-[#5F6A65]">{rev.horizonHours}h ahead</td>
                      <td className="py-2 px-3 text-right text-[#E58A5C] font-semibold tabular-nums">
                        {rev.forecastMW.toLocaleString()} MW
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        <span
                          className={
                            rev.deltaFromPreviousMW > 0
                              ? 'text-[#35B89A]'
                              : rev.deltaFromPreviousMW < 0
                              ? 'text-[#E0645A]'
                              : 'text-[#5F6A65]'
                          }
                        >
                          {rev.deltaFromPreviousMW > 0 ? '+' : ''}
                          {rev.deltaFromPreviousMW.toLocaleString()} MW
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-[#8B9691] tabular-nums">
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
        <div className="h-[200px] flex items-center justify-center text-xs font-mono text-[#5F6A65]">
          No forecast history records found for this timestamp.
        </div>
      )}
    </div>
  );
};
