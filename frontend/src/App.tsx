import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Navbar } from './components/layout/Navbar';
import { ExecutiveKPIs } from './components/summary/ExecutiveKPIs';
import { TradingInsights } from './components/summary/TradingInsights';
import { ActualVsForecastChart } from './components/charts/ActualVsForecastChart';
import { AccuracyDeepDive } from './components/accuracy/AccuracyDeepDive';
import { ForecastEvolutionView } from './components/evolution/ForecastEvolutionView';
import { SettlementDataTable } from './components/table/SettlementDataTable';
import { api } from './services/api';
import { LineChart, BarChart2, GitCommit, Table, RefreshCw, AlertCircle } from 'lucide-react';

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

  // Queries
  const {
    data: summary,
    isLoading: isSummaryLoading,
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
    <div className="min-h-screen bg-navy-900 text-slate-100 flex flex-col font-sans">
      <Navbar
        cutoffHour={cutoffHour}
        setCutoffHour={setCutoffHour}
        resolution={resolution}
        setResolution={setResolution}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Banner if API connection fails */}
        {summaryError && (
          <div className="bg-rose-950/80 border border-rose-500 rounded-xl p-4 flex items-center space-x-3 text-rose-200 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">Backend Connection Notice:</span> Could not connect to API server. Ensure the backend daemon is running on port 8000.
            </div>
          </div>
        )}

        {/* Executive KPI Strip */}
        {summary ? (
          <ExecutiveKPIs summary={summary} latestPoint={latestPoint} />
        ) : (
          <div className="h-28 bg-navy-800/40 border border-navy-700/60 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-500">
            Loading executive benchmarks...
          </div>
        )}

        {/* Automated Trading Insights Panel */}
        {summary && <TradingInsights insights={summary.insights} />}

        {/* Controlled Tab Navigation */}
        <div className="border-b border-navy-700/80 flex items-center justify-between">
          <nav className="flex space-x-1 sm:space-x-3 text-xs sm:text-sm font-medium">
            <button
              onClick={() => setActiveTab('SERIES')}
              className={`flex items-center space-x-2 py-3 px-3 border-b-2 transition-all ${
                activeTab === 'SERIES'
                  ? 'border-wind-teal text-wind-teal font-semibold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <LineChart className="w-4 h-4" />
              <span>Forecast vs. Actuals</span>
            </button>

            <button
              onClick={() => setActiveTab('ACCURACY')}
              className={`flex items-center space-x-2 py-3 px-3 border-b-2 transition-all ${
                activeTab === 'ACCURACY'
                  ? 'border-wind-teal text-wind-teal font-semibold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Forecast Accuracy & Error Analysis</span>
            </button>

            <button
              onClick={() => setActiveTab('EVOLUTION')}
              className={`flex items-center space-x-2 py-3 px-3 border-b-2 transition-all ${
                activeTab === 'EVOLUTION'
                  ? 'border-wind-teal text-wind-teal font-semibold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <GitCommit className="w-4 h-4" />
              <span>Forecast Evolution Tracker</span>
            </button>

            <button
              onClick={() => setActiveTab('TABLE')}
              className={`flex items-center space-x-2 py-3 px-3 border-b-2 transition-all ${
                activeTab === 'TABLE'
                  ? 'border-wind-teal text-wind-teal font-semibold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Settlement Reconciliation Grid</span>
            </button>
          </nav>

          <div className="hidden sm:flex items-center text-xs text-slate-400 font-mono">
            <span>Market Delivery: Jan 1 – 31, 2026 (GMT)</span>
          </div>
        </div>

        {/* Tab Viewport */}
        <div className="transition-all">
          {activeTab === 'SERIES' && (
            <div>
              {isSeriesLoading ? (
                <div className="h-[400px] bg-navy-800/40 border border-navy-700/60 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-500">
                  Loading 30-minute time-series data...
                </div>
              ) : series ? (
                <ActualVsForecastChart series={series} onSelectPeriod={handleSelectPeriod} />
              ) : null}
            </div>
          )}

          {activeTab === 'ACCURACY' && (
            <AccuracyDeepDive
              series={series || []}
              distribution={distribution}
              diurnal={diurnal}
              horizon={horizon}
            />
          )}

          {activeTab === 'EVOLUTION' && (
            <ForecastEvolutionView initialDeliveryTime={selectedPeriod} />
          )}

          {activeTab === 'TABLE' && (
            <SettlementDataTable
              cutoffHour={cutoffHour}
              resolution={resolution}
              onSelectPeriod={handleSelectPeriod}
            />
          )}
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="bg-navy-950 border-t border-navy-800/80 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-300">Data Source:</span>
            <span>Elexon BMRS (FUELHH Outturn & WINDFOR Forecast Streams)</span>
          </div>
          <div>
            <span>UK Electricity Market Timezone: GMT (UTC+0) | Settlement Periods 1 to 48</span>
          </div>
          <div className="text-slate-400">
            <span>REint Energy Procurement Intelligence v1.0</span>
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
