import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { Wallet, CheckCircle2, AlertCircle, FileText, User, Calendar, ArrowRight, ShieldCheck, Banknote } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

/**
 * Payroll (Admin/HR View)
 * 
 * Simple, professional redesign for generating and releasing staff payslips.
 */
const Payroll = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [cutoff, setCutoff] = useState('');
  const [message, setMessage] = useState(null);

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
    generateMutation.mutate({ employee_id: selectedEmployee, cutoff });
  };

  const pendingPayrolls = allPayrolls?.filter(p => p.status !== 'released') || [];

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Wallet className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">Payroll Management</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">Generate, Approve, and Disburse Salaries</p>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.type === 'error' ? 'alert-error' : 'bg-primary'} text-white shadow-xl border-none rounded-xl flex items-center gap-3 py-4 px-6`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="font-bold text-sm uppercase tracking-tight">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step 1: Generation Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-base-200 overflow-hidden sticky top-8">
            <div className="p-6 border-b border-base-100 bg-base-50/50">
               <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">1. Generate Draft</h3>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Employee</label>
                  <select
                    className="select select-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-lg text-sm font-bold"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  >
                    <option value="">Choose staff...</option>
                    {employees?.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Period</label>
                  <select
                    className="select select-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-lg text-sm font-bold"
                    value={cutoff}
                    onChange={(e) => setCutoff(e.target.value)}
                  >
                    <option value="">Select period...</option>
                    <option value="May 1-15, 2026">May 1-15, 2026</option>
                    <option value="May 16-31, 2026">May 16-31, 2026</option>
                  </select>
                </div>
              </div>

              <button
                className={`btn btn-primary w-full rounded-lg h-14 uppercase font-black text-xs tracking-widest ${generateMutation.isPending ? 'loading' : ''}`}
                onClick={handleGenerate}
                disabled={generateMutation.isPending || (user?.role !== 'ADMIN' && user?.role !== 'ACCOUNTANT')}
              >
                {!generateMutation.isPending && <FileText className="w-4 h-4 mr-2" />}
                Generate Draft
              </button>
            </div>
          </div>
        </div>

        {/* Step 2 & 3: Release Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-base-200 overflow-hidden">
             <div className="p-6 border-b border-base-100 flex justify-between items-center bg-base-50/50">
                <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">2. Review & Disbursement Queue</h3>
                <span className="badge badge-primary badge-sm font-black text-[9px] uppercase">{pendingPayrolls.length} Pending</span>
             </div>
             <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                   <thead>
                      <tr className="bg-base-50/30 text-[9px] uppercase tracking-widest opacity-40">
                         <th className="px-6 py-4">Employee</th>
                         <th>Net Amount</th>
                         <th>Status</th>
                         <th className="text-right px-6">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-base-100">
                      {pendingPayrolls.length > 0 ? pendingPayrolls.map(p => (
                         <tr key={p.id} className="hover:bg-base-50/30">
                            <td className="px-6 py-4">
                               <div className="font-bold text-sm">{p.employee_name}</div>
                               <div className="text-[10px] opacity-40 uppercase font-black">{p.cutoff_period}</div>
                            </td>
                            <td>
                               <span className="font-black text-base-content">₱{parseFloat(p.net_salary).toLocaleString()}</span>
                            </td>
                            <td>
                               <span className={`badge badge-sm font-black text-[9px] uppercase ${
                                  p.status === 'approved' ? 'badge-success text-white' : 'badge-warning'
                               }`}>
                                  {p.status}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex justify-end gap-2">
                                  {p.status === 'draft' && (user?.role === 'ADMIN' || user?.role === 'HR') && (
                                     <button 
                                        onClick={() => approveMutation.mutate(p.id)}
                                        className="btn btn-ghost btn-xs text-primary font-black uppercase tracking-widest hover:bg-primary/10"
                                     >
                                        <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Approve
                                     </button>
                                  )}
                                  {p.status === 'approved' && (user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT') && (
                                     <button 
                                        onClick={() => releaseMutation.mutate(p.id)}
                                        className="btn btn-ghost btn-xs text-success font-black uppercase tracking-widest hover:bg-success/10"
                                     >
                                        <Banknote className="w-3.5 h-3.5 mr-1" /> Release
                                     </button>
                                  )}
                               </div>
                            </td>
                         </tr>
                      )) : (
                         <tr>
                            <td colSpan="4" className="text-center py-20 opacity-20 font-black uppercase text-xs">Queue is empty</td>
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
