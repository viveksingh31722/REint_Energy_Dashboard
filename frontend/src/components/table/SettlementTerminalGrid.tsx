import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { TimeSeriesPoint } from '../../types';
import { ArrowUpDown, Download, Search, SlidersHorizontal } from 'lucide-react';

interface TerminalGridProps {
  cutoffHour: number;
  resolution: string;
  onSelectPeriod?: (deliveryTime: string) => void;
}

export const SettlementTerminalGrid: React.FC<TerminalGridProps> = ({
  cutoffHour,
  resolution,
  onSelectPeriod,
}) => {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [sortBy, setSortBy] = useState<string>('deliveryTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState<string>('');
  const [errorFilter, setErrorFilter] = useState<'all' | 'severe' | 'surplus' | 'shortfall'>('all');

  const { data: tableData, isLoading } = useQuery({
    queryKey: ['table', cutoffHour, resolution, page, pageSize, sortBy, sortOrder, errorFilter],
    queryFn: () =>
      api.getTable({
        cutoffHour,
        resolution,
        page,
        pageSize,
        sortBy,
        order: sortOrder,
        minAbsError: errorFilter === 'severe' ? 2500 : undefined,
      }),
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleExportCSV = () => {
    window.location.href = api.getExportCsvUrl(cutoffHour, resolution);
  };

  // Client-side search and direction filter
  const displayedRecords = React.useMemo(() => {
    if (!tableData?.records) return [];
    let list = tableData.records;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.settlementDate.toLowerCase().includes(q) ||
          r.deliveryTime.toLowerCase().includes(q) ||
          r.settlementPeriod.toString().includes(q)
      );
    }
    if (errorFilter === 'surplus') {
      list = list.filter((r) => (r.errorMW ?? 0) >= 0);
    } else if (errorFilter === 'shortfall') {
      list = list.filter((r) => (r.errorMW ?? 0) < 0);
    }
    return list;
  }, [tableData, search, errorFilter]);

  return (
    <div className="dark-card p-6 space-y-4">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#252C29] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E58A5C]" />
            <h3 className="text-xs font-semibold tracking-wider uppercase text-[#F1F4F1]">
              Settlement Period Reconciliation Terminal
            </h3>
            <span className="text-[#252C29]">·</span>
            <span className="text-xs text-[#8B9691]">1,488 Half-Hour Settlement Blocks</span>
          </div>
          <p className="text-xs text-[#5F6A65] mt-0.5">
            Full audit log of Elexon FUELHH metered outturns vs. WINDFOR day-ahead commitments
          </p>
        </div>

        {/* Global CSV Export & Filter Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="flex items-center bg-[#080A0A] border border-[#252C29] rounded-md px-2 py-1 text-xs">
            <Search className="w-3 h-3 text-[#5F6A65] mr-1.5" />
            <input
              type="text"
              placeholder="Filter date or SP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-[#F1F4F1] placeholder-[#5F6A65] focus:outline-none font-mono w-36 text-xs"
            />
          </div>

          {/* Quick Error Severity Filters */}
          <div className="flex items-center bg-[#080A0A] border border-[#252C29] rounded-md p-0.5 text-xs font-mono">
            <SlidersHorizontal className="w-3 h-3 text-[#5F6A65] mx-1" />
            {(['all', 'severe', 'surplus', 'shortfall'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setErrorFilter(filter);
                  setPage(1);
                }}
                className={`px-2 py-0.5 rounded text-[11px] capitalize transition-all ${
                  errorFilter === filter
                    ? 'bg-[#151A18] text-[#F1F4F1] font-semibold border border-[#252C29]'
                    : 'text-[#8B9691] hover:text-[#F1F4F1]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-[#151A18] hover:bg-[#1A201E] border border-[#252C29] text-[#E58A5C] font-semibold px-3 py-1 rounded-md text-xs transition-all cursor-pointer shadow-terminal-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Grid Table */}
      <div className="border border-[#252C29] rounded-xl overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-[#080A0A] text-[#5F6A65] border-b border-[#252C29] select-none text-[10px] uppercase">
            <tr>
              <th
                onClick={() => handleSort('deliveryTime')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-[#F1F4F1]"
              >
                <div className="flex items-center space-x-1">
                  <span>Delivery GMT</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-[#5F6A65]" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">SP</th>
              <th
                onClick={() => handleSort('actualGenerationMW')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-[#F1F4F1] text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Actual (MW)</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-[#5F6A65]" />
                </div>
              </th>
              <th
                onClick={() => handleSort('forecastGenerationMW')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-[#F1F4F1] text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Forecast (MW)</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-[#5F6A65]" />
                </div>
              </th>
              <th
                onClick={() => handleSort('errorMW')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-[#F1F4F1] text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Signed Error</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-[#5F6A65]" />
                </div>
              </th>
              <th
                onClick={() => handleSort('absoluteErrorMW')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-[#F1F4F1] text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Absolute |Err|</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-[#5F6A65]" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Lead Horizon</th>
              <th className="py-2.5 px-3.5 text-center">Desk Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2220] text-[#8B9691]">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#5F6A65]">
                  Querying Elexon settlement engine records...
                </td>
              </tr>
            ) : displayedRecords.length > 0 ? (
              displayedRecords.map((row: TimeSeriesPoint) => {
                const absErr = row.absoluteErrorMW ?? 0;
                const isSevere = absErr >= 2500;
                const isUnder = (row.errorMW ?? 0) < 0; // Shortfall
                const errorSign = (row.errorMW ?? 0) > 0 ? '+' : '';

                return (
                  <tr
                    key={row.deliveryTime}
                    onClick={() => onSelectPeriod && onSelectPeriod(row.deliveryTime)}
                    className="hover:bg-[#151A18] cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3.5 text-[#F1F4F1] font-medium">
                      {row.settlementDate} {row.deliveryTime.substring(11, 16)}
                    </td>
                    <td className="py-2.5 px-3 text-center text-[#5F6A65]">{row.settlementPeriod}</td>
                    <td className="py-2.5 px-3.5 text-right text-[#35B89A] font-semibold tabular-nums">
                      {row.actualGenerationMW?.toLocaleString() ?? '—'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-[#E58A5C] font-semibold tabular-nums">
                      {row.forecastGenerationMW?.toLocaleString() ?? '—'}
                    </td>
                    <td
                      className={`py-2.5 px-3.5 text-right font-semibold tabular-nums ${
                        isUnder ? 'text-[#E58A5C]' : 'text-[#35B89A]'
                      }`}
                    >
                      {row.errorMW !== null && row.errorMW !== undefined
                        ? `${errorSign}${row.errorMW.toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-[#F1F4F1] tabular-nums">
                      {row.absoluteErrorMW !== null && row.absoluteErrorMW !== undefined
                        ? row.absoluteErrorMW.toLocaleString()
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center text-[#5F6A65]">
                      {row.forecastHorizonHours ? `${row.forecastHorizonHours}h` : '—'}
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      {isSevere ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E0645A]/15 border border-[#E0645A]/30 text-[#E0645A]">
                          <span>Severe Miss</span>
                        </span>
                      ) : absErr < 1000 ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#35B89A]/15 border border-[#35B89A]/30 text-[#35B89A]">
                          <span>Balanced</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#151A18] text-[#8B9691]">
                          <span>Nominal</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#5F6A65]">
                  No matching settlement period records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {tableData && (
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#8B9691] pt-2 gap-3">
          <div>
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, tableData.totalCount)} of{' '}
            <strong className="text-[#F1F4F1]">{tableData.totalCount.toLocaleString()}</strong> settlement periods
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-[#080A0A] border border-[#252C29] text-[#F1F4F1] rounded px-2 py-1 focus:outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2.5 py-1 rounded border border-[#252C29] bg-[#111514] hover:bg-[#151A18] disabled:opacity-30 disabled:cursor-not-allowed text-[#F1F4F1]"
              >
                Prev
              </button>
              <span className="px-2 text-[#F1F4F1] font-semibold">
                {page} / {tableData.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(tableData.totalPages, p + 1))}
                disabled={page >= tableData.totalPages}
                className="px-2.5 py-1 rounded border border-[#252C29] bg-[#111514] hover:bg-[#151A18] disabled:opacity-30 disabled:cursor-not-allowed text-[#F1F4F1]"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
