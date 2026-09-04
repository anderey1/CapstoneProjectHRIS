import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { 
  Wallet, CheckCircle2, AlertCircle, ShieldCheck, Loader2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCutoffStatus } from './payroll/payrollConstants';
import PayrollCutoffSelector from './payroll/PayrollCutoffSelector';
import PayrollWorkflowStepper from './payroll/PayrollWorkflowStepper';
import PayrollActionPanel from './payroll/PayrollActionPanel';
import PayrollBreakdownTable from './payroll/PayrollBreakdownTable';

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
  const cutoffStatus = getCutoffStatus(cutoffPayrolls);

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
          <button type="button" onClick={() => setMessage(null)} className="btn btn-ghost btn-xs text-white hover:bg-white/20">Hide</button>
        </div>
      )}

      {/* STEP 1: Cutoff Selection Row */}
      <PayrollCutoffSelector
        selectedCutoff={selectedCutoff}
        onSelectCutoff={(period) => {
          setSelectedCutoff(period);
          setMessage(null);
        }}
        allPayrolls={allPayrolls}
      />

      {/* STEP 2: Cutoff Header Stepper Card */}
      <PayrollWorkflowStepper
        selectedCutoff={selectedCutoff}
        cutoffStatus={cutoffStatus}
        totalGross={totalGross}
        totalDeductions={totalDeductions}
        totalNet={totalNet}
      />

      {/* STEP 3: Contextual Action Panel & Generation Panel */}
      <PayrollActionPanel
        cutoffStatus={cutoffStatus}
        canGenerate={canGenerate}
        canApprove={canApprove}
        canRelease={canRelease}
        handleBulkGenerate={handleBulkGenerate}
        bulkGenerateLoading={bulkGenerateMutation.isPending}
        handleBulkApprove={handleBulkApprove}
        bulkApproveLoading={bulkApproveMutation.isPending}
        handleBulkRelease={handleBulkRelease}
        bulkReleaseLoading={bulkReleaseMutation.isPending}
        handleExportPayrollSheet={handleExportPayrollSheet}
        handleExportDV={handleExportDV}
        employees={employees}
        selectedEmployee={selectedEmployee}
        setSelectedEmployee={setSelectedEmployee}
        handleGenerate={handleGenerate}
        generateLoading={generateMutation.isPending}
      />

      {/* STEP 4: Staff Breakdown Table */}
      <PayrollBreakdownTable
        selectedCutoff={selectedCutoff}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activePayrolls={activePayrolls}
        canApprove={canApprove}
        canRelease={canRelease}
        onApprove={(id) => approveMutation.mutate(id)}
        approveLoading={approveMutation.isPending}
        onRelease={(id) => releaseMutation.mutate(id)}
        releaseLoading={releaseMutation.isPending}
      />
    </div>
  );
};

export default Payroll;
