import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, CheckCircle2, AlertCircle, Coins } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';
import LoanStats from '../../components/features/loans/LoanStats';
import LoanCard from '../../components/features/loans/LoanCard';
import ApplyLoanModal from '../../components/features/loans/ApplyLoanModal';

/**
 * My Loans (Employee View)
 */
const MyLoans = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeModal, setActiveModal] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);

  // 1. Data Fetching
  const { data: loans, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.LOANS, user?.id],
    queryFn: async () => {
      const response = await api.get('loans/');
      return response.data;
    },
  });

  // 2. Mutations
  const applyMutation = useMutation({
    mutationFn: async ({ formData, files }) => {
      // 1. Create the loan
      const res = await api.post('loans/', formData);
      const loanId = res.data.id;

      // 2. Upload files if any
      for (const { doc_type, file } of files) {
        const fd = new FormData();
        fd.append('doc_type', doc_type);
        fd.append('file', file);
        await api.post(`loans/${loanId}/upload_document/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LOANS] });
      setActiveModal(null);
      setSelectedLoan(null);
      alert('Application sent successfully!');
    },
    onError: (err) => {
      const errorData = err.response?.data;
      let msg = 'Application failed. Please ensure all data is correct and files are valid.';
      if (errorData) {
        if (typeof errorData === 'string') msg = errorData;
        else if (Array.isArray(errorData)) msg = errorData[0];
        else if (errorData.detail) msg = errorData.detail;
      }
      alert(msg);
    }
  });

  const resubmitMutation = useMutation({
    mutationFn: async ({ id, formData, files }) => {
      // 1. Resubmit the loan data
      const res = await api.post(`loans/${id}/resubmit/`, formData);
      
      // 2. Upload new files if any
      for (const { doc_type, file } of files) {
        const fd = new FormData();
        fd.append('doc_type', doc_type);
        fd.append('file', file);
        await api.post(`loans/${id}/upload_document/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LOANS] });
      setActiveModal(null);
      setSelectedLoan(null);
      alert('Application resubmitted successfully!');
    },
    onError: (err) => {
      const errorData = err.response?.data;
      let msg = 'Resubmission failed. Please check your data and try again.';
      if (errorData) {
        if (typeof errorData === 'string') msg = errorData;
        else if (Array.isArray(errorData)) msg = errorData[0];
        else if (errorData.detail) msg = errorData.detail;
      }
      alert(msg);
    }
  });

  const handleApplySubmit = (formData, files) => {
    if (selectedLoan) {
      resubmitMutation.mutate({ id: selectedLoan.id, formData, files });
    } else {
      applyMutation.mutate({ formData, files });
    }
  };

  const handleResubmitClick = (loan) => {
    setSelectedLoan(loan);
    setActiveModal('apply');
  };

  const loanList = Array.isArray(loans) ? loans : (loans?.results || []);

  if (isLoading) return (
    <div className="p-8 flex justify-center h-[60vh] items-center">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Coins className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">My Loans</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">Track your loan history</p>
        </div>
        
        <button 
          onClick={() => setActiveModal('apply')} 
          className="btn btn-primary rounded-lg shadow-lg shadow-primary/20 px-8"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Apply Now
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
              onResubmit={handleResubmitClick}
            />
          ))
        ) : (
          <div className="lg:col-span-2 py-20 bg-white rounded-xl border border-dashed border-base-300 flex flex-col items-center justify-center text-center opacity-30">
            <AlertCircle className="w-12 h-12 mb-3" />
            <p className="text-lg font-black uppercase tracking-widest">No loans found</p>
          </div>
        )}
      </div>

      <ApplyLoanModal 
        isOpen={activeModal === 'apply'} 
        onClose={() => { setActiveModal(null); setSelectedLoan(null); }} 
        onSubmit={handleApplySubmit} 
        isPending={applyMutation.isPending || resubmitMutation.isPending} 
        user={user}
        initialData={selectedLoan}
      />
    </div>
  );
};

export default MyLoans;
