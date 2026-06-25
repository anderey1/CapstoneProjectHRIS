import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { 
  Wallet, CheckCircle2, AlertCircle, FileText, 
  ShieldCheck, Banknote, Users, History, 
  TrendingUp, ArrowRight, Loader2, Search,
  Calendar, FileSignature, CheckCircle, HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Payroll & Payslip Management
 * Grouped Cutoff Workflow (Preparation -> Approval -> DV -> ATM Release)
 */
const Payroll = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedCutoff, setSelectedCutoff] = useState('May 1-15, 2026');
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Roles permission check
  const isSuperintendent = user?.role === 'SUPERINTENDENT';
  const isHR = user?.role === 'HR';
  const isAccountant = user?.role === 'ACCOUNTANT';

  // Permissions mapping
  const canGenerate = isAccountant;
  const canApprove = isSuperintendent;
  const canRelease = isAccountant;

  const CUTOFF_PERIODS = [
    "May 1-15, 2026",
    "May 16-31, 2026",
    "June 1-15, 2026",
    "June 16-30, 2026"
  ];

  // 1. Data Fetching
  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES],
    queryFn: () => api.get('employees/').then(res => res.data.results || res.data),
  });

  const { data: allPayrolls, isLoading: loadingPayrolls } = useQuery({
    queryKey: [QUERY_KEYS.PAYROLL],
    queryFn: () => api.get('payroll/').then(res => res.data.results || res.data),
  });

  // Calculate matching payrolls for selected cutoff
  const cutoffPayrolls = allPayrolls?.filter(p => p.cutoff_period === selectedCutoff) || [];

  // Determine cutoff status
  let cutoffStatus = 'unprepared'; // 'unprepared', 'draft', 'approved', 'released'
  if (cutoffPayrolls.length > 0) {
    const hasDraft = cutoffPayrolls.some(p => p.status === 'draft');
    const hasApproved = cutoffPayrolls.some(p => p.status === 'approved');
    const allReleased = cutoffPayrolls.every(p => p.status === 'released');
    
    if (allReleased) {
      cutoffStatus = 'released';
    } else if (hasDraft) {
      cutoffStatus = 'draft';
    } else if (hasApproved) {
      cutoffStatus = 'approved';
    }
  }

  // 2. Mutations
  const generateMutation = useMutation({
    mutationFn: (data) => api.post('payroll/generate/', data),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Draft payslip generated.' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYROLL] });
    },
    onError: (err) => setMessage({ type: 'error', text: err.response?.data?.detail || 'Generation failed.' })
  });

  const bulkGenerateMutation = useMutation({
    mutationFn: (data) => api.post('payroll/bulk_generate/', data),
    onSuccess: (res) => {
      const skippedCount = res.data.skipped?.length || 0;
      setMessage({ 
        type: 'success', 
        text: `Bulk generation complete. Generated: ${res.data.generated}, Updated: ${res.data.updated}, Skipped: ${skippedCount}.` 
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYROLL] });
    },
    onError: (err) => setMessage({ type: 'error', text: err.response?.data?.detail || 'Bulk generation failed.' })
  });

  const approveMutation = useMutation({
    mutationFn: (id) => api.post(`payroll/${id}/approve/`),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Payroll record approved.' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYROLL] });
    },
    onError: (err) => setMessage({ type: 'error', text: err.response?.data?.detail || 'Approval failed.' })
  });

  const releaseMutation = useMutation({
    mutationFn: (id) => api.post(`payroll/${id}/release/`),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Payroll record released.' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYROLL] });
    },
    onError: (err) => setMessage({ type: 'error', text: err.response?.data?.detail || 'Release failed.' })
  });

  const bulkApproveMutation = useMutation({
    mutationFn: (data) => api.post('payroll/bulk_approve/', data),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'General Payroll approved and signed successfully!' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYROLL] });
    },
    onError: (err) => setMessage({ type: 'error', text: err.response?.data?.detail || 'Bulk approval failed.' })
  });

  const bulkReleaseMutation = useMutation({
    mutationFn: (data) => api.post('payroll/bulk_release/', data),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'All payroll records in cutoff released and credited to LandBank ATM!' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYROLL] });
    },
    onError: (err) => setMessage({ type: 'error', text: err.response?.data?.detail || 'Bulk release failed.' })
  });

  // Handlers
  const handleExportPayrollSheet = async () => {
    try {
      const response = await api.get(`payroll/export_payroll_sheet/`, {
        params: { cutoff_period: selectedCutoff },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `General_Payroll_${selectedCutoff.replace(/ /g, '_').replace(/,/g, '')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("No payroll records found for this period to generate the payroll sheet.");
    }
  };

  const handleExportDV = async () => {
    try {
      const response = await api.get(`payroll/export_disbursement_voucher/`, {
        params: { cutoff_period: selectedCutoff },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Disbursement_Voucher_${selectedCutoff.replace(/ /g, '_').replace(/,/g, '')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("No payroll records found for this period to generate the disbursement voucher.");
    }
  };

  const handleGenerate = () => {
    if (!selectedEmployee) {
      setMessage({ type: 'error', text: 'Please select an employee.' });
      return;
    }

    const employee = employees?.find(emp => emp.id === parseInt(selectedEmployee));
    if (employee && (employee.salary === null || employee.salary === undefined || parseFloat(employee.salary) <= 0)) {
      setMessage({ 
        type: 'error', 
        text: `Cannot generate payroll: ${employee.first_name} ${employee.last_name} has no salary set in their profile.` 
      });
      return;
    }

    generateMutation.mutate({ employee_id: selectedEmployee, cutoff_period: selectedCutoff });
  };

  const handleBulkGenerate = () => {
    bulkGenerateMutation.mutate({ cutoff_period: selectedCutoff });
  };

  const handleBulkApprove = () => {
    if (window.confirm(`Are you sure you want to approve the General Payroll Sheet for ${selectedCutoff}?`)) {
      bulkApproveMutation.mutate({ cutoff_period: selectedCutoff });
    }
  };

  const handleBulkRelease = () => {
    if (window.confirm(`Are you sure you want to release and credit all salaries to LandBank ATM for ${selectedCutoff}? This will record any loan payments and notify staff.`)) {
      bulkReleaseMutation.mutate({ cutoff_period: selectedCutoff });
    }
  };

  // Calculations for current cutoff
  const activePayrolls = cutoffPayrolls.filter(p => 
    p.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalGross = cutoffPayrolls.reduce((sum, p) => sum + parseFloat(p.gross_salary || p.basic_salary), 0);
  const totalDeductions = cutoffPayrolls.reduce((sum, p) => sum + parseFloat(p.total_deductions), 0);
  const totalNet = cutoffPayrolls.reduce((sum, p) => sum + parseFloat(p.net_salary), 0);

  const releasedCount = cutoffPayrolls.filter(p => p.status === 'released').length;
  const approvedCount = cutoffPayrolls.filter(p => p.status === 'approved').length;
  const draftCount = cutoffPayrolls.filter(p => p.status === 'draft').length;

  if (loadingPayrolls || loadingEmployees) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-primary">
        <Loader2 className="w-12 h-12 animate-spin opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Loading Payroll Data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-750 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 rotate-3 hover:rotate-0 transition-transform duration-300">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">Release Salaries & Payslips</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                <p className="text-[10px] font-black opacity-45 uppercase tracking-widest">Lucena School Division</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="text-[10px] bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-blue-800 flex items-center gap-2 max-w-sm">
          <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>Only the <strong>Accountant</strong> can calculate and release salaries. Only the <strong>Superintendent</strong> can sign and approve the general payroll sheets.</span>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.type === 'error' ? 'alert-error' : 'bg-blue-600'} text-white shadow-lg border-none rounded-2xl flex items-center justify-between py-4 px-6 animate-in slide-in-from-top-4`}>
          <div className="flex items-center gap-3">
            {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="font-bold text-xs uppercase tracking-wider">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="btn btn-ghost btn-xs text-white hover:bg-white/20">Hide</button>
        </div>
      )}

      {/* STEP 1: Cutoff Selection Row */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest opacity-40 ml-1">Select Pay Period to Process</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-base-100 p-2 rounded-2xl border border-base-200">
          {CUTOFF_PERIODS.map(period => {
            // Get status for each period
            const periodPayrolls = allPayrolls?.filter(p => p.cutoff_period === period) || [];
            let status = 'unprepared';
            if (periodPayrolls.length > 0) {
              const hasDraft = periodPayrolls.some(p => p.status === 'draft');
              const hasApproved = periodPayrolls.some(p => p.status === 'approved');
              const allReleased = periodPayrolls.every(p => p.status === 'released');
              if (allReleased) status = 'released';
              else if (hasDraft) status = 'draft';
              else if (hasApproved) status = 'approved';
            }
            
            const isSelected = selectedCutoff === period;
            
            return (
              <button
                key={period}
                onClick={() => {
                  setSelectedCutoff(period);
                  setMessage(null);
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all border ${
                  isSelected 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]' 
                    : 'bg-white border-base-200 hover:border-blue-300 text-base-content'
                }`}
              >
                <span className="text-[11px] font-black uppercase tracking-wider">{period}</span>
                <span className={`mt-2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                  status === 'released' 
                    ? isSelected ? 'bg-white/25 border-white/20 text-white' : 'bg-success/10 border-success/20 text-success'
                    : status === 'approved'
                    ? isSelected ? 'bg-white/25 border-white/20 text-white' : 'bg-blue-100 border-blue-200 text-blue-700'
                    : status === 'draft'
                    ? isSelected ? 'bg-amber-400/30 border-amber-400/40 text-amber-200' : 'bg-amber-100 border-amber-200 text-amber-700'
                    : isSelected ? 'bg-white/10 border-white/10 text-white/60' : 'bg-base-100 border-base-200 text-base-content/40'
                }`}>
                  {status === 'unprepared' ? 'Not Prepared' : status}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: Cutoff Header Stepper Card */}
      <div className="bg-white rounded-3xl p-6 border border-base-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-base-100 pb-5">
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase tracking-wider text-base-content flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Steps for selected period: {selectedCutoff}
            </h3>
            <p className="text-[10px] font-bold uppercase opacity-45">Follow these steps to calculate, approve, and send salaries to bank accounts</p>
          </div>
          
          {/* Stats Badges */}
          <div className="flex gap-2">
            <div className="px-3 py-1 bg-base-100 rounded-lg text-center border border-base-200">
              <span className="block text-[8px] font-black uppercase tracking-wider opacity-40">Gross Pay (Before Deductions)</span>
              <span className="text-xs font-black text-base-content">₱{totalGross.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="px-3 py-1 bg-base-100 rounded-lg text-center border border-base-200">
              <span className="block text-[8px] font-black uppercase tracking-wider opacity-40">Total Deductions</span>
              <span className="text-xs font-black text-rose-600">₱{totalDeductions.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="px-3 py-1 bg-blue-50 rounded-lg text-center border border-blue-100">
              <span className="block text-[8px] font-black uppercase tracking-wider opacity-40 text-blue-600">Net Pay (Take-Home)</span>
              <span className="text-xs font-black text-blue-700">₱{totalNet.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>
        
        {/* Stepper Visuals */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Step 1: Accountant Preparation */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 ${
            cutoffStatus !== 'unprepared' 
              ? 'bg-blue-50 border-blue-200 text-blue-900' 
              : 'bg-base-50 border-base-200 opacity-60'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                cutoffStatus !== 'unprepared' ? 'bg-blue-600 text-white' : 'bg-base-300 text-base-content/60'
              }`}>1</span>
              <div>
                <p className="text-xs font-black uppercase tracking-wide">1. Accountant Preparation</p>
                <p className="text-[9px] opacity-60 font-bold uppercase">{cutoffStatus === 'unprepared' ? 'Not Started' : 'Draft Prepared'}</p>
              </div>
            </div>
          </div>

          {/* Step 2: Superintendent Approval */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 ${
            cutoffStatus === 'approved' || cutoffStatus === 'released'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : cutoffStatus === 'draft'
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-base-50 border-base-200 opacity-60'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                cutoffStatus === 'approved' || cutoffStatus === 'released'
                  ? 'bg-emerald-600 text-white'
                  : cutoffStatus === 'draft'
                  ? 'bg-amber-500 text-white'
                  : 'bg-base-300 text-base-content/60'
              }`}>2</span>
              <div>
                <p className="text-xs font-black uppercase tracking-wide">2. Superintendent Review</p>
                <p className="text-[9px] opacity-60 font-bold uppercase">
                  {cutoffStatus === 'released' || cutoffStatus === 'approved' ? 'Approved & Signed' : cutoffStatus === 'draft' ? 'Awaiting Signature' : 'Awaiting Step 1'}
                </p>
              </div>
            </div>
          </div>

          {/* Step 3: Disbursement Voucher */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 ${
            cutoffStatus === 'released'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : cutoffStatus === 'approved'
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-base-50 border-base-200 opacity-60'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                cutoffStatus === 'released'
                  ? 'bg-emerald-600 text-white'
                  : cutoffStatus === 'approved'
                  ? 'bg-amber-500 text-white'
                  : 'bg-base-300 text-base-content/60'
              }`}>3</span>
              <div>
                <p className="text-xs font-black uppercase tracking-wide">3. Official Voucher (DV)</p>
                <p className="text-[9px] opacity-60 font-bold uppercase">
                  {cutoffStatus === 'released' ? 'Voucher Prepared' : cutoffStatus === 'approved' ? 'Ready to Release' : 'Awaiting Step 2'}
                </p>
              </div>
            </div>
          </div>

          {/* Step 4: Released / Credited */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 ${
            cutoffStatus === 'released'
              ? 'bg-emerald-100 border-emerald-300 text-emerald-950'
              : 'bg-base-50 border-base-200 opacity-60'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                cutoffStatus === 'released' ? 'bg-emerald-600 text-white' : 'bg-base-300 text-base-content/60'
              }`}>4</span>
              <div>
                <p className="text-xs font-black uppercase tracking-wide">4. Sent to Bank (ATM)</p>
                <p className="text-[9px] opacity-60 font-bold uppercase">
                  {cutoffStatus === 'released' ? 'Paid to Employees' : 'Awaiting Release'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 3: Contextual Action Panel & Generation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Bulk Action / Stepper Detail Card */}
        <div className="lg:col-span-8 bg-gradient-to-br from-blue-900 to-blue-950 text-white rounded-3xl p-8 space-y-6 shadow-xl relative overflow-hidden">
          {/* Subtle logo background */}
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
                    onClick={handleBulkGenerate}
                    disabled={bulkGenerateMutation.isPending}
                    className={`btn btn-warning border-none hover:bg-amber-500 rounded-xl font-black text-xs uppercase tracking-wider px-6 h-12 shadow-lg shadow-amber-500/20 ${bulkGenerateMutation.isPending ? 'loading' : ''}`}
                  >
                    {!bulkGenerateMutation.isPending && <Users className="w-4 h-4 mr-2" />}
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
                  onClick={handleExportPayrollSheet}
                  className="btn btn-outline border-blue-500 text-blue-200 hover:bg-blue-800 hover:text-white rounded-xl font-black text-xs uppercase tracking-wider px-6 h-12"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download Payroll Sheet (PDF)
                </button>
                
                {canApprove ? (
                  <button
                    onClick={handleBulkApprove}
                    disabled={bulkApproveMutation.isPending}
                    className={`btn btn-warning border-none hover:bg-amber-500 rounded-xl font-black text-xs uppercase tracking-wider px-6 h-12 shadow-lg shadow-amber-500/20 ${bulkApproveMutation.isPending ? 'loading' : ''}`}
                  >
                    {!bulkApproveMutation.isPending && <FileSignature className="w-4 h-4 mr-2" />}
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
                  onClick={handleExportPayrollSheet}
                  className="btn btn-outline border-blue-500 text-blue-200 hover:bg-blue-800 hover:text-white rounded-xl font-black text-xs uppercase tracking-wider px-5 h-12"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  General Payroll Sheet (PDF)
                </button>
                <button
                  onClick={handleExportDV}
                  className="btn btn-outline border-blue-500 text-blue-200 hover:bg-blue-800 hover:text-white rounded-xl font-black text-xs uppercase tracking-wider px-5 h-12"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Disbursement Voucher (PDF)
                </button>

                {canRelease ? (
                  <button
                    onClick={handleBulkRelease}
                    disabled={bulkReleaseMutation.isPending}
                    className={`btn btn-warning border-none hover:bg-amber-500 rounded-xl font-black text-xs uppercase tracking-wider px-6 h-12 shadow-lg shadow-amber-500/20 ${bulkReleaseMutation.isPending ? 'loading' : ''}`}
                  >
                    {!bulkReleaseMutation.isPending && <Banknote className="w-4 h-4 mr-2" />}
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
                  onClick={handleExportPayrollSheet}
                  className="btn btn-outline border-blue-800 text-blue-200 hover:bg-blue-800 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-wider"
                >
                  <FileText className="w-4 h-4 mr-1" /> Payroll Summary (PDF)
                </button>
                <button
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
                  className={`btn btn-primary w-full rounded-xl h-12 uppercase font-black text-[10px] tracking-wider shadow-md shadow-blue-500/10 hover:shadow-lg transition-all ${generateMutation.isPending ? 'loading' : ''}`}
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || !selectedEmployee}
                >
                  {!generateMutation.isPending && <FileText className="w-4 h-4 mr-2" />}
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

      {/* STEP 4: Staff Breakdown Table */}
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
                          onClick={() => approveMutation.mutate(p.id)}
                          className="btn btn-xs btn-primary text-[8px] rounded-lg font-black uppercase tracking-wider"
                          disabled={approveMutation.isPending}
                        >
                          Approve
                        </button>
                      )}
                      {p.status === 'approved' && canRelease && (
                        <button 
                          onClick={() => releaseMutation.mutate(p.id)}
                          className="btn btn-xs btn-success text-white text-[8px] rounded-lg font-black uppercase tracking-wider"
                          disabled={releaseMutation.isPending}
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
    </div>
  );
};

export default Payroll;
