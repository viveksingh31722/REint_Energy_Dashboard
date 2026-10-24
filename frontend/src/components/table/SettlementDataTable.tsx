import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Download, ChevronLeft, ChevronRight, ArrowUpDown, Filter, Search } from 'lucide-react';

interface TableProps {
  cutoffHour: number;
  resolution: string;
  onSelectPeriod?: (deliveryTime: string) => void;
}

export const SettlementDataTable: React.FC<TableProps> = ({
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
      setOrder('desc'); // Default to descending on new metric
    }
    setPage(1);
  };

  const exportUrl = api.getExportCsvUrl(cutoffHour, resolution);

  return (
    <div className="bg-navy-800/80 border border-navy-700 rounded-xl p-5 shadow-lg space-y-4">
      {/* Table Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Settlement Period Reconciliation Grid</span>
            <span className="text-xs px-2 py-0.5 rounded bg-wind-teal/10 border border-wind-teal/30 text-wind-teal font-mono">
              {data?.totalCount ?? 0} Records
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Half-hourly metered volumes vs. day-ahead market commitment baselines
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Minimum Error Filter */}
          <div className="flex items-center space-x-2 bg-navy-900 border border-navy-700 rounded-lg px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Min Error:</span>
            <select
              value={minAbsError || ''}
              onChange={(e) => {
                setMinAbsError(e.target.value ? Number(e.target.value) : undefined);
                setPage(1);
              }}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-navy-800">All Errors</option>
              <option value="1000" className="bg-navy-800">&gt; 1,000 MW</option>
              <option value="2000" className="bg-navy-800">&gt; 2,000 MW</option>
              <option value="3000" className="bg-navy-800">&gt; 3,000 MW (Extreme)</option>
            </select>
          </div>

          {/* Export CSV Button */}
          <a
            href={exportUrl}
            download
            className="flex items-center space-x-1.5 bg-wind-teal/20 hover:bg-wind-teal/30 border border-wind-teal/40 text-wind-teal px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Clean CSV</span>
          </a>
        </div>
      </div>

      {/* Grid Container */}
      <div className="border border-navy-700/80 rounded-lg overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-navy-900 text-slate-400 border-b border-navy-700/80 select-none">
            <tr>
              <th
                onClick={() => handleSort('deliveryTime')}
                className="py-3 px-3.5 cursor-pointer hover:text-white"
              >
                <div className="flex items-center space-x-1">
                  <span>Delivery Time (UTC)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-3">SP</th>
              <th
                onClick={() => handleSort('actualGenerationMW')}
                className="py-3 px-3.5 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Actual Outturn</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('forecastGenerationMW')}
                className="py-3 px-3.5 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>DA Forecast</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('errorMW')}
                className="py-3 px-3.5 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Signed Error</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('absoluteErrorMW')}
                className="py-3 px-3.5 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Absolute Error</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Horizon</th>
              <th className="py-3 px-3 text-center">Risk Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-800/80 text-slate-300">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                  Loading settlement grid...
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
                    className="hover:bg-navy-700/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3.5 text-white font-medium">
                      {r.deliveryTime.substring(0, 10)} {r.deliveryTime.substring(11, 16)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      SP {r.settlementPeriod}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-wind-teal font-semibold">
                      {r.actualGenerationMW.toLocaleString()} MW
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-wind-violet font-semibold">
                      {r.forecastGenerationMW !== undefined && r.forecastGenerationMW !== null
                        ? `${r.forecastGenerationMW.toLocaleString()} MW`
                        : 'N/A'}
                    </td>
                    <td
                      className={`py-2.5 px-3.5 text-right font-semibold ${
                        isUnder ? 'text-wind-emerald' : 'text-wind-rose'
                      }`}
                    >
                      {r.errorMW !== undefined && r.errorMW !== null
                        ? `${r.errorMW > 0 ? '+' : ''}${r.errorMW.toLocaleString()} MW`
                        : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-white font-semibold">
                      {r.absoluteErrorMW !== undefined && r.absoluteErrorMW !== null
                        ? `±${r.absoluteErrorMW.toLocaleString()} MW`
                        : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400">
                      {r.forecastHorizonHours ? `${r.forecastHorizonHours}h` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {isSevere ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/60 border border-rose-500/40 text-rose-300">
                          Tail Miss &gt; 2k
                        </span>
                      ) : isUnder ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
                          Surplus
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950/40 border border-amber-500/30 text-amber-300">
                          Shortfall
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {data && (
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 pt-2 gap-3">
          <div className="flex items-center space-x-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-navy-900 border border-navy-700 text-white rounded px-2 py-1 focus:outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, data.totalCount)} of{' '}
              {data.totalCount}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded border border-navy-700 bg-navy-900 hover:bg-navy-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-white">
              Page {data.page} of {data.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              className="p-1.5 rounded border border-navy-700 bg-navy-900 hover:bg-navy-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
