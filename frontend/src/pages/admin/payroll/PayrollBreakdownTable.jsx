import React from 'react';
import { Search, Users } from 'lucide-react';

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
  return (
    <div className="bg-white rounded-3xl border border-base-200 shadow-sm overflow-hidden">
      {/* Table Controls */}
      <div className="p-6 border-b border-base-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-50/20">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-base-content">Staff Pay Sheet Breakdown</h3>
          <p className="text-[10px] font-bold opacity-30 mt-0.5 uppercase tracking-wide">Records for cutoff period ({selectedCutoff})</p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
          <input 
            type="text" 
            placeholder="Search employee names..." 
            className="input input-bordered w-full pl-11 bg-base-50 border-base-200 focus:bg-white focus:border-blue-400 font-bold text-xs h-10 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* The Table */}
      <div className="overflow-x-auto">
        <table className="table table-md w-full">
          <thead>
            <tr className="bg-base-50/40 text-[9px] uppercase tracking-[0.15em] opacity-45 border-b border-base-100">
              <th className="px-6 py-4">Employee</th>
              <th>Cutoff Period</th>
              <th>Days Worked</th>
              <th className="text-right">Gross Salary</th>
              <th className="text-right text-rose-500">Deductions</th>
              <th className="text-right text-blue-700">Net Salary</th>
              <th>Status</th>
              <th className="text-center">Audit Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-100 text-xs font-bold">
            {activePayrolls.length > 0 ? activePayrolls.map(p => (
              <tr key={p.id} className="hover:bg-base-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-black text-xs text-blue-700">
                      {p.employee_name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-black text-sm tracking-tight">{p.employee_name}</div>
                      <span className="text-[8px] opacity-40 bg-base-100 px-1 py-0.5 rounded uppercase">{p.employee_role || 'Staff'}</span>
                    </div>
                  </div>
                </td>
                <td className="opacity-60">{p.cutoff_period}</td>
                <td>{p.days_worked || '11.0'}</td>
                <td className="text-right">₱{parseFloat(p.gross_salary || p.basic_salary).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td className="text-right text-rose-600">
                  <span className="tooltip tooltip-bottom" data-tip={`SSS: ₱${p.sss} | PhilHealth: ₱${p.philhealth} | PagIBIG: ₱${p.pagibig} | Loans: ₱${p.loans} | Tax: ₱${p.tax}`}>
                    ₱{parseFloat(p.total_deductions).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </span>
                </td>
                <td className="text-right text-blue-700 font-black">₱{parseFloat(p.net_salary).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td>
                  <span className={`px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-[0.1em] border ${
                    p.status === 'released' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : p.status === 'approved' 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {p.status === 'draft' && canApprove && (
                      <button 
                        type="button"
                        onClick={() => onApprove(p.id)}
                        className="btn btn-xs btn-primary text-[8px] rounded-lg font-black uppercase tracking-wider"
                        disabled={approveLoading}
                      >
                        Approve
                      </button>
                    )}
                    {p.status === 'approved' && canRelease && (
                      <button 
                        type="button"
                        onClick={() => onRelease(p.id)}
                        className="btn btn-xs btn-success text-white text-[8px] rounded-lg font-black uppercase tracking-wider"
                        disabled={releaseLoading}
                      >
                        Disburse
                      </button>
                    )}
                    {p.status === 'released' ? (
                      <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Disbursed</span>
                    ) : (
                      (p.status === 'draft' && !canApprove) || (p.status === 'approved' && !canRelease) ? (
                        <span className="text-[8px] opacity-35 font-bold uppercase tracking-wider italic">Locked</span>
                      ) : null
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="8" className="text-center py-16">
                  <div className="flex flex-col items-center gap-3 opacity-25">
                    <Users className="w-12 h-12" />
                    <p className="font-black uppercase text-xs tracking-wider">No payroll records found for this cutoff</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollBreakdownTable;
