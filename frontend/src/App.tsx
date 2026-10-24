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
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    },
  },
});

function DashboardContent() {
  const [cutoffHour, setCutoffHour] = useState<number>(12);
  const [resolution, setResolution] = useState<string>('30min');
  const [activeTab, setActiveTab] = useState<'SERIES' | 'ACCURACY' | 'EVOLUTION' | 'TABLE'>('SERIES');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-01-15T18:00:00Z');

  // Backend analytical queries
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
    <div className="min-h-screen bg-[#F4F6F8] ambient-light-glass text-[#17202A] flex flex-col font-sans relative selection:bg-[#E27D4F]/20 selection:text-[#17202A]">
      {/* Light Atmospheric Glass Caustic Field */}
      <AtmosphericField />

      {/* Refined Glass Product Header */}
      <CommandHeader
        cutoffHour={cutoffHour}
        setCutoffHour={setCutoffHour}
        resolution={resolution}
        setResolution={setResolution}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        {/* Connection Notice */}
        {summaryError && (
          <div className="bg-[#FFF5F5] border border-[#D95C55]/30 rounded-xl p-4 flex items-center space-x-2.5 text-[#D95C55] text-xs font-mono shadow-glass-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#D95C55]" />
            <span>Connection Notice: Could not reach FastAPI backend. Verify backend is running on port 8000.</span>
          </div>
        )}

        {/* 1. Day-Ahead Wind Position & Floating Glass KPIs */}
        {summary ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, type: 'spring', stiffness: 300, damping: 30 }}
          >
            <DecisionCockpit summary={summary} latestPoint={latestPoint} />
          </motion.div>
        ) : (
          <div className="h-44 solid-data-surface rounded-2xl animate-pulse flex items-center justify-center text-xs font-mono text-[#8D98A3]">
            Initialising day-ahead position & risk benchmarks...
          </div>
        )}

        {/* 2. Visual Narrative Viewport */}
        <AnimatePresence mode="wait">
          {activeTab === 'SERIES' && (
            <motion.div
              key="SERIES"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* ECharts Main Forecast vs Actual Chart */}
              {isSeriesLoading ? (
                <div className="h-[450px] solid-data-surface rounded-2xl animate-pulse flex items-center justify-center text-xs font-mono text-[#8D98A3]">
                  Rendering 30-minute settlement surface...
                </div>
              ) : series ? (
                <ForecastHeroChart series={series} onSelectPeriod={handleSelectPeriod} />
              ) : null}

              {/* Market Intelligence Briefing */}
              {summary && <MarketIntelligence summary={summary} />}
            </motion.div>
          )}

          {activeTab === 'ACCURACY' && (
            <motion.div
              key="ACCURACY"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ForecastEvolutionScrubber initialDeliveryTime={selectedPeriod} />
            </motion.div>
          )}

          {activeTab === 'TABLE' && (
            <motion.div
              key="TABLE"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
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

      {/* Terminal Footnote */}
      <footer className="border-t border-[#E4E8EC] bg-white/60 backdrop-blur-md py-4 mt-auto relative z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#8D98A3] gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-[#66717C] font-semibold">BMRS DATA FEEDS:</span>
            <span>FUELHH OUTTURN (WIND)</span>
            <span className="text-[#CBD2D9]">·</span>
            <span>WINDFOR FORECAST RUNS</span>
          </div>
          <div>
            <span>GB ELECTRICITY MARKET TIME: GMT (UTC+0) · SETTLEMENT PERIODS 1–48</span>
          </div>
          <div>
            <span className="text-[#66717C] font-medium">REint Forecasting IQ · Energy Terminal</span>
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
