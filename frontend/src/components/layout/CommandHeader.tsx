import React from 'react';
import { motion } from 'motion/react';
import { Clock, SlidersHorizontal, Activity } from 'lucide-react';

interface CommandHeaderProps {
  cutoffHour: number;
  setCutoffHour: (h: number) => void;
  resolution: string;
  setResolution: (r: string) => void;
  activeTab: 'SERIES' | 'ACCURACY' | 'EVOLUTION' | 'TABLE';
  setActiveTab: (tab: 'SERIES' | 'ACCURACY' | 'EVOLUTION' | 'TABLE') => void;
}

export const CommandHeader: React.FC<CommandHeaderProps> = ({
  cutoffHour,
  setCutoffHour,
  resolution,
  setResolution,
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    { id: 'SERIES', label: 'Overview & Series' },
    { id: 'ACCURACY', label: 'Forecast Accuracy' },
    { id: 'EVOLUTION', label: 'Forecast Evolution' },
    { id: 'TABLE', label: 'Settlement Grid' },
  ] as const;

  return (
    <header className="border-b border-white/[0.08] bg-[#080B10]/90 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Strip: Brand & Live System Status */}
        <div className="h-14 flex items-center justify-between border-b border-white/[0.04]">
          {/* Brand & Market Identification */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.6)]" />
              <div className="flex items-baseline space-x-2">
                <span className="text-sm font-bold tracking-tight text-white uppercase font-mono">
                  REint Energy
                </span>
                <span className="text-[11px] tracking-wider text-slate-400 font-medium">
                  Forecasting IQ
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-white/[0.08] text-[11px] text-slate-400 font-mono">
              <span className="text-slate-300">UK DAY-AHEAD WIND</span>
              <span className="text-white/20">/</span>
              <span className="text-slate-400">JANUARY 2026</span>
            </div>
          </div>

          {/* Center: Live BMRS System Heartbeat */}
          <div className="hidden lg:flex items-center space-x-2.5 px-3 py-1 rounded bg-[#0E131F] border border-white/[0.06] text-[11px] font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E5FF]" />
            </span>
            <span className="text-slate-300 font-medium">ELEXON BMRS</span>
            <span className="text-white/30">·</span>
            <span className="text-slate-400">DATA STREAM VERIFIED</span>
            <span className="text-white/30">·</span>
            <span className="text-[#00E5FF]/90">SP 1–48 SYNCED</span>
          </div>

          {/* Right Controls: Decision Gate & Settlement Resolution */}
          <div className="flex items-center space-x-3 text-xs font-mono">
            {/* Resolution Switcher */}
            <div className="flex items-center bg-[#0E131F] border border-white/[0.08] rounded p-0.5">
              <button
                onClick={() => setResolution('30min')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  resolution === '30min'
                    ? 'bg-[#1C2538] text-[#00E5FF] shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                30-MIN SP
              </button>
              <button
                onClick={() => setResolution('hourly')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  resolution === 'hourly'
                    ? 'bg-[#1C2538] text-[#00E5FF] shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                HOURLY BLOCK
              </button>
            </div>

            {/* Decision Gate Selector */}
            <div className="flex items-center space-x-2 bg-[#0E131F] border border-white/[0.08] rounded px-2.5 py-1">
              <Clock className="w-3.5 h-3.5 text-[#A78BFA]" />
              <span className="text-[10px] text-slate-400 uppercase tracking-wider hidden sm:inline">Gate:</span>
              <select
                value={cutoffHour}
                onChange={(e) => setCutoffHour(Number(e.target.value))}
                aria-label="Select Day-Ahead Gate Closure Cutoff"
                className="bg-transparent text-[11px] text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value={12} className="bg-[#0E131F] text-white">
                  D-1 12:00 UTC (GB Auction)
                </option>
                <option value={11} className="bg-[#0E131F] text-white">
                  D-1 11:00 UTC (Early Cutoff)
                </option>
                <option value={17} className="bg-[#0E131F] text-white">
                  D-1 17:00 UTC (NESO Planning)
                </option>
                <option value={23} className="bg-[#0E131F] text-white">
                  D-1 23:59 UTC (Midnight EOD)
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Lower Strip: Clean Horizontal Navigation Tabs with Shared Motion Indicator */}
        <div className="flex items-center justify-between h-11 overflow-x-auto no-scrollbar">
          <nav className="flex space-x-1" aria-label="Dashboard Views">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3.5 py-2 text-xs font-medium transition-colors rounded ${
                    isActive ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="relative z-10">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-[#141C2C] border-b-2 border-[#00E5FF] rounded-t"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden sm:flex items-center space-x-3 text-[11px] font-mono text-slate-400">
            <span>MARKET SETTLEMENT: JAN 01 – 31, 2026</span>
            <span className="text-white/20">|</span>
            <span>TIMEZONE: GMT (UTC+0)</span>
          </div>
        </div>
      </div>
    </header>
  );
};
