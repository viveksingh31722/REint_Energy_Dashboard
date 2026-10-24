import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { motion } from 'motion/react';
import { TimeSeriesPoint } from '../../types';
import { Activity, Zap, ZoomIn, Calendar } from 'lucide-react';

interface HeroChartProps {
  series: TimeSeriesPoint[];
  onSelectPeriod?: (deliveryTime: string) => void;
}

export const ForecastHeroChart: React.FC<HeroChartProps> = ({ series, onSelectPeriod }) => {
  const [rangeFilter, setRangeFilter] = useState<'ALL' | 'W1' | 'W2' | 'W3' | 'W4' | 'STORM'>('ALL');

  // Filter series based on selected preset
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

  // Prepare arrays for ECharts
  const timeLabels = useMemo(
    () =>
      filteredData.map((d) => {
        // e.g. "2026-01-15T18:00:00Z" -> "15 Jan 18:00"
        const day = d.deliveryTime.substring(8, 10);
        const time = d.deliveryTime.substring(11, 16);
        return `${day} Jan ${time}`;
      }),
    [filteredData]
  );

  const actualValues = useMemo(() => filteredData.map((d) => d.actualGenerationMW), [filteredData]);
  const forecastValues = useMemo(
    () => filteredData.map((d) => (d.forecastGenerationMW !== undefined ? d.forecastGenerationMW : null)),
    [filteredData]
  );

  // ECharts Option Configuration
  const option = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 600,
      animationEasing: 'cubicOut',
      grid: {
        top: 40,
        right: 25,
        bottom: 65,
        left: 65,
        containLabel: false,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          lineStyle: {
            color: 'rgba(0, 229, 255, 0.4)',
            width: 1,
            type: 'dashed',
          },
          crossStyle: {
            color: 'rgba(255, 255, 255, 0.2)',
          },
        },
        backgroundColor: 'rgba(8, 11, 16, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: '#E2E8F0',
          fontSize: 12,
          fontFamily: 'Geist Mono, JetBrains Mono, monospace',
        },
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const idx = params[0].dataIndex;
          const record = filteredData[idx];
          if (!record) return '';

          const actual = record.actualGenerationMW?.toLocaleString() ?? 'N/A';
          const forecast = record.forecastGenerationMW?.toLocaleString() ?? 'N/A';
          const error = record.errorMW ?? 0;
          const absError = record.absoluteErrorMW?.toLocaleString() ?? 'N/A';
          const isOver = error < 0;
          const errorSign = error > 0 ? '+' : '';
          const horizon = record.forecastHorizonHours ? `${record.forecastHorizonHours}h` : 'N/A';

          return `
            <div style="font-family: 'Geist Mono', monospace; min-width: 210px;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px; margin-bottom: 8px;">
                <span style="font-weight: 600; color: #FFFFFF; font-size: 11px;">${record.settlementDate} · ${record.deliveryTime.substring(11, 16)} GMT</span>
                <span style="background: rgba(255,255,255,0.08); color: #94A3B8; padding: 1px 5px; border-radius: 3px; font-size: 10px;">SP ${record.settlementPeriod}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #00E5FF; display: flex; align-items: center; gap: 4px;">
                  <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#00E5FF;"></span>
                  Actual Outturn:
                </span>
                <span style="font-weight: 700; color: #FFFFFF;">${actual} MW</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="color: #A78BFA; display: flex; align-items: center; gap: 4px;">
                  <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#A78BFA;"></span>
                  DA Forecast:
                </span>
                <span style="font-weight: 700; color: #FFFFFF;">${forecast} MW</span>
              </div>
              <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px; display: flex; justify-content: space-between;">
                <span style="color: #94A3B8; font-size: 11px;">Signed Error:</span>
                <span style="font-weight: 700; color: ${isOver ? '#FB7185' : '#34D399'};">
                  ${errorSign}${error.toLocaleString()} MW
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 2px;">
                <span style="color: #64748B;">Absolute Deviation:</span>
                <span style="color: #CBD5E1;">±${absError} MW</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 2px;">
                <span style="color: #64748B;">Lead Time Horizon:</span>
                <span style="color: #94A3B8;">${horizon}</span>
              </div>
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.08); text-align: center; font-size: 10px; color: #00E5FF;">
                Click to inspect evolution trajectory →
              </div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: timeLabels,
        boundaryGap: false,
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
          fontFamily: 'Geist Mono, monospace',
          interval: Math.floor(timeLabels.length / 8),
        },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.04)',
            type: 'dashed',
          },
        },
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
          fontFamily: 'Geist Mono, monospace',
          formatter: (value: number) => `${(value / 1000).toFixed(0)}k MW`,
        },
      },
      dataZoom: [
        {
          type: 'slider',
          show: true,
          xAxisIndex: 0,
          bottom: 12,
          height: 20,
          borderColor: 'transparent',
          backgroundColor: '#0A0E17',
          fillerColor: 'rgba(0, 229, 255, 0.12)',
          handleStyle: {
            color: '#00E5FF',
            borderColor: '#00E5FF',
            borderWidth: 1,
            shadowBlur: 4,
            shadowColor: 'rgba(0, 229, 255, 0.4)',
          },
          moveHandleStyle: {
            color: 'rgba(255, 255, 255, 0.2)',
          },
          textStyle: {
            color: '#64748B',
            fontSize: 9,
            fontFamily: 'Geist Mono, monospace',
          },
        },
        {
          type: 'inside',
          xAxisIndex: 0,
          zoomOnMouseWheel: 'ctrl',
        },
      ],
      series: [
        {
          name: 'Actual Wind Outturn',
          type: 'line',
          smooth: 0.25,
          showSymbol: false,
          data: actualValues,
          lineStyle: {
            width: 2.5,
            color: '#00E5FF',
            shadowColor: 'rgba(0, 229, 255, 0.35)',
            shadowBlur: 8,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 229, 255, 0.22)' },
              { offset: 0.6, color: 'rgba(0, 229, 255, 0.04)' },
              { offset: 1, color: 'rgba(0, 229, 255, 0.0)' },
            ]),
          },
        },
        {
          name: 'Day-Ahead Forecast',
          type: 'line',
          smooth: 0.25,
          showSymbol: false,
          data: forecastValues,
          lineStyle: {
            width: 2,
            color: '#A78BFA',
            type: [5, 4],
            shadowColor: 'rgba(167, 139, 250, 0.3)',
            shadowBlur: 6,
          },
        },
      ],
    };
  }, [timeLabels, actualValues, forecastValues, filteredData]);

  const onChartClick = (params: any) => {
    if (params && params.dataIndex !== undefined && onSelectPeriod) {
      const record = filteredData[params.dataIndex];
      if (record) {
        onSelectPeriod(record.deliveryTime);
      }
    }
  };

  const rangeButtons = [
    { id: 'ALL', label: 'Entire Month' },
    { id: 'W1', label: 'Week 1' },
    { id: 'W2', label: 'Week 2' },
    { id: 'W3', label: 'Week 3' },
    { id: 'W4', label: 'Week 4' },
    { id: 'STORM', label: 'Storm Peak (14–17 Jan)' },
  ] as const;

  return (
    <div className="border border-white/[0.08] bg-[#0E131F]/90 rounded-lg p-5 backdrop-blur-md shadow-2xl relative">
      {/* Chart Top Header & Modern Range Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#00E5FF]" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
              Actual Generation Outturn vs. Day-Ahead Forecast
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
              ECharts Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            30-minute metered transmission grid feed vs. D-1 wholesale commitment profile
          </p>
        </div>

        {/* Segmented Range Selectors with Shared Motion Pill */}
        <div className="flex items-center space-x-1 bg-[#090D16] border border-white/[0.06] rounded p-1 text-xs font-mono">
          {rangeButtons.map((btn) => {
            const isSelected = rangeFilter === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => setRangeFilter(btn.id)}
                className={`relative px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  isSelected ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="relative z-10">{btn.label}</span>
                {isSelected && (
                  <motion.div
                    layoutId="activeRangePill"
                    className="absolute inset-0 bg-[#1C2538] border border-white/[0.1] rounded shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main ECharts Canvas Surface */}
      <div className="w-full h-[440px]">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          onEvents={{ click: onChartClick }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>

      {/* Chart Legend & Tips Footnote */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] font-mono text-slate-400 pt-3 border-t border-white/[0.04] mt-2 gap-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1 rounded bg-[#00E5FF] inline-block shadow-[0_0_6px_rgba(0,229,255,0.8)]" />
            <span className="text-slate-300">Actual Outturn (FUELHH)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-[#A78BFA] inline-block" />
            <span className="text-slate-300">Day-Ahead Forecast (WINDFOR D-1)</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-slate-400">
          <span>{filteredData.length} Settlement Records</span>
          <span className="text-white/20">|</span>
          <span>Click any point to inspect evolution</span>
        </div>
      </div>
    </div>
  );
};
