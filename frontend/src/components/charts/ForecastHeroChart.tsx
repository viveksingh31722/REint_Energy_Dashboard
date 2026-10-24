import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { motion } from 'motion/react';
import { TimeSeriesPoint } from '../../types';
import { Shield, AlertCircle } from 'lucide-react';

interface HeroChartProps {
  series: TimeSeriesPoint[];
  onSelectPeriod?: (deliveryTime: string) => void;
}

export const ForecastHeroChart: React.FC<HeroChartProps> = ({ series, onSelectPeriod }) => {
  const [rangeFilter, setRangeFilter] = useState<'ALL' | 'W1' | 'W2' | 'W3' | 'W4' | 'STORM'>('ALL');
  const [showUncertainty, setShowUncertainty] = useState<boolean>(true);
  const [showSevereErrors, setShowSevereErrors] = useState<boolean>(true);

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

  // Severe Error Callouts (|Error| >= 2,800 MW)
  const severeErrorMarkPoints = useMemo(() => {
    if (!showSevereErrors) return [];
    const points: any[] = [];
    filteredData.forEach((d, idx) => {
      if (d.absoluteErrorMW && d.absoluteErrorMW >= 2800) {
        // Only mark peak local extremes so chart remains clean
        if (idx % 3 === 0) {
          points.push({
            name: 'Severe Deviation',
            coord: [timeLabels[idx], d.actualGenerationMW],
            value: `${Math.round(d.absoluteErrorMW).toLocaleString()} MW`,
            itemStyle: { color: '#D95C55' },
          });
        }
      }
    });
    return points;
  }, [filteredData, timeLabels, showSevereErrors]);

  // ECharts Option Configuration: Premium Light Financial / Energy Terminal
  const option = useMemo(() => {
    const seriesList: any[] = [];

    // 1. Uncertainty Confidence Band (Stacked area)
    if (showUncertainty) {
      seriesList.push(
        {
          name: 'Uncertainty Lower Base',
          type: 'line',
          stack: 'uncertainty-band',
          symbol: 'none',
          lineStyle: { opacity: 0 },
          data: uncertaintyLower,
          silent: true,
        },
        {
          name: 'Uncertainty Corridor (±P90)',
          type: 'line',
          stack: 'uncertainty-band',
          symbol: 'none',
          data: uncertaintyBandHeight,
          lineStyle: {
            color: 'rgba(230, 184, 79, 0.4)',
            width: 1,
            type: 'dashed',
          },
          areaStyle: {
            color: 'rgba(230, 184, 79, 0.12)',
          },
          silent: true,
        }
      );
    }

    // 2. Actual Wind Generation (Muted Emerald / Teal)
    seriesList.push({
      name: 'Actual Wind Outturn',
      type: 'line',
      smooth: 0.25,
      showSymbol: false,
      data: actualValues,
      lineStyle: {
        width: 2.4,
        color: '#168F79',
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(22, 143, 121, 0.14)' },
          { offset: 0.7, color: 'rgba(22, 143, 121, 0.03)' },
          { offset: 1, color: 'rgba(22, 143, 121, 0.0)' },
        ]),
      },
      emphasis: {
        lineStyle: {
          width: 3.2,
          shadowBlur: 10,
          shadowColor: 'rgba(22, 143, 121, 0.35)',
        },
      },
      markPoint: {
        symbol: 'circle',
        symbolSize: 8,
        label: {
          show: false,
        },
        data: severeErrorMarkPoints,
      },
    });

    // 3. Day-Ahead Forecast (Soft Coral / Orange)
    seriesList.push({
      name: 'Day-Ahead Forecast',
      type: 'line',
      smooth: 0.25,
      showSymbol: false,
      data: forecastValues,
      lineStyle: {
        width: 2.0,
        color: '#E27D4F',
        type: [6, 4],
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(226, 125, 79, 0.06)' },
          { offset: 1, color: 'rgba(226, 125, 79, 0.0)' },
        ]),
      },
      emphasis: {
        lineStyle: {
          width: 2.8,
          shadowBlur: 10,
          shadowColor: 'rgba(226, 125, 79, 0.35)',
        },
      },
    });

    return {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 450,
      animationEasing: 'cubicOut',
      grid: {
        top: 30,
        right: 25,
        bottom: 55,
        left: 65,
        containLabel: false,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          lineStyle: {
            color: 'rgba(226, 125, 79, 0.45)',
            width: 1,
            type: 'dashed',
          },
          crossStyle: {
            color: 'rgba(102, 113, 124, 0.3)',
          },
        },
        // Floating glass panel tooltip
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        borderColor: 'rgba(228, 232, 236, 0.95)',
        borderWidth: 1,
        extraCssText: 'box-shadow: 0 16px 36px rgba(23, 32, 42, 0.10); backdrop-filter: blur(18px); border-radius: 12px;',
        padding: [12, 16],
        textStyle: {
          color: '#17202A',
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
            <div style="font-family: 'Geist Mono', monospace; min-width: 220px;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E4E8EC; padding-bottom: 6px; margin-bottom: 8px;">
                <span style="font-weight: 600; color: #17202A; font-size: 11px;">${record.settlementDate} · ${record.deliveryTime.substring(11, 16)} GMT</span>
                <span style="background: #F4F6F8; border: 1px solid #E4E8EC; color: #66717C; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">SP ${record.settlementPeriod}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #168F79; display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 500;">
                  <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#168F79;"></span>
                  Actual Outturn:
                </span>
                <span style="font-weight: 700; color: #17202A;">${actual} MW</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="color: #E27D4F; display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 500;">
                  <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#E27D4F;"></span>
                  Day-Ahead Forecast:
                </span>
                <span style="font-weight: 700; color: #17202A;">${forecast} MW</span>
              </div>
              <div style="border-top: 1px solid #E4E8EC; padding-top: 6px; display: flex; justify-content: space-between; font-size: 11px;">
                <span style="color: #66717C;">Forecast Error:</span>
                <span style="font-weight: 700; color: ${isOver ? '#D95C55' : '#3D9B76'};">
                  ${errorSign}${error.toLocaleString()} MW
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 2px;">
                <span style="color: #8D98A3;">Absolute Error:</span>
                <span style="color: #17202A; font-weight: 500;">±${absError} MW</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 2px;">
                <span style="color: #8D98A3;">Lead Horizon:</span>
                <span style="color: #66717C;">${horizon}</span>
              </div>
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #E4E8EC; text-align: center; font-size: 10px; color: #E27D4F; font-weight: 500;">
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
        axisLine: { lineStyle: { color: '#E4E8EC' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#8D98A3',
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
            color: '#EEF1F4',
            type: 'dashed',
          },
        },
        axisLabel: {
          color: '#8D98A3',
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
          bottom: 8,
          height: 18,
          borderColor: 'transparent',
          backgroundColor: '#F4F6F8',
          fillerColor: 'rgba(226, 125, 79, 0.15)',
          handleStyle: {
            color: '#E27D4F',
            borderColor: '#FFFFFF',
            borderWidth: 1.5,
          },
          moveHandleStyle: {
            color: '#CBD2D9',
          },
          textStyle: {
            color: '#8D98A3',
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
      series: seriesList,
    };
  }, [timeLabels, actualValues, forecastValues, uncertaintyLower, uncertaintyBandHeight, severeErrorMarkPoints, filteredData, showUncertainty]);

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
    <div className="solid-data-surface rounded-2xl p-6 shadow-glass-md relative">
      {/* Chart Top Header & Range Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#168F79]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#17202A]">
              Actual Generation Outturn vs. Day-Ahead Forecast
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-[#E27D4F] border border-[#E4E8EC] shadow-glass-sm font-semibold">
              ECharts Precision Canvas
            </span>
          </div>
          <p className="text-xs text-[#66717C] mt-1 font-mono">
            30-minute metered transmission feed (Emerald) vs. D-1 gate commitment (Coral) with uncertainty envelope
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Layer Visibility Toggles */}
          <div className="flex items-center space-x-1.5 bg-[#F4F6F8] border border-[#E4E8EC] rounded-lg p-1 text-[11px] font-mono">
            <button
              onClick={() => setShowUncertainty(!showUncertainty)}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-all ${
                showUncertainty ? 'bg-white text-[#E6B84F] shadow-sm font-semibold' : 'text-[#8D98A3] hover:text-[#17202A]'
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>Uncertainty</span>
            </button>
            <button
              onClick={() => setShowSevereErrors(!showSevereErrors)}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-all ${
                showSevereErrors ? 'bg-white text-[#D95C55] shadow-sm font-semibold' : 'text-[#8D98A3] hover:text-[#17202A]'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>Errors</span>
            </button>
          </div>

          {/* Range Selectors with Shared Motion Pill */}
          <div className="flex items-center space-x-1 bg-[#F4F6F8] border border-[#E4E8EC] rounded-lg p-1 text-xs font-mono">
            {rangeButtons.map((btn) => {
              const isSelected = rangeFilter === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setRangeFilter(btn.id)}
                  className={`relative px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    isSelected ? 'text-[#17202A] font-semibold' : 'text-[#66717C] hover:text-[#17202A]'
                  }`}
                >
                  <span className="relative z-10">{btn.label}</span>
                  {isSelected && (
                    <motion.div
                      layoutId="activeRangePill"
                      className="absolute inset-0 bg-white rounded-md shadow-glass-sm border border-white"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main ECharts Canvas Surface (Opaque crisp white for maximum optical clarity) */}
      <div className="w-full h-[450px]">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          onEvents={{ click: onChartClick }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>

      {/* Chart Legend & Context Footnote */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] font-mono text-[#66717C] pt-3 border-t border-[#E4E8EC] mt-2 gap-2">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1 rounded-sm bg-[#168F79] inline-block" />
            <span className="text-[#17202A] font-medium">Actual Outturn (Emerald · FUELHH)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-[#E27D4F] inline-block" />
            <span className="text-[#17202A] font-medium">Day-Ahead Forecast (Coral · WINDFOR D-1)</span>
          </div>
          {showUncertainty && (
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-2 rounded-sm bg-[#E6B84F]/30 border border-[#E6B84F] inline-block" />
              <span className="text-[#66717C]">Uncertainty Band (±P90 Corridor)</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 text-[#8D98A3]">
          <span>{filteredData.length} Settlement Records</span>
          <span className="text-[#CBD2D9]">·</span>
          <span className="text-[#E27D4F] font-medium">Click point to open evolution</span>
        </div>
      </div>
    </div>
  );
};
