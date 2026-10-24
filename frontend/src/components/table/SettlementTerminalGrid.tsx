import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Download, ChevronLeft, ChevronRight, ArrowUpDown, Filter } from 'lucide-react';

interface GridProps {
  cutoffHour: number;
  resolution: string;
  onSelectPeriod?: (deliveryTime: string) => void;
}

export const SettlementTerminalGrid: React.FC<GridProps> = ({
  cutoffHour,
  resolution,
  onSelectPeriod,
}) => {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [sortBy, setSortBy] = useState<string>('deliveryTime');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [minAbsError, setMinAbsError] = useState<number | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['table', page, pageSize, sortBy, order, minAbsError, cutoffHour, resolution],
    queryFn: () =>
      api.getTable({
        page,
        pageSize,
        sortBy,
        order,
        minAbsError,
        cutoffHour,
        resolution,
      }),
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
    setPage(1);
  };

  const exportUrl = api.getExportCsvUrl(cutoffHour, resolution);

  return (
    <div className="border border-white/[0.08] bg-[#0E131F]/90 rounded-lg p-5 backdrop-blur-md shadow-2xl space-y-4">
      {/* Table Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#00E5FF]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Settlement Period Reconciliation Grid
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-[#00E5FF] border border-white/[0.08]">
              {data?.totalCount ?? 0} Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Granular half-hourly outturn vs. D-1 gate commitment benchmarks
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          {/* Min Error Filter Buttons */}
          <div className="flex items-center bg-[#090D16] border border-white/[0.06] rounded p-1 text-[11px]">
            <span className="text-slate-400 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Min:
            </span>
            {[
              { label: 'All', val: undefined },
              { label: '>1k MW', val: 1000 },
              { label: '>2k MW', val: 2000 },
              { label: '>3k MW', val: 3000 },
            ].map((f, i) => (
              <button
                key={i}
                onClick={() => {
                  setMinAbsError(f.val);
                  setPage(1);
                }}
                className={`px-2 py-0.5 rounded transition-colors ${
                  minAbsError === f.val
                    ? 'bg-[#1C2538] text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <a
            href={exportUrl}
            download
            className="flex items-center space-x-1.5 bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 border border-[#00E5FF]/30 text-[#00E5FF] px-3 py-1.5 rounded text-[11px] font-medium transition-all shadow-sm"
          >
            <Download className="w-3 h-3" />
            <span>EXPORT CLEAN CSV</span>
          </a>
        </div>
      </div>

      {/* High-Density Terminal Table */}
      <div className="border border-white/[0.06] rounded overflow-x-auto">
        <table className="w-full text-left font-mono text-xs tabular-nums">
          <thead className="bg-[#090D16] text-slate-400 border-b border-white/[0.06] select-none text-[10px] uppercase">
            <tr>
              <th
                onClick={() => handleSort('deliveryTime')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-white"
              >
                <div className="flex items-center space-x-1">
                  <span>Delivery Time (UTC)</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-500" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">SP</th>
              <th
                onClick={() => handleSort('actualGenerationMW')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Actual Outturn</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('forecastGenerationMW')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>DA Forecast</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('errorMW')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Signed Error</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('absoluteErrorMW')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Abs Deviation</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-slate-500" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Horizon</th>
              <th className="py-2.5 px-3 text-center">Imbalance State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03] text-slate-300">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  Loading settlement reconciliation records...
                </td>
              </tr>
            ) : data && data.records.length > 0 ? (
              data.records.map((r, idx) => {
                const isSevere = (r.absoluteErrorMW ?? 0) >= 2000;
                const isUnder = (r.errorMW ?? 0) > 0;

                return (
                  <tr
                    key={idx}
                    onClick={() => onSelectPeriod && onSelectPeriod(r.deliveryTime)}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-3.5 text-white font-medium">
                      {r.deliveryTime.substring(0, 10)} {r.deliveryTime.substring(11, 16)}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-400">
                      SP {r.settlementPeriod}
                    </td>
                    <td className="py-2 px-3.5 text-right text-[#00E5FF] font-semibold">
                      {r.actualGenerationMW.toLocaleString()} MW
                    </td>
                    <td className="py-2 px-3.5 text-right text-[#A78BFA] font-semibold">
                      {r.forecastGenerationMW !== undefined && r.forecastGenerationMW !== null
                        ? `${r.forecastGenerationMW.toLocaleString()} MW`
                        : 'N/A'}
                    </td>
                    <td
                      className={`py-2 px-3.5 text-right font-semibold ${
                        isUnder ? 'text-[#34D399]' : 'text-[#FB7185]'
                      }`}
                    >
                      {r.errorMW !== undefined && r.errorMW !== null
                        ? `${r.errorMW > 0 ? '+' : ''}${r.errorMW.toLocaleString()} MW`
                        : 'N/A'}
                    </td>
                    <td className="py-2 px-3.5 text-right text-slate-200">
                      {r.absoluteErrorMW !== undefined && r.absoluteErrorMW !== null
                        ? `±${r.absoluteErrorMW.toLocaleString()} MW`
                        : 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-400">
                      {r.forecastHorizonHours ? `${r.forecastHorizonHours}h` : '-'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {isSevere ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FB7185]/10 border border-[#FB7185]/20 text-[#FB7185]">
                          <span className="w-1 h-1 rounded-full bg-[#FB7185]" />
                          <span>Tail Miss &gt; 2k</span>
                        </span>
                      ) : isUnder ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399]">
                          <span className="w-1 h-1 rounded-full bg-[#34D399]" />
                          <span>Surplus</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#FBBF24]/10 border border-[#FBBF24]/20 text-[#FBBF24]">
                          <span className="w-1 h-1 rounded-full bg-[#FBBF24]" />
                          <span>Shortfall</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No records match the active criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {data && (
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 pt-2 gap-3">
          <div className="flex items-center space-x-2">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Select rows per page"
              className="bg-[#090D16] border border-white/[0.08] text-white rounded px-2 py-1 focus:outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.totalCount)} of{' '}
              {data.totalCount}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous Page"
              className="p-1 rounded border border-white/[0.08] bg-[#090D16] hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white">
              Page {data.page} of {data.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              aria-label="Next Page"
              className="p-1 rounded border border-white/[0.08] bg-[#090D16] hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
