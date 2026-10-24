import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import { motion } from 'motion/react';
import { api } from '../../services/api';

interface ForecastEvolutionTimelineProps {
  initialDeliveryTime?: string;
}

export const ForecastEvolutionTimeline: React.FC<ForecastEvolutionTimelineProps> = ({
  initialDeliveryTime = '2026-01-15T18:00:00Z',
}) => {
  const [deliveryTime, setDeliveryTime] = useState<string>(initialDeliveryTime);
  const [selectedHorizon, setSelectedHorizon] = useState<number | null>(null);

  const { data: evolution, isLoading } = useQuery({
    queryKey: ['evolution', deliveryTime],
    queryFn: () => api.getEvolution(deliveryTime),
    enabled: !!deliveryTime,
  });

  const presets = [
    { label: '15 Jan · 18:00 GMT (Storm Peak)', value: '2026-01-15T18:00:00Z' },
    { label: '01 Jan · 00:00 GMT (New Year SP 1)', value: '2026-01-01T00:00:00Z' },
    { label: '10 Jan · 12:00 GMT (Mid-Month Noon)', value: '2026-01-10T12:00:00Z' },
    { label: '20 Jan · 08:00 GMT (Morning Ramp)', value: '2026-01-20T08:00:00Z' },
    { label: '28 Jan · 20:00 GMT (Late Month Gale)', value: '2026-01-28T20:00:00Z' },
  ];

  const milestones = [
    { label: 'D-48', hours: 48 },
    { label: 'D-24', hours: 24 },
    { label: 'D-12', hours: 12 },
    { label: 'D-6', hours: 6 },
    { label: 'D-1', hours: 18 },
    { label: 'GATE', hours: 1 },
  ];

  // Active run calculation
  const activeRun = useMemo(() => {
    if (!evolution || !evolution.evolutionSeries.length) return null;
    if (selectedHorizon !== null) {
      // Find closest run
      return evolution.evolutionSeries.reduce((prev, curr) =>
        Math.abs(curr.horizonHours - selectedHorizon) < Math.abs(prev.horizonHours - selectedHorizon)
          ? curr
          : prev
      );
    }
    return evolution.evolutionSeries[evolution.evolutionSeries.length - 1];
  }, [evolution, selectedHorizon]);

  // ECharts Step-Chart Options
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
      grid: { top: 20, right: 15, bottom: 25, left: 45 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#111514',
        borderColor: '#252C29',
        textStyle: { color: '#F1F4F1', fontFamily: 'Geist Mono, monospace', fontSize: 11 },
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const idx = params[0].dataIndex;
          const s = evolution.evolutionSeries[idx];
          return `
            <div style="font-family:'Geist Mono',monospace;">
              <div style="color:#8B9691; font-size:10px;">${s.publishTime.substring(0, 10)} ${s.publishTime.substring(11, 16)} UTC (${s.horizonHours}h ahead)</div>
              <div style="color:#E58A5C; font-weight:700; margin-top:2px;">Forecast: ${s.forecastMW.toLocaleString()} MW</div>
              ${s.deltaFromActualMW !== null && s.deltaFromActualMW !== undefined ? `<div style="color:#35B89A; font-size:10px;">Delta to Actual: ${s.deltaFromActualMW > 0 ? '+' : ''}${s.deltaFromActualMW.toLocaleString()} MW</div>` : ''}
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: pubs,
        axisLine: { lineStyle: { color: '#252C29' } },
        axisTick: { show: false },
        axisLabel: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#1A201E', type: 'dashed' } },
        axisLabel: { color: '#5F6A65', fontSize: 9, formatter: (v: number) => `${(v / 1000).toFixed(0)}k` },
      },
      series: [
        {
          name: 'Forecast Trajectory',
          type: 'line',
          step: 'end',
          data: forecasts,
          lineStyle: { color: '#E58A5C', width: 2 },
          itemStyle: { color: '#E58A5C' },
          markLine: actual !== null && actual !== undefined ? {
            symbol: 'none',
            data: [
              {
                yAxis: actual,
                lineStyle: { color: '#35B89A', type: 'dashed', width: 1.5 },
                label: {
                  formatter: `Actual: ${actual.toLocaleString()} MW`,
                  position: 'insideStartTop',
                  color: '#35B89A',
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
    <div className="dark-card p-5 h-full flex flex-col justify-between space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#252C29] pb-3">
        <div>
          <h3 className="text-xs font-semibold tracking-wider uppercase text-[#F1F4F1]">
            Forecast Evolution
          </h3>
          <p className="text-[11px] text-[#5F6A65] mt-0.5">
            Model convergence across horizon publication cycles
          </p>
        </div>

        {/* Target Delivery Selector */}
        <select
          value={deliveryTime}
          onChange={(e) => {
            setDeliveryTime(e.target.value);
            setSelectedHorizon(null);
          }}
          className="bg-[#080A0A] border border-[#252C29] rounded-md px-2 py-1 text-xs text-[#F1F4F1] focus:outline-none cursor-pointer"
        >
          {presets.map((p) => (
            <option key={p.value} value={p.value} className="bg-[#111514]">
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Horizontal Timeline Stages */}
      <div className="flex items-center justify-between bg-[#080A0A] border border-[#252C29] rounded-lg p-1 text-xs font-mono">
        {milestones.map((m) => {
          const isSelected = selectedHorizon === m.hours;
          return (
            <button
              key={m.label}
              onClick={() => setSelectedHorizon(m.hours)}
              className={`flex-1 py-1 rounded text-center transition-all ${
                isSelected
                  ? 'bg-[#151A18] text-[#E58A5C] font-bold border border-[#252C29]'
                  : 'text-[#8B9691] hover:text-[#F1F4F1]'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Dynamic Evolution KPIs */}
      <div className="grid grid-cols-3 gap-3 text-xs font-mono">
        <div>
          <span className="text-[10px] text-[#5F6A65] block uppercase">Selected Forecast</span>
          <motion.span
            key={activeRun?.forecastMW}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-bold text-[#E58A5C] tabular-nums"
          >
            {activeRun?.forecastMW?.toLocaleString() ?? '—'} MW
          </motion.span>
        </div>

        <div>
          <span className="text-[10px] text-[#5F6A65] block uppercase">Final Actual</span>
          <span className="text-lg font-bold text-[#35B89A] tabular-nums">
            {evolution?.actualGenerationMW?.toLocaleString() ?? '—'} MW
          </span>
        </div>

        <div>
          <span className="text-[10px] text-[#5F6A65] block uppercase">Convergence Gap</span>
          <span className="text-lg font-bold text-[#F1F4F1] tabular-nums">
            {activeRun?.deltaFromActualMW !== null && activeRun?.deltaFromActualMW !== undefined
              ? `${activeRun.deltaFromActualMW > 0 ? '+' : ''}${activeRun.deltaFromActualMW.toLocaleString()} MW`
              : '—'}
          </span>
        </div>
      </div>

      {/* Step Chart */}
      <div className="h-44 w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-xs font-mono text-[#5F6A65]">
            Reconstructing trajectory...
          </div>
        ) : (
          <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
        )}
      </div>
    </div>
  );
};
