import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';
import LoanStats from '../../components/features/loans/LoanStats';
import LoanCard from '../../components/features/loans/LoanCard';
import ApplyLoanModal from '../../components/features/loans/ApplyLoanModal';

/**
 * MyLoans (Employee View)
 * 
 * Allows an employee to track their own loan applications and history.
 * They can also submit a new loan application.
 */
const MyLoans = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeModal, setActiveModal] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch My Loans
  const { data: loans, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.LOANS, user?.id],
    queryFn: async () => {
      const response = await api.get('loans/');
      return response.data;
    },
  });

  // Mutations
  const applyMutation = useMutation({
    mutationFn: (newLoan) => api.post('loans/', newLoan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LOANS] });
      setActiveModal(null);
      showToast('Loan application submitted!');
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || err.response?.data?.[0] || 'Failed to submit application.';
      showToast(msg, 'error');
    }
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

  if (isLoading) return (
    <div className="p-8 flex justify-center">
      <span className="loading loading-spinner loading-lg text-secondary"></span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {successMsg && (
        <div className="toast toast-top toast-end z-[100]">
          <div className={`alert ${successMsg.type === 'error' ? 'alert-error' : 'alert-secondary'} shadow-xl border-none text-white rounded-2xl flex items-center gap-3`}>
            {successMsg.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="font-bold text-sm">{successMsg.text}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-base-content flex items-center gap-3">
            <Wallet className="w-8 h-8 text-secondary" />
            My Loans
          </h1>
          <p className="text-sm opacity-50 font-medium mt-1">Track your loan applications and history.</p>
        </div>
        <button onClick={() => setActiveModal('apply')} className="btn btn-secondary shadow-lg shadow-secondary/20 rounded-2xl group">
          <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Apply for Loan
        </button>
      </div>

      <LoanStats loans={loanList} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loanList.length > 0 ? (
          loanList.map((loan) => (
            <LoanCard 
              key={loan.id} 
              loan={loan} 
              user={user} 
            />
          ))
        ) : (
          <div className="lg:col-span-2 py-20 bg-base-100 rounded-3xl border-2 border-dashed border-base-300 flex flex-col items-center justify-center text-center opacity-30">
            <AlertCircle className="w-16 h-16 mb-4" />
            <p className="text-xl font-bold italic">You have no loan records.</p>
          </div>
        )}
      </div>

      <ApplyLoanModal 
        isOpen={activeModal === 'apply'} 
        onClose={() => setActiveModal(null)} 
        onSubmit={handleApplySubmit} 
        isPending={applyMutation.isPending} 
        user={user}
      />
    </div>
  );
};

export default MyLoans;
