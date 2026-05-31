import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
import { Plus, User, Mail, Phone, Trash2, ChevronRight, Layout, Search, Star, FileText, CheckCircle2, XCircle, Info, MessageSquare } from 'lucide-react';
import AddApplicantModal from '../../components/features/recruitment/AddApplicantModal';

/**
 * DepEd Recruitment Board
 * Columns based on DepEd Order No. 007, s. 2023 / DO 19, s. 2022
 */
const COLUMNS = [
  { id: 'applied', label: 'Applied', color: 'bg-slate-50 text-slate-500 border-slate-200' },
  { id: 'initial_evaluation', label: 'QS Check', color: 'bg-blue-50 text-blue-500 border-blue-200' },
  { id: 'comparative_assessment', label: 'Assessment', color: 'bg-indigo-50 text-indigo-500 border-indigo-200' },
  { id: 'interview', label: 'Interview (BEI)', color: 'bg-purple-50 text-purple-500 border-purple-200' },
  { id: 'appointment_proposed', label: 'Proposed', color: 'bg-amber-50 text-amber-500 border-amber-200' },
  { id: 'hired', label: 'Hired/Appointed', color: 'bg-emerald-50 text-emerald-500 border-emerald-200' },
  { id: 'rejected', label: 'Not Selected', color: 'bg-rose-50 text-rose-500 border-rose-200' }
];

