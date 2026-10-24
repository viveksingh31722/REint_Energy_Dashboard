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

  // Uncertainty Corridor (±1,850 MW around forecast)
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

  // Significant Error Markers only (|Error| >= 3,200 MW)
  const significantErrorMarkPoints = useMemo(() => {
    const points: any[] = [];
    filteredData.forEach((d, idx) => {
      if (d.absoluteErrorMW && d.absoluteErrorMW >= 3200) {
        if (idx % 4 === 0) {
          points.push({
            name: 'Significant Miss',
            coord: [timeLabels[idx], d.actualGenerationMW],
            value: `${Math.round(d.absoluteErrorMW).toLocaleString()} MW`,
            itemStyle: { color: '#E0645A' },
          });
        }
      }
    });
    return points;
  }, [filteredData, timeLabels]);

  // ECharts Option: Financial Energy Terminal
  const option = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 400,
      animationEasing: 'cubicOut',
      grid: {
        top: 24,
        right: 18,
        bottom: 48,
        left: 55,
        containLabel: false,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          lineStyle: {
            color: 'rgba(229, 138, 92, 0.45)',
            width: 1,
            type: 'dashed',
          },
          crossStyle: {
            color: 'rgba(139, 150, 145, 0.25)',
          },
        },
        backgroundColor: '#111514',
        borderColor: '#252C29',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: {
          color: '#F1F4F1',
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
            <div style="font-family: 'Geist Mono', monospace; min-width: 195px;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #252C29; padding-bottom: 5px; margin-bottom: 6px;">
                <span style="font-weight: 600; color: #F1F4F1; font-size: 11px;">${time} · SP ${record.settlementPeriod}</span>
                <span style="color: #8B9691; font-size: 10px;">${record.settlementDate}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                <span style="color: #35B89A; font-weight: 500; font-size: 11px;">ACTUAL</span>
                <span style="font-weight: 700; color: #F1F4F1;">${actual} MW</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="color: #E58A5C; font-weight: 500; font-size: 11px;">DAY-AHEAD</span>
                <span style="font-weight: 700; color: #F1F4F1;">${forecast} MW</span>
              </div>
              <div style="border-top: 1px solid #1C2220; padding-top: 5px; display: flex; justify-content: space-between; font-size: 11px;">
                <span style="color: #8B9691;">ERROR</span>
                <span style="font-weight: 700; color: ${isSignificant ? '#E0645A' : error < 0 ? '#E58A5C' : '#35B89A'};">
                  ${errorSign}${error.toLocaleString()} MW
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 2px;">
                <span style="color: #5F6A65;">ABS ERROR</span>
                <span style="color: #F1F4F1;">±${absError} MW</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 2px;">
                <span style="color: #5F6A65;">HORIZON</span>
                <span style="color: #8B9691;">${horizon}</span>
              </div>
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: timeLabels,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#252C29' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#5F6A65',
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
            color: '#1A201E',
            type: 'dashed',
          },
        },
        axisLabel: {
          color: '#5F6A65',
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
          bottom: 4,
          height: 14,
          borderColor: 'transparent',
          backgroundColor: '#0B0D0D',
          fillerColor: 'rgba(229, 138, 92, 0.16)',
          handleStyle: {
            color: '#E58A5C',
            borderColor: '#252C29',
            borderWidth: 1,
          },
          moveHandleStyle: {
            color: '#252C29',
          },
          textStyle: {
            color: '#5F6A65',
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
        // 1. Uncertainty Envelope (Ochre #D7B35A @ 10%)
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
            color: 'rgba(215, 179, 90, 0.35)',
            width: 1,
            type: 'dashed',
          },
          areaStyle: {
            color: 'rgba(215, 179, 90, 0.10)',
          },
          silent: true,
        },

        // 2. Actual Wind Generation (Emerald #35B89A)
        {
          name: 'Actual Generation',
          type: 'line',
          smooth: 0.25,
          showSymbol: false,
          data: actualValues,
          lineStyle: {
            width: 2.2,
            color: '#35B89A',
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(53, 184, 154, 0.12)' },
              { offset: 0.8, color: 'rgba(53, 184, 154, 0.01)' },
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
            data: significantErrorMarkPoints,
          },
        },

        // 3. Day-Ahead Forecast (Terracotta #E58A5C)
        {
          name: 'Day-Ahead Forecast',
          type: 'line',
          smooth: 0.25,
          showSymbol: false,
          data: forecastValues,
          lineStyle: {
            width: 1.8,
            color: '#E58A5C',
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
  }, [timeLabels, actualValues, forecastValues, uncertaintyLower, uncertaintyBandHeight, significantErrorMarkPoints, filteredData]);

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
    <div className="dark-card p-5 h-full flex flex-col justify-between">
      {/* Chart Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-xs font-semibold tracking-wider uppercase text-[#F1F4F1]">
            Actual vs Day-Ahead Forecast
          </h2>
          <p className="text-[11px] text-[#5F6A65] mt-0.5">
            30-minute UK wind generation · January 2026
          </p>
        </div>

        {/* Compact Segmented Range Control */}
        <div className="flex items-center space-x-0.5 bg-[#080A0A] rounded-lg p-0.5 border border-[#252C29] text-xs">
          {rangeButtons.map((btn) => {
            const isSelected = rangeFilter === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => setRangeFilter(btn.id)}
                className={`relative px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                  isSelected ? 'text-[#F1F4F1] font-semibold' : 'text-[#8B9691] hover:text-[#F1F4F1]'
                }`}
              >
                <span className="relative z-10">{btn.label}</span>
                {isSelected && (
                  <motion.div
                    layoutId="activeRangePill"
                    className="absolute inset-0 bg-[#151A18] rounded-md border border-[#252C29]"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main ECharts Surface */}
      <div className="w-full flex-1 min-h-[360px]">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          onEvents={{ click: onChartClick }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>

      {/* Bottom Chart Footer Legend */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#8B9691] pt-3 border-t border-[#252C29] mt-1 gap-2">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-1 rounded-xs bg-[#35B89A] inline-block" />
            <span className="text-[#F1F4F1] font-medium text-[11px]">Actual Outturn</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-0.5 border-t-2 border-dashed border-[#E58A5C] inline-block" />
            <span className="text-[#F1F4F1] font-medium text-[11px]">Day-Ahead Forecast</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-1.5 rounded-xs bg-[#D7B35A]/25 border border-[#D7B35A] inline-block" />
            <span className="text-[11px]">Uncertainty Band</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-[#5F6A65]">
          <span>{filteredData.length} Settlement Records · Click point to inspect</span>
        </div>
      </div>
    </div>
  );
};
