import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
import { Plus, User, Mail, Phone, Briefcase, Trash2, ChevronRight, Layout } from 'lucide-react';
import AddApplicantModal from '../../components/features/recruitment/AddApplicantModal';

const COLUMNS = [
  { id: 'applied', label: 'Applied', color: 'bg-info/10 text-info border-info/20' },
  { id: 'screened', label: 'Screened', color: 'bg-warning/10 text-warning border-warning/20' },
  { id: 'interviewed', label: 'Interviewed', color: 'bg-primary/10 text-primary border-primary/20' },
  { id: 'hired', label: 'Hired', color: 'bg-success/10 text-success border-success/20' },
  { id: 'rejected', label: 'Rejected', color: 'bg-error/10 text-error border-error/20' }
];

/**
 * Hiring Board (Recruitment)
 * 
 * Simple, professional Kanban redesign with standard radii and plain language.
 */
const Recruitment = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: applicants = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.APPLICANTS],
    queryFn: async () => {
      const res = await api.get('applicants/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`applicants/${id}/`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APPLICANTS] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`applicants/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APPLICANTS] }),
  });

  const handleDelete = (id) => {
    if (window.confirm('Remove this applicant?')) deleteMutation.mutate(id);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 h-full flex flex-col">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Layout className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">Hiring Board</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">Track applicant status</p>
        </div>
        
        <button 
          className="btn btn-primary rounded-lg shadow-lg shadow-primary/20 px-8" 
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Applicant
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center"><span className="loading loading-spinner text-primary loading-lg" /></div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-8 flex gap-6 scrollbar-thin">
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
              
              {/* Column Header */}
              <div className={`p-4 rounded-lg border ${column.color} flex items-center justify-between shadow-sm bg-white/50 backdrop-blur-sm`}>
                <span className="font-black uppercase tracking-widest text-[10px]">{column.label}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-current opacity-10"></span>
                <span className="absolute right-4 text-[10px] font-black">{applicants.filter(a => a.status === column.id).length}</span>
              </div>

              {/* Column Body */}
              <div className="flex-1 flex flex-col gap-4 min-h-[500px] bg-base-200/50 rounded-xl p-3 border border-base-300/50">
                {applicants.filter(a => a.status === column.id).map((applicant) => (
                  <div key={applicant.id} className="bg-white border border-base-200 shadow-sm hover:shadow-md transition-all group rounded-lg overflow-hidden">
                    <div className="p-5 space-y-4">
                      
                      <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-lg bg-base-50 border border-base-200 flex items-center justify-center text-xs font-black text-primary">
                          {applicant.first_name[0]}{applicant.last_name[0]}
                        </div>
                        <button 
                          onClick={() => handleDelete(applicant.id)} 
                          className="btn btn-ghost btn-xs text-error btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-base-content">{applicant.first_name} {applicant.last_name}</h3>
                        <p className="text-[10px] font-black opacity-30 uppercase tracking-tight mt-0.5">{applicant.position_applied}</p>
                      </div>
                      
                      <div className="space-y-1.5 py-2 border-y border-base-50">
                        <div className="flex items-center gap-2 text-[10px] font-bold opacity-50">
                           <Mail className="w-3 h-3" /> {applicant.email}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold opacity-50">
                           <Phone className="w-3 h-3" /> {applicant.phone}
                        </div>
                      </div>

                      <div className="dropdown dropdown-top dropdown-end w-full">
                        <label tabIndex={0} className="btn btn-ghost btn-block btn-xs bg-base-100 border border-base-200 hover:bg-primary/5 hover:text-primary hover:border-primary/20 rounded-md flex items-center justify-between px-3 h-8 transition-colors">
                           <span className="text-[9px] font-black uppercase tracking-widest">Update Status</span>
                           <ChevronRight className="w-3 h-3" />
                        </label>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-2xl bg-base-100 rounded-xl w-52 mb-2 border border-base-200 animate-in fade-in slide-in-from-bottom-2">
                          <li className="menu-title px-4 py-2 opacity-30 uppercase text-[9px] font-black tracking-widest">Move to</li>
                          {COLUMNS.filter(c => c.id !== applicant.status).map(c => (
                            <li key={c.id}>
                              <button 
                                onClick={() => updateStatusMutation.mutate({ id: applicant.id, status: c.id })}
                                className="text-[10px] font-bold uppercase py-2.5 px-4"
                              >
                                {c.label}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
                
                {applicants.filter(a => a.status === column.id).length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-10 py-10">
                    <User className="w-8 h-8 mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Empty</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <AddApplicantModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default Recruitment;
