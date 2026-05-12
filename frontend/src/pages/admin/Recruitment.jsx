import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
import { Plus, User, Mail, Phone, Briefcase, Trash2, ChevronRight, Filter } from 'lucide-react';
import AddApplicantModal from '../../components/features/recruitment/AddApplicantModal';

const COLUMNS = [
  { id: 'applied', label: 'Applied', color: 'bg-info/10 text-info border-info/20' },
  { id: 'screened', label: 'Screened', color: 'bg-warning/10 text-warning border-warning/20' },
  { id: 'interviewed', label: 'Interviewed', color: 'bg-primary/10 text-primary border-primary/20' },
  { id: 'hired', label: 'Hired', color: 'bg-success/10 text-success border-success/20' },
  { id: 'rejected', label: 'Rejected', color: 'bg-error/10 text-error border-error/20' }
];

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
    if (window.confirm('Remove this applicant from the board?')) deleteMutation.mutate(id);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-base-content flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary" />
            Recruitment Board
          </h1>
          <p className="text-sm opacity-50 font-medium mt-1">Track and manage applicant progression through the hiring pipeline.</p>
        </div>
        <button className="btn btn-primary btn-lg rounded-2xl shadow-xl shadow-primary/20 px-8" onClick={() => setShowModal(true)}>
          <Plus className="w-5 h-5" />
          Add Applicant
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-20"><span className="loading loading-spinner text-primary loading-lg" /></div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide">
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
              <div className={`p-4 rounded-2xl border ${column.color} flex items-center justify-between shadow-sm`}>
                <span className="font-black uppercase tracking-widest text-[10px]">{column.label}</span>
                <span className="badge badge-sm font-bold bg-current/10 border-none">
                  {applicants.filter(a => a.status === column.id).length}
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-4 min-h-[500px] bg-base-200/30 rounded-[2rem] p-4 border border-dashed border-base-300">
                {applicants.filter(a => a.status === column.id).map((applicant) => (
                  <div key={applicant.id} className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all group rounded-2xl">
                    <div className="card-body p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-base-200 flex items-center justify-center text-xs font-black">
                          {applicant.first_name[0]}{applicant.last_name[0]}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleDelete(applicant.id)} className="btn btn-ghost btn-xs text-error btn-circle">
                             <Trash2 className="w-3 h-3" />
                           </button>
                        </div>
                      </div>

                      <h3 className="font-black text-sm">{applicant.first_name} {applicant.last_name}</h3>
                      <p className="text-[10px] font-bold opacity-40 uppercase tracking-tighter mb-4">{applicant.position_applied}</p>
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-[10px] font-medium opacity-60">
                           <Mail className="w-3 h-3" /> {applicant.email}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-medium opacity-60">
                           <Phone className="w-3 h-3" /> {applicant.phone}
                        </div>
                      </div>

                      <div className="dropdown dropdown-top dropdown-end w-full">
                        <label tabIndex={0} className="btn btn-ghost btn-block btn-xs bg-base-200 hover:bg-primary hover:text-white rounded-lg flex items-center justify-between px-3 h-8">
                           <span className="text-[9px] font-bold uppercase tracking-widest">Move Status</span>
                           <ChevronRight className="w-3 h-3" />
                        </label>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-2xl bg-base-100 rounded-2xl w-52 mb-2 border border-base-300">
                          {COLUMNS.filter(c => c.id !== applicant.status).map(c => (
                            <li key={c.id}>
                              <button 
                                onClick={() => updateStatusMutation.mutate({ id: applicant.id, status: c.id })}
                                className="text-[10px] font-bold uppercase py-3"
                              >
                                Move to {c.label}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
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
