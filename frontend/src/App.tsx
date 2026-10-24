import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { AtmosphericField } from './components/layout/AtmosphericField';
import { CommandHeader } from './components/layout/CommandHeader';
import { DecisionCockpit } from './components/summary/DecisionCockpit';
import { MarketIntelligence } from './components/summary/MarketIntelligence';
import { ForecastHeroChart } from './components/charts/ForecastHeroChart';
import { AccuracyWorkspace } from './components/accuracy/AccuracyWorkspace';
import { ForecastEvolutionScrubber } from './components/evolution/ForecastEvolutionScrubber';
import { SettlementTerminalGrid } from './components/table/SettlementTerminalGrid';
import { api } from './services/api';
import { AlertCircle } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes cache
      refetchOnWindowFocus: false,
    },
  },
});

function DashboardContent() {
  const [cutoffHour, setCutoffHour] = useState<number>(12);
  const [resolution, setResolution] = useState<string>('30min');
  const [activeTab, setActiveTab] = useState<'SERIES' | 'ACCURACY' | 'EVOLUTION' | 'TABLE'>('SERIES');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-01-15T18:00:00Z');

  // Backend queries
  const {
    data: summary,
    error: summaryError,
  } = useQuery({
    queryKey: ['summary', cutoffHour, resolution],
    queryFn: () => api.getSummary(cutoffHour, resolution),
  });

  const {
    data: series,
    isLoading: isSeriesLoading,
  } = useQuery({
    queryKey: ['series', cutoffHour, resolution],
    queryFn: () => api.getSeries(cutoffHour, resolution),
  });

  const { data: distribution } = useQuery({
    queryKey: ['distribution', cutoffHour, resolution],
    queryFn: () => api.getDistribution(cutoffHour, 25),
  });

  const { data: diurnal } = useQuery({
    queryKey: ['diurnal', cutoffHour, resolution],
    queryFn: () => api.getDiurnal(cutoffHour),
  });

  const { data: horizon } = useQuery({
    queryKey: ['horizon', cutoffHour, resolution],
    queryFn: () => api.getHorizon(cutoffHour),
  });

  const handleSelectPeriod = (deliveryTime: string) => {
    setSelectedPeriod(deliveryTime);
    setActiveTab('EVOLUTION');
  };

  const latestPoint = series && series.length > 0 ? series[series.length - 1] : undefined;

  return (
    <div className="min-h-screen bg-[#080B10] text-slate-100 flex flex-col font-sans relative selection:bg-[#00E5FF]/20 selection:text-white">
      {/* Subtle Atmospheric Energy Field */}
      <AtmosphericField />

      {/* Thin Command Terminal Header */}
      <CommandHeader
        cutoffHour={cutoffHour}
        setCutoffHour={setCutoffHour}
        resolution={resolution}
        setResolution={setResolution}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        {/* Error Notice if API is unreachable */}
        {summaryError && (
          <div className="bg-rose-950/70 border border-rose-500/40 rounded p-3 flex items-center space-x-2.5 text-rose-200 text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Connection Warning: Could not reach backend analytical service. Ensure FastAPI daemon is running on port 8000.</span>
          </div>
        )}

        {/* Primary Decision Cockpit (Pillars 1, 2, 3) */}
        {summary ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <DecisionCockpit summary={summary} latestPoint={latestPoint} />
          </motion.div>
        ) : (
          <div className="h-44 border border-white/[0.06] bg-[#0E131F]/50 rounded-lg animate-pulse flex items-center justify-center text-xs font-mono text-slate-500">
            Initialising decision signal & risk benchmarks...
          </div>
        )}

        {/* Tab Viewport with Smooth Motion Transitions */}
        <AnimatePresence mode="wait">
          {activeTab === 'SERIES' && (
            <motion.div
              key="SERIES"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* ECharts Central Hero Surface */}
              {isSeriesLoading ? (
                <div className="h-[440px] border border-white/[0.06] bg-[#0E131F]/50 rounded-lg animate-pulse flex items-center justify-center text-xs font-mono text-slate-500">
                  Rendering 30-minute time-series surface...
                </div>
              ) : series ? (
                <ForecastHeroChart series={series} onSelectPeriod={handleSelectPeriod} />
              ) : null}

              {/* Editorial Market Intelligence Briefing */}
              {summary && <MarketIntelligence summary={summary} />}
            </motion.div>
          )}

          {activeTab === 'ACCURACY' && (
            <motion.div
              key="ACCURACY"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {summary && (
                <AccuracyWorkspace
                  summary={summary}
                  series={series || []}
                  distribution={distribution}
                  diurnal={diurnal}
                  horizon={horizon}
                />
              )}
            </motion.div>
          )}

          {activeTab === 'EVOLUTION' && (
            <motion.div
              key="EVOLUTION"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <ForecastEvolutionScrubber initialDeliveryTime={selectedPeriod} />
            </motion.div>
          )}

          {activeTab === 'TABLE' && (
            <motion.div
              key="TABLE"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <SettlementTerminalGrid
                cutoffHour={cutoffHour}
                resolution={resolution}
                onSelectPeriod={handleSelectPeriod}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Razor-Thin Terminal Footer */}
      <footer className="border-t border-white/[0.06] bg-[#06080D]/95 py-3 mt-auto relative z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium">BMRS DATA FEEDS:</span>
            <span>FUELHH OUTTURN (WIND)</span>
            <span className="text-white/20">·</span>
            <span>WINDFOR FORECAST RUNS</span>
          </div>
          <div>
            <span>GB ELECTRICITY MARKET TIME: GMT (UTC+0) · SETTLEMENT PERIODS 1–48</span>
          </div>
          <div>
            <span className="text-slate-400">REint Forecasting IQ · v2.0 Enterprise</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
}
