import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { AtmosphericField } from './components/layout/AtmosphericField';
import { CommandHeader } from './components/layout/CommandHeader';
import { DecisionCockpit } from './components/summary/DecisionCockpit';
import { MetricsStrip } from './components/summary/MetricsStrip';
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

  // Analytical queries
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
    <div className="min-h-screen bg-[#EEF2F1] ambient-terminal-depth text-[#18201F] flex flex-col font-sans relative selection:bg-[#C96A3D]/20 selection:text-[#18201F]">
      {/* Calm Ambient Depth Streamlines */}
      <AtmosphericField />

      {/* Thin Elegant Application Chrome Header */}
      <CommandHeader
        cutoffHour={cutoffHour}
        setCutoffHour={setCutoffHour}
        resolution={resolution}
        setResolution={setResolution}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 relative z-10">
        {/* Backend Connectivity Notice */}
        {summaryError && (
          <div className="bg-white border border-[#C84B4B]/40 rounded-lg p-3 flex items-center space-x-2 text-[#C84B4B] text-xs font-mono shadow-terminal-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#C84B4B]" />
            <span>Connection Notice: Could not reach FastAPI backend. Verify backend is running on port 8000.</span>
          </div>
        )}

        {/* 1. DAY-AHEAD WIND POSITION: Editorial Information Block (Zero Card Boxes) */}
        {summary ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DecisionCockpit summary={summary} latestPoint={latestPoint} />
          </motion.div>
        ) : (
          <div className="h-28 border-b border-[#DCE3E0] animate-pulse flex items-center justify-center text-xs font-mono text-[#8B9692]">
            Initialising day-ahead position & benchmarks...
          </div>
        )}

        {/* 2. Visual Analytical Narrative Viewport */}
        <AnimatePresence mode="wait">
          {activeTab === 'SERIES' && (
            <motion.div
              key="SERIES"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* MAIN FORECAST / ACTUAL VISUALIZATION: Hero of the Product */}
              {isSeriesLoading ? (
                <div className="h-[500px] terminal-surface rounded-xl animate-pulse flex items-center justify-center text-xs font-mono text-[#8B9692]">
                  Loading 30-minute settlement trajectory...
                </div>
              ) : series ? (
                <ForecastHeroChart series={series} onSelectPeriod={handleSelectPeriod} />
              ) : null}

              {/* HORIZONTAL ACCURACY METRICS STRIP: Clean Thin Dividers */}
              {summary && <MetricsStrip summary={summary} />}

              {/* MARKET INTELLIGENCE: Editorial Research Briefing */}
              {summary && <MarketIntelligence summary={summary} />}
            </motion.div>
          )}

          {activeTab === 'ACCURACY' && (
            <motion.div
              key="ACCURACY"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {summary && <MetricsStrip summary={summary} />}
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
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <ForecastEvolutionScrubber initialDeliveryTime={selectedPeriod} />
            </motion.div>
          )}

          {activeTab === 'TABLE' && (
            <motion.div
              key="TABLE"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
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

      {/* Terminal Minimalist Footnote */}
      <footer className="border-t border-[#DCE3E0] bg-transparent py-4 mt-auto relative z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8B9692] gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-[#18201F] font-medium">BMRS DATA FEEDS:</span>
            <span>FUELHH Outturn (Wind)</span>
            <span className="text-[#DCE3E0]">·</span>
            <span>WINDFOR Forecast Runs</span>
          </div>
          <div>
            <span>GB Electricity Market: GMT (UTC+0) · Settlement Periods 1–48</span>
          </div>
          <div>
            <span className="text-[#687370]">REint Forecasting IQ · Energy Terminal</span>
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
