import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
import { FileText, Award, Calendar, ChevronRight } from 'lucide-react';
import IPCRFDetailsModal from '../../components/features/performance/IPCRFDetailsModal';

const MyIPCRF = () => {
  const [selectedReview, setSelectedReview] = useState(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.PERFORMANCE],
    queryFn: async () => {
      const res = await api.get('performance/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  });

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-base-content flex items-center gap-3">
            <Award className="w-8 h-8 text-primary" />
            My IPCRF Ratings
          </h1>
          <p className="text-sm opacity-50 font-medium mt-1">Official performance results and promotion eligibility.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center p-20"><span className="loading loading-spinner text-primary loading-lg"></span></div>
        ) : reviews.length > 0 ? (
          reviews.map((r) => (
            <div key={r.id} className="card bg-base-100 shadow-xl border border-base-300 hover:border-primary/30 transition-all rounded-[2rem] overflow-hidden group">
               <div className="card-body p-6">
                  <div className="flex justify-between items-start mb-4">
                     <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                        <FileText className="w-6 h-6" />
                     </div>
                     <div className={`badge badge-sm font-bold ${r.is_promotion_eligible ? 'badge-success text-white' : 'badge-ghost opacity-50'}`}>
                        {r.is_promotion_eligible ? 'ELIGIBLE' : 'STABLE'}
                     </div>
                  </div>
                  
                  <h3 className="font-black text-xl mb-1">{r.period}</h3>
                  <div className="flex items-center gap-2 text-xs opacity-50 font-bold mb-6">
                     <Calendar className="w-3 h-3" />
                     Evaluated on {new Date(r.date_evaluated).toLocaleDateString()}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-6">
                     <div className="text-center p-2 bg-base-200 rounded-xl">
                        <p className="text-[10px] font-black opacity-30 uppercase">P</p>
                        <p className="font-black">{r.punctuality_score}</p>
                     </div>
                     <div className="text-center p-2 bg-base-200 rounded-xl">
                        <p className="text-[10px] font-black opacity-30 uppercase">Q</p>
                        <p className="font-black">{r.quality_score}</p>
                     </div>
                     <div className="text-center p-2 bg-base-200 rounded-xl">
                        <p className="text-[10px] font-black opacity-30 uppercase">B</p>
                        <p className="font-black">{r.behavior_score}</p>
                     </div>
                  </div>

                  <button 
                    onClick={() => setSelectedReview(r)}
                    className="btn btn-primary btn-block rounded-xl group"
                  >
                     View Official Form
                     <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
               </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-40 bg-base-100 rounded-[3rem] border-4 border-dashed border-base-300 flex flex-col items-center justify-center opacity-30">
             <FileText className="w-16 h-16 mb-4" />
             <p className="text-xl font-bold italic">No IPCRF ratings available yet.</p>
          </div>
        )}
      </div>

      {selectedReview && (
        <IPCRFDetailsModal 
          review={selectedReview} 
          onClose={() => setSelectedReview(null)} 
        />
      )}
    </div>
  );
};

export default MyIPCRF;
