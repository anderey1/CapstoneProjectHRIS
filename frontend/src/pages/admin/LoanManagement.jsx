import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Coins, Clock, CheckCircle2, XCircle, ChevronRight, Tag,
  Users, FileText, AlertCircle, Eye, MessageSquare,
  TrendingUp, Circle, FileCheck, Calendar
} from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import SubsidiaryLedger from '../../components/features/loans/SubsidiaryLedger';

const PURPOSE_LABELS = {
  general: 'General',
  medical: 'Medical',
  calamity: 'Calamity',
  educational: 'Educational',
  emergency: 'Emergency',
};

const PURPOSE_COLORS = {
  general: 'bg-base-content/5 text-base-content/60',
  medical: 'bg-error/10 text-error',
  calamity: 'bg-warning/10 text-warning',
  educational: 'bg-info/10 text-info',
  emergency: 'bg-error/10 text-error',
};

const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const host = baseUrl.split('/api')[0];
  return `${host}${path}`;
};

/**
 * Loan Management (HR/Admin View)
 * 
 * Review-focused dashboard for managing loan applications.
 */
const LoanManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [approveRemarks, setApproveRemarks] = useState('');
  const [successMsg, setSuccessMsg] = useState(null);

  // Data Fetching
  const { data: loans = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.LOANS],
    queryFn: async () => {
      const res = await api.get('loans/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  // Checklist for selected loan
  const { data: checklist } = useQuery({
    queryKey: [QUERY_KEYS.LOANS, selectedLoan?.id, 'checklist'],
    queryFn: async () => {
      const res = await api.get(`loans/${selectedLoan.id}/checklist/`);
      return res.data;
    },
    enabled: !!selectedLoan,
  });

  // Documents for selected loan
  const { data: documents = [] } = useQuery({
    queryKey: [QUERY_KEYS.LOANS, selectedLoan?.id, 'documents'],
    queryFn: async () => {
      const res = await api.get(`loans/${selectedLoan.id}/documents/`);
      return res.data;
    },
    enabled: !!selectedLoan,
  });

  // Mutations
  const verifyMutation = useMutation({
    mutationFn: (id) => api.post(`loans/${id}/verify/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LOANS] });
      setSelectedLoan(null);
      showToast('Loan documents verified successfully!');
    },
    onError: (err) => showToast(err.response?.data?.detail || 'Verification failed.', 'error'),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, remarks }) => api.post(`loans/${id}/approve/`, { remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LOANS] });
      setSelectedLoan(null);
      setApproveRemarks('');
      showToast('Loan approved successfully!');
    },
    onError: (err) => showToast(err.response?.data?.detail || 'Approval failed.', 'error'),
  });

  const disburseMutation = useMutation({
    mutationFn: (id) => api.post(`loans/${id}/release-funds/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LOANS] });
      setSelectedLoan(null);
      showToast('Loan funds released successfully!');
    },
    onError: (err) => showToast(err.response?.data?.detail || 'Disbursement failed.', 'error'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, remarks }) => api.post(`loans/${id}/reject/`, { remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LOANS] });
      setSelectedLoan(null);
      setRejectRemarks('');
      showToast('Loan rejected.');
    },
    onError: (err) => showToast(err.response?.data?.detail || 'Rejection failed.', 'error'),
  });

  const showToast = (msg, type = 'success') => {
    setSuccessMsg({ text: msg, type });
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Filtering
  const pendingLoans = loans.filter(l => l.status === 'pending');
  const verifiedLoans = loans.filter(l => l.status === 'verified');
  const approvedLoans = loans.filter(l => l.status === 'approved');
  const releasedLoans = loans.filter(l => l.status === 'released');
  const rejectedLoans = loans.filter(l => l.status === 'rejected');
  const paidLoans = loans.filter(l => l.status === 'paid');

  const filteredLoans = activeTab === 'pending' ? pendingLoans
    : activeTab === 'verified' ? verifiedLoans
    : activeTab === 'approved' ? approvedLoans
    : activeTab === 'released' ? [...releasedLoans, ...paidLoans]
    : activeTab === 'rejected' ? rejectedLoans
    : paidLoans;

  const totalReleasedValue = [...releasedLoans, ...paidLoans].reduce((acc, l) => acc + parseFloat(l.loan_amount || 0), 0);

  if (isLoading) return (
    <div className="p-8 flex justify-center h-[60vh] items-center">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">

      {/* Toast */}
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
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">Loan Review</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">Review and process loan applications</p>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-base-200 shadow-sm flex items-center gap-4 group hover:border-warning/20 transition-all">
          <div className="w-10 h-10 bg-warning/5 text-warning border border-warning/5 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase opacity-30 tracking-[0.2em] mb-0.5">To Verify</p>
            <p className="text-2xl font-black text-base-content tracking-tighter">{pendingLoans.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-base-200 shadow-sm flex items-center gap-4 group hover:border-info/20 transition-all">
          <div className="w-10 h-10 bg-info/5 text-info border border-info/5 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase opacity-30 tracking-[0.2em] mb-0.5">To Approve</p>
            <p className="text-2xl font-black text-base-content tracking-tighter">{verifiedLoans.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-base-200 shadow-sm flex items-center gap-4 group hover:border-success/20 transition-all">
          <div className="w-10 h-10 bg-success/5 text-success border border-success/5 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase opacity-30 tracking-[0.2em] mb-0.5">Wait Release</p>
            <p className="text-2xl font-black text-base-content tracking-tighter">{approvedLoans.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-base-200 shadow-sm flex items-center gap-4 group hover:border-primary/20 transition-all">
          <div className="w-10 h-10 bg-primary/5 text-primary border border-primary/5 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase opacity-30 tracking-[0.2em] mb-0.5">Total Released</p>
            <p className="text-2xl font-black text-base-content tracking-tighter">₱{totalReleasedValue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-base-200/50 p-1 rounded-xl w-fit border border-base-200">
        {[
          { key: 'pending', label: 'Verify Docs', count: pendingLoans.length },
          { key: 'verified', label: 'Superintendent Approval', count: verifiedLoans.length },
          { key: 'approved', label: 'Wait Release', count: approvedLoans.length },
          { key: 'released', label: 'Active / Paid', count: releasedLoans.length + paidLoans.length },
          { key: 'rejected', label: 'Rejected', count: rejectedLoans.length },
        ].map(tab => (
          <button
            key={tab.key}
            className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeTab === tab.key ? 'bg-white text-primary shadow-sm' : 'opacity-40 hover:opacity-100'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-base-300/50'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loan Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredLoans.length > 0 ? (
          filteredLoans.map((loan) => (
            <div key={loan.id} className="bg-white border border-base-200 shadow-sm hover:shadow-md transition-all rounded-xl overflow-hidden group">
              <div className="p-6 space-y-5">

                {/* Header: Employee + Status */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-base-50 border border-base-200 flex items-center justify-center text-primary font-black uppercase text-xs">
                      {loan.employee_name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-base-content leading-tight">{loan.employee_name}</p>
                      <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">LOAN-{loan.id.toString().padStart(4, '0')}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    loan.status === 'approved' ? 'bg-success/10 text-success' :
                    loan.status === 'rejected' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                  }`}>
                    {loan.status}
                  </div>
                </div>

                {/* Details Row */}
                <div className="space-y-2 py-4 border-y border-base-50">
                  <div className="flex items-center gap-2">
                    <Coins className="w-3.5 h-3.5 opacity-30" />
                    <span className="text-[11px] font-bold text-base-content uppercase tracking-tight">
                      ₱{parseFloat(loan.loan_amount).toLocaleString()} — {loan.term_months} months @ {loan.interest_rate}%
                    </span>
                  </div>
                  {loan.purpose && (
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 opacity-30" />
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${PURPOSE_COLORS[loan.purpose] || 'bg-base-100'}`}>
                        {PURPOSE_LABELS[loan.purpose] || loan.purpose}
                      </span>
                    </div>
                  )}
                  {(loan.co_maker_name_display || loan.co_maker_name) && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 opacity-30" />
                      <span className="text-[11px] font-medium opacity-60">Co-maker: {loan.co_maker_name_display || loan.co_maker_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 opacity-30" />
                    <span className="text-[11px] font-medium opacity-60">Applied: {new Date(loan.date_applied).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Letter excerpt */}
                {loan.letter_request && (
                  <div className="bg-base-50/50 p-4 rounded-lg border border-base-100">
                    <p className="text-[11px] font-medium italic opacity-60 line-clamp-2 leading-relaxed">"{loan.letter_request}"</p>
                  </div>
                )}

                {/* Remarks (for resolved loans) */}
                {loan.remarks && loan.status !== 'pending' && (
                  <div className="flex items-start gap-2 p-3 bg-base-50 rounded-lg border border-base-100">
                    <MessageSquare className="w-3 h-3 mt-0.5 opacity-30 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-0.5">Superintendent Remarks</p>
                      <p className="text-[10px] font-bold text-base-content/70 line-clamp-2">{loan.remarks}</p>
                    </div>
                  </div>
                )}

                {/* Review Button */}
                <button
                  onClick={() => { setSelectedLoan(loan); setRejectRemarks(''); setApproveRemarks(''); }}
                  className="btn btn-ghost btn-block bg-base-50 border-base-200 hover:bg-primary/5 hover:text-primary hover:border-primary/20 rounded-lg text-xs font-bold uppercase tracking-widest group transition-all"
                >
                  {loan.status === 'pending' ? 'Review Application' : 'View Details'}
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform ml-1" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-32 bg-white rounded-xl border border-dashed border-base-300 flex flex-col items-center justify-center text-center opacity-30">
            <Coins className="w-12 h-12 mb-3" />
            <p className="text-lg font-black uppercase tracking-widest">No {activeTab} applications</p>
          </div>
        )}
      </div>

      {/* ===== REVIEW MODAL ===== */}
      {selectedLoan && (
        <div className="modal modal-open">
          <div className="modal-box rounded-xl max-w-2xl p-0 overflow-hidden shadow-2xl border border-base-300 bg-white max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="bg-primary p-8 text-white relative shrink-0">
              <button onClick={() => setSelectedLoan(null)} className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <XCircle className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 font-black text-lg">
                  {selectedLoan.employee_name?.[0] || '?'}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight leading-none mb-1">{selectedLoan.employee_name}</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">LOAN-{selectedLoan.id.toString().padStart(4, '0')}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                  {selectedLoan.status}
                </div>
                {selectedLoan.purpose && (
                  <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {PURPOSE_LABELS[selectedLoan.purpose] || selectedLoan.purpose}
                  </div>
                )}
                <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                  {new Date(selectedLoan.date_applied).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 overflow-y-auto flex-1 min-h-0">

              {(selectedLoan.status === 'released' || selectedLoan.status === 'paid') ? (
                <SubsidiaryLedger 
                  loan={selectedLoan} 
                  userCanPost={user?.role === 'ACCOUNTANT' || user?.role === 'ADMINISTRATIVE' || user?.is_superuser} 
                />
              ) : (
                <>
                  {/* Financial Breakdown */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-base-50 rounded-xl border border-base-100">
                      <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-1">Principal</p>
                      <p className="text-xl font-black text-secondary tracking-tighter">₱{parseFloat(selectedLoan.loan_amount).toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-base-50 rounded-xl border border-base-100">
                      <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-1">Monthly</p>
                      <p className="text-xl font-black text-primary tracking-tighter">₱{parseFloat(selectedLoan.monthly_payment).toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-base-50 rounded-xl border border-base-100">
                      <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-1">Total</p>
                      <p className="text-xl font-black text-base-content tracking-tighter">₱{parseFloat(selectedLoan.total_amount).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-[10px] font-black opacity-40 uppercase tracking-widest px-1">
                    <span>Rate: {selectedLoan.interest_rate}%</span>
                    <span>Term: {selectedLoan.term_months} months</span>
                  </div>

                  {/* Application Details */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-black uppercase tracking-widest opacity-40 px-1">Application Details</h4>

                    {(selectedLoan.co_maker_name_display || selectedLoan.co_maker_name) && (
                      <div className="flex items-center gap-3 p-4 bg-base-50 rounded-lg border border-base-100">
                        <Users className="w-4 h-4 opacity-30" />
                        <div>
                          <p className="text-[9px] font-black opacity-30 uppercase tracking-widest">Co-Maker</p>
                          <p className="text-xs font-bold">{selectedLoan.co_maker_name_display || selectedLoan.co_maker_name}</p>
                        </div>
                      </div>
                    )}

                    {selectedLoan.letter_request && (
                      <div className="p-4 bg-base-50 rounded-lg border border-base-100">
                        <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-2">Letter Request</p>
                        <p className="text-xs font-medium leading-relaxed italic text-base-content/70 whitespace-pre-wrap">"{selectedLoan.letter_request}"</p>
                      </div>
                    )}
                  </div>

                  {/* Document Checklist */}
                  {checklist && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <h4 className="text-[11px] font-black uppercase tracking-widest opacity-40">Documents</h4>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          checklist.all_required_submitted
                            ? 'bg-success/10 text-success'
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {checklist.all_required_submitted ? 'Complete' : 'Incomplete'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {checklist.checklist?.map((doc) => {
                          const uploadedDoc = documents.find(d => d.doc_type === doc.doc_type);
                          return (
                            <div key={doc.doc_type} className="flex items-center justify-between p-3 bg-base-50 rounded-lg border border-base-100">
                              <div className="flex items-center gap-2">
                                {doc.submitted
                                  ? <FileCheck className="w-3.5 h-3.5 text-success" />
                                  : <Circle className="w-3.5 h-3.5 opacity-20" />
                                }
                                <span className="text-[10px] font-bold uppercase tracking-wide">{doc.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {uploadedDoc?.file && (
                                  <a 
                                    href={getFileUrl(uploadedDoc.file)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-ghost btn-xs text-primary font-black uppercase tracking-widest hover:bg-primary/5"
                                  >
                                    <Eye className="w-3 h-3" /> View
                                  </a>
                                )}
                                {!doc.required && <span className="text-[8px] font-black text-info/50 uppercase">Optional</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Existing Remarks (for resolved loans) */}
                  {selectedLoan.remarks && selectedLoan.status !== 'pending' && (
                    <div className="p-4 bg-warning/5 rounded-lg border border-warning/10 flex items-start gap-3">
                      <MessageSquare className="w-4 h-4 text-warning opacity-60 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-1">Superintendent Remarks</p>
                        <p className="text-xs font-bold text-base-content/70">{selectedLoan.remarks}</p>
                        {selectedLoan.reviewed_by_name && (
                          <p className="text-[9px] font-bold opacity-30 mt-1 uppercase">— {selectedLoan.reviewed_by_name}, {selectedLoan.reviewed_at ? new Date(selectedLoan.reviewed_at).toLocaleDateString() : ''}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Section (Accountant Verification) */}
                  {selectedLoan.status === 'pending' && (
                    <div className="space-y-4 pt-4 border-t border-base-100">
                      <h4 className="text-[11px] font-black uppercase tracking-widest opacity-40 px-1">Accountant Verification</h4>
                      {(user?.role === 'ACCOUNTANT' || user?.is_superuser) ? (
                        <>
                          <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-3">
                            <p className="text-[10px] font-bold text-primary/70 uppercase leading-relaxed text-center">
                              Verify that all required documents are uploaded and valid before endorsing to the Superintendent.
                            </p>
                            <button
                              onClick={() => verifyMutation.mutate(selectedLoan.id)}
                              disabled={verifyMutation.isPending}
                              className="btn btn-primary btn-block rounded-lg font-black text-[11px] uppercase tracking-widest h-12 shadow-md shadow-primary/20"
                            >
                              {verifyMutation.isPending ? 'Verifying...' : 'Verify & Endorse Loan Documents'}
                            </button>
                          </div>

                          {/* Reject Section */}
                          <div className="p-4 bg-error/5 border border-error/10 rounded-xl space-y-3">
                            <textarea
                              value={rejectRemarks}
                              onChange={(e) => setRejectRemarks(e.target.value)}
                              placeholder="Reason for rejection/returned files (required)..."
                              rows={2}
                              className="textarea textarea-sm w-full bg-white border-error/20 focus:border-error rounded-lg text-xs font-bold"
                            />
                            <button
                              onClick={() => rejectMutation.mutate({ id: selectedLoan.id, remarks: rejectRemarks })}
                              disabled={rejectMutation.isPending || !rejectRemarks.trim()}
                              className="btn btn-outline border-error/30 text-error hover:bg-error hover:border-error btn-block rounded-lg font-black text-[11px] uppercase tracking-widest h-12"
                            >
                              {rejectMutation.isPending ? 'Processing...' : 'Reject Application'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="p-4 bg-base-100 rounded-lg text-center text-xs font-bold opacity-40 italic">
                          Only Accountants can verify loan documents.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Section (Superintendent Approval) */}
                  {selectedLoan.status === 'verified' && (
                    <div className="space-y-4 pt-4 border-t border-base-100">
                      <h4 className="text-[11px] font-black uppercase tracking-widest opacity-40 px-1">Superintendent Approval</h4>
                      {(user?.role === 'SUPERINTENDENT' || user?.is_superuser) ? (
                        <>
                          {/* Approve Section */}
                          <div className="p-4 bg-success/5 border border-success/10 rounded-xl space-y-3">
                            <textarea
                              value={approveRemarks}
                              onChange={(e) => setApproveRemarks(e.target.value)}
                              placeholder="Remarks for approval (optional)..."
                              rows={2}
                              className="textarea textarea-sm w-full bg-white border-success/20 focus:border-success rounded-lg text-xs font-bold"
                            />
                            <button
                              onClick={() => approveMutation.mutate({ id: selectedLoan.id, remarks: approveRemarks })}
                              disabled={approveMutation.isPending}
                              className="btn btn-success btn-block rounded-lg font-black text-[11px] uppercase tracking-widest h-12 shadow-md shadow-success/20"
                            >
                              {approveMutation.isPending ? 'Processing...' : 'Approve Application'}
                            </button>
                          </div>

                          {/* Reject Section */}
                          <div className="p-4 bg-error/5 border border-error/10 rounded-xl space-y-3">
                            <textarea
                              value={rejectRemarks}
                              onChange={(e) => setRejectRemarks(e.target.value)}
                              placeholder="Reason for rejection (required)..."
                              rows={2}
                              className="textarea textarea-sm w-full bg-white border-error/20 focus:border-error rounded-lg text-xs font-bold"
                            />
                            <button
                              onClick={() => rejectMutation.mutate({ id: selectedLoan.id, remarks: rejectRemarks })}
                              disabled={rejectMutation.isPending || !rejectRemarks.trim()}
                              className="btn btn-outline border-error/30 text-error hover:bg-error hover:border-error btn-block rounded-lg font-black text-[11px] uppercase tracking-widest h-12"
                            >
                              {rejectMutation.isPending ? 'Processing...' : 'Reject Application'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="p-4 bg-base-100 rounded-lg text-center text-xs font-bold opacity-40 italic">
                          Waiting for Superintendent approval.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Release Section (Accountant) */}
                  {selectedLoan.status === 'approved' && (
                    <div className="space-y-4 pt-4 border-t border-base-100">
                      <h4 className="text-[11px] font-black uppercase tracking-widest opacity-40 px-1">Disbursement</h4>
                      {(user?.role === 'ACCOUNTANT' || user?.is_superuser) ? (
                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-3">
                          <p className="text-[10px] font-bold text-primary/70 uppercase leading-relaxed text-center mb-2">
                            Verify fund availability before releasing.
                          </p>
                          <button
                            onClick={() => disburseMutation.mutate(selectedLoan.id)}
                            disabled={disburseMutation.isPending}
                            className="btn btn-primary btn-block rounded-lg font-black text-[11px] uppercase tracking-widest h-12 shadow-md shadow-primary/20"
                          >
                            {disburseMutation.isPending ? 'Processing...' : 'Release Funds (Payout)'}
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 bg-base-100 rounded-lg text-center text-xs font-bold opacity-40 italic">
                          Waiting for Accountant disbursement.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="modal-backdrop bg-black/40" onClick={() => setSelectedLoan(null)}></div>
        </div>
      )}
    </div>
  );
};


export default LoanManagement;
