import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Download, FileText, MapPin, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

/**
 * Official DTR (Daily Time Record) Page
 * 
 * Redesigned for viewing detailed slots and exporting Form 48 compliant PDFs.
 */
const DTR = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [downloading, setDownloading] = useState(false);

  // Only allow Employees to export PDF
  const isEmployee = [ROLES.TEACHING, ROLES.ADMINISTRATIVE, ROLES.NON_TEACHING].includes(user?.role);

  const { data: records = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE, selectedMonth],
    queryFn: async () => {
      const [year, month] = selectedMonth.split('-');
      const response = await api.get(`attendance/?month=${month}&year=${year}`);
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    },
  });

  const handleDownload = async (cutoff) => {
    try {
      setDownloading(true);
      const response = await api.get(`attendance/dtr_pdf/?month=${selectedMonth}&cutoff=${cutoff}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DTR_${selectedMonth}_Cutoff_${cutoff}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download failed", error);
    } finally {
      setDownloading(false);
    }
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
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">Daily Time Record logs (Form 48)</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            {isEmployee && (
              <div className="dropdown dropdown-end">
                  <label tabIndex={0} className={`btn btn-primary rounded-lg shadow-lg shadow-primary/20 px-6 font-black uppercase tracking-widest text-[11px] ${downloading ? 'loading' : ''}`}>
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                  </label>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-xl bg-base-100 border border-base-200 rounded-xl w-52 mt-2">
                      <li className="menu-title font-black text-[9px] uppercase tracking-widest opacity-40">Choose Cutoff</li>
                      <li><button onClick={() => handleDownload('1')} className="font-bold text-xs uppercase py-3">1st Cutoff (1-15)</button></li>
                      <li><button onClick={() => handleDownload('2')} className="font-bold text-xs uppercase py-3">2nd Cutoff (16-31)</button></li>
                      <li><button onClick={() => handleDownload('split')} className="font-bold text-xs uppercase py-3">Split (Both Cards)</button></li>
                      <li><button onClick={() => handleDownload('')} className="font-bold text-xs uppercase py-3">Full Month (Copy)</button></li>
                  </ul>
              </div>
            )}
        </div>
      </div>

      {/* DTR Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-base-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr className="bg-base-50/50 border-b border-base-200 uppercase text-[10px] tracking-widest font-black opacity-50">
                <th className="px-6 py-4 text-primary text-center">Date</th>
                <th className="px-6 py-4 text-center" colSpan={2}>Morning (AM)</th>
                <th className="px-6 py-4 text-center" colSpan={2}>Afternoon (PM)</th>
                <th className="px-6 py-4 text-center" colSpan={2}>Overtime (OT)</th>
                <th className="px-6 py-4 text-right">DTR Status</th>
              </tr>
              <tr className="bg-base-50/20 border-b border-base-100 uppercase text-[8px] tracking-tighter font-black opacity-40">
                <th></th>
                <th className="text-center">Arrival</th>
                <th className="text-center border-r border-base-100">Departure</th>
                <th className="text-center">Arrival</th>
                <th className="text-center border-r border-base-100">Departure</th>
                <th className="text-center">Arrival</th>
                <th className="text-center">Departure</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-100">
              {records.length > 0 ? (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-base-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-[11px] text-base-content uppercase">
                      {new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="text-center py-4">
                      <span className="font-black text-[10px] text-success">
                        {rec.am_in ? rec.am_in.substring(0, 5) : '---'}
                      </span>
                    </td>
                    <td className="text-center py-4 border-r border-base-100">
                      <span className="font-black text-[10px] text-error">
                        {rec.am_out ? rec.am_out.substring(0, 5) : '---'}
                      </span>
                    </td>
                    <td className="text-center py-4">
                      <span className="font-black text-[10px] text-success">
                        {rec.pm_in ? rec.pm_in.substring(0, 5) : '---'}
                      </span>
                    </td>
                    <td className="text-center py-4 border-r border-base-100">
                      <span className="font-black text-[10px] text-error">
                        {rec.pm_out ? rec.pm_out.substring(0, 5) : '---'}
                      </span>
                    </td>
                    <td className="text-center py-4">
                      <span className="font-black text-[10px] text-primary">
                        {rec.ot_in ? rec.ot_in.substring(0, 5) : '---'}
                      </span>
                    </td>
                    <td className="text-center py-4">
                      <span className="font-black text-[10px] text-primary">
                        {rec.ot_out ? rec.ot_out.substring(0, 5) : '---'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                            rec.is_dtr_approved ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                          }`}>
                            {rec.is_dtr_approved ? 'Approved' : 'Pending HR'}
                          </span>
                          {rec.is_geo_flagged && (
                             <span className="text-[8px] font-black text-error flex items-center gap-0.5">
                                <AlertCircle className="w-2 h-2" /> Outside Zone
                             </span>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-20 opacity-30 italic text-xs uppercase tracking-widest">No records for this period</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DTR;
