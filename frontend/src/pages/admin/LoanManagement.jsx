import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, PlusCircle, CheckCircle2, AlertCircle, Coins } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';
import LoanStats from '../../components/features/loans/LoanStats';
import LoanCard from '../../components/features/loans/LoanCard';
import ApplyLoanModal from '../../components/features/loans/ApplyLoanModal';

/**
 * Loans (Admin/HR View)
 * 
 * Simple, professional redesign for managing staff loans.
 */
const LoanManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeModal, setActiveModal] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // 1. Data Fetching
  const { data: loans, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.LOANS],
    queryFn: async () => {
      const response = await api.get('loans/');
      return response.data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES],
    queryFn: async () => {
      const response = await api.get('employees/');
      return response.data;
    }
  });

  // 2. Mutations
  const applyMutation = useMutation({
    mutationFn: (newLoan) => api.post('loans/', newLoan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LOANS] });
      setActiveModal(null);
      showToast('Loan recorded!');
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Failed to add loan.';
      showToast(msg, 'error');
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id) => api.post(`loans/${id}/approve/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LOANS] });
      showToast('Loan approved!');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => api.post(`loans/${id}/reject/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LOANS] });
      showToast('Loan rejected.');
    },
  });

  const showToast = (msg, type = 'success') => {
    setSuccessMsg({ text: msg, type });
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleApplySubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    applyMutation.mutate(Object.fromEntries(formData.entries()));
  };

  const loanList = Array.isArray(loans) ? loans : (loans?.results || []);
  const employeeList = Array.isArray(employees) ? employees : (employees?.results || []);

  if (isLoading) return (
    <div className="p-8 flex justify-center h-[60vh] items-center">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Toast Notification */}
      {successMsg && (
        <div className="toast toast-top toast-end z-[100] mt-16">
          <div className={`alert ${successMsg.type === 'error' ? 'alert-error' : 'bg-primary'} text-white shadow-xl border-none rounded-lg flex items-center gap-3 py-3 px-6`}>
            {successMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span className="font-bold text-xs uppercase tracking-widest">{successMsg.text}</span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Coins className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">Loans</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">Manage staff loan requests</p>
        </div>
        
        <button 
          onClick={() => setActiveModal('apply')} 
          className="btn btn-primary rounded-lg shadow-lg shadow-primary/20 px-8"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Loan
        </button>
      </div>

      {/* Summary Stats */}
      <div className="animate-in fade-in duration-700">
        <LoanStats loans={loanList} />
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loanList.length > 0 ? (
          loanList.map((loan) => (
            <LoanCard 
              key={loan.id} 
              loan={loan} 
              user={user} 
              onApprove={(id) => approveMutation.mutate(id)} 
              onReject={(id) => rejectMutation.mutate(id)} 
              isProcessing={approveMutation.isPending || rejectMutation.isPending}
            />
          ))
        ) : (
          <div className="lg:col-span-2 py-20 bg-white rounded-xl border border-dashed border-base-300 flex flex-col items-center justify-center text-center opacity-30">
            <AlertCircle className="w-12 h-12 mb-3" />
            <p className="text-lg font-black uppercase tracking-widest">No loan requests</p>
          </div>
        )}
      </div>

      <ApplyLoanModal 
        isOpen={activeModal === 'apply'} 
        onClose={() => setActiveModal(null)} 
        onSubmit={handleApplySubmit} 
        isPending={applyMutation.isPending} 
        user={user}
        employees={employeeList}
      />
    </div>
  );
};

export default LoanManagement;
