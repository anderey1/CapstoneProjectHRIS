import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { Wallet, CheckCircle2, AlertCircle, FileText, User, Calendar } from 'lucide-react';

/**
 * Payroll (Admin/HR View)
 * 
 * Simple, professional redesign for generating staff payslips.
 */
const Payroll = () => {
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [cutoff, setCutoff] = useState('');
  const [message, setMessage] = useState(null);

  // 1. Data Fetching
  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES],
    queryFn: async () => {
      const res = await api.get('employees/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  // 2. Mutations
  const generateMutation = useMutation({
    mutationFn: async ({ employeeId, cutoffPeriod }) => {
      const res = await api.post('payroll/generate/', { 
        employee_id: employeeId, 
        cutoff: cutoffPeriod 
      });
      return res.data;
    },
    onSuccess: (data) => {
      setMessage({ type: 'success', text: `Payslip created! Net Salary: ₱${parseFloat(data.net_salary).toLocaleString()}` });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYROLL] });
    },
    onError: (err) => {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to create payslip.' });
    },
  });

  const handleGenerate = () => {
    if (!selectedEmployee || !cutoff) {
      setMessage({ type: 'error', text: 'Please select an employee and period.' });
      return;
    }
    generateMutation.mutate({ employeeId: selectedEmployee, cutoffPeriod: cutoff });
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Wallet className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">Payroll</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">Generate staff payslips</p>
        </div>
      </div>

      {/* Message Feedback */}
      {message && (
        <div className={`alert ${message.type === 'error' ? 'alert-error' : 'bg-primary'} text-white shadow-xl border-none rounded-xl flex items-center gap-3 py-4 px-6 animate-in fade-in slide-in-from-top-2`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="font-bold text-sm uppercase tracking-tight">{message.text}</span>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-base-200 overflow-hidden">
        <div className="p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Employee Selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
                <User className="w-3 h-3" />
                Select Employee
              </label>
              <div className="relative">
                {loadingEmployees ? (
                  <div className="flex items-center gap-2 p-3 bg-base-50 rounded-lg border border-base-200 animate-pulse">
                     <span className="loading loading-spinner loading-xs text-primary" />
                     <span className="text-xs font-bold opacity-30">Loading staff...</span>
                  </div>
                ) : (
                  <select
                    className="select select-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-lg text-sm font-bold"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  >
                    <option value="">Choose an employee</option>
                    {(Array.isArray(employees) ? employees : [])?.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} — {emp.position}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Cutoff Selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
                <Calendar className="w-3 h-3" />
                Time Period
              </label>
              <select
                className="select select-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-lg text-sm font-bold"
                value={cutoff}
                onChange={(e) => setCutoff(e.target.value)}
              >
                <option value="">Select period</option>
                <option value="1st-15th">1st – 15th (Mid Month)</option>
                <option value="16th-end">16th – End (End Month)</option>
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-base-100">
            <button
              className={`btn btn-primary btn-lg w-full rounded-lg shadow-lg shadow-primary/20 text-xs font-black uppercase tracking-widest h-16 ${generateMutation.isPending ? 'loading' : ''}`}
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
            >
              {!generateMutation.isPending && <FileText className="w-5 h-5 mr-3" />}
              {generateMutation.isPending ? 'Calculating...' : 'Create Payslip'}
            </button>
          </div>

          <p className="text-[10px] text-center font-medium opacity-30 uppercase tracking-tighter">
            Note: This will calculate deductions based on attendance and statutory requirements.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Payroll;
