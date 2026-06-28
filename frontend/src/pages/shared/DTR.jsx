import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Download, FileText, MapPin, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
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
  const [selectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Allow employees and HR/admin roles to export PDF records.
  const canExport = [ROLES.TEACHING, ROLES.ADMINISTRATIVE, ROLES.NON_TEACHING, ROLES.HR, 'ADMIN', 'SUPERINTENDENT', 'ACCOUNTANT'].includes(user?.role);
  const canSelectEmployee = ['ADMIN', 'HR', 'ADMINISTRATIVE', 'SUPERINTENDENT', 'ACCOUNTANT'].includes(user?.role);

  const { data: records = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE, selectedMonth],
    queryFn: async () => {
      const [year, month] = selectedMonth.split('-');
      const response = await api.get(`attendance/?month=${month}&year=${year}`);
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees_for_dtr'],
    queryFn: async () => {
      const response = await api.get('employees/');
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    },
    enabled: canSelectEmployee,
  });

  const handleDownload = async (cutoff) => {
    try {
      setDownloading(true);
      setErrorMessage('');

      if (canSelectEmployee && !selectedEmployeeId) {
        throw new Error('Please select an employee before exporting.');
      }

      const response = await api.get('attendance/dtr_pdf/', {
        params: {
          month: selectedMonth,
          cutoff,
          ...(selectedEmployeeId ? { employee_id: selectedEmployeeId } : {}),
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
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">Official DTR</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">Daily Time Record logs (Form 48)</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
            {canSelectEmployee && (
              <select
                className="select select-bordered select-sm w-full md:min-w-[240px] md:w-auto font-bold text-xs uppercase"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            )}
            {canExport && (
              <div className="dropdown dropdown-end">
                  <label tabIndex={0} className={`btn btn-primary rounded-lg shadow-lg shadow-primary/20 px-6 font-black uppercase tracking-widest text-[11px] ${downloading ? 'loading' : ''}`}>
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                  </label>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-xl bg-base-100 border border-base-200 rounded-xl w-52 mt-2">
                      <li className="menu-title font-black text-[9px] uppercase tracking-widest opacity-40">Choose Cutoff</li>
                      <li><button type="button" onClick={() => handleDownload('1')} className="font-bold text-xs uppercase py-3">1st Cutoff (1-15)</button></li>
                      <li><button type="button" onClick={() => handleDownload('2')} className="font-bold text-xs uppercase py-3">2nd Cutoff (16-31)</button></li>
                      <li><button type="button" onClick={() => handleDownload('split')} className="font-bold text-xs uppercase py-3">Split (Both Cards)</button></li>
                      <li><button type="button" onClick={() => handleDownload('')} className="font-bold text-xs uppercase py-3">Full Month (Copy)</button></li>
                  </ul>
              </div>
            )}
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-error rounded-xl shadow-sm">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">{errorMessage}</span>
        </div>
      )}

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
                        {formatTime(rec.am_in)}
                      </span>
                    </td>
                    <td className="text-center py-4 border-r border-base-100">
                      <span className="font-black text-[10px] text-error">
                        {formatTime(rec.am_out)}
                      </span>
                    </td>
                    <td className="text-center py-4">
                      <span className="font-black text-[10px] text-success">
                        {formatTime(rec.pm_in)}
                      </span>
                    </td>
                    <td className="text-center py-4 border-r border-base-100">
                      <span className="font-black text-[10px] text-error">
                        {formatTime(rec.pm_out)}
                      </span>
                    </td>
                    <td className="text-center py-4">
                      <span className="font-black text-[10px] text-primary">
                        {formatTime(rec.ot_in)}
                      </span>
                    </td>
                    <td className="text-center py-4">
                      <span className="font-black text-[10px] text-primary">
                        {formatTime(rec.ot_out)}
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
