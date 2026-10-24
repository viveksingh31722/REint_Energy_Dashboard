import React from 'react';
import { Wind, Clock, Sliders, Database, Activity } from 'lucide-react';

interface NavbarProps {
  cutoffHour: number;
  setCutoffHour: (h: number) => void;
  resolution: string;
  setResolution: (r: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cutoffHour,
  setCutoffHour,
  resolution,
  setResolution,
}) => {
  return (
    <header className="bg-navy-800 border-b border-navy-700/80 sticky top-0 z-50 shadow-lg backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Branding */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-wind-teal to-wind-violet rounded-lg shadow-md shadow-wind-teal/20">
            <Wind className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white">REint Energy</span>
              <span className="text-xs px-2 py-0.5 rounded bg-wind-violet/20 border border-wind-violet/40 text-wind-violet font-semibold uppercase tracking-wider">
                Forecasting IQ
              </span>
            </div>
            <p className="text-xs text-slate-400">UK Day-Ahead Wind Procurement & Uncertainty</p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center space-x-4">
          {/* Resolution Selector */}
          <div className="flex items-center bg-navy-900 border border-navy-700 rounded-lg p-1 text-xs">
            <button
              onClick={() => setResolution('30min')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                resolution === '30min'
                  ? 'bg-wind-teal text-navy-900 shadow font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              30-Min (SP 1-48)
            </button>
            <button
              onClick={() => setResolution('hourly')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                resolution === 'hourly'
                  ? 'bg-wind-teal text-navy-900 shadow font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hourly Block
            </button>
          </div>

          {/* Decision Cutoff Selector */}
          <div className="flex items-center space-x-2 bg-navy-900 border border-navy-700 rounded-lg px-3 py-1.5">
            <Clock className="w-4 h-4 text-wind-violet" />
            <span className="text-xs text-slate-400 hidden sm:inline">Gate Closure:</span>
            <select
              value={cutoffHour}
              onChange={(e) => setCutoffHour(Number(e.target.value))}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value={12} className="bg-navy-800 text-white">
                D-1 12:00 UTC (GB Auction Default)
              </option>
              <option value={11} className="bg-navy-800 text-white">
                D-1 11:00 UTC (Early Auction Gate)
              </option>
              <option value={17} className="bg-navy-800 text-white">
                D-1 17:00 UTC (NESO Evening Gate)
              </option>
              <option value={23} className="bg-navy-800 text-white">
                D-1 23:59 UTC (End-of-Day Snapshot)
              </option>
            </select>
          </div>

          {/* BMRS Status Indicator */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-medium">Elexon BMRS Verified</span>
          </div>
        </div>
      </div>
    </header>
  );
};
