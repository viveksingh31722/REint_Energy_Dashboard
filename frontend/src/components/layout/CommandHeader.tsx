import React from 'react';
import { motion } from 'motion/react';
import { Clock } from 'lucide-react';

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
    <header className="sticky top-0 z-50 pt-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto glass-panel rounded-2xl border border-white/80 shadow-glass-md transition-all">
        {/* Top Product Utility Bar */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-[#E4E8EC]/70">
          {/* Brand & Market Identity */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#E27D4F] shadow-[0_0_10px_rgba(226,125,79,0.35)]" />
              <div className="flex items-baseline space-x-1.5">
                <span className="text-sm font-semibold tracking-tight text-[#17202A] font-mono">
                  REint Energy
                </span>
                <span className="text-xs text-[#66717C] font-medium">
                  |
                </span>
                <span className="text-xs tracking-wider text-[#66717C] font-medium">
                  Forecasting IQ
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-2 pl-3 border-l border-[#E4E8EC] text-[11px] font-mono text-[#8D98A3]">
              <span className="font-semibold text-[#66717C]">UK DAY-AHEAD WIND</span>
              <span className="text-[#CBD2D9]">·</span>
              <span>JAN 2026</span>
            </div>
          </div>

          {/* Center: Live BMRS Heartbeat Badge */}
          <div className="hidden lg:flex items-center space-x-2.5 px-3 py-1 rounded-full bg-white/70 border border-white/90 shadow-glass-sm text-[11px] font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#168F79] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#168F79]" />
            </span>
            <span className="text-[#17202A] font-medium">ELEXON BMRS VERIFIED</span>
            <span className="text-[#CBD2D9]">·</span>
            <span className="text-[#168F79] font-semibold">SP 1–48 SYNCED</span>
          </div>

          {/* Right Controls: Resolution & Gate Closure */}
          <div className="flex items-center space-x-2.5 text-xs font-mono">
            {/* Resolution Switcher */}
            <div className="flex items-center bg-white/70 border border-[#E4E8EC] rounded-lg p-0.5 shadow-glass-sm">
              <button
                onClick={() => setResolution('30min')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  resolution === '30min'
                    ? 'bg-white text-[#168F79] shadow-sm font-semibold'
                    : 'text-[#66717C] hover:text-[#17202A]'
                }`}
              >
                30-MIN SP
              </button>
              <button
                onClick={() => setResolution('hourly')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  resolution === 'hourly'
                    ? 'bg-white text-[#168F79] shadow-sm font-semibold'
                    : 'text-[#66717C] hover:text-[#17202A]'
                }`}
              >
                HOURLY
              </button>
            </div>

            {/* Decision Gate Selector */}
            <div className="flex items-center space-x-1.5 bg-white/70 border border-[#E4E8EC] rounded-lg px-2.5 py-1 shadow-glass-sm">
              <Clock className="w-3.5 h-3.5 text-[#E27D4F]" />
              <span className="text-[10px] text-[#8D98A3] uppercase tracking-wider hidden sm:inline">Gate:</span>
              <select
                value={cutoffHour}
                onChange={(e) => setCutoffHour(Number(e.target.value))}
                aria-label="Select Day-Ahead Gate Closure Cutoff"
                className="bg-transparent text-[11px] text-[#17202A] font-semibold focus:outline-none cursor-pointer"
              >
                <option value={12} className="bg-white text-[#17202A]">
                  D-1 12:00 UTC (GB Auction)
                </option>
                <option value={11} className="bg-white text-[#17202A]">
                  D-1 11:00 UTC (Early Cutoff)
                </option>
                <option value={17} className="bg-white text-[#17202A]">
                  D-1 17:00 UTC (NESO Planning)
                </option>
                <option value={23} className="bg-white text-[#17202A]">
                  D-1 23:59 UTC (Midnight EOD)
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Lower Strip: Floating Tab Navigation */}
        <div className="px-4 flex items-center justify-between h-11 overflow-x-auto no-scrollbar">
          <nav className="flex space-x-1" aria-label="Dashboard Views">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3.5 py-1.5 text-xs font-medium transition-all rounded-lg ${
                    isActive ? 'text-[#17202A] font-semibold' : 'text-[#66717C] hover:text-[#17202A]'
                  }`}
                >
                  <span className="relative z-10">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-white/95 rounded-lg shadow-sm border border-white"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden sm:flex items-center space-x-3 text-[11px] font-mono text-[#8D98A3]">
            <span>DELIVERY: JAN 01 – 31, 2026</span>
            <span className="text-[#CBD2D9]">·</span>
            <span>TIMEZONE: GMT (UTC+0)</span>
          </div>
        </div>
      </div>
    </header>
  );
};
