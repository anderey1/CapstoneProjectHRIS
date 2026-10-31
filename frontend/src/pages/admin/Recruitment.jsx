import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
import { Plus, User, Mail, Phone, Trash2, ChevronRight, Layout, Search, Star, FileText, CheckCircle2, XCircle, Info, MessageSquare } from 'lucide-react';
import AddApplicantModal from '../../components/features/recruitment/AddApplicantModal';

/**
 * DepEd Recruitment Board
 */
const COLUMNS = [
  { id: 'applied', label: 'New Applications', color: 'bg-primary/10 text-primary border-primary/20' },
  { id: 'initial_evaluation', label: 'Initial Review', color: 'bg-primary/20 text-primary border-primary/30' },
  { id: 'comparative_assessment', label: 'Staff Evaluation', color: 'bg-primary/10 text-primary border-primary/20' },
  { id: 'interview', label: 'Interviews', color: 'bg-secondary/20 text-base-content border-secondary/30' },
  { id: 'appointment_proposed', label: 'Ready for Hiring', color: 'bg-primary/10 text-primary border-primary/20' },
  { id: 'hired', label: 'Hired', color: 'bg-success/10 text-success border-success/20' },
  { id: 'rejected', label: 'Not Selected', color: 'bg-error/10 text-error border-error/20' }
];

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
    cav: 'Certification on the Authenticity (CAV)',
    privacy_consent: 'Data Privacy Consent'
  };
  return mapping[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const Recruitment = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [statusNote, setStatusNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isEditingScores, setIsEditingScores] = useState(false);
  const [scores, setScores] = useState({
    education_score: 0,
    training_score: 0,
    experience_score: 0,
    demo_teaching_score: 0,
    exam_score: 0,
    interview_score: 0
  });

  // 1. Data Fetching
  const { data: applicants = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.APPLICANTS],
    queryFn: async () => {
      const res = await api.get('applicants/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  // 2. Mutations
  const statusMutation = useMutation({
    mutationFn: ({ id, status, notes }) => api.post(`applicants/${id}/change-status/`, { status, notes }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APPLICANTS] });
      setSelectedApplicant(null);
      setStatusNote('');
      alert(res.data.message);
    },
    onError: (err) => alert(err.response?.data?.error || "Status update failed.")
  });

  const updateScoresMutation = useMutation({
    mutationFn: ({ id, scores }) => api.patch(`applicants/${id}/`, scores),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APPLICANTS] });
      // Update local state if needed or just refetch
      setIsEditingScores(false);
      // Update selectedApplicant locally to show new points immediately if possible, or close and let refetch work
      setSelectedApplicant(res.data);
      alert("Scores updated successfully.");
    },
    onError: (err) => alert("Failed to update scores.")
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`applicants/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APPLICANTS] }),
  });

  const handleDelete = (id) => {
    if (window.confirm('Remove this applicant record?')) deleteMutation.mutate(id);
  };

  const [activeStage, setActiveStage] = useState('all');

  const filteredApplicants = applicants.filter(a => {
    const fullName = `${a.first_name} ${a.middle_name || ''} ${a.last_name}`.toLowerCase();
    const position = (a.position_applied || '').toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || position.includes(searchTerm.toLowerCase());
    const matchesStage = activeStage === 'all' || a.status === activeStage;
    return matchesSearch && matchesStage;
  });

  const stageCounts = COLUMNS.reduce((acc, col) => {
    acc[col.id] = applicants.filter(a => a.status === col.id).length;
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      {/* Institutional Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center text-[#0038A8]">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
                Comparative Assessment Result (CAR) Ledger
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                DepEd Order No. 007, s. 2023 • Merit Selection Plan & Personnel Evaluation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            className="px-4 py-2 bg-[#0038A8] hover:bg-[#002d86] text-white text-xs font-semibold uppercase tracking-wider rounded border border-[#002d86] shadow-sm flex items-center gap-1.5 transition-colors"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4" />
            Encode Applicant Profile
          </button>
        </div>
      </div>

      {/* 5-Metric Portfolio Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Applicants</p>
          <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">{applicants.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">All candidate records</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Initial Review</p>
          <p className="text-xl font-bold text-[#0038A8] font-mono tabular-nums mt-1">{stageCounts.initial_evaluation || 0}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Document screening</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Comparative Assessment</p>
          <p className="text-xl font-bold text-amber-700 font-mono tabular-nums mt-1">{stageCounts.comparative_assessment || 0}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Rubric points evaluation</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ready for Hiring</p>
          <p className="text-xl font-bold text-blue-700 font-mono tabular-nums mt-1">{stageCounts.appointment_proposed || 0}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Endorsed to SDS</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Hired / Appointed</p>
          <p className="text-xl font-bold text-emerald-700 font-mono tabular-nums mt-1">{stageCounts.hired || 0}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Plantilla deployed</p>
        </div>
      </div>

      {/* Stage Selector Tabs & Search Bar */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-300 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search candidate by name or position applied..." 
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-[#0038A8] rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0038A8]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500 shrink-0 font-medium">
            Showing <span className="font-mono tabular-nums font-semibold text-slate-800">{filteredApplicants.length}</span> of <span className="font-mono tabular-nums text-slate-800">{applicants.length}</span> candidates
          </div>
        </div>

        {/* Stage Tabs */}
        <div className="flex flex-wrap gap-1.5 border-t border-slate-200 pt-2.5">
          <button
            onClick={() => setActiveStage('all')}
            className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded transition-colors ${
              activeStage === 'all'
                ? 'bg-[#0038A8] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Stages ({applicants.length})
          </button>
          {COLUMNS.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveStage(col.id)}
              className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 ${
                activeStage === col.id
                  ? 'bg-[#0038A8] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{col.label}</span>
              <span className={`px-1 py-0.2 rounded text-[10px] font-mono tabular-nums ${
                activeStage === col.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {stageCounts[col.id] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* High-Density CAR Evaluation Ledger Table */}
      <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-primary">
            <span className="loading loading-spinner loading-lg text-[#0038A8]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Position Applied</th>
                  <th className="px-4 py-3 text-right">Education</th>
                  <th className="px-4 py-3 text-right">Training</th>
                  <th className="px-4 py-3 text-right">Experience</th>
                  <th className="px-4 py-3 text-right">Demo / Exam</th>
                  <th className="px-4 py-3 text-right">Interview</th>
                  <th className="px-4 py-3 text-right">Total Score</th>
                  <th className="px-4 py-3">Pipeline Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredApplicants.length > 0 ? (
                  filteredApplicants.map((applicant) => (
                    <tr 
                      key={applicant.id} 
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => {
                        setSelectedApplicant(applicant);
                        setIsEditingScores(false);
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {applicant.first_name} {applicant.middle_name ? `${applicant.middle_name} ` : ''}{applicant.last_name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {applicant.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {applicant.position_applied}
                        <div className="text-[10px] text-slate-500">
                          Applied: {new Date(applicant.date_applied).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                        {applicant.education_score || 0}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                        {applicant.training_score || 0}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                        {applicant.experience_score || 0}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                        {((Number(applicant.demo_teaching_score) || 0) + (Number(applicant.exam_score) || 0)).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                        {applicant.interview_score || 0}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-[#0038A8]">
                        {applicant.total_score || 0}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-tight border ${
                          applicant.status === 'hired'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : applicant.status === 'rejected' || applicant.status === 'disqualified'
                            ? 'bg-red-50 text-red-800 border-red-300'
                            : applicant.status === 'appointment_proposed'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {COLUMNS.find(c => c.id === applicant.status)?.label || applicant.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApplicant(applicant);
                              setIsEditingScores(false);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                          >
                            Review
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(applicant.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            title="Remove applicant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-4 py-12 text-center text-slate-400 italic">
                      No candidate records found under this evaluation stage.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Add Applicant Modal */}
      {showAddModal && <AddApplicantModal onClose={() => setShowAddModal(false)} />}

      
      {/* Applicant Detail / Status Update Modal */}
      {selectedApplicant && (
         <div className="modal modal-open">
            <div className="modal-box rounded-lg max-w-4xl p-0 overflow-hidden shadow-lg border border-slate-200 bg-white h-[85vh] flex flex-col">     
               <div className="bg-base-50/50 border-b border-base-200 p-8 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-xl bg-primary text-white flex items-center justify-center text-xl font-black uppercase shadow-sm">
                        {selectedApplicant.first_name[0]}{selectedApplicant.last_name[0]}
                     </div>
                     <div>
                        <h3 className="font-black text-2xl text-base-content uppercase tracking-tight leading-none">{selectedApplicant.first_name} {selectedApplicant.middle_name ? selectedApplicant.middle_name + ' ' : ''}{selectedApplicant.last_name}</h3>
                        <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mt-2">Applied for: {selectedApplicant.position_applied}</p>
                     </div>
                  </div>
                  <button onClick={() => setSelectedApplicant(null)} className="btn btn-ghost btn-sm btn-circle opacity-30 hover:opacity-100"><XCircle className="w-6 h-6" /></button>
               </div>

               <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                     {/* Left: Info & Contact */}
                     <div className="space-y-6">
                        <section className="space-y-4">
                           <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                              <Info className="w-3 h-3" /> Basic Info
                           </h4>
                           <div className="bg-base-50 p-4 rounded-xl border border-base-200 space-y-4">
                              <div className="flex items-center gap-3">
                                 <Mail className="w-4 h-4 opacity-30" />
                                 <p className="text-xs font-bold text-base-content/70">{selectedApplicant.email}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                 <Phone className="w-4 h-4 opacity-30" />
                                 <p className="text-xs font-bold text-base-content/70">{selectedApplicant.phone}</p>
                              </div>
                              <div className="pt-2 border-t border-base-200 flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-primary" />
                                 <p className="text-[10px] font-black uppercase opacity-40">Division: {selectedApplicant.school_division}</p>
                              </div>
                           </div>
                        </section>

                        <section className="space-y-4">
                           <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                              <FileText className="w-3 h-3" /> Documents
                           </h4>
                            <div className="space-y-3">
                               {selectedApplicant.resume ? (
                                  <a href={selectedApplicant.resume} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-white border border-base-200 rounded-xl hover:border-primary/30 transition-colors shadow-sm group">
                                     <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-primary opacity-40" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Resume / CV</span>
                                     </div>
                                     <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </a>
                               ) : null}
                               
                               {selectedApplicant.pds_file ? (
                                  <a href={selectedApplicant.pds_file} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-white border border-base-200 rounded-xl hover:border-primary/30 transition-colors shadow-sm group">
                                     <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-primary opacity-40" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Personal Data Sheet (PDS)</span>
                                     </div>
                                     <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </a>
                               ) : null}

                                {selectedApplicant.documents && selectedApplicant.documents
                                  .filter(doc => doc.document_type !== 'resume' && doc.document_type !== 'pds_file')
                                  .map(doc => (
                                     <a key={doc.id} href={doc.file} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-white border border-base-200 rounded-xl hover:border-primary/30 transition-colors shadow-sm group">
                                        <div className="flex items-center gap-3 min-w-0">
                                           <FileText className="w-5 h-5 text-primary opacity-40 shrink-0" />
                                           <div className="min-w-0">
                                              <span className="text-[10px] font-black uppercase tracking-widest block">{formatDocType(doc.document_type)}</span>
                                              <span className="text-[8px] opacity-40 font-bold block truncate max-w-[180px]">{doc.filename}</span>
                                           </div>
                                        </div>
                                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                     </a>
                                  ))
                                }

                                {!selectedApplicant.resume && !selectedApplicant.pds_file && (!selectedApplicant.documents || selectedApplicant.documents.length === 0) && (
                                   <p className="text-[10px] italic opacity-20 text-center">No documents uploaded</p>
                                )}
                            </div>
                        </section>
                     </div>

                     {/* Middle: Assessment Scores */}
                     <div className="md:col-span-2 space-y-6">
                        <section className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                                 <Star className="w-3 h-3" /> Staff Evaluation Scores
                              </h4>
                              {!isEditingScores ? (
                                <button 
                                  onClick={() => {
                                    setScores({
                                      education_score: selectedApplicant.education_score,
                                      training_score: selectedApplicant.training_score,
                                      experience_score: selectedApplicant.experience_score,
                                      demo_teaching_score: selectedApplicant.demo_teaching_score || 0,
                                      exam_score: selectedApplicant.exam_score,
                                      interview_score: selectedApplicant.interview_score
                                    });
                                    setIsEditingScores(true);
                                  }}
                                  className="btn btn-xs btn-ghost text-primary font-black uppercase tracking-widest"
                                >
                                  Edit Scores
                                </button>
                              ) : (
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => setIsEditingScores(false)}
                                    className="btn btn-xs btn-ghost text-error font-black uppercase tracking-widest"
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    onClick={() => updateScoresMutation.mutate({ id: selectedApplicant.id, scores })}
                                    className="btn btn-xs btn-primary font-black uppercase tracking-widest"
                                    disabled={updateScoresMutation.isPending}
                                  >
                                    Save Points
                                  </button>
                                </div>
                              )}
                           </div>

                           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {[
                                 { key: 'education_score', label: 'Education', max: 10 },
                                 { key: 'training_score', label: 'Training', max: 10 },
                                 { key: 'experience_score', label: 'Experience', max: 10 },
                                 { key: 'demo_teaching_score', label: 'Demo Teaching', max: 35 },
                                 { key: 'exam_score', label: 'TRF / Exam', max: 25 },
                                 { key: 'interview_score', label: 'Interview', max: 10 }
                              ].map(s => (
                                 <div key={s.key} className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center group">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                       <p className="text-[9px] font-black opacity-40 uppercase tracking-tighter">{s.label}</p>
                                       <span className="text-[8px] font-bold text-primary/40 uppercase">(Max {s.max})</span>
                                    </div>
                                    {isEditingScores ? (
                                      <input 
                                        type="number" 
                                        step="0.01"
                                        max={s.max}
                                        className={`input input-xs input-bordered w-full text-center font-black rounded-md ${scores[s.key] > s.max ? 'border-error text-error bg-error/5' : 'text-primary bg-white'}`}
                                        value={scores[s.key]}
                                        onChange={(e) => {
                                           const val = parseFloat(e.target.value) || 0;
                                           setScores({ ...scores, [s.key]: val });
                                        }}
                                      />
                                    ) : (
                                      <p className="text-xl font-black text-primary">{selectedApplicant[s.key]}</p>
                                    )}
                                 </div>
                              ))}
                              <div className="bg-primary border-2 border-primary rounded-xl p-4 text-center shadow-lg shadow-primary/20">
                                 <p className="text-[9px] font-black text-white/60 uppercase tracking-tighter mb-1">Total Points</p>
                                 <p className="text-xl font-black text-white">
                                    {isEditingScores 
                                      ? (Object.values(scores).reduce((a, b) => Number(a) + Number(b), 0)).toFixed(2)
                                      : selectedApplicant.total_score}
                                 </p>
                              </div>
                           </div>
                        </section>

                        <section className="space-y-4 pt-4 border-t border-base-100">
                           <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                              <MessageSquare className="w-3 h-3" /> Status Timeline & Notes
                           </h4>
                           <div className="bg-base-50 rounded-xl p-6">
                              {selectedApplicant.notes ? (
                                 <p className="text-xs font-medium leading-relaxed italic text-base-content/60 whitespace-pre-wrap">{selectedApplicant.notes}</p>
                              ) : (
                                 <p className="text-xs font-bold opacity-20 uppercase text-center py-4 tracking-widest italic">No history recorded yet</p>
                              )}
                           </div>
                        </section>

                        {/* Status Change Section */}
                        <section className="bg-white border-2 border-primary/20 rounded-2xl p-8 space-y-6 shadow-xl shadow-primary/5">
                           <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                 Update Pipeline Status
                              </h4>
                              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest">      
                                 Current: {COLUMNS.find(c => c.id === selectedApplicant.status)?.label}
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1">New Stage</label>
                                 <select 
                                    id="status-select"
                                    className="select select-bordered w-full bg-base-50 border-base-200 rounded-lg text-xs font-bold"
                                    defaultValue={selectedApplicant.status}
                                 >
                                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    <option value="disqualified">Disqualified (QS Fail)</option>
                                 </select>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1">Internal Remarks</label>
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
                                 className="btn btn-primary btn-block rounded-xl font-black uppercase tracking-[0.2em] text-xs h-14 shadow-lg shadow-primary/20"
                                 onClick={() => {
                                    const select = document.getElementById('status-select');
                                    statusMutation.mutate({ 
                                       id: selectedApplicant.id, 
                                       status: select.value,
                                       notes: statusNote
                                    });
                                 }}
                                 disabled={statusMutation.isPending}
                              >
                                 {statusMutation.isPending ? 'Processing...' : 'Confirm Status Update & Notify Applicant'}
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
            <div className="modal-backdrop bg-black/60 backdrop-blur-sm" onClick={() => setSelectedApplicant(null)}></div>
         </div>
      )}
    </div>
  );
};

export default Recruitment;