const Recruitment = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('board'); // 'board' or 'rqa'
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [statusNote, setStatusNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isEditingScores, setIsEditingScores] = useState(false);
  const [scores, setScores] = useState({
    education_score: 0,
    training_score: 0,
    experience_score: 0,
    interview_score: 0,
    exam_score: 0
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

  const filteredApplicants = applicants.filter(a => 
    `${a.first_name} ${a.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.position_applied.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const rqaApplicants = [...applicants]
    .filter(a => a.is_rqa_eligible)
    .sort((a, b) => b.total_score - a.total_score);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 h-[calc(100vh-100px)] flex flex-col">

      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Layout className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">Recruitment Board</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">DepEd Merit Selection Plan (MSP) Portal</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex bg-base-200 p-1 rounded-xl border border-base-300">
             <button 
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'board' ? 'bg-white text-primary shadow-sm' : 'opacity-40 hover:opacity-100'}`}
                onClick={() => setActiveTab('board')}
             >
                Pipeline
             </button>
             <button 
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'rqa' ? 'bg-white text-primary shadow-sm' : 'opacity-40 hover:opacity-100'}`}
                onClick={() => setActiveTab('rqa')}
             >
                RQA Ranking
             </button>
          </div>
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-30" />
             <input 
                type="text" 
                placeholder="Search candidates..." 
                className="input input-sm input-bordered w-full pl-9 bg-white rounded-lg text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <button
            className="btn btn-primary btn-sm rounded-lg shadow-lg shadow-primary/20 px-6 font-black uppercase tracking-widest text-[10px]"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Applicant
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-primary"><span className="loading loading-spinner loading-lg" /></div>
      ) : activeTab === 'board' ? (
        <div className="flex-1 overflow-x-auto pb-8 flex gap-6 scrollbar-thin">
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-80 flex flex-col gap-4">

              {/* Column Header */}
              <div className={`p-4 rounded-lg border ${column.color} flex items-center justify-between shadow-sm bg-white/80 backdrop-blur-md sticky top-0 z-10`}>
                <span className="font-black uppercase tracking-widest text-[10px]">{column.label}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/50 border border-current/10">
                   {filteredApplicants.filter(a => a.status === column.id).length}
                </span>
              </div>

              {/* Column Body */}
              <div className="flex-1 flex flex-col gap-4 min-h-[500px] bg-base-200/30 rounded-xl p-3 border border-dashed border-base-300">
                {filteredApplicants.filter(a => a.status === column.id).map((applicant) => (
                  <div 
                    key={applicant.id} 
                    className="bg-white border border-base-200 shadow-sm hover:shadow-md transition-all group rounded-xl overflow-hidden cursor-pointer"
                    onClick={() => {
                        setSelectedApplicant(applicant);
                        setIsEditingScores(false);
                    }}
                  >
                    <div className="p-5 space-y-4">

                      <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-lg bg-base-50 border border-base-200 flex items-center justify-center text-xs font-black text-primary group-hover:bg-primary group-hover:text-white transition-colors uppercase">
                          {applicant.first_name[0]}{applicant.last_name[0]}
                        </div>
                        <div className="flex items-center gap-1">
                           {applicant.is_notified && <CheckCircle2 className="w-3.5 h-3.5 text-success opacity-40" title="Notified" />}
                           <button
                             onClick={(e) => { e.stopPropagation(); handleDelete(applicant.id); }}
                             className="btn btn-ghost btn-xs text-error btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             <Trash2 className="w-3 h-3" />
                           </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-base-content leading-tight group-hover:text-primary transition-colors">{applicant.first_name} {applicant.last_name}</h3>
                        <p className="text-[10px] font-black opacity-30 uppercase tracking-tight mt-0.5">{applicant.position_applied}</p>
                      </div>

                      <div className="flex items-center justify-between py-2 border-y border-base-50">
                        <div className="flex items-center gap-1 text-[9px] font-black uppercase text-primary">
                           <Star className="w-3 h-3 fill-current" />
                           {applicant.total_score} pts
                        </div>
                        <div className="text-[9px] font-bold opacity-30 uppercase">
                           {new Date(applicant.date_applied).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <button className="btn btn-ghost btn-block btn-xs h-7 text-[9px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 bg-base-50 rounded-md">
                         Review Details
                      </button>
                    </div>
                  </div>
                ))}

                {filteredApplicants.filter(a => a.status === column.id).length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-10 py-10">
                    <User className="w-8 h-8 mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest">No candidates</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* RQA Ranking View */
        <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-base-200 shadow-sm animate-in slide-in-from-right-4 duration-500">
           <div className="p-8 border-b border-base-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10">
              <div>
                 <h2 className="text-lg font-black uppercase tracking-tight text-base-content">Registry of Qualified Applicants (RQA)</h2>
                 <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mt-1">Candidates with ≥ 50.00 Total Points</p>
              </div>
              <div className="px-4 py-2 bg-primary/5 text-primary rounded-xl border border-primary/10 font-black text-xs uppercase tracking-widest">
                 {rqaApplicants.length} Qualified
              </div>
           </div>
           
           <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                 <thead>
                    <tr className="bg-base-50/50 border-b border-base-100">
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">Rank</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">Candidate</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">Position</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest opacity-40 text-center">HRMPSB Points</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">Status</th>
                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest opacity-40"></th>
                    </tr>
                 </thead>
                 <tbody>
                    {rqaApplicants.map((applicant, index) => (
                       <tr key={applicant.id} className="hover:bg-primary/5 transition-colors cursor-pointer group" onClick={() => {
                           setSelectedApplicant(applicant);
                           setIsEditingScores(false);
                       }}>
                          <td className="px-8 py-6">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${index < 3 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-base-100 border border-base-200 opacity-40'}`}>
                                {index + 1}
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-base-100 border border-base-200 flex items-center justify-center text-xs font-black text-primary uppercase">
                                   {applicant.first_name[0]}{applicant.last_name[0]}
                                </div>
                                <div>
                                   <p className="font-bold text-sm text-base-content">{applicant.first_name} {applicant.last_name}</p>
                                   <p className="text-[10px] font-medium opacity-40">{applicant.email}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <span className="text-[10px] font-black uppercase tracking-widest bg-base-100 px-3 py-1 rounded-full border border-base-200">
                                {applicant.position_applied}
                             </span>
                          </td>
                          <td className="px-8 py-6 text-center">
                             <div className="inline-flex flex-col items-center">
                                <span className="text-xl font-black text-primary">{applicant.total_score}</span>
                                <span className="text-[8px] font-black opacity-30 uppercase tracking-tighter">Total Pts</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block ${
                                COLUMNS.find(c => c.id === applicant.status)?.color || 'bg-base-100'
                             }`}>
                                {COLUMNS.find(c => c.id === applicant.status)?.label || applicant.status}
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button className="btn btn-ghost btn-sm btn-circle opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight className="w-4 h-4 text-primary" />
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
              {rqaApplicants.length === 0 && (
                 <div className="py-40 flex flex-col items-center justify-center opacity-20 italic font-black uppercase tracking-[0.3em]">
                    <Star className="w-16 h-16 mb-4" />
                    No candidates reached the 50pt threshold yet
                 </div>
              )}
           </div>
        </div>
      )}

      {/* Applicant Detail / Status Update Modal */}
      {selectedApplicant && (
         <div className="modal modal-open">
            <div className="modal-box rounded-xl max-w-4xl p-0 overflow-hidden shadow-2xl border border-base-300 bg-white h-[85vh] flex flex-col">
               <div className="bg-base-50/50 border-b border-base-200 p-8 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-xl bg-primary text-white flex items-center justify-center text-xl font-black uppercase shadow-lg shadow-primary/20">
                        {selectedApplicant.first_name[0]}{selectedApplicant.last_name[0]}
                     </div>
                     <div>
                        <h3 className="font-black text-2xl text-base-content uppercase tracking-tight leading-none">{selectedApplicant.first_name} {selectedApplicant.last_name}</h3>
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
                              ) : <p className="text-[10px] italic opacity-20 text-center">No resume uploaded</p>}
                           </div>
                        </section>
                     </div>

                     {/* Middle: Assessment Scores */}
                     <div className="md:col-span-2 space-y-6">
                        <section className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                                 <Star className="w-3 h-3" /> HRMPSB Assessment (Registry Points)
                              </h4>
                              {!isEditingScores ? (
                                <button 
                                  onClick={() => {
                                    setScores({
                                      education_score: selectedApplicant.education_score,
                                      training_score: selectedApplicant.training_score,
                                      experience_score: selectedApplicant.experience_score,
                                      interview_score: selectedApplicant.interview_score,
                                      exam_score: selectedApplicant.exam_score
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
                                 { key: 'interview_score', label: 'Interview', max: 10 },
                                 { key: 'exam_score', label: 'Exam', max: 10 }
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

      {showAddModal && <AddApplicantModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
};

export default Recruitment;
