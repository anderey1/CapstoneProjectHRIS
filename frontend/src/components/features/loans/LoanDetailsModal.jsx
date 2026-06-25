import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, FileText, AlertCircle, CheckCircle2, Circle, Tag, Users, MessageSquare, Eye } from 'lucide-react';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import SubsidiaryLedger from './SubsidiaryLedger';

const PURPOSE_LABELS = {
  general: 'General',
  medical: 'Medical',
  calamity: 'Calamity',
  educational: 'Educational',
  emergency: 'Emergency',
};

const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const host = baseUrl.split('/api')[0];
  return `${host}${path}`;
};

/**
 * Loan Details Modal — Shows financial breakdown, docs checklist, review info.
 */
const LoanDetailsModal = ({ loan, onClose }) => {
  // Fetch checklist from backend
  const { data: checklist } = useQuery({
    queryKey: [QUERY_KEYS.LOANS, loan?.id, 'checklist'],
    queryFn: async () => {
      const res = await api.get(`loans/${loan.id}/checklist/`);
      return res.data;
    },
    enabled: !!loan?.id,
  });

  // Documents for selected loan
  const { data: documents = [] } = useQuery({
    queryKey: [QUERY_KEYS.LOANS, loan?.id, 'documents'],
    queryFn: async () => {
      const res = await api.get(`loans/${loan.id}/documents/`);
      return res.data;
    },
    enabled: !!loan?.id,
  });

  if (!loan) return null;

  const monthlyPayment = parseFloat(loan.monthly_payment);
  const term = parseInt(loan.term_months);
  const startDate = new Date(loan.date_applied);

  const schedule = Array.from({ length: term }, (_, i) => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i + 1);
    return {
      month: i + 1,
      date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      amount: monthlyPayment,
      status: i < 2 ? 'Paid' : 'Upcoming'
    };
  });

  return (
    <div className="modal modal-open">
      <div className="modal-box rounded-xl p-0 overflow-hidden border border-base-200 max-w-2xl w-[95vw] shadow-2xl bg-white animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="bg-primary p-10 text-white relative">
          <button onClick={onClose} className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Loan Details</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">ID: LOAN-{loan.id.toString().padStart(4, '0')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
              {loan.status}
            </div>
            {loan.purpose && (
              <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-1">
                <Tag className="w-3 h-3" /> {PURPOSE_LABELS[loan.purpose] || loan.purpose}
              </div>
            )}
            <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
              {new Date(loan.date_applied).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto">
          {(loan.status === 'released' || loan.status === 'paid') ? (
            <SubsidiaryLedger loan={loan} userCanPost={false} />
          ) : (
            <>
              {/* Financial Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-base-50 rounded-xl border border-base-100 group hover:border-secondary/20 transition-all">
                  <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-1">Principal</p>
                  <p className="text-xl font-black text-secondary tracking-tighter">₱{parseFloat(loan.loan_amount).toLocaleString()}</p>
                </div>
                <div className="p-6 bg-base-50 rounded-xl border border-base-100 group hover:border-primary/20 transition-all">
                  <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-1">Interest</p>
                  <p className="text-xl font-black text-primary tracking-tighter">₱{(parseFloat(loan.total_amount) - parseFloat(loan.loan_amount)).toLocaleString()}</p>
                </div>
                <div className="p-6 bg-base-50 rounded-xl border border-base-100 group hover:border-base-content/20 transition-all">
                  <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-1">Total Cost</p>
                  <p className="text-xl font-black text-base-content tracking-tighter">₱{parseFloat(loan.total_amount).toLocaleString()}</p>
                </div>
              </div>

              {/* Application Details */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-widest opacity-40 px-1">Application Info</h4>

                {loan.co_maker_name_display || loan.co_maker_name ? (
                  <div className="flex items-center gap-3 p-4 bg-base-50 rounded-lg border border-base-100">
                    <Users className="w-4 h-4 opacity-30" />
                    <div>
                      <p className="text-[9px] font-black opacity-30 uppercase tracking-widest">Co-Maker</p>
                      <p className="text-xs font-bold">{loan.co_maker_name_display || loan.co_maker_name}</p>
                    </div>
                  </div>
                ) : null}

                {loan.letter_request && (
                  <div className="p-4 bg-base-50 rounded-lg border border-base-100">
                    <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-2">Letter Request</p>
                    <p className="text-xs font-bold text-base-content/70 leading-relaxed whitespace-pre-wrap">{loan.letter_request}</p>
                  </div>
                )}

                {loan.remarks && (
                  <div className="p-4 bg-warning/5 rounded-lg border border-warning/10 flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-warning opacity-60 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mb-1">HR Remarks</p>
                      <p className="text-xs font-bold text-base-content/70">{loan.remarks}</p>
                      {loan.reviewed_by_name && (
                        <p className="text-[9px] font-bold opacity-30 mt-1 uppercase">— {loan.reviewed_by_name}, {loan.reviewed_at ? new Date(loan.reviewed_at).toLocaleDateString() : ''}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Document Checklist */}
              {checklist && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[11px] font-black uppercase tracking-widest opacity-40">Document Checklist</h4>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${checklist.all_required_submitted
                      ? 'bg-success/10 text-success'
                      : 'bg-warning/10 text-warning'
                      }`}>
                      {checklist.all_required_submitted ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {checklist.checklist?.map((doc) => {
                      const uploadedDoc = documents.find(d => d.doc_type === doc.doc_type);
                      return (
                        <div key={doc.doc_type} className="flex items-center justify-between p-3 bg-base-50 rounded-lg border border-base-100">
                          <div className="flex items-center gap-2">
                            {doc.submitted
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-success" />
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
                            {!doc.required && (
                              <span className="text-[8px] font-black text-info/50 uppercase tracking-widest">Optional</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Schedule Section */}
              {loan.status === 'approved' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[11px] font-black uppercase tracking-widest opacity-40">Payment Schedule</h4>
                    <span className="text-[10px] font-black opacity-20 uppercase tracking-widest">{term} Monthly Payments</span>
                  </div>

                  <div className="bg-white rounded-xl border border-base-200 shadow-sm overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      <table className="table table-sm w-full">
                        <thead>
                          <tr className="bg-base-50/50 text-[10px] font-black uppercase tracking-widest opacity-40 border-b border-base-100">
                            <th className="py-4 px-8">#</th>
                            <th>Due Date</th>
                            <th>Amount</th>
                            <th className="text-right px-8">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-base-50">
                          {schedule.map((item) => (
                            <tr key={item.month} className="hover:bg-base-50/50 transition-colors">
                              <td className="py-4 px-8 font-black text-xs opacity-30">{item.month}</td>
                              <td className="text-xs font-bold text-base-content/60 uppercase">{item.date}</td>
                              <td className="font-black text-xs text-primary">₱{item.amount.toLocaleString()}</td>
                              <td className="text-right px-8">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status === 'Paid' ? 'bg-success/10 text-success' : 'bg-base-50 text-base-content/30'
                                  }`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-4">
                <AlertCircle className="w-4 h-4 mt-0.5 text-primary opacity-40" />
                <p className="text-[10px] font-bold text-primary/70 uppercase leading-relaxed tracking-tight">
                  Payments are automatically deducted from your payroll based on the division's semi-monthly cutoff schedule.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-base-50/50 border-t border-base-100 flex justify-end">
          <button onClick={onClose} className="btn btn-ghost text-[10px] font-black uppercase tracking-widest opacity-40">Close Details</button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose}></div>
    </div>
  );
};

export default LoanDetailsModal;
