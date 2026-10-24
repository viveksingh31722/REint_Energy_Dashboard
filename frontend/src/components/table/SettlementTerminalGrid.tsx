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
    <div className="solid-data-surface rounded-2xl p-6 shadow-glass-md space-y-4">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E4E8EC] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#E27D4F]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#17202A]">
              Settlement Period Reconciliation Terminal
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F4F6F8] text-[#E27D4F] border border-[#E4E8EC] font-semibold">
              30-min Audit Feed
            </span>
          </div>
          <p className="text-xs text-[#66717C] mt-1 font-mono">
            Granular reconciliation of Elexon FUELHH actuals vs. WINDFOR day-ahead commitments
          </p>
        </div>

        {/* Global CSV Export & Filter Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="flex items-center bg-[#F4F6F8] border border-[#E4E8EC] rounded-lg p-1 text-[11px] shadow-glass-sm">
            <span className="text-[#8D98A3] px-2 flex items-center gap-1 font-mono">
              <Search className="w-3 h-3" />
            </span>
            <input
              type="text"
              placeholder="Filter date or SP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-[#17202A] placeholder-[#8D98A3] focus:outline-none font-mono w-44 text-xs"
            />
          </div>

          {/* Quick Error Severity Filters */}
          <div className="flex items-center bg-[#F4F6F8] border border-[#E4E8EC] rounded-lg p-1 text-[11px] font-mono shadow-glass-sm">
            <SlidersHorizontal className="w-3 h-3 text-[#8D98A3] mx-1.5" />
            {(['all', 'severe', 'surplus', 'shortfall'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setErrorFilter(filter);
                  setPage(1);
                }}
                className={`px-2 py-0.5 rounded-md capitalize transition-all ${
                  errorFilter === filter
                    ? 'bg-white text-[#17202A] font-semibold shadow-sm'
                    : 'text-[#8D98A3] hover:text-[#17202A]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-white hover:bg-[#F4F6F8] border border-[#E4E8EC] text-[#E27D4F] font-semibold px-3 py-1.5 rounded-lg text-xs transition-all shadow-glass-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Grid Table */}
      <div className="border border-[#E4E8EC] rounded-xl overflow-x-auto shadow-glass-sm">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-[#F4F6F8] text-[#8D98A3] border-b border-[#E4E8EC] select-none text-[10px] uppercase">
            <tr>
              <th
                onClick={() => handleSort('deliveryTime')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-[#17202A]"
              >
                <div className="flex items-center space-x-1">
                  <span>Delivery GMT</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-[#8D98A3]" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">SP</th>
              <th
                onClick={() => handleSort('actualGenerationMW')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-[#17202A] text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Actual (MW)</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-[#8D98A3]" />
                </div>
              </th>
              <th
                onClick={() => handleSort('forecastGenerationMW')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-[#17202A] text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Forecast (MW)</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-[#8D98A3]" />
                </div>
              </th>
              <th
                onClick={() => handleSort('errorMW')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-[#17202A] text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Signed Error</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-[#8D98A3]" />
                </div>
              </th>
              <th
                onClick={() => handleSort('absoluteErrorMW')}
                className="py-2.5 px-3.5 cursor-pointer hover:text-[#17202A] text-right"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Absolute |Err|</span>
                  <ArrowUpDown className="w-2.5 h-2.5 text-[#8D98A3]" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Lead Horizon</th>
              <th className="py-2.5 px-3.5 text-center">Desk Risk Class</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E8EC] text-[#66717C]">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#8D98A3]">
                  Querying Elexon settlement engine records...
                </td>
              </tr>
            ) : displayedRecords.length > 0 ? (
              displayedRecords.map((row: TimeSeriesPoint) => {
                const absErr = row.absoluteErrorMW ?? 0;
                const isSevere = absErr >= 2500;
                const isUnder = (row.errorMW ?? 0) < 0; // Negative error = forecast > actual (over-forecast shortfall)
                const errorSign = (row.errorMW ?? 0) > 0 ? '+' : '';

                return (
                  <tr
                    key={row.deliveryTime}
                    onClick={() => onSelectPeriod && onSelectPeriod(row.deliveryTime)}
                    className="hover:bg-[#F4F6F8] cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3.5 text-[#17202A] font-medium">
                      {row.settlementDate} {row.deliveryTime.substring(11, 16)}
                    </td>
                    <td className="py-2.5 px-3 text-center text-[#8D98A3]">{row.settlementPeriod}</td>
                    <td className="py-2.5 px-3.5 text-right text-[#168F79] font-semibold tabular-nums">
                      {row.actualGenerationMW?.toLocaleString() ?? '—'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-[#E27D4F] font-semibold tabular-nums">
                      {row.forecastGenerationMW?.toLocaleString() ?? '—'}
                    </td>
                    <td
                      className={`py-2.5 px-3.5 text-right font-semibold tabular-nums ${
                        isUnder ? 'text-[#D95C55]' : 'text-[#3D9B76]'
                      }`}
                    >
                      {row.errorMW !== null && row.errorMW !== undefined
                        ? `${errorSign}${row.errorMW.toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-[#17202A] tabular-nums">
                      {row.absoluteErrorMW !== null && row.absoluteErrorMW !== undefined
                        ? row.absoluteErrorMW.toLocaleString()
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center text-[#8D98A3]">
                      {row.forecastHorizonHours ? `${row.forecastHorizonHours}h` : '—'}
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      {isSevere ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#D95C55]/10 border border-[#D95C55]/30 text-[#D95C55]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D95C55]" />
                          <span>Severe Miss</span>
                        </span>
                      ) : absErr < 1000 ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#168F79]/10 border border-[#168F79]/30 text-[#168F79]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#168F79]" />
                          <span>Balanced</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#E27D4F]/10 border border-[#E27D4F]/30 text-[#E27D4F]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E27D4F]" />
                          <span>Standard Deviation</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#8D98A3]">
                  No matching settlement period records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {tableData && (
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#66717C] pt-2 gap-3">
          <div>
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, tableData.totalCount)} of{' '}
            <strong className="text-[#17202A]">{tableData.totalCount.toLocaleString()}</strong> settlement periods
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
                className="bg-white border border-[#E4E8EC] text-[#17202A] rounded-md px-2 py-1 focus:outline-none shadow-glass-sm"
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
                className="px-2.5 py-1 rounded-md border border-[#E4E8EC] bg-white hover:bg-[#F4F6F8] disabled:opacity-40 disabled:cursor-not-allowed text-[#17202A] shadow-glass-sm"
              >
                Prev
              </button>
              <span className="px-2 text-[#17202A] font-semibold">
                {page} / {tableData.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(tableData.totalPages, p + 1))}
                disabled={page >= tableData.totalPages}
                className="px-2.5 py-1 rounded-md border border-[#E4E8EC] bg-white hover:bg-[#F4F6F8] disabled:opacity-40 disabled:cursor-not-allowed text-[#17202A] shadow-glass-sm"
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
