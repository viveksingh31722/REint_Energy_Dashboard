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
    { id: 'SERIES', label: 'Overview' },
    { id: 'ACCURACY', label: 'Forecast Accuracy' },
    { id: 'EVOLUTION', label: 'Forecast Evolution' },
    { id: 'TABLE', label: 'Settlement' },
  ] as const;

  return (
    <header className="sticky top-0 z-50 pt-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto glass-chrome rounded-xl px-4 h-13 flex items-center justify-between border border-[#DCE3E0] shadow-terminal-sm">
        {/* Left: Product Identity & Context */}
        <div className="flex items-center space-x-3.5">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-sm bg-[#087F6A]" />
            <span className="text-sm font-semibold tracking-tight text-[#18201F]">
              REint Energy
            </span>
            <span className="text-xs text-[#8B9692]">|</span>
            <span className="text-xs text-[#687370] font-medium">
              Forecasting IQ
            </span>
          </div>

          <div className="hidden lg:flex items-center space-x-2 pl-3 border-l border-[#DCE3E0] text-[11px] text-[#687370]">
            <span>UK Day-Ahead Wind</span>
            <span className="text-[#8B9692]">·</span>
            <span className="text-[#8B9692]">Jan 2026</span>
          </div>
        </div>

        {/* Center: Clean Text Navigation Tabs with Emerald Dot Indicator */}
        <nav className="flex items-center space-x-1" aria-label="Main Navigation">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 py-1.5 text-xs transition-colors rounded-md flex items-center space-x-1.5 ${
                  isActive ? 'text-[#18201F] font-semibold' : 'text-[#687370] hover:text-[#18201F]'
                }`}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#087F6A] inline-block shrink-0" />
                )}
                <span className="relative z-10">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-[#FFFFFF] rounded-md shadow-terminal-sm border border-[#DCE3E0]/80"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Verification Status & Decision Controls */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Elexon BMRS Verified Indicator */}
          <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-[#687370] pr-2 border-r border-[#DCE3E0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#087F6A]" />
            <span className="font-medium tracking-wide">ELEXON BMRS VERIFIED</span>
          </div>

          {/* 30-min vs Hourly Resolution */}
          <div className="flex items-center bg-[#EEF2F1] rounded-md p-0.5 border border-[#DCE3E0] text-[11px]">
            <button
              onClick={() => setResolution('30min')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                resolution === '30min'
                  ? 'bg-white text-[#18201F] shadow-terminal-sm font-semibold'
                  : 'text-[#687370] hover:text-[#18201F]'
              }`}
            >
              30-min
            </button>
            <button
              onClick={() => setResolution('hourly')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                resolution === 'hourly'
                  ? 'bg-white text-[#18201F] shadow-terminal-sm font-semibold'
                  : 'text-[#687370] hover:text-[#18201F]'
              }`}
            >
              Hourly
            </button>
          </div>

          {/* Gate Closure Selector */}
          <div className="flex items-center space-x-1 bg-white border border-[#DCE3E0] rounded-md px-2 py-1 text-[11px] shadow-terminal-sm">
            <Clock className="w-3 h-3 text-[#C96A3D]" />
            <span className="text-[#8B9692] hidden md:inline">Gate:</span>
            <select
              value={cutoffHour}
              onChange={(e) => setCutoffHour(Number(e.target.value))}
              aria-label="Select Gate Closure"
              className="bg-transparent text-[#18201F] font-medium focus:outline-none cursor-pointer"
            >
              <option value={12}>D-1 12:00 UTC</option>
              <option value={11}>D-1 11:00 UTC</option>
              <option value={17}>D-1 17:00 UTC</option>
              <option value={23}>D-1 23:59 UTC</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
