import React, { useState } from 'react';
import { PlusCircle, AlertCircle, Coins } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  LoanStats, 
  LoanCard, 
  ApplyLoanModal, 
  useLoans 
} from '../../features/loans';

/**
 * My Loans (Employee View)
 * Clean feature-hook driven view with zero data-fetching boilerplate.
 */
const MyLoans = () => {
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);

  const {
    loans,
    isLoading,
    applyLoan,
    isApplying,
    resubmitLoan,
    isResubmitting,
  } = useLoans();

  const handleApplySubmit = async (formData, files) => {
    try {
      if (selectedLoan) {
        await resubmitLoan({ id: selectedLoan.id, formData, files });
      } else {
        await applyLoan({ formData, files });
      }
      setActiveModal(null);
      setSelectedLoan(null);
    } catch {
      // Error handled by hook's toast
    }
  };

  const handleResubmitClick = (loan) => {
    setSelectedLoan(loan);
    setActiveModal('apply');
  };

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
        <LoanStats loans={loans} />
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loans.length > 0 ? (
          loans.map((loan) => (
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
        isPending={isApplying || isResubmitting} 
        user={user}
        initialData={selectedLoan}
      />
    </div>
  );
};

export default MyLoans;
