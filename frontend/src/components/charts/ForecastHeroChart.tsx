import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { motion } from 'motion/react';
import { TimeSeriesPoint } from '../../types';

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

  // Uncertainty Corridor (±1,850 MW standard uncertainty)
  const uncertaintyLower = useMemo(
    () =>
      filteredData.map((d) => {
        if (d.forecastGenerationMW === undefined || d.forecastGenerationMW === null) return null;
        return Math.max(0, Math.round(d.forecastGenerationMW - 1850));
      }),
    [filteredData]
  );

  const uncertaintyBandHeight = useMemo(
    () =>
      filteredData.map((d) => {
        if (d.forecastGenerationMW === undefined || d.forecastGenerationMW === null) return null;
        const lower = Math.max(0, Math.round(d.forecastGenerationMW - 1850));
        const upper = Math.round(d.forecastGenerationMW + 1850);
        return upper - lower;
      }),
    [filteredData]
  );

  // Severe Error Callouts: Only for statistically significant misses (|Error| >= 3,200 MW)
  const severeErrorMarkPoints = useMemo(() => {
    const points: any[] = [];
    filteredData.forEach((d, idx) => {
      if (d.absoluteErrorMW && d.absoluteErrorMW >= 3200) {
        if (idx % 4 === 0) {
          points.push({
            name: 'Significant Miss',
            coord: [timeLabels[idx], d.actualGenerationMW],
            value: `${Math.round(d.absoluteErrorMW).toLocaleString()} MW`,
            itemStyle: { color: '#C84B4B' },
          });
        }
      }
    });
    return points;
  }, [filteredData, timeLabels]);

  // ECharts Option: Financial Market Terminal Architecture
  const option = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 400,
      animationEasing: 'cubicOut',
      grid: {
        top: 24,
        right: 20,
        bottom: 50,
        left: 55,
        containLabel: false,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          lineStyle: {
            color: 'rgba(201, 106, 61, 0.45)',
            width: 1,
            type: 'dashed',
          },
          crossStyle: {
            color: 'rgba(104, 115, 112, 0.25)',
          },
        },
        // Floating glass panel tooltip
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#DCE3E0',
        borderWidth: 1,
        extraCssText: 'box-shadow: 0 8px 24px rgba(24, 32, 31, 0.08); backdrop-filter: blur(16px); border-radius: 8px;',
        padding: [10, 14],
        textStyle: {
          color: '#18201F',
          fontSize: 12,
          fontFamily: 'Geist Mono, JetBrains Mono, monospace',
        },
        formatter: (params: any) => {
          if (!params || !params.length) return '';
          const idx = params[0].dataIndex;
          const record = filteredData[idx];
          if (!record) return '';

          const actual = record.actualGenerationMW?.toLocaleString() ?? '—';
          const forecast = record.forecastGenerationMW?.toLocaleString() ?? '—';
          const error = record.errorMW ?? 0;
          const absError = record.absoluteErrorMW?.toLocaleString() ?? '—';
          const isSignificant = Math.abs(error) >= 2800;
          const errorSign = error > 0 ? '+' : '';
          const horizon = record.forecastHorizonHours ? `${record.forecastHorizonHours}h` : '—';
          const time = record.deliveryTime.substring(11, 16);

          return `
            <div style="font-family: 'Geist Mono', monospace; min-width: 200px;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #DCE3E0; padding-bottom: 5px; margin-bottom: 6px;">
                <span style="font-weight: 600; color: #18201F; font-size: 11px;">${time} · SP ${record.settlementPeriod}</span>
                <span style="color: #8B9692; font-size: 10px;">${record.settlementDate}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                <span style="color: #087F6A; font-weight: 500; font-size: 11px;">ACTUAL</span>
                <span style="font-weight: 700; color: #18201F;">${actual} MW</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="color: #C96A3D; font-weight: 500; font-size: 11px;">DAY-AHEAD</span>
                <span style="font-weight: 700; color: #18201F;">${forecast} MW</span>
              </div>
              <div style="border-top: 1px solid #E8EDEA; padding-top: 5px; display: flex; justify-content: space-between; font-size: 11px;">
                <span style="color: #687370;">ERROR</span>
                <span style="font-weight: 700; color: ${isSignificant ? '#C84B4B' : error < 0 ? '#C96A3D' : '#087F6A'};">
                  ${errorSign}${error.toLocaleString()} MW
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 2px;">
                <span style="color: #8B9692;">ABS ERROR</span>
                <span style="color: #18201F;">±${absError} MW</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 2px;">
                <span style="color: #8B9692;">HORIZON</span>
                <span style="color: #687370;">${horizon}</span>
              </div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: timeLabels,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#DCE3E0' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#8B9692',
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
            color: '#E8EDEA',
            type: 'dashed',
          },
        },
        axisLabel: {
          color: '#8B9692',
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
          bottom: 6,
          height: 16,
          borderColor: 'transparent',
          backgroundColor: '#EEF2F1',
          fillerColor: 'rgba(201, 106, 61, 0.14)',
          handleStyle: {
            color: '#C96A3D',
            borderColor: '#FFFFFF',
            borderWidth: 1,
          },
          moveHandleStyle: {
            color: '#CBD5D2',
          },
          textStyle: {
            color: '#8B9692',
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
        // 1. Uncertainty Confidence Corridor (Ochre @ 10% opacity)
        {
          name: 'Uncertainty Lower Base',
          type: 'line',
          stack: 'uncertainty',
          symbol: 'none',
          lineStyle: { opacity: 0 },
          data: uncertaintyLower,
          silent: true,
        },
        {
          name: 'Uncertainty Corridor',
          type: 'line',
          stack: 'uncertainty',
          symbol: 'none',
          data: uncertaintyBandHeight,
          lineStyle: {
            color: 'rgba(213, 168, 62, 0.35)',
            width: 1,
            type: 'dashed',
          },
          areaStyle: {
            color: 'rgba(213, 168, 62, 0.09)',
          },
          silent: true,
        },

        // 2. Actual Wind Generation (Emerald #087F6A)
        {
          name: 'Actual Generation',
          type: 'line',
          smooth: 0.25,
          showSymbol: false,
          data: actualValues,
          lineStyle: {
            width: 2.2,
            color: '#087F6A',
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(8, 127, 106, 0.08)' },
              { offset: 0.8, color: 'rgba(8, 127, 106, 0.01)' },
              { offset: 1, color: 'transparent' },
            ]),
          },
          emphasis: {
            lineStyle: {
              width: 3.0,
            },
          },
          markPoint: {
            symbol: 'circle',
            symbolSize: 6,
            label: { show: false },
            data: severeErrorMarkPoints,
          },
        },

        // 3. Day-Ahead Forecast (Terracotta #C96A3D)
        {
          name: 'Day-Ahead Forecast',
          type: 'line',
          smooth: 0.25,
          showSymbol: false,
          data: forecastValues,
          lineStyle: {
            width: 1.8,
            color: '#C96A3D',
            type: [5, 4],
          },
          emphasis: {
            lineStyle: {
              width: 2.5,
            },
          },
        },
      ],
    };
  }, [timeLabels, actualValues, forecastValues, uncertaintyLower, uncertaintyBandHeight, severeErrorMarkPoints, filteredData]);

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
    { id: 'STORM', label: 'Storm Peak' },
  ] as const;

  return (
    <div className="terminal-surface rounded-xl p-6 shadow-terminal-sm">
      {/* Top Header & Range Segmented Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xs font-semibold tracking-wider uppercase text-[#18201F]">
            Actual vs Day-Ahead Forecast
          </h2>
          <p className="text-xs text-[#8B9692] mt-0.5">
            30-minute UK wind generation · January 2026
          </p>
        </div>

        {/* Subtle Segmented Selector */}
        <div className="flex items-center space-x-0.5 bg-[#EEF2F1] rounded-lg p-0.5 border border-[#DCE3E0] text-xs">
          {rangeButtons.map((btn) => {
            const isSelected = rangeFilter === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => setRangeFilter(btn.id)}
                className={`relative px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  isSelected ? 'text-[#18201F] font-semibold' : 'text-[#687370] hover:text-[#18201F]'
                }`}
              >
                <span className="relative z-10">{btn.label}</span>
                {isSelected && (
                  <motion.div
                    layoutId="activeRangePill"
                    className="absolute inset-0 bg-white rounded-md shadow-terminal-sm border border-[#DCE3E0]/70"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main ECharts Canvas Surface (Dominant 500px vertical space) */}
      <div className="w-full h-[500px]">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          onEvents={{ click: onChartClick }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>

      {/* Minimal Bottom Legend (No Implementation Jargon) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#687370] pt-3 border-t border-[#DCE3E0] mt-1 gap-2">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-1 rounded-xs bg-[#087F6A] inline-block" />
            <span className="text-[#18201F] font-medium">Actual</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-0.5 border-t-2 border-dashed border-[#C96A3D] inline-block" />
            <span className="text-[#18201F] font-medium">Day-Ahead Forecast</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-1.5 rounded-xs bg-[#D5A83E]/25 border border-[#D5A83E] inline-block" />
            <span>Uncertainty Corridor</span>
          </div>
        </div>

        <div className="text-[11px] text-[#8B9692]">
          <span>{filteredData.length} Settlement Records · Click any point to open evolution</span>
        </div>
      </div>
    </div>
  );
};
