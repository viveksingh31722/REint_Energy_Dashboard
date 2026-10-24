import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { TimeSeriesPoint } from '../../types';
import { ArrowRight } from 'lucide-react';

interface SettlementPreviewCardProps {
  cutoffHour: number;
  resolution: string;
  onViewFullTable: () => void;
  onSelectPeriod?: (deliveryTime: string) => void;
}

export const SettlementPreviewCard: React.FC<SettlementPreviewCardProps> = ({
  cutoffHour,
  resolution,
  onViewFullTable,
  onSelectPeriod,
}) => {
  const { data: tableData, isLoading } = useQuery({
    queryKey: ['table-preview', cutoffHour, resolution],
    queryFn: () =>
      api.getTable({
        cutoffHour,
        resolution,
        page: 1,
        pageSize: 6,
        sortBy: 'deliveryTime',
        order: 'desc',
      }),
  });

  return (
    <div className="dark-card p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#252C29] pb-3">
        <div>
          <h3 className="text-xs font-semibold tracking-wider uppercase text-[#F1F4F1]">
            Settlement Reconciliation
          </h3>
          <p className="text-[11px] text-[#5F6A65] mt-0.5">
            Realized 30-minute metered transmission vs. day-ahead gate closure commitments
          </p>
        </div>

        <button
          onClick={onViewFullTable}
          className="flex items-center space-x-1 text-xs font-medium text-[#E58A5C] hover:text-[#F1F4F1] transition-colors cursor-pointer"
        >
          <span>View full settlement grid</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Compact Dense Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="text-[#5F6A65] border-b border-[#252C29] select-none text-[10px] uppercase">
            <tr>
              <th className="py-2 px-3 text-center">SP</th>
              <th className="py-2 px-3">Delivery Time (GMT)</th>
              <th className="py-2 px-3 text-right">Actual (MW)</th>
              <th className="py-2 px-3 text-right">Forecast (MW)</th>
              <th className="py-2 px-3 text-right">Error (MW)</th>
              <th className="py-2 px-3 text-right">Abs Error</th>
              <th className="py-2 px-3 text-center">Horizon</th>
              <th className="py-2 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2220] text-[#8B9691]">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-[#5F6A65]">
                  Loading recent settlement outturns...
                </td>
              </tr>
            ) : tableData?.records && tableData.records.length > 0 ? (
              tableData.records.map((row: TimeSeriesPoint) => {
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
                    <td className="py-2 px-3 text-center text-[#5F6A65] font-semibold">
                      {row.settlementPeriod}
                    </td>
                    <td className="py-2 px-3 text-[#F1F4F1]">
                      {row.settlementDate} {row.deliveryTime.substring(11, 16)}
                    </td>
                    <td className="py-2 px-3 text-right text-[#35B89A] font-semibold tabular-nums">
                      {row.actualGenerationMW?.toLocaleString() ?? '—'}
                    </td>
                    <td className="py-2 px-3 text-right text-[#E58A5C] font-semibold tabular-nums">
                      {row.forecastGenerationMW?.toLocaleString() ?? '—'}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-semibold tabular-nums ${
                        isUnder ? 'text-[#E58A5C]' : 'text-[#35B89A]'
                      }`}
                    >
                      {row.errorMW !== null && row.errorMW !== undefined
                        ? `${errorSign}${row.errorMW.toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="py-2 px-3 text-right text-[#F1F4F1] tabular-nums">
                      {row.absoluteErrorMW !== null && row.absoluteErrorMW !== undefined
                        ? `±${row.absoluteErrorMW.toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="py-2 px-3 text-center text-[#5F6A65]">
                      {row.forecastHorizonHours ? `${row.forecastHorizonHours}h` : '—'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {isSevere ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#E0645A]/15 text-[#E0645A]">
                          Severe Miss
                        </span>
                      ) : absErr < 1000 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#35B89A]/15 text-[#35B89A]">
                          Balanced
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-[#5F6A65]">
                          Nominal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};
