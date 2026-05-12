import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Download, FileText, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';

/**
 * DTR (Daily Time Record) Component
 * 
 * Displays the official log of time-in and time-out for personnel.
 * Includes geo-validation status for defense transparency.
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

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-base-content flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Daily Time Record (DTR)
          </h1>
          <p className="text-sm opacity-50 font-medium mt-1">Official timekeeping log for DepEd Lucena City Division Office.</p>
        </div>
        <button className="btn btn-outline btn-primary rounded-xl">
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      <div className="card bg-white border border-base-300 shadow-xl rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-100 border-b border-base-200">
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest opacity-40">Date</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest opacity-40">Time In</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest opacity-40">Time Out</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest opacity-40">Duration</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest opacity-40">Geo-Status</th>
                <th className="py-6 px-8 text-[10px] font-black uppercase tracking-widest opacity-40 text-right">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <span className="loading loading-spinner loading-lg text-primary" />
                  </td>
                </tr>
              ) : records.length > 0 ? (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-base-50 transition-colors">
                    <td className="py-5 px-8">
                      <p className="font-bold text-base-content">{new Date(rec.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </td>
                    <td className="py-5 px-8">
                      <span className="font-mono text-sm bg-success/5 text-success px-3 py-1.5 rounded-lg border border-success/10">
                        {rec.time_in ? rec.time_in.substring(0, 5) : '---'}
                      </span>
                    </td>
                    <td className="py-5 px-8">
                      <span className="font-mono text-sm bg-error/5 text-error px-3 py-1.5 rounded-lg border border-error/10">
                        {rec.time_out ? rec.time_out.substring(0, 5) : '---'}
                      </span>
                    </td>
                    <td className="py-5 px-8">
                      <p className="text-sm font-bold opacity-60">
                        {calculateDuration(rec.time_in, rec.time_out)}
                      </p>
                    </td>
                    <td className="py-5 px-8">
                      {rec.is_geo_flagged ? (
                        <div className="flex items-center gap-2 text-warning font-black text-[10px] uppercase tracking-widest">
                          <AlertCircle className="w-4 h-4" />
                          Geo-Flagged
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-success font-black text-[10px] uppercase tracking-widest">
                          <CheckCircle2 className="w-4 h-4" />
                          Validated
                        </div>
                      )}
                    </td>
                    <td className="py-5 px-8 text-right">
                      <span className={`badge badge-sm font-bold uppercase ${
                        rec.is_geo_flagged 
                          ? 'badge-error text-white' 
                          : rec.status === 'present' 
                            ? 'badge-success text-white' 
                            : 'badge-warning'
                      }`}>
                        {rec.is_geo_flagged ? 'FLAGGED' : rec.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-20 text-center opacity-30 italic font-medium">
                    No DTR records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DTR Footer Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-base-100 rounded-3xl border border-base-300">
           <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <h4 className="font-bold text-sm">Geo-Validation</h4>
           </div>
           <p className="text-xs opacity-50">Verified presence within the 100m geofence of the assigned office location via Haversine calculation.</p>
        </div>
        <div className="p-6 bg-base-100 rounded-3xl border border-base-300">
           <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <h4 className="font-bold text-sm">Timekeeping</h4>
           </div>
           <p className="text-xs opacity-50">Official server-side timestamps captured during QR scan events to prevent local clock manipulation.</p>
        </div>
        <div className="p-6 bg-base-100 rounded-3xl border border-base-300">
           <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-5 h-5 text-secondary" />
              <h4 className="font-bold text-sm">Station Check</h4>
           </div>
           <p className="text-xs opacity-50">Authorized workstations are pre-configured in the system. Personnel must scan at their designated schools.</p>
        </div>
      </div>
    </div>
  );
};

export default DTR;
