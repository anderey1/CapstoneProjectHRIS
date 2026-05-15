import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Download, FileText, MapPin, AlertCircle, CheckCircle2, History } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';

/**
 * Official DTR (Daily Time Record) Page
 * 
 * Simple, professional redesign for viewing and exporting attendance logs.
 */
const DTR = () => {
  const { data: records = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE],
    queryFn: async () => {
      const response = await api.get('attendance/');
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    },
  });

  const calculateDuration = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return '---';
    const start = new Date(`1970-01-01T${timeIn}`);
    const end = new Date(`1970-01-01T${timeOut}`);
    const diff = (end - start) / 1000 / 60; // minutes
    const hours = Math.floor(diff / 60);
    const mins = Math.floor(diff % 60);
    return `${hours}h ${mins}m`;
  };

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
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">Official DTR</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">Daily Time Record logs</p>
        </div>
        
        <button className="btn btn-primary rounded-lg shadow-lg shadow-primary/20 px-8">
          <Download className="w-4 h-4 mr-2" />
          Download
        </button>
      </div>

      {/* DTR Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-base-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr className="bg-base-50/50 border-b border-base-200 uppercase text-[10px] tracking-widest font-black opacity-50">
                <th className="px-6 py-4 text-primary">Date</th>
                <th className="px-6 py-4">In</th>
                <th className="px-6 py-4">Out</th>
                <th className="px-6 py-4">Hours</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-100">
              {records.length > 0 ? (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-base-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-xs text-base-content uppercase">
                      {new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-xs text-success bg-success/5 px-2 py-1 rounded border border-success/10">
                        {rec.time_in ? rec.time_in.substring(0, 5) : '--:--'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-xs text-error bg-error/5 px-2 py-1 rounded border border-error/10">
                        {rec.time_out ? rec.time_out.substring(0, 5) : '--:--'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black opacity-40 uppercase">
                        {calculateDuration(rec.time_in, rec.time_out)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {rec.is_geo_flagged ? (
                        <div className="flex items-center gap-1.5 text-warning font-black text-[9px] uppercase tracking-wider">
                          <AlertCircle className="w-3 h-3" />
                          Flagged
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-primary font-black text-[9px] uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        rec.is_geo_flagged 
                          ? 'bg-error/10 text-error' 
                          : rec.status === 'present' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-warning/10 text-warning'
                      }`}>
                        {rec.is_geo_flagged ? 'Out' : rec.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-20 opacity-30 italic text-xs uppercase tracking-widest">No records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-xl border border-base-200 shadow-sm">
           <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <h4 className="font-black text-[10px] uppercase tracking-widest text-base-content">Office Check</h4>
           </div>
           <p className="text-[10px] font-medium opacity-40 uppercase leading-relaxed">Verified your presence within the office area using GPS validation.</p>
        </div>
        <div className="p-6 bg-white rounded-xl border border-base-200 shadow-sm">
           <div className="flex items-center gap-3 mb-3">
              <Clock className="w-4 h-4 text-primary" />
              <h4 className="font-black text-[10px] uppercase tracking-widest text-base-content">Server Time</h4>
           </div>
           <p className="text-[10px] font-medium opacity-40 uppercase leading-relaxed">Timestamps are based on our secure server clock to ensure accuracy.</p>
        </div>
        <div className="p-6 bg-white rounded-xl border border-base-200 shadow-sm">
           <div className="flex items-center gap-3 mb-3">
              <MapPin className="w-4 h-4 text-primary" />
              <h4 className="font-black text-[10px] uppercase tracking-widest text-base-content">Assigned School</h4>
           </div>
           <p className="text-[10px] font-medium opacity-40 uppercase leading-relaxed">Records are only validated when scanned at your designated workplace.</p>
        </div>
      </div>
    </div>
  );
};

export default DTR;
