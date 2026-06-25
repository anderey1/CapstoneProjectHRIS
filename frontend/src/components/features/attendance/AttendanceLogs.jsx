import React, { useState } from 'react';
import { Search, Calendar } from 'lucide-react';

/**
 * Attendance Logs List (Table & Card View)
 * 
 * High-density design for monitoring staff daily records.
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const getStatusLabel = (status) => {
    if (status === 'late') return 'Late';
    return 'Present';
  };

  const getStatusClass = (status) => {
    return status === 'late'
      ? 'bg-warning/10 text-warning border-warning/20'
      : 'bg-success/10 text-success border-success/20';
  };

  return (
    <div className="flex flex-col h-full gap-6">
      
      {/* Search & Global Actions */}
      <div className="bg-white border border-base-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center flex-1">
          <div className="relative min-w-[200px] flex-1 lg:flex-none">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-primary" />
            <input 
              type="text" 
              placeholder="Search staff..." 
              className="input input-sm w-full pl-10 bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 bg-base-50 px-3 py-1 rounded-lg border border-base-100 h-8">
              <Calendar className="w-3.5 h-3.5 opacity-30" />
              <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest outline-none"
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
        </div>

        <div className="flex items-center gap-4 border-l border-base-200 pl-4">
         <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              className="checkbox checkbox-xs checkbox-primary rounded-md" 
              checked={flaggedOnly}
              onChange={(e) => setFlaggedOnly(e.target.checked)}
            />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Location Warnings Only</span>
         </label>
        </div>
      </div>

      {/* Mobile Card View (< lg) */}
      <div className="lg:hidden space-y-4">
        {isLoading ? (
          <div className="py-20 flex justify-center"><span className="loading loading-spinner text-primary" /></div>
        ) : records?.length > 0 ? (
          records.map(rec => (
            <div key={rec.id} className={`bg-white border ${rec.is_geo_flagged ? 'border-error/30' : 'border-base-200'} rounded-xl p-5 shadow-sm space-y-4 relative overflow-hidden`}>
              {rec.is_geo_flagged && <div className="absolute top-0 right-0 bg-error text-white text-[7px] font-black px-2 py-0.5 uppercase tracking-[0.2em] rounded-bl-lg">Location Warning</div>}
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-base-100 rounded-lg flex items-center justify-center text-xs font-black text-primary uppercase">
                   {rec.employee_name.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-xs text-base-content uppercase tracking-tight">{rec.employee_name}</p>
                  <p className="text-[9px] font-black opacity-30 uppercase tracking-widest">{rec.date}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-base-50 p-2 rounded-lg border border-base-100">
                  <p className="text-[7px] font-black uppercase opacity-40 mb-1">Morning</p>
                  <div className="flex flex-col">
                    <span className="text-success font-black text-[9px]">{rec.am_in?.substring(0, 5) || '--:--'}</span>
                    <span className="text-error font-black text-[9px]">{rec.am_out?.substring(0, 5) || '--:--'}</span>
                  </div>
                </div>
                <div className="bg-base-50 p-2 rounded-lg border border-base-100">
                  <p className="text-[7px] font-black uppercase opacity-40 mb-1">Afternoon</p>
                  <div className="flex flex-col">
                    <span className="text-success font-black text-[9px]">{rec.pm_in?.substring(0, 5) || '--:--'}</span>
                    <span className="text-error font-black text-[9px]">{rec.pm_out?.substring(0, 5) || '--:--'}</span>
                  </div>
                </div>
                <div className="bg-base-50 p-2 rounded-lg border border-base-100">
                  <p className="text-[7px] font-black uppercase opacity-40 mb-1">Overtime</p>
                  <div className="flex flex-col">
                    <span className="text-primary font-black text-[9px]">{rec.ot_in?.substring(0, 5) || '--:--'}</span>
                    <span className="text-primary font-black text-[9px]">{rec.ot_out?.substring(0, 5) || '--:--'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-base-100">
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusClass(rec.status)}`}>
                  {getStatusLabel(rec.status)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center opacity-30 italic font-black uppercase tracking-widest text-xs">No records found</div>
        )}
      </div>

      {/* Desktop Table View (>= lg) */}
      <div className="hidden lg:block bg-white border border-base-200 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="table table-sm w-full">
            <thead>
              <tr className="bg-base-50/50 border-b border-base-100 text-[9px] font-black uppercase tracking-[0.1em] opacity-40">
                <th className="py-5 px-8 text-primary">Staff Member</th>
                <th>Date</th>
                <th className="text-center">AM In/Out</th>
                <th className="text-center">PM In/Out</th>
                <th className="text-center">OT In/Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-50">
              {isLoading ? (
                <tr><td colSpan="4" className="text-center py-20"><span className="loading loading-spinner text-primary" /></td></tr>
              ) : records?.length > 0 ? (
                records.map(rec => (
                  <tr key={rec.id} className={`hover:bg-base-50/50 transition-colors ${rec.is_geo_flagged ? 'bg-error/5' : ''}`}>
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-base-100 rounded-lg flex items-center justify-center text-[10px] font-black text-primary uppercase">
                           {rec.employee_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-[11px] text-base-content uppercase tracking-tight">{rec.employee_name}</p>
                          <p className="text-[8px] font-black opacity-30 uppercase tracking-widest">{rec.department}</p>
                        </div>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusClass(rec.status)}`}>
                          {getStatusLabel(rec.status)}
                        </span>
                      </div>
                    </td>
                    <td className="text-[10px] font-bold opacity-60 uppercase">{rec.date}</td>
                    <td className="text-center">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-success font-black text-[9px]">{rec.am_in?.substring(0, 5) || '--:--'}</span>
                            <span className="text-error font-black text-[9px]">{rec.am_out?.substring(0, 5) || '--:--'}</span>
                        </div>
                    </td>
                    <td className="text-center">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-success font-black text-[9px]">{rec.pm_in?.substring(0, 5) || '--:--'}</span>
                            <span className="text-error font-black text-[9px]">{rec.pm_out?.substring(0, 5) || '--:--'}</span>
                        </div>
                    </td>
                    <td className="text-center">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-primary font-black text-[9px]">{rec.ot_in?.substring(0, 5) || '--:--'}</span>
                            <span className="text-primary font-black text-[9px]">{rec.ot_out?.substring(0, 5) || '--:--'}</span>
                        </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-40 opacity-30 italic font-black uppercase tracking-widest">No records found</td>
                </tr>
              )}
            </tbody>
          </table>
      </div>
    </div>
  );
};

export default AttendanceLogs;
