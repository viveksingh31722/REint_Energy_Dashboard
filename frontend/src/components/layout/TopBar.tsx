import React from 'react';
import { Clock } from 'lucide-react';

interface TopBarProps {
  cutoffHour: number;
  setCutoffHour: (h: number) => void;
  resolution: string;
  setResolution: (r: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  cutoffHour,
  setCutoffHour,
  resolution,
  setResolution,
}) => {
  return (
    <header className="h-13 bg-[#0B0D0D] border-b border-[#252C29] px-6 flex items-center justify-between shrink-0 select-none">
      {/* Left: Product Title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-baseline space-x-1.5">
          <span className="text-sm font-bold tracking-tight text-[#F1F4F1]">
            REint Energy
          </span>
          <span className="text-xs text-[#5F6A65]">|</span>
          <span className="text-xs text-[#8B9691] font-medium">
            Forecasting IQ
          </span>
        </div>
      </div>

      {/* Center: Market Scope */}
      <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-[#8B9691]">
        <span className="text-[#F1F4F1] font-semibold">UK DAY-AHEAD WIND</span>
        <span className="text-[#3D4441]">·</span>
        <span>JANUARY 2026</span>
      </div>

      {/* Right: Verification Status & Decision Controls */}
      <div className="flex items-center space-x-3.5 text-xs font-mono">
        {/* Verification Status */}
        <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-[#8B9691] pr-3 border-r border-[#252C29]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#35B89A]" />
          <span className="font-medium tracking-wide">ELEXON BMRS VERIFIED</span>
        </div>

        {/* 30-Min vs Hourly Toggle */}
        <div className="flex items-center bg-[#111514] border border-[#252C29] rounded-lg p-0.5 text-[11px]">
          <button
            onClick={() => setResolution('30min')}
            className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
              resolution === '30min'
                ? 'bg-[#151A18] text-[#F1F4F1] shadow-terminal-sm border border-[#252C29]'
                : 'text-[#8B9691] hover:text-[#F1F4F1]'
            }`}
          >
            30-MIN
          </button>
          <button
            onClick={() => setResolution('hourly')}
            className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
              resolution === 'hourly'
                ? 'bg-[#151A18] text-[#F1F4F1] shadow-terminal-sm border border-[#252C29]'
                : 'text-[#8B9691] hover:text-[#F1F4F1]'
            }`}
          >
            HOURLY
          </button>
        </div>

        {/* Gate Closure Selector */}
        <div className="flex items-center space-x-1.5 bg-[#111514] border border-[#252C29] rounded-lg px-2.5 py-1 text-[11px]">
          <Clock className="w-3 h-3 text-[#E58A5C]" />
          <span className="text-[#5F6A65] hidden lg:inline">Gate:</span>
          <select
            value={cutoffHour}
            onChange={(e) => setCutoffHour(Number(e.target.value))}
            aria-label="Select Gate Closure"
            className="bg-transparent text-[#F1F4F1] font-medium focus:outline-none cursor-pointer"
          >
            <option value={12} className="bg-[#111514] text-[#F1F4F1]">D-1 12:00 UTC</option>
            <option value={11} className="bg-[#111514] text-[#F1F4F1]">D-1 11:00 UTC</option>
            <option value={17} className="bg-[#111514] text-[#F1F4F1]">D-1 17:00 UTC</option>
            <option value={23} className="bg-[#111514] text-[#F1F4F1]">D-1 23:59 UTC</option>
          </select>
        </div>
      </div>
    </header>
  );
};
