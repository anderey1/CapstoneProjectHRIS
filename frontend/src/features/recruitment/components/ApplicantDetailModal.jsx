import React from 'react';
import {
  XCircle,
  Info,
  Mail,
  Phone,
  FileText,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import ApplicantScoringMatrix from './ApplicantScoringMatrix';
import { RECRUITMENT_COLUMNS } from './RecruitmentTable';

const formatDocType = (type) => {
  const mapping = {
    letter_of_intent: 'Letter of Intent',
    pds_file: 'Personal Data Sheet (PDS)',
    resume: 'Resume / CV',
    prc_documents: 'PRC Documents',
    eligibility_certificate: 'Eligibility Certificate',
    tor: 'Transcript of Records (TOR)',
    certificates_of_training: 'Certificate of Training',
    employment_documents: 'Employment Document',
    latest_appointment: 'Latest Appointment',
    performance_rating: 'Performance Rating',
    specialized_training: 'Specialized Training Certificate',
    checklist: 'Checklist of Requirements',
    omnibus: 'Omnibus Sworn Statement',
    cav: 'Certification on the Authenticity and Veracity (CAV)',
    privacy_consent: 'Data Privacy Consent',
  };
  return mapping[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Detailed Applicant View & Evaluation Modal.
 */
const ApplicantDetailModal = ({
  applicant,
  onClose,
  scores,
  setScores,
  isEditingScores,
  setIsEditingScores,
  onSaveScores,
  isSavingScores,
  statusNote,
  setStatusNote,
  onChangeStatus,
  isChangingStatus,
}) => {
  if (!applicant) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box rounded-lg max-w-4xl p-0 overflow-hidden shadow-lg border border-slate-200 bg-white h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-base-50/50 border-b border-base-200 p-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary text-white flex items-center justify-center text-xl font-black uppercase shadow-sm">
              {applicant.first_name[0]}
              {applicant.last_name[0]}
            </div>
            <div>
              <h3 className="font-black text-2xl text-base-content uppercase tracking-tight leading-none">
                {applicant.first_name}{' '}
                {applicant.middle_name ? applicant.middle_name + ' ' : ''}
                {applicant.last_name}
              </h3>
              <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mt-2">
                Applied for: {applicant.position_applied}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle opacity-30 hover:opacity-100"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Info & Documents */}
            <div className="space-y-6">
              <section className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                  <Info className="w-3 h-3" /> Basic Info
                </h4>
                <div className="bg-base-50 p-4 rounded-xl border border-base-200 space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 opacity-30" />
                    <p className="text-xs font-bold text-base-content/70">{applicant.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 opacity-30" />
                    <p className="text-xs font-bold text-base-content/70">{applicant.phone}</p>
                  </div>
                  <div className="pt-2 border-t border-base-200 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <p className="text-[10px] font-black uppercase opacity-40">
                      Division: {applicant.school_division}
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                  <FileText className="w-3 h-3" /> Documents
                </h4>
                <div className="space-y-3">
                  {applicant.resume && (
                    <a
                      href={applicant.resume}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-4 bg-white border border-base-200 rounded-xl hover:border-primary/30 transition-colors shadow-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary opacity-40" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Resume / CV
                        </span>
                      </div>
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}

                  {applicant.pds_file && (
                    <a
                      href={applicant.pds_file}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-4 bg-white border border-base-200 rounded-xl hover:border-primary/30 transition-colors shadow-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary opacity-40" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Personal Data Sheet (PDS)
                        </span>
                      </div>
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}

                  {applicant.documents &&
                    applicant.documents
                      .filter(
                        (doc) => doc.document_type !== 'resume' && doc.document_type !== 'pds_file'
                      )
                      .map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.file}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-4 bg-white border border-base-200 rounded-xl hover:border-primary/30 transition-colors shadow-sm group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-5 h-5 text-primary opacity-40 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[10px] font-black uppercase tracking-widest block">
                                {formatDocType(doc.document_type)}
                              </span>
                              <span className="text-[8px] opacity-40 font-bold block truncate max-w-[180px]">
                                {doc.filename}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ))}

                  {!applicant.resume &&
                    !applicant.pds_file &&
                    (!applicant.documents || applicant.documents.length === 0) && (
                      <p className="text-[10px] italic opacity-20 text-center">
                        No documents uploaded
                      </p>
                    )}
                </div>
              </section>
            </div>

            {/* Right Column: Assessment Scores & Status Update */}
            <div className="md:col-span-2 space-y-6">
              <ApplicantScoringMatrix
                applicant={applicant}
                scores={scores}
                setScores={setScores}
                isEditingScores={isEditingScores}
                setIsEditingScores={setIsEditingScores}
                onSaveScores={onSaveScores}
                isSaving={isSavingScores}
              />

              <section className="space-y-4 pt-4 border-t border-base-100">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                  <MessageSquare className="w-3 h-3" /> Status Timeline & Notes
                </h4>
                <div className="bg-base-50 rounded-xl p-6">
                  {applicant.notes ? (
                    <p className="text-xs font-medium leading-relaxed italic text-base-content/60 whitespace-pre-wrap">
                      {applicant.notes}
                    </p>
                  ) : (
                    <p className="text-xs font-bold opacity-20 uppercase text-center py-4 tracking-widest italic">
                      No history recorded yet
                    </p>
                  )}
                </div>
              </section>

              {/* Status Change Section */}
              <section className="bg-white border-2 border-primary/20 rounded-2xl p-8 space-y-6 shadow-xl shadow-primary/5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    Update Application Status
                  </h4>
                  <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest">
                    Current: {RECRUITMENT_COLUMNS.find((c) => c.id === applicant.status)?.label}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1">
                      New Stage
                    </label>
                    <select
                      id="status-select"
                      className="select select-bordered w-full bg-base-50 border-base-200 rounded-lg text-xs font-bold"
                      defaultValue={applicant.status}
                    >
                      {RECRUITMENT_COLUMNS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                      <option value="disqualified">Does Not Meet Qualification Standards</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1">
                      Internal Remarks
                    </label>
                    <textarea
                      className="textarea textarea-bordered w-full bg-base-50 border-base-200 rounded-lg text-xs font-medium h-12"
                      placeholder="Add reason for status change..."
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    className="btn btn-primary btn-block rounded-xl font-black uppercase tracking-[0.2em] text-xs h-14 shadow-lg shadow-primary/20"
                    onClick={() => {
                      const select = document.getElementById('status-select');
                      onChangeStatus({
                        id: applicant.id,
                        status: select.value,
                        notes: statusNote,
                      });
                    }}
                    disabled={isChangingStatus}
                  >
                    {isChangingStatus
                      ? 'Processing...'
                      : 'Confirm Status Update & Notify Applicant'}
                  </button>
                </div>
                <p className="text-[9px] text-center opacity-40 font-bold uppercase tracking-tight italic">
                  Applicant will receive an automatic status update via their registered email.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
      <div
        className="modal-backdrop bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
    </div>
  );
};

export default ApplicantDetailModal;
