import React from 'react';
import { 
  FileText, Download, Users, 
  Loader2, Calculator, CheckCircle2, Send
} from 'lucide-react';

const PayrollActionPanel = ({
  cutoffStatus,
  canGenerate,
  canApprove,
  canRelease,
  handleBulkGenerate,
  bulkGenerateLoading,
  handleBulkApprove,
  bulkApproveLoading,
  handleBulkRelease,
  bulkReleaseLoading,
  handleExportPayrollSheet,
  handleExportDV,
  employees,
  selectedEmployee,
  setSelectedEmployee,
  handleGenerate,
  generateLoading
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-4">
      {/* Top Header Row with Status and Direct Operational CTAs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Accounting Command Center
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
              cutoffStatus === 'released'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : cutoffStatus === 'approved'
                ? 'bg-blue-50 text-[#0038A8] border-blue-200'
                : cutoffStatus === 'draft'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {cutoffStatus === 'unprepared' && 'Awaiting Draft Calculation'}
              {cutoffStatus === 'draft' && 'Pending Superintendent Sign-off'}
              {cutoffStatus === 'approved' && 'Ready for ATM Release'}
              {cutoffStatus === 'released' && 'Cutoff Completed & Disbursed'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {cutoffStatus === 'unprepared' && 'Calculate semi-monthly draft gross pay, statutory withholdings, and loan amortizations.'}
            {cutoffStatus === 'draft' && 'Draft payroll sheets generated. Superintendent signature required on General Payroll Sheet (Form 7).'}
            {cutoffStatus === 'approved' && 'Executive sign-off complete. Export Disbursement Voucher and credit funds to LandBank ATM accounts.'}
            {cutoffStatus === 'released' && 'Salaries have been credited. Payroll ledger is locked for this period.'}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {cutoffStatus === 'unprepared' && canGenerate && (
            <button
              type="button"
              onClick={handleBulkGenerate}
              disabled={bulkGenerateLoading}
              className="btn btn-sm bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded-md text-xs font-semibold px-4 h-9 shadow-xs"
            >
              {bulkGenerateLoading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Calculator className="w-3.5 h-3.5 mr-1.5" />
              )}
              Calculate Division Payroll
            </button>
          )}

          {cutoffStatus === 'draft' && canApprove && (
            <button
              type="button"
              onClick={handleBulkApprove}
              disabled={bulkApproveLoading}
              className="btn btn-sm bg-emerald-700 hover:bg-emerald-800 text-white border-none rounded-md text-xs font-semibold px-4 h-9 shadow-xs"
            >
              {bulkApproveLoading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              )}
              Certify & Sign General Payroll (Form 7)
            </button>
          )}

          {cutoffStatus === 'approved' && canRelease && (
            <button
              type="button"
              onClick={handleBulkRelease}
              disabled={bulkReleaseLoading}
              className="btn btn-sm bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded-md text-xs font-semibold px-4 h-9 shadow-xs"
            >
              {bulkReleaseLoading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 mr-1.5" />
              )}
              Disburse & Credit Salaries to LandBank ATM
            </button>
          )}

          {/* Official Document Export Dropdown */}
          <div className="dropdown dropdown-end">
            <label
              tabIndex={0}
              className="btn btn-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold px-3 h-9"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Export Reports
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content z-20 menu p-1.5 shadow-md bg-white border border-slate-200 rounded-md w-60 mt-1"
            >
              <li className="menu-title text-[10px] font-bold uppercase text-slate-400 px-2 py-1">
                Official Commission on Audit Reports
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleExportPayrollSheet}
                  className="text-xs text-slate-700 hover:bg-slate-50 font-medium py-2 rounded"
                >
                  <FileText className="w-3.5 h-3.5 text-[#0038A8] mr-2" />
                  General Payroll Sheet (Form 7)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleExportDV}
                  className="text-xs text-slate-700 hover:bg-slate-50 font-medium py-2 rounded"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-700 mr-2" />
                  Disbursement Voucher (DV)
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Secondary Bar: Single Employee Recalculation (Compact, non-invasive) */}
      {canGenerate && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-medium">Single Staff Recalculation:</span>
            <span className="text-slate-400 text-[11px] hidden md:inline">
              Re-run calculation for an individual personnel after DTR update
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="select select-bordered select-sm text-xs bg-slate-50 border-slate-200 text-slate-700 rounded-md flex-1 sm:w-64"
            >
              <option value="">Select individual staff member...</option>
              {employees?.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.position || 'Staff'})
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={!selectedEmployee || generateLoading}
              onClick={handleGenerate}
              className="btn btn-sm bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold px-3 h-8"
            >
              {generateLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                'Recalculate'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollActionPanel;
