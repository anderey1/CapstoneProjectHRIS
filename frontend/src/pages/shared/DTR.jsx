import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Download, FileText, MapPin, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';
// Helper to format HH:MM:SS string to 12-hour AM/PM format
const formatTime = (timeStr, fallback = '---') => {
  if (!timeStr) return fallback;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes.padStart(2, '0')} ${ampm}`;
};

/**
 * Official DTR (Daily Time Record) Page
 * 
 * Redesigned for viewing detailed slots and exporting Form 48 compliant PDFs.
 */
const DTR = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [downloading, setDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
      setErrorMessage('');

      const response = await api.get('attendance/dtr_pdf/', {
        params: {
          month: selectedMonth,
          cutoff,
        },
        responseType: 'blob'
      });

      const blob = response.data;
      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error('The server returned an empty PDF response.');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DTR_${selectedMonth}_Cutoff_${cutoff || 'Full'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
      setErrorMessage(
        error?.response?.data?.detail ||
        error?.message ||
        'Unable to generate the PDF right now.'
      );
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
    <div className="p-4 md:p-8 space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center text-[#0038A8]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
                Daily Time Record (CSC Form No. 48)
              </h1>
              <p className="text-xs text-slate-500">
                Official Monthly Attendance Record • Department of Education
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#0038A8]"
          />

          <div className="dropdown dropdown-end">
            <button 
              tabIndex={0} 
              disabled={downloading}
              className={`px-4 py-2 bg-[#0038A8] hover:bg-[#002d86] text-white text-xs font-semibold uppercase tracking-wider rounded border border-[#002d86] shadow-sm flex items-center gap-1.5 transition-colors ${downloading ? 'opacity-60' : ''}`}
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Generating PDF...' : 'Export Form 48 PDF'}
            </button>
            <ul tabIndex={0} className="dropdown-content z-20 menu p-2 shadow-lg bg-white border border-slate-300 rounded-lg w-56 mt-1 text-xs">
              <li className="menu-title font-bold text-[10px] uppercase text-slate-400">Select Form Cutoff Period</li>
              <li><button type="button" onClick={() => handleDownload('1')} className="py-2 text-slate-700 hover:bg-slate-50">1st Cutoff (1st - 15th Day)</button></li>
              <li><button type="button" onClick={() => handleDownload('2')} className="py-2 text-slate-700 hover:bg-slate-50">2nd Cutoff (16th - End of Month)</button></li>
              <li><button type="button" onClick={() => handleDownload('split')} className="py-2 text-slate-700 hover:bg-slate-50">Split Cards (Full Month)</button></li>
              <li><button type="button" onClick={() => handleDownload('')} className="py-2 font-semibold text-[#0038A8] hover:bg-blue-50">Full Month Single Document</button></li>
            </ul>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div role="alert" className="bg-red-50 border border-red-300 p-3.5 rounded flex items-start gap-2.5 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* DTR Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                <th className="px-6 py-3 text-center">Date</th>
                <th className="px-6 py-3 text-center" colSpan={2}>Morning (A.M.)</th>
                <th className="px-6 py-3 text-center" colSpan={2}>Afternoon (P.M.)</th>
                <th className="px-6 py-3 text-center" colSpan={2}>Overtime (O.T.)</th>
                <th className="px-6 py-3 text-right">DTR Status</th>
              </tr>
              <tr className="bg-slate-100/70 border-b border-slate-200 uppercase text-[10px] font-semibold text-slate-500">
                <th></th>
                <th className="text-center py-1.5 font-mono">Arrival</th>
                <th className="text-center py-1.5 font-mono border-r border-slate-200">Departure</th>
                <th className="text-center py-1.5 font-mono">Arrival</th>
                <th className="text-center py-1.5 font-mono border-r border-slate-200">Departure</th>
                <th className="text-center py-1.5 font-mono">Arrival</th>
                <th className="text-center py-1.5 font-mono">Departure</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length > 0 ? (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-xs text-slate-900">
                      {new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                    </td>
                    <td className="text-center py-3.5">
                      <span className="font-mono text-xs font-semibold tabular-nums text-emerald-700">
                        {formatTime(rec.am_in)}
                      </span>
                    </td>
                    <td className="text-center py-3.5 border-r border-slate-100">
                      <span className="font-mono text-xs font-semibold tabular-nums text-slate-700">
                        {formatTime(rec.am_out)}
                      </span>
                    </td>
                    <td className="text-center py-3.5">
                      <span className="font-mono text-xs font-semibold tabular-nums text-emerald-700">
                        {formatTime(rec.pm_in)}
                      </span>
                    </td>
                    <td className="text-center py-3.5 border-r border-slate-100">
                      <span className="font-mono text-xs font-semibold tabular-nums text-slate-700">
                        {formatTime(rec.pm_out)}
                      </span>
                    </td>
                    <td className="text-center py-3.5">
                      <span className="font-mono text-xs font-semibold tabular-nums text-blue-700">
                        {formatTime(rec.ot_in)}
                      </span>
                    </td>
                    <td className="text-center py-3.5">
                      <span className="font-mono text-xs font-semibold tabular-nums text-blue-700">
                        {formatTime(rec.ot_out)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex flex-col items-end gap-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            rec.is_dtr_approved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {rec.is_dtr_approved ? 'Approved' : 'Pending Review'}
                          </span>
                          {rec.is_geo_flagged && (
                             <span className="text-xs font-medium text-red-600 flex items-center gap-0.5">
                                <AlertCircle className="w-3 h-3" /> Outside Geofence
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
