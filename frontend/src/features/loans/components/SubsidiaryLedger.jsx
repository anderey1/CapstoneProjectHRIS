import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, Plus, AlertCircle, CheckCircle2, User, Printer } from 'lucide-react';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';

/**
 * SubsidiaryLedger
 * 
 * Digitized "DEPARTMENT OF EDUCATION - DIVISION OF LUCENA CITY PROVIDENT FUND SUBSIDIARY LEDGER"
 * Shows ledger card in landscape-style table structure divided into two columns (1-30, 31-60).
 */
const SubsidiaryLedger = ({ loan, userCanPost = false }) => {
  const queryClient = useQueryClient();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [msg, setMsg] = useState(null);

  const postPaymentMutation = useMutation({
    mutationFn: (amount) => api.post(`loans/${loan.id}/post-payment/`, { amount_paid: amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LOANS] });
      setPaymentAmount('');
      showToast('Deduction posted successfully!');
    },
    onError: (err) => showToast(err.response?.data?.detail || 'Failed to post deduction.', 'error'),
  });

  const showToast = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const handlePostPayment = (e) => {
    e.preventDefault();
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return;
    postPaymentMutation.mutate(paymentAmount);
  };

  // Organize payments by sequence
  const paymentsMap = {};
  if (Array.isArray(loan.payments)) {
    loan.payments.forEach(p => {
      paymentsMap[p.sequence] = p;
    });
  }

  // Pre-calculate interest receivable
  const principal = parseFloat(loan.loan_amount) || 0;
  const totalLoan = parseFloat(loan.total_amount) || 0;
  const interestReceivable = totalLoan - principal;

  const handlePrint = () => {
    window.print();
  };

  const renderLedgerTable = (startSeq, endSeq) => {
    const rows = [];
    for (let i = startSeq; i <= endSeq; i++) {
      const payment = paymentsMap[i];
      rows.push(
        <tr key={i} className="h-6 border-b border-black text-[9px]">
          <td className="border-r border-black text-center font-bold">{i}</td>
          <td className="border-r border-black px-1 text-center font-mono">
            {payment ? new Date(payment.payment_date).toLocaleDateString() : ''}
          </td>
          <td className="border-r border-black px-1 text-right font-mono">
            {payment ? `₱${parseFloat(payment.principal_paid).toFixed(2)}` : ''}
          </td>
          <td className="border-r border-black px-1 text-right font-mono">
            {payment ? `₱${parseFloat(payment.interest_paid).toFixed(2)}` : ''}
          </td>
          <td className="border-r border-black px-1 text-right font-mono font-bold">
            {payment ? `₱${parseFloat(payment.amount_paid).toFixed(2)}` : ''}
          </td>
          <td className="border-r border-black px-1 text-right font-mono font-bold bg-base-50/50">
            {payment ? `₱${parseFloat(payment.remaining_balance).toFixed(2)}` : ''}
          </td>
          <td className="px-1 text-center truncate max-w-[60px] opacity-75">
            {payment ? (payment.posted_by_name || 'System') : ''}
          </td>
        </tr>
      );
    }

    return (
      <table className="w-full border-collapse border border-black bg-white text-black">
        <thead>
          <tr className="bg-base-100/50 text-[8px] font-black uppercase tracking-tighter border-b border-black text-center h-8">
            <th className="border-r border-black w-7" rowSpan={2}>Seq</th>
            <th className="border-r border-black w-16" rowSpan={2}>Date Deducted</th>
            <th className="border-b border-black border-r border-black" colSpan={3}>Monthly Amortization</th>
            <th className="border-r border-black w-20" rowSpan={2}>Loan Balance</th>
            <th className="w-14" rowSpan={2}>Posted By</th>
          </tr>
          <tr className="bg-base-100/50 text-[7px] font-black uppercase border-b border-black text-center h-6">
            <th className="border-r border-black w-14">Principal</th>
            <th className="border-r border-black w-14">Interest</th>
            <th className="border-r border-black w-14">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Alert Inside Widget */}
      {msg && (
        <div className="alert flex items-center gap-2 text-xs font-black uppercase tracking-widest py-2.5 px-4 rounded-lg bg-base-900 text-white shadow-md border-none animate-in fade-in">
          {msg.type === 'error' ? <AlertCircle className="w-4 h-4 text-error" /> : <CheckCircle2 className="w-4 h-4 text-success" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* LEDGER CARD container - optimized for print */}
      <div id="provident-ledger-card" className="bg-white border border-black p-6 rounded-none text-black font-serif shadow-sm print:p-0 print:border-none">
        
        {/* Document Header */}
        <div className="text-center space-y-0.5 mb-6">
          <p className="text-[10px] font-bold tracking-widest uppercase">Department of Education</p>
          <p className="text-[10px] font-bold tracking-widest uppercase">Division of Lucena City</p>
          <h2 className="text-base font-black tracking-wider uppercase border-b-2 border-black pb-1.5 w-fit mx-auto mt-1">
            Provident Fund Subsidiary Ledger
          </h2>
        </div>

        {/* Header Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-[10px] uppercase font-sans mb-6 border-b border-dashed border-black pb-4">
          <div className="space-y-2">
            <div className="flex border-b border-black pb-0.5">
              <span className="font-bold w-32">Name of Borrower:</span>
              <span className="font-mono font-bold flex-1">{loan.employee_name}</span>
            </div>
            <div className="flex border-b border-black pb-0.5">
              <span className="font-bold w-32">Employee Number:</span>
              <span className="font-mono flex-1">{loan.employee_number || 'N/A'}</span>
            </div>
            <div className="flex border-b border-black pb-0.5">
              <span className="font-bold w-32">Station Code:</span>
              <span className="font-mono flex-1">{loan.station_code || 'N/A'}</span>
            </div>
            <div className="flex border-b border-black pb-0.5">
              <span className="font-bold w-32">Date Granted:</span>
              <span className="font-mono flex-1">
                {loan.date_granted ? new Date(loan.date_granted).toLocaleDateString() : 'Pending Release'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex border-b border-black pb-0.5">
              <span className="font-bold w-32">Amount Granted:</span>
              <span className="font-mono font-bold flex-1">₱{(parseFloat(loan.loan_amount) || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex border-b border-black pb-0.5">
              <span className="font-bold w-32">Interest Receivable:</span>
              <span className="font-mono flex-1">₱{interestReceivable.toLocaleString(undefined, {minimumFractionDigits: 2})} ({loan.interest_rate}%)</span>
            </div>
            <div className="flex border-b border-black pb-0.5">
              <span className="font-bold w-32">Total Loan:</span>
              <span className="font-mono font-bold flex-1 text-primary">₱{(parseFloat(loan.total_amount) || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex border-b border-black pb-0.5">
              <span className="font-bold w-32">Current Balance:</span>
              <span className="font-mono font-bold flex-1 text-secondary">
                ₱{paymentsMap[loan.payments?.length]?.remaining_balance || (parseFloat(loan.total_amount) - (loan.payments?.reduce((acc, p) => acc + parseFloat(p.amount_paid), 0) || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}
              </span>
            </div>
          </div>
        </div>

        {/* Ledger Tables (Side-by-Side Landscape) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          {/* Left Table: 1-30 */}
          <div>
            <h4 className="text-[8px] font-bold uppercase tracking-widest text-center mb-1 opacity-50">Ledger Section A (Seq. 1 - 30)</h4>
            {renderLedgerTable(1, 30)}
          </div>

          {/* Right Table: 31-60 */}
          <div>
            <h4 className="text-[8px] font-bold uppercase tracking-widest text-center mb-1 opacity-50">Ledger Section B (Seq. 31 - 60)</h4>
            {renderLedgerTable(31, 60)}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex justify-between items-center text-[7px] uppercase tracking-wider mt-6 opacity-30 font-sans">
          <span>DepEd division of lucena city • HRIS digital subsidiary ledger</span>
          <span>System Generated Ledger Card</span>
        </div>
      </div>

      {/* Action Buttons for Printing & Posting */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-base-50 p-4 rounded-xl border border-base-200 print:hidden">
        
        {/* Manual Posting Form (Accountant Only) */}
        {userCanPost ? (
          <form onSubmit={handlePostPayment} className="flex gap-2 w-full sm:w-auto items-center">
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs opacity-40 font-bold">₱</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Deduction Amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="input input-sm h-10 pl-7 w-40 text-xs font-bold rounded-lg border-base-300 focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={postPaymentMutation.isPending || !paymentAmount}
              className="btn btn-primary btn-sm h-10 rounded-lg text-[10px] font-black uppercase tracking-widest px-4 gap-1.5 shadow-md shadow-primary/20"
            >
              <Plus className="w-3.5 h-3.5" /> Post Deduction
            </button>
          </form>
        ) : (
          <div className="text-xs opacity-50 flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> View-only access
          </div>
        )}

        {/* Print Button */}
        <button
          onClick={handlePrint}
          className="btn btn-ghost btn-sm h-10 border border-base-300 rounded-lg text-[10px] font-black uppercase tracking-widest px-6 hover:bg-base-200 w-full sm:w-auto"
        >
          <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Ledger Card
        </button>
      </div>

    </div>
  );
};

export default SubsidiaryLedger;
