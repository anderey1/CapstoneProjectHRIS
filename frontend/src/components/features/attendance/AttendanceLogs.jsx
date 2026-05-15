import React from 'react';
import { Search, FileDown, CheckCircle, AlertTriangle, Clock, MapPin, History } from 'lucide-react';
import { exportToCSV } from '../../../utils/export';

/**
 * Attendance Logs List (Table & Card View)
 * 
 * Simple, professional redesign for viewing daily check-ins.
 */
const AttendanceLogs = ({ 
  records, 
  isLoading, 
  searchTerm, 
  setSearchTerm, 
  deptFilter, 
  setDeptFilter, 
  flaggedOnly, 
  setFlaggedOnly 
}) => {
  
  const calculateDuration = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return '---';
    const start = new Date(`1970-01-01T${timeIn}`);
    const end = new Date(`1970-01-01T${timeOut}`);
    const diff = (end - start) / 1000 / 60;
    const hours = Math.floor(diff / 60);
    const mins = Math.floor(diff % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="flex flex-col h-full gap-6">
      
      {/* Search & Filters */}
      <div className="bg-white border border-base-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-primary" />
          <input 
            type="text" 
            placeholder="Search staff..." 
            className="input input-sm w-full pl-10 bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="select select-sm bg-base-50 border-base-100 rounded-lg text-[11px] font-black uppercase tracking-widest"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="All">All Areas</option>
          <option value="Instructional">Instructional</option>
          <option value="Administrative">Administrative</option>
          <option value="Finance">Finance</option>
        </select>

        <button 
          onClick={() => exportToCSV(records, 'Attendance_Logs')}
          className="btn btn-ghost btn-sm bg-base-50 border-base-100 rounded-lg text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100"
        >
          <FileDown className="w-3.5 h-3.5 mr-1" /> Export
        </button>
      </div>

      {/* Mobile Card List (< lg) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {isLoading ? (
          <div className="col-span-full py-10 flex justify-center"><span className="loading loading-spinner text-primary" /></div>
        ) : records?.length > 0 ? (
          records.map(rec => (
            <div key={rec.id} className={`bg-white p-6 rounded-xl shadow-sm border border-base-200 flex flex-col gap-4 transition-all ${rec.is_geo_flagged ? 'border-error/10 bg-error/5' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-black text-sm text-base-content leading-tight uppercase tracking-tight">{rec.employee_name}</p>
                  <p className="text-[9px] font-black opacity-30 uppercase tracking-widest">{rec.department}</p>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  rec.is_geo_flagged 
                    ? 'bg-error text-white' 
                    : rec.status === 'present' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-warning/10 text-warning'
                }`}>
                  {rec.is_geo_flagged ? 'Flagged' : rec.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 border-y border-base-100/50">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase opacity-30 tracking-widest">Time Logs</p>
                  <p className="text-xs font-black">
                    <span className="text-success">{rec.time_in?.substring(0, 5) || '--:--'}</span>
                    <span className="mx-2 opacity-10">/</span>
                    <span className="text-error">{rec.time_out?.substring(0, 5) || '--:--'}</span>
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] font-black uppercase opacity-30 tracking-widest">Result</p>
                  <p className={`text-[10px] font-black uppercase ${rec.is_geo_flagged ? 'text-error' : 'text-primary'}`}>
                    {rec.is_geo_flagged ? 'Out of Range' : 'Validated'}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-black opacity-30 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><History className="w-3 h-3" /> {rec.date}</span>
                <span>{calculateDuration(rec.time_in, rec.time_out)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-white rounded-xl border border-dashed border-base-300 flex flex-col items-center justify-center opacity-30">
             <Clock className="w-8 h-8 mb-2" />
             <p className="text-xs font-black uppercase tracking-widest">No records found</p>
          </div>
        )}
      </div>

      {/* Desktop Table (>= lg) */}
      <div className="hidden lg:block bg-white border border-base-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr className="bg-base-50/50 border-b border-base-100 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                <th className="py-5 px-8 text-primary">Staff Member</th>
                <th>Log Date</th>
                <th>Check In / Out</th>
                <th>Working Hours</th>
                <th className="text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-50">
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-20"><span className="loading loading-spinner text-primary" /></td></tr>
              ) : records?.length > 0 ? (
                records.map(rec => (
                  <tr key={rec.id} className={`hover:bg-base-50/50 transition-colors ${rec.is_geo_flagged ? 'bg-error/5' : ''}`}>
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-base-50 border border-base-100 rounded-lg flex items-center justify-center text-[10px] font-black text-primary uppercase">
                           {rec.employee_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-xs text-base-content uppercase tracking-tight">{rec.employee_name}</p>
                          <p className="text-[9px] font-black opacity-30 uppercase tracking-widest">{rec.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs font-bold text-base-content/60">{rec.date}</td>
                    <td className="font-black text-[11px]">
                      <span className="text-success">{rec.time_in?.substring(0, 5) || '---'}</span>
                      <span className="mx-2 opacity-10">/</span>
                      <span className="text-error">{rec.time_out?.substring(0, 5) || '---'}</span>
                    </td>
                    <td className="text-[10px] font-black opacity-30 uppercase">{calculateDuration(rec.time_in, rec.time_out)}</td>
                    <td className="text-right px-8">
                       <div className="flex items-center justify-end gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            rec.is_geo_flagged ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
                          }`}>
                            {rec.is_geo_flagged ? 'Flagged' : 'Validated'}
                          </span>
                          {rec.is_geo_flagged ? <AlertTriangle className="w-3.5 h-3.5 text-error opacity-40" /> : <CheckCircle className="w-3.5 h-3.5 text-success opacity-40" />}
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-40 opacity-30 italic font-black uppercase tracking-widest">No records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceLogs;
