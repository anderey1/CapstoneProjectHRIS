import React from 'react';
import { Search, FileSpreadsheet, Check, Send } from 'lucide-react';

import { formatCurrency, payrollStatusLabel, sumRecordedAmounts, unavailable } from '../utils/payrollDisplay';

const PayrollBreakdownTable = ({
  selectedCutoff,
  searchTerm,
  setSearchTerm,
  activePayrolls,
  canApprove,
  canRelease,
  onApprove,
  approveLoading,
  onRelease,
  releaseLoading,
  dataUnavailable = false,
  isLoading = false,
  isError = false,
  retry,
}) => {
  // Aggregate page totals
  const totalGross = sumRecordedAmounts(activePayrolls, 'gross_salary');
  const totalDeductions = sumRecordedAmounts(activePayrolls, 'total_deductions');
  const totalNet = sumRecordedAmounts(activePayrolls, 'net_salary');

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
      {/* Header Controls */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-slate-900 tracking-wide">
              General Payroll Sheet (Form 7)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Semi-monthly compensation and statutory deduction breakdown • {selectedCutoff}
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <label htmlFor="payroll-search" className="block text-sm text-slate-700 mb-1">Search payroll records</label>
          <Search className="w-3.5 h-3.5 absolute left-3 bottom-3.5 text-slate-500" />
          <input 
            id="payroll-search"
            type="text" 
            placeholder="Search personnel or station..." 
            className="input input-bordered min-h-11 w-full pl-8.5 bg-white border-slate-200 text-sm font-medium rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Structured Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <th className="px-4 py-3">Personnel</th>
              <th className="px-3 py-3">Station / Position</th>
              <th className="px-3 py-3 text-center">Days Worked</th>
              <th className="px-3 py-3 text-right">Gross Salary</th>
              <th className="px-3 py-3 text-right text-rose-700">Deductions</th>
              <th className="px-3 py-3 text-right text-primary">Net Take-Home</th>
              <th className="px-3 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isError ? (
              <tr><td colSpan="8" className="p-4 text-red-700">
                <p role="alert">Could not load payroll records.</p>
                <button type="button" className="btn min-h-11 mt-2" onClick={retry}>Retry records</button>
              </td></tr>
            ) : isLoading ? (
              <tr><td colSpan="8" className="p-4 text-slate-600" role="status">Loading payroll records...</td></tr>
            ) : activePayrolls.length > 0 ? (
              activePayrolls.map((p) => {
                const grossVal = p.gross_salary;
                const deductVal = p.total_deductions;
                const netVal = p.net_salary;

                const deductionBreakdown = `GSIS: ${formatCurrency(p.gsis)} | PhilHealth: ${formatCurrency(p.philhealth)} | Pag-IBIG: ${formatCurrency(p.pagibig)} | Loans: ${formatCurrency(p.loans)} | Tax: ${formatCurrency(p.tax)}`;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{p.employee_name || 'Name not available'}</div>
                      <span className="text-xs font-mono text-slate-600">Employee ID: {p.employee ?? unavailable}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      <div className="font-medium text-slate-800">{p.position || 'Position not available'}</div>
                      <div className="text-xs text-slate-600">{p.department || 'Station not available'}</div>
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-medium text-slate-700">
                      {p.days_worked === '' ? unavailable : p.days_worked ?? unavailable}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-slate-800">
                      {formatCurrency(grossVal)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-rose-700">
                      <span
                        className="cursor-help underline decoration-dotted decoration-rose-300"
                        title={deductionBreakdown}
                      >
                        {formatCurrency(deductVal)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-primary">
                      {formatCurrency(netVal)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-sm font-semibold border ${
                        p.status === 'released'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : p.status === 'approved'
                          ? 'bg-blue-50 text-primary border-blue-200'
                          : p.status === 'draft'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {payrollStatusLabel(p.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {p.status === 'draft' && canApprove && (
                          <button
                            type="button"
                            onClick={() => onApprove(p.id)}
                            disabled={dataUnavailable || approveLoading}
                            className="btn btn-ghost min-h-11 text-sm text-blue-700 hover:bg-blue-50 font-semibold px-3"
                            title="Sign and certify this record"
                          >
                            <Check className="w-4 h-4 mr-1" /> Approve payroll
                          </button>
                        )}
                        {p.status === 'approved' && canRelease && (
                          <button
                            type="button"
                            onClick={() => onRelease(p.id)}
                            disabled={dataUnavailable || releaseLoading}
                            className="btn btn-ghost min-h-11 text-sm text-emerald-700 hover:bg-emerald-50 font-semibold px-3"
                            title="Record payroll release"
                          >
                            <Send className="w-4 h-4 mr-1" /> Release payroll
                          </button>
                        )}
                        {p.status === 'released' && (
                          <span className="text-xs font-medium text-slate-400">Locked</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-12 text-slate-400 italic">
                  No payroll records found matching current filters for {selectedCutoff}.
                </td>
              </tr>
            )}
          </tbody>

          {/* Table Footer Totals */}
          {!isError && !isLoading && activePayrolls.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800">
                <td colSpan="3" className="px-4 py-3 uppercase tracking-wider text-xs">
                  Page subtotal ({activePayrolls.length} Personnel)
                </td>
                <td className="px-3 py-3 text-right font-mono text-slate-900">
                  {formatCurrency(totalGross)}
                </td>
                <td className="px-3 py-3 text-right font-mono text-rose-700">
                  {formatCurrency(totalDeductions)}
                </td>
                <td className="px-3 py-3 text-right font-mono text-primary">
                  {formatCurrency(totalNet)}
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default PayrollBreakdownTable;
