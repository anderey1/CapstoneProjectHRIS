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
  generateLoading,
  dataUnavailable = false,
}) => {
  return (
    <fieldset disabled={dataUnavailable} className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs space-y-4 min-w-0">
      {/* Top Header Row with Status and Direct Operational CTAs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Accounting Command Center
            </span>
            <span className={`px-2 py-1 rounded text-sm font-semibold border ${
              cutoffStatus === 'released'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : cutoffStatus === 'approved'
                ? 'bg-blue-50 text-primary border-blue-200'
                : cutoffStatus === 'draft'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {cutoffStatus === 'unprepared' && 'Awaiting Draft Calculation'}
              {cutoffStatus === 'draft' && 'Pending Superintendent Sign-off'}
              {cutoffStatus === 'approved' && 'Approved for release'}
              {cutoffStatus === 'released' && 'Release recorded'}
              {cutoffStatus === 'unavailable' && 'Status unavailable'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {cutoffStatus === 'unprepared' && 'Calculate semi-monthly draft gross pay, statutory withholdings, and loan amortizations.'}
            {cutoffStatus === 'draft' && 'Draft payroll sheets generated. Superintendent signature required on General Payroll Sheet (Form 7).'}
            {cutoffStatus === 'approved' && 'Payroll is approved. Export the voucher and record release after completing your disbursement procedure.'}
            {cutoffStatus === 'released' && 'Release recorded in the payroll ledger. This does not confirm a bank transfer.'}
            {cutoffStatus === 'unavailable' && 'Reload payroll data before processing this period.'}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {cutoffStatus === 'unprepared' && canGenerate && (
            <button
              type="button"
              onClick={handleBulkGenerate}
              disabled={bulkGenerateLoading}
              className="btn btn-primary btn-sm h-auto py-2 px-4"
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
              className="btn btn-success btn-sm h-auto py-2 px-4"
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
              className="btn btn-primary btn-sm h-auto py-2 px-4"
            >
              {bulkReleaseLoading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 mr-1.5" />
              )}
              Record payroll release
            </button>
          )}

          {/* Official Document Export Dropdown */}
          <details className="dropdown dropdown-end" onKeyDown={event => {
            if (event.key === 'Escape') {
              event.currentTarget.open = false;
              event.currentTarget.querySelector('summary')?.focus();
            }
          }}>
            <summary className="btn btn-outline btn-sm px-3">
              <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Export Reports
            </summary>
            <ul
              tabIndex={0}
              className="dropdown-content z-20 menu p-1.5 shadow-md bg-white border border-slate-200 rounded-md w-60 mt-1"
            >
              <li className="menu-title text-xs font-bold uppercase text-slate-400 px-2 py-1">
                Official Commission on Audit Reports
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleExportPayrollSheet}
                  className="min-h-11 text-sm text-slate-700 hover:bg-slate-50 font-medium py-2 rounded"
                >
                  <FileText className="w-3.5 h-3.5 text-primary mr-2" />
                  General Payroll Sheet (Form 7)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleExportDV}
                  className="min-h-11 text-sm text-slate-700 hover:bg-slate-50 font-medium py-2 rounded"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-700 mr-2" />
                  Disbursement Voucher (DV)
                </button>
              </li>
            </ul>
          </details>
        </div>
      </div>

      {/* Secondary Bar: Single Employee Recalculation (Compact, non-invasive) */}
      {canGenerate && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <label htmlFor="payroll-employee" className="font-medium">Staff member:</label>
            <span className="text-slate-400 text-xs hidden md:inline">
              Re-run calculation for an individual personnel after DTR update
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              id="payroll-employee"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="select select-bordered min-h-11 text-sm bg-slate-50 border-slate-200 text-slate-700 rounded-md flex-1 min-w-0 sm:w-64"
            >
              <option value="">Select individual staff member...</option>
              {employees?.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.position || 'Position not available'})
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={!selectedEmployee || generateLoading}
              onClick={handleGenerate}
              className="btn btn-outline btn-sm px-3"
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
    </fieldset>
  );
};

export default PayrollActionPanel;
