import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { 
  Wallet, CheckCircle2, AlertCircle, FileText, 
  ShieldCheck, Banknote, Users, History, 
  TrendingUp, ArrowRight, Loader2, Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

/**
 * Payroll Management
 * 
 * Refined, role-aware dashboard for handling staff salaries.
 */
const Payroll = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [cutoff, setCutoff] = useState('');
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Roles permission check
  const isAdmin = user?.role === ROLES.ADMIN;
  const isHR = user?.role === ROLES.HR;
  const isAccountant = user?.role === ROLES.ACCOUNTANT;

  // Can generate if Admin, HR, or Accountant
  const canGenerate = isAdmin || isHR || isAccountant;
  // Can approve if Admin or HR
  const canApprove = isAdmin || isHR;
  // Can release if Admin or Accountant
  const canRelease = isAdmin || isAccountant;

  // 1. Data Fetching
  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES],
    queryFn: () => api.get('employees/').then(res => res.data.results || res.data),
  });

  const { data: allPayrolls, isLoading: loadingPayrolls } = useQuery({
    queryKey: [QUERY_KEYS.PAYROLL],
    queryFn: () => api.get('payroll/').then(res => res.data.results || res.data),
  });

  // 2. Mutations
  const generateMutation = useMutation({
    mutationFn: (data) => api.post('payroll/generate/', data),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Draft payslip generated.' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYROLL] });
    },
    onError: (err) => setMessage({ type: 'error', text: err.response?.data?.detail || 'Generation failed.' })
  });

  const approveMutation = useMutation({
    mutationFn: (id) => api.post(`payroll/${id}/approve/`),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Payroll approved.' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYROLL] });
    },
    onError: (err) => setMessage({ type: 'error', text: err.response?.data?.detail || 'Approval failed.' })
  });

  const releaseMutation = useMutation({
    mutationFn: (id) => api.post(`payroll/${id}/release/`),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Payroll released and funds disbursed.' });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYROLL] });
    },
    onError: (err) => setMessage({ type: 'error', text: err.response?.data?.detail || 'Release failed.' })
  });

  const handleGenerate = () => {
    if (!selectedEmployee || !cutoff) {
      setMessage({ type: 'error', text: 'Please select an employee and period.' });
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

    generateMutation.mutate({ employee_id: selectedEmployee, cutoff });
  };

  const filteredPayrolls = allPayrolls?.filter(p => 
    p.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const pendingPayrolls = filteredPayrolls.filter(p => p.status !== 'released');
  const releasedPayrolls = filteredPayrolls.filter(p => p.status === 'released');

  // Stats calculation
  const totalDisbursed = allPayrolls?.filter(p => p.status === 'released')
    .reduce((sum, p) => sum + parseFloat(p.net_salary), 0) || 0;

  if (loadingPayrolls || loadingEmployees) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-primary">
        <Loader2 className="w-12 h-12 animate-spin opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Loading Payroll Data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-content shadow-lg shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-300">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-base-content uppercase">Payroll</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.15em]">Live Financial Operations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-base-200 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center text-success">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black opacity-40 uppercase tracking-wider">Total Disbursed</p>
              <p className="text-lg font-black leading-none">₱{totalDisbursed.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-base-200 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center text-warning">
              <History className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black opacity-40 uppercase tracking-wider">Pending</p>
              <p className="text-lg font-black leading-none">{pendingPayrolls.length}</p>
            </div>
          </div>
          <div className="hidden md:flex bg-white p-4 rounded-xl border border-base-200 shadow-sm items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black opacity-40 uppercase tracking-wider">Staff Count</p>
              <p className="text-lg font-black leading-none">{employees?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.type === 'error' ? 'alert-error' : 'bg-primary'} text-white shadow-2xl border-none rounded-2xl flex items-center justify-between py-5 px-8 animate-in slide-in-from-top-4`}>
          <div className="flex items-center gap-4">
            {message.type === 'error' ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            <span className="font-black text-xs uppercase tracking-wider">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="btn btn-ghost btn-xs text-white hover:bg-white/20">Hide</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT: Generation Form (Only if Role allowed) */}
        {canGenerate && (
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl shadow-base-200/50 border border-base-200 overflow-hidden sticky top-8">
              <div className="p-8 border-b border-base-100 bg-gradient-to-br from-base-50/80 to-transparent">
                 <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-primary">1. Generate Draft</h3>
                 <p className="text-[10px] font-bold opacity-40 mt-1 uppercase">Calculate semi-monthly dues</p>
              </div>
              <div className="p-8 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Select Employee</label>
                    <div className="relative group">
                      <select
                        className="select select-bordered w-full bg-base-50 border-base-200 group-hover:border-primary transition-all rounded-xl text-sm font-bold h-14"
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                      >
                        <option value="">Choose staff...</option>
                        {employees?.map((emp) => (
                          <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.position})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Pay Period</label>
                    <select
                      className="select select-bordered w-full bg-base-50 border-base-200 hover:border-primary transition-all rounded-xl text-sm font-bold h-14"
                      value={cutoff}
                      onChange={(e) => setCutoff(e.target.value)}
                    >
                      <option value="">Select period...</option>
                      <option value="May 1-15, 2026">May 1-15, 2026</option>
                      <option value="May 16-31, 2026">May 16-31, 2026</option>
                      <option value="June 1-15, 2026">June 1-15, 2026</option>
                      <option value="June 16-30, 2026">June 16-30, 2026</option>
                    </select>
                  </div>
                </div>

                <button
                  className={`btn btn-primary w-full rounded-xl h-16 uppercase font-black text-[11px] tracking-[0.2em] shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all ${generateMutation.isPending ? 'loading' : ''}`}
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                >
                  {!generateMutation.isPending && <FileText className="w-4 h-4 mr-2" />}
                  Create Draft Payslip
                </button>
                
                <div className="p-4 bg-info/5 rounded-xl border border-info/10">
                   <p className="text-[9px] font-bold text-info leading-relaxed uppercase opacity-80 italic">
                     * System automatically calculates required gov't deductions and active loans.
                   </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT: Main Queue */}
        <div className={canGenerate ? "lg:col-span-8 space-y-8" : "lg:col-span-12 space-y-8"}>
          
          {/* SEARCH & FILTERS */}
          <div className="bg-white rounded-2xl border border-base-200 p-3 flex flex-col md:flex-row gap-4 items-center shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
              <input 
                type="text" 
                placeholder="Search employee names..." 
                className="input input-ghost w-full pl-12 focus:bg-base-50 font-bold text-sm h-12 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
               <button className="btn btn-ghost btn-sm font-black text-[9px] uppercase tracking-widest opacity-40">All Records</button>
               <button className="btn btn-ghost btn-sm font-black text-[9px] uppercase tracking-widest">Released</button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-base-200/50 border border-base-200 overflow-hidden">
             <div className="p-8 border-b border-base-100 flex justify-between items-center bg-base-50/30">
                <div>
                   <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-base-content">2. Review & Release Queue</h3>
                   <p className="text-[10px] font-bold opacity-30 mt-0.5 uppercase tracking-wide">Action required for pending items</p>
                </div>
                <div className="flex gap-2">
                   <div className="px-4 py-1.5 bg-warning/10 text-warning rounded-full font-black text-[9px] uppercase tracking-wider">
                     {pendingPayrolls.length} Pending
                   </div>
                   <div className="px-4 py-1.5 bg-success/10 text-success rounded-full font-black text-[9px] uppercase tracking-wider">
                     {releasedPayrolls.length} Paid
                   </div>
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="table table-lg w-full">
                   <thead>
                      <tr className="bg-base-50/20 text-[10px] uppercase tracking-[0.2em] opacity-40 border-b border-base-100">
                         <th className="px-8 py-6">Staff Member</th>
                         <th>Financial Details</th>
                         <th>Status</th>
                         <th className="text-right px-8">Process Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-base-100">
                      {pendingPayrolls.length > 0 ? pendingPayrolls.map(p => (
                         <tr key={p.id} className="hover:bg-base-50/50 transition-colors group">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-base-200 rounded-full flex items-center justify-center font-black text-xs text-base-content/40 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                     {p.employee_name?.charAt(0)}
                                  </div>
                                  <div>
                                     <div className="font-black text-base tracking-tight">{p.employee_name}</div>
                                     <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                        <span className="text-[9px] font-black text-primary px-1.5 py-0.5 bg-primary/5 rounded border border-primary/10 tracking-widest uppercase">LBP-ATM</span>
                                        <span className="text-[9px] font-bold opacity-60 bg-base-100 px-2 py-0.5 rounded border border-base-200 uppercase">{p.days_worked || '11.0'} Days Worked</span>
                                        <span className="text-[10px] opacity-40 uppercase font-bold tracking-widest">{p.cutoff_period}</span>
                                     </div>
                                  </div>
                                </div>
                            </td>
                            <td>
                               <div className="space-y-1">
                                  <div className="text-lg font-black text-base-content">₱{parseFloat(p.net_salary).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                                  <div className="flex flex-col gap-0.5">
                                     <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-success">Credit Disburse</span>
                                        <span className="w-1 h-1 bg-base-300 rounded-full"></span>
                                        <span className="text-[9px] font-black uppercase tracking-wider opacity-30">Net Payable</span>
                                     </div>
                                     {p.status === 'released' && (
                                       <div className="text-[8px] font-bold opacity-40 uppercase tracking-tighter italic">
                                         To: {p.bank_name || 'Land Bank'} — ****{p.account_number?.slice(-4) || '8821'}
                                       </div>
                                     )}
                                  </div>
                               </div>
                            </td>
                            <td>
                               <span className={`px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-[0.1em] border ${
                                  p.status === 'approved' 
                                    ? 'bg-success/5 border-success/20 text-success' 
                                    : 'bg-warning/5 border-warning/20 text-warning'
                               }`}>
                                  {p.status}
                               </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <div className="flex justify-end gap-3">
                                  {p.status === 'draft' && canApprove && (
                                     <button 
                                        onClick={() => approveMutation.mutate(p.id)}
                                        className="btn btn-sm btn-primary rounded-xl font-black uppercase text-[10px] tracking-widest px-6 shadow-md shadow-primary/20 hover:shadow-lg transition-all"
                                        disabled={approveMutation.isPending}
                                     >
                                        {approveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><ShieldCheck className="w-3.5 h-3.5 mr-2" /> Approve</>}
                                     </button>
                                  )}
                                  {p.status === 'approved' && canRelease && (
                                     <button 
                                        onClick={() => releaseMutation.mutate(p.id)}
                                        className="btn btn-sm btn-success text-white rounded-xl font-black uppercase text-[10px] tracking-widest px-6 shadow-md shadow-success/20 hover:shadow-lg transition-all"
                                        disabled={releaseMutation.isPending}
                                     >
                                        {releaseMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Banknote className="w-3.5 h-3.5 mr-2" /> Disburse</>}
                                     </button>
                                  )}
                                  
                                  {/* Simple indicator if no action possible for current role */}
                                  {p.status === 'draft' && !canApprove && (
                                    <span className="text-[9px] font-black uppercase opacity-20 italic">Awaiting HR Review</span>
                                  )}
                                  {p.status === 'approved' && !canRelease && (
                                    <span className="text-[9px] font-black uppercase opacity-20 italic">Awaiting Accountant</span>
                                  )}
                               </div>
                            </td>
                         </tr>
                      )) : (
                         <tr>
                            <td colSpan="4" className="text-center py-24">
                               <div className="flex flex-col items-center gap-4 opacity-20">
                                  <Users className="w-16 h-16" />
                                  <p className="font-black uppercase text-sm tracking-[0.3em]">No Pending Transactions</p>
                               </div>
                            </td>
                         </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payroll;
