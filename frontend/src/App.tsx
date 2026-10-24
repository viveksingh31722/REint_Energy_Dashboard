import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { KpiRow } from './components/summary/KpiRow';
import { ForecastHeroChart } from './components/charts/ForecastHeroChart';
import { ForecastIntelligencePanel } from './components/summary/ForecastIntelligencePanel';
import { ForecastEvolutionTimeline } from './components/evolution/ForecastEvolutionTimeline';
import { ErrorDistributionCard } from './components/accuracy/ErrorDistributionCard';
import { SettlementPreviewCard } from './components/table/SettlementPreviewCard';
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
    <div className="min-h-screen bg-[#0B0D0D] text-[#F1F4F1] flex font-sans selection:bg-[#E58A5C]/25 selection:text-[#F1F4F1]">
      {/* 1. LEFT SIDEBAR: 80px Compact Chrome */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. MAIN APPLICATION WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Application Bar */}
        <TopBar
          cutoffHour={cutoffHour}
          setCutoffHour={setCutoffHour}
          resolution={resolution}
          setResolution={setResolution}
        />

        <main className="flex-1 max-w-[1680px] w-full mx-auto p-5 sm:p-6 space-y-5">
          {/* Backend Connectivity Notice */}
          {summaryError && (
            <div className="bg-[#151A18] border border-[#E0645A]/40 rounded-xl p-3 flex items-center space-x-2 text-[#E0645A] text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#E0645A]" />
              <span>Connection Notice: Could not reach FastAPI backend. Verify backend is running on port 8000.</span>
            </div>
          )}

          {/* PRIMARY KPI ROW: 4 Compact Premium Cards with Mini Sparklines */}
          {summary ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <KpiRow summary={summary} latestPoint={latestPoint} />
            </motion.div>
          ) : (
            <div className="h-28 dark-card animate-pulse flex items-center justify-center text-xs font-mono text-[#5F6A65]">
              Initialising day-ahead position and benchmarks...
            </div>
          )}

          {/* DYNAMIC VIEWPORT */}
          <AnimatePresence mode="wait">
            {activeTab === 'SERIES' && (
              <motion.div
                key="SERIES"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="space-y-5"
              >
                {/* TWO-COLUMN ANALYTICAL WORKSPACE: 70% Left Chart + 30% Right Intelligence */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  <div className="lg:col-span-8 min-h-[460px]">
                    {isSeriesLoading ? (
                      <div className="h-full min-h-[460px] dark-card animate-pulse flex items-center justify-center text-xs font-mono text-[#5F6A65]">
                        Rendering 30-minute settlement surface...
                      </div>
                    ) : series ? (
                      <ForecastHeroChart series={series} onSelectPeriod={handleSelectPeriod} />
                    ) : null}
                  </div>

                  <div className="lg:col-span-4 min-h-[460px]">
                    {summary ? (
                      <ForecastIntelligencePanel summary={summary} />
                    ) : null}
                  </div>
                </div>

                {/* SECONDARY ANALYTICS ROW: 2 Cards (Evolution Timeline + Error Distribution) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  <div className="lg:col-span-7">
                    <ForecastEvolutionTimeline initialDeliveryTime={selectedPeriod} />
                  </div>
                  <div className="lg:col-span-5">
                    <ErrorDistributionCard distribution={distribution} />
                  </div>
                </div>

                {/* BOTTOM: SETTLEMENT PREVIEW COMPACT CARD */}
                <SettlementPreviewCard
                  cutoffHour={cutoffHour}
                  resolution={resolution}
                  onViewFullTable={() => setActiveTab('TABLE')}
                  onSelectPeriod={handleSelectPeriod}
                />
              </motion.div>
            )}

            {activeTab === 'ACCURACY' && (
              <motion.div
                key="ACCURACY"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
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
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                <ForecastEvolutionScrubber initialDeliveryTime={selectedPeriod} />
              </motion.div>
            )}

            {activeTab === 'TABLE' && (
              <motion.div
                key="TABLE"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
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

        {/* Minimal Terminal Footer */}
        <footer className="border-t border-[#252C29] bg-[#080A0A] py-3 px-6 mt-auto text-xs text-[#5F6A65] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-[#8B9691] font-medium">BMRS DATA FEEDS:</span>
            <span>FUELHH Outturn (Wind)</span>
            <span className="text-[#252C29]">·</span>
            <span>WINDFOR Forecast Runs</span>
          </div>
          <div>
            <span>GB Electricity Market: GMT (UTC+0) · Settlement Periods 1–48</span>
          </div>
          <div>
            <span className="text-[#8B9691]">REint Forecasting IQ · Energy Trading Terminal</span>
          </div>
        </footer>
      </div>
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
