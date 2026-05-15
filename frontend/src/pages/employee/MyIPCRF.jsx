import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
import { FileText, Award, Calendar, ChevronRight, BarChart3 } from 'lucide-react';
import IPCRFDetailsModal from '../../components/features/performance/IPCRFDetailsModal';

/**
 * My Performance Ratings (Employee IPCRF)
 * 
 * Simple, professional redesign for staff to view their results.
 */
const MyIPCRF = () => {
  const [selectedReview, setSelectedReview] = useState(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.PERFORMANCE],
    queryFn: async () => {
      const res = await api.get('performance/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  });

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
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">My Performance</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">Your ratings and eligibility</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.length > 0 ? (
          reviews.map((r) => (
            <div key={r.id} className="bg-white border border-base-200 shadow-sm hover:shadow-md transition-all rounded-xl overflow-hidden group">
               <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                     <div className="p-3 bg-primary/10 text-primary rounded-lg border border-primary/5">
                        <FileText className="w-5 h-5" />
                     </div>
                     <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${r.is_promotion_eligible ? 'bg-success/10 text-success' : 'bg-base-100 text-base-content/30'}`}>
                        {r.is_promotion_eligible ? 'Eligible' : 'Regular'}
                     </div>
                  </div>
                  
                  <h3 className="font-black text-xl mb-1 text-base-content">{r.period}</h3>
                  <div className="flex items-center gap-2 text-[10px] opacity-40 font-bold mb-8 uppercase tracking-tight">
                     <Calendar className="w-3 h-3" />
                     Evaluated: {new Date(r.date_evaluated).toLocaleDateString()}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-8">
                     <div className="text-center p-3 bg-base-50/50 rounded-lg border border-base-100">
                        <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-1">Punctual</p>
                        <p className="font-black text-primary">{r.punctuality_score}</p>
                     </div>
                     <div className="text-center p-3 bg-base-50/50 rounded-lg border border-base-100">
                        <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-1">Quality</p>
                        <p className="font-black text-primary">{r.quality_score}</p>
                     </div>
                     <div className="text-center p-3 bg-base-50/50 rounded-lg border border-base-100">
                        <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-1">Behavior</p>
                        <p className="font-black text-primary">{r.behavior_score}</p>
                     </div>
                  </div>

                  <button 
                    onClick={() => setSelectedReview(r)}
                    className="btn btn-ghost btn-block bg-base-50 border-base-200 hover:bg-primary/5 hover:text-primary hover:border-primary/20 rounded-lg text-xs font-bold uppercase tracking-widest group transition-all"
                  >
                     View Report
                     <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform ml-1" />
                  </button>
               </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-40 bg-white rounded-xl border border-dashed border-base-300 flex flex-col items-center justify-center opacity-30">
             <BarChart3 className="w-12 h-12 mb-3" />
             <p className="text-lg font-black uppercase tracking-widest">No results yet</p>
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
