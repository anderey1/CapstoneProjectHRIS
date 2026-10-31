import React from 'react';
import { Search, FileSpreadsheet, Check, Send } from 'lucide-react';

const formatCurrency = (val) => {
  const num = parseFloat(val) || 0;
  return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

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
  releaseLoading
}) => {
  // Aggregate page totals
  const totalGross = activePayrolls.reduce((sum, p) => sum + (parseFloat(p.gross_salary || p.basic_salary) || 0), 0);
  const totalDeductions = activePayrolls.reduce((sum, p) => sum + (parseFloat(p.total_deductions) || 0), 0);
  const totalNet = activePayrolls.reduce((sum, p) => sum + (parseFloat(p.net_salary) || 0), 0);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
      {/* Header Controls */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#0038A8]" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              General Payroll Sheet (Form 7)
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Semi-monthly compensation and statutory deduction breakdown • {selectedCutoff}
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search personnel or station..." 
            className="input input-sm input-bordered w-full pl-8.5 bg-white border-slate-200 text-xs font-medium rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Structured Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <th className="px-4 py-3">Personnel</th>
              <th className="px-3 py-3">Station / Position</th>
              <th className="px-3 py-3 text-center">Days Worked</th>
              <th className="px-3 py-3 text-right">Gross Salary</th>
              <th className="px-3 py-3 text-right text-rose-700">Deductions</th>
              <th className="px-3 py-3 text-right text-[#0038A8]">Net Take-Home</th>
              <th className="px-3 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activePayrolls.length > 0 ? (
              activePayrolls.map((p) => {
                const grossVal = parseFloat(p.gross_salary || p.basic_salary) || 0;
                const deductVal = parseFloat(p.total_deductions) || 0;
                const netVal = parseFloat(p.net_salary) || 0;

                const deductionBreakdown = `GSIS (9%): ₱${parseFloat(p.sss || 0).toFixed(2)} | PhilHealth: ₱${parseFloat(p.philhealth || 0).toFixed(2)} | Pag-IBIG: ₱${parseFloat(p.pagibig || 0).toFixed(2)} | Loans: ₱${parseFloat(p.loans || 0).toFixed(2)} | Tax: ₱${parseFloat(p.tax || 0).toFixed(2)}`;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{p.employee_name}</div>
                      <span className="text-[10px] font-mono text-slate-400">ID #{p.employee || p.id}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      <div className="font-medium text-slate-800">{p.position || 'Staff'}</div>
                      <div className="text-[10px] text-slate-500">{p.department || 'Division Office'}</div>
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-medium text-slate-700">
                      {p.days_worked || '11.0'}
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
                    <td className="px-3 py-3 text-right font-mono font-bold text-[#0038A8]">
                      {formatCurrency(netVal)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border uppercase ${
                        p.status === 'released'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : p.status === 'approved'
                          ? 'bg-blue-50 text-[#0038A8] border-blue-200'
                          : p.status === 'draft'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {p.status === 'draft' && canApprove && (
                          <button
                            type="button"
                            onClick={() => onApprove(p.id)}
                            disabled={approveLoading}
                            className="btn btn-ghost btn-xs text-blue-700 hover:bg-blue-50 font-semibold px-2"
                            title="Sign and certify this record"
                          >
                            <Check className="w-3 h-3 mr-1" /> Sign
                          </button>
                        )}
                        {p.status === 'approved' && canRelease && (
                          <button
                            type="button"
                            onClick={() => onRelease(p.id)}
                            disabled={releaseLoading}
                            className="btn btn-ghost btn-xs text-emerald-700 hover:bg-emerald-50 font-semibold px-2"
                            title="Release to ATM account"
                          >
                            <Send className="w-3 h-3 mr-1" /> Disburse
                          </button>
                        )}
                        {p.status === 'released' && (
                          <span className="text-[10px] font-medium text-slate-400">Locked</span>
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
          {activePayrolls.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800">
                <td colSpan="3" className="px-4 py-3 uppercase tracking-wider text-[10px]">
                  Batch Totals ({activePayrolls.length} Personnel)
                </td>
                <td className="px-3 py-3 text-right font-mono text-slate-900">
                  {formatCurrency(totalGross)}
                </td>
                <td className="px-3 py-3 text-right font-mono text-rose-700">
                  {formatCurrency(totalDeductions)}
                </td>
                <td className="px-3 py-3 text-right font-mono text-[#0038A8]">
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
