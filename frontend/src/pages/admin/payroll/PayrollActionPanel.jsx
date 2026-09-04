import React from 'react';
import { 
  Wallet, FileText, Banknote, Users, 
  Loader2, FileSignature, CheckCircle, HelpCircle 
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Bulk Action / Stepper Detail Card */}
      <div className="lg:col-span-8 bg-gradient-to-br from-blue-900 to-blue-950 text-white rounded-3xl p-8 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none scale-150 rotate-12">
          <Wallet className="w-80 h-80" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            Action Needed
          </span>
          <h3 className="text-2xl font-black tracking-tight mt-2">
            {cutoffStatus === 'unprepared' && "Calculate Draft Payroll"}
            {cutoffStatus === 'draft' && "Approve General Payroll Sheet"}
            {cutoffStatus === 'approved' && "Confirm & Release Salary to Bank"}
            {cutoffStatus === 'released' && "Salaries Released successfully"}
          </h3>
          <p className="text-xs text-blue-200 leading-relaxed">
            {cutoffStatus === 'unprepared' && "Draft payroll records have not been generated for this period yet. The Accountant must prepare drafts using staff DTR logs before approvals can be started."}
            {cutoffStatus === 'draft' && "Draft payroll sheets have been prepared. The Superintendent must review the summary and approve the payroll to proceed."}
            {cutoffStatus === 'approved' && "The Superintendent has signed off. The Accountant should export the official files and click 'Release Salaries' to credit the employee bank accounts."}
            {cutoffStatus === 'released' && "All employee salaries have been sent to their bank accounts. Payslips are now viewable in the employee portals."}
          </p>
        </div>

        {/* Action Buttons based on Status */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          {cutoffStatus === 'unprepared' && (
            <>
              {canGenerate ? (
                <button
                  type="button"
                  onClick={handleBulkGenerate}
                  disabled={bulkGenerateLoading}
                  className={`btn btn-warning border-none hover:bg-amber-500 rounded-xl font-black text-xs uppercase tracking-wider px-6 h-12 shadow-lg shadow-amber-500/20 ${bulkGenerateLoading ? 'loading' : ''}`}
                >
                  {!bulkGenerateLoading && <Users className="w-4 h-4 mr-2" />}
                  Generate Drafts for All Staff
                </button>
              ) : (
                <span className="text-xs font-bold text-amber-400/90 italic flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  Awaiting Accountant to prepare draft payrolls...
                </span>
              )}
            </>
          )}

          {cutoffStatus === 'draft' && (
            <>
              <button
                type="button"
                onClick={handleExportPayrollSheet}
                className="btn btn-outline border-blue-500 text-blue-200 hover:bg-blue-800 hover:text-white rounded-xl font-black text-xs uppercase tracking-wider px-6 h-12"
              >
                <FileText className="w-4 h-4 mr-2" />
                Download Payroll Sheet (PDF)
              </button>
              
              {canApprove ? (
                <button
                  type="button"
                  onClick={handleBulkApprove}
                  disabled={bulkApproveLoading}
                  className={`btn btn-warning border-none hover:bg-amber-500 rounded-xl font-black text-xs uppercase tracking-wider px-6 h-12 shadow-lg shadow-amber-500/20 ${bulkApproveLoading ? 'loading' : ''}`}
                >
                  {!bulkApproveLoading && <FileSignature className="w-4 h-4 mr-2" />}
                  Approve Payroll Sheet
                </button>
              ) : (
                <span className="text-xs font-bold text-amber-400/90 italic flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  Awaiting Superintendent signature...
                </span>
              )}
            </>
          )}

          {cutoffStatus === 'approved' && (
            <>
              <button
                type="button"
                onClick={handleExportPayrollSheet}
                className="btn btn-outline border-blue-500 text-blue-200 hover:bg-blue-800 hover:text-white rounded-xl font-black text-xs uppercase tracking-wider px-5 h-12"
              >
                <FileText className="w-4 h-4 mr-2" />
                General Payroll Sheet (PDF)
              </button>
              <button
                type="button"
                onClick={handleExportDV}
                className="btn btn-outline border-blue-500 text-blue-200 hover:bg-blue-800 hover:text-white rounded-xl font-black text-xs uppercase tracking-wider px-5 h-12"
              >
                <FileText className="w-4 h-4 mr-2" />
                Disbursement Voucher (PDF)
              </button>

              {canRelease ? (
                <button
                  type="button"
                  onClick={handleBulkRelease}
                  disabled={bulkReleaseLoading}
                  className={`btn btn-warning border-none hover:bg-amber-500 rounded-xl font-black text-xs uppercase tracking-wider px-6 h-12 shadow-lg shadow-amber-500/20 ${bulkReleaseLoading ? 'loading' : ''}`}
                >
                  {!bulkReleaseLoading && <Banknote className="w-4 h-4 mr-2" />}
                  Release Salaries to ATM
                </button>
              ) : (
                <span className="text-xs font-bold text-amber-400/90 italic flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  Awaiting Accountant to send funds to bank...
                </span>
              )}
            </>
          )}

          {cutoffStatus === 'released' && (
            <div className="flex flex-wrap gap-3 w-full">
              <div className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 w-full">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">Salaries released successfully!</p>
                  <p className="text-[10px] text-emerald-400/70 mt-0.5">Vouchers and approved payroll sheets have been saved. Staff payslips are now available in their portals.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportPayrollSheet}
                className="btn btn-outline border-blue-800 text-blue-200 hover:bg-blue-800 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-wider"
              >
                <FileText className="w-4 h-4 mr-1" /> Payroll Summary (PDF)
              </button>
              <button
                type="button"
                onClick={handleExportDV}
                className="btn btn-outline border-blue-800 text-blue-200 hover:bg-blue-800 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-wider"
              >
                <FileText className="w-4 h-4 mr-1" /> Voucher (PDF)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Generate / Action Form (Only visible to Accountant, during unprepared/draft cutoff status) */}
      <div className="lg:col-span-4 space-y-6">
        {canGenerate && (cutoffStatus === 'unprepared' || cutoffStatus === 'draft') ? (
          <div className="bg-white rounded-3xl border border-base-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-base-100 bg-base-50/50">
               <h3 className="text-xs font-black uppercase tracking-wider text-blue-700">Calculate for Single Staff</h3>
               <p className="text-[9px] font-semibold opacity-40 uppercase tracking-wide mt-0.5">Calculate draft salary for a single employee</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-45 ml-1">Staff Member</label>
                <select
                  className="select select-bordered w-full bg-base-50 border-base-200 hover:border-blue-400 transition-all rounded-xl text-xs font-bold h-12"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">Select staff...</option>
                  {employees?.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.position})</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className={`btn btn-primary w-full rounded-xl h-12 uppercase font-black text-[10px] tracking-wider shadow-md shadow-blue-500/10 hover:shadow-lg transition-all ${generateLoading ? 'loading' : ''}`}
                onClick={handleGenerate}
                disabled={generateLoading || !selectedEmployee}
              >
                {!generateLoading && <FileText className="w-4 h-4 mr-2" />}
                Generate Draft
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 border border-base-200 shadow-sm space-y-4 text-center">
            <div className="w-12 h-12 bg-base-100 rounded-full flex items-center justify-center mx-auto text-base-content/40">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-base-content">Status: {cutoffStatus}</p>
              <p className="text-[9px] font-bold opacity-45 uppercase mt-1 leading-relaxed">
                {cutoffStatus === 'released' && "All steps completed. This pay period is closed."}
                {cutoffStatus === 'approved' && "General payroll is signed. Accountant needs to release the funds to bank accounts."}
                {!canGenerate && "Only Accountants can calculate and release salaries."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollActionPanel;
