import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Target,
  History,
  Table2,
  Database,
  Settings2,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'SERIES' | 'ACCURACY' | 'EVOLUTION' | 'TABLE';
  setActiveTab: (tab: 'SERIES' | 'ACCURACY' | 'EVOLUTION' | 'TABLE') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const mainNav = [
    { id: 'SERIES', label: 'Overview', icon: LayoutDashboard },
    { id: 'ACCURACY', label: 'Accuracy', icon: Target },
    { id: 'EVOLUTION', label: 'Evolution', icon: History },
    { id: 'TABLE', label: 'Settlement', icon: Table2 },
  ] as const;

  return (
    <aside className="w-20 shrink-0 bg-[#080A0A] border-r border-[#252C29] flex flex-col justify-between items-center py-5 select-none z-30 min-h-screen">
      {/* Top: Brand Mark */}
      <div className="flex flex-col items-center space-y-6">
        <div className="w-10 h-10 rounded-xl bg-[#111514] border border-[#252C29] flex items-center justify-center shadow-terminal-sm group cursor-pointer">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#35B89A] to-[#E58A5C] flex items-center justify-center text-[#0B0D0D]">
            <Zap className="w-3.5 h-3.5 fill-current" />
          </div>
        </div>

        {/* Primary Navigation Icons with Tooltips */}
        <nav className="flex flex-col space-y-2" aria-label="Main Navigation">
          {mainNav.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all group ${
                  isActive
                    ? 'text-[#F1F4F1]'
                    : 'text-[#8B9691] hover:text-[#F1F4F1] hover:bg-[#111514]/70'
                }`}
                title={item.label}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-[#151A18] rounded-xl border border-[#252C29] shadow-terminal-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute left-0 w-1 h-4 bg-[#35B89A] rounded-r-full" />
                )}
                <Icon className="w-5 h-5 relative z-10" />
                <span className="text-[9px] font-medium tracking-tight mt-0.5 relative z-10 scale-95 opacity-80">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="w-8 h-[1px] bg-[#252C29]" />

        {/* Secondary Utility Navigation */}
        <div className="flex flex-col space-y-2">
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5F6A65] hover:text-[#8B9691] hover:bg-[#111514] transition-colors"
            title="Data Sources (Elexon BMRS)"
          >
            <Database className="w-4 h-4" />
          </button>
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#5F6A65] hover:text-[#8B9691] hover:bg-[#111514] transition-colors"
            title="Terminal Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom: Elexon BMRS Live Pulse Indicator */}
      <div className="flex flex-col items-center space-y-2 text-center">
        <div
          className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#111514] border border-[#252C29]"
          title="Elexon BMRS: Active connection"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#35B89A] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#35B89A]" />
          </span>
        </div>
        <span className="text-[9px] font-mono text-[#5F6A65] tracking-tight uppercase">
          BMRS
        </span>
      </div>
    </aside>
  );
};
