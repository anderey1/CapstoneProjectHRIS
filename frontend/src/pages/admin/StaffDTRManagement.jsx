import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, AlertCircle, Calendar, Users, Search } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';

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
 * StaffDTRManagement Page
 * Dedicated administrative page for HR, Superintendent, and Admin to view
 * and export CSC Form 48 DTR records for any employee across the division.
 */
const StaffDTRManagement = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch all division employees for selection
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees_for_staff_dtr'],
    queryFn: async () => {
      const response = await api.get('employees/');
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    },
  });

  // Fetch attendance records for selected employee and month
  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE, selectedMonth, selectedEmployeeId],
    queryFn: async () => {
      const [year, month] = selectedMonth.split('-');
      const params = new URLSearchParams({ month, year });
      if (selectedEmployeeId) {
        params.append('employee_id', selectedEmployeeId);
      }
      const response = await api.get(`attendance/?${params.toString()}`);
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    },
    enabled: !!selectedEmployeeId,
  });

  const selectedEmployee = employees.find(e => String(e.id) === String(selectedEmployeeId));

  const filteredEmployees = employees.filter(emp => 
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.position || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = async (cutoff) => {
    try {
      if (!selectedEmployeeId) {
        throw new Error('Please select an employee before generating CSC Form 48.');
      }
      setDownloading(true);
      setErrorMessage('');

      const response = await api.get('attendance/dtr_pdf/', {
        params: {
          month: selectedMonth,
          cutoff,
          employee_id: selectedEmployeeId,
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
      const empName = selectedEmployee ? `${selectedEmployee.last_name}_${selectedEmployee.first_name}` : `Emp_${selectedEmployeeId}`;
      link.setAttribute('download', `DTR_${empName}_${selectedMonth}_Cutoff_${cutoff || 'Full'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
      setErrorMessage(
        error?.response?.data?.detail ||
        error?.message ||
        'Unable to generate the Form 48 PDF.'
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 border-b border-base-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-[#0038A8]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff DTR Directory</h1>
              <p className="text-xs text-slate-500">Civil Service Commission Form No. 48 Division Management & Export</p>
            </div>
          </div>
        </div>

        {/* Date Month and Export Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input input-sm input-bordered text-xs bg-white text-slate-700"
          />

          <div className="dropdown dropdown-end">
            <button
              tabIndex={0}
              disabled={!selectedEmployeeId || downloading}
              className={`btn btn-primary btn-sm bg-[#0038A8] hover:bg-[#002b80] text-white border-none rounded-md px-4 text-xs font-semibold ${downloading ? 'loading' : ''}`}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export Form 48 PDF
            </button>
            <ul tabIndex={0} className="dropdown-content z-[20] menu p-2 shadow-xl bg-base-100 border border-base-200 rounded-xl w-52 mt-2">
              <li className="menu-title font-black text-[9px] uppercase tracking-widest opacity-40">Choose Cutoff</li>
              <li><button type="button" onClick={() => handleDownload('1')} className="font-bold text-xs uppercase py-2.5">1st Cutoff (1-15)</button></li>
              <li><button type="button" onClick={() => handleDownload('2')} className="font-bold text-xs uppercase py-2.5">2nd Cutoff (16-31)</button></li>
              <li><button type="button" onClick={() => handleDownload('split')} className="font-bold text-xs uppercase py-2.5">Split (Both Cards)</button></li>
              <li><button type="button" onClick={() => handleDownload('')} className="font-bold text-xs uppercase py-2.5">Full Month</button></li>
            </ul>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-error rounded-xl shadow-sm">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Employee Selection Sidebar & DTR Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Staff Picker */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#0038A8]" /> Personnel ({filteredEmployees.length})
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-sm input-bordered w-full pl-8 text-xs bg-slate-50"
            />
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-50">
            {employeesLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading personnel list...</div>
            ) : filteredEmployees.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No personnel found</div>
            ) : (
              filteredEmployees.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setSelectedEmployeeId(emp.id)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex flex-col gap-0.5 ${
                    String(selectedEmployeeId) === String(emp.id)
                      ? 'bg-blue-50 border border-blue-200 text-[#0038A8] font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="font-semibold">{emp.first_name} {emp.last_name}</span>
                  <span className="text-[10px] text-slate-400 truncate">{emp.position || 'Staff'} • {emp.department}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Attendance Records for Selected Employee */}
        <div className="lg:col-span-3 space-y-4">
          {!selectedEmployeeId ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-16 text-center text-slate-400 space-y-3">
              <Users className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
              <p className="text-sm font-medium">Select an employee from the left panel to inspect their Daily Time Record.</p>
            </div>
          ) : recordsLoading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center text-primary">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-slate-300 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase">
                    {selectedEmployee?.first_name} {selectedEmployee?.last_name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Plantilla ID #{selectedEmployee?.id} • Period: {selectedMonth}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-[#0038A8] text-xs font-semibold rounded font-mono tabular-nums">
                  {records.length} DTR Entries Recorded
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                      <th className="px-4 py-3">Calendar Date</th>
                      <th className="px-4 py-3 text-center">A.M. Arrival</th>
                      <th className="px-4 py-3 text-center">A.M. Departure</th>
                      <th className="px-4 py-3 text-center">P.M. Arrival</th>
                      <th className="px-4 py-3 text-center">P.M. Departure</th>
                      <th className="px-4 py-3 text-center">Undertime (Mins)</th>
                      <th className="px-4 py-3 text-right">Verification Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {records.length > 0 ? (
                      records.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {row.date ? new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }) : '---'}
                          </td>
                          <td className="px-4 py-3 text-center font-mono">{formatTime(row.time_in)}</td>
                          <td className="px-4 py-3 text-center font-mono">{formatTime(row.lunch_out)}</td>
                          <td className="px-4 py-3 text-center font-mono">{formatTime(row.lunch_in)}</td>
                          <td className="px-4 py-3 text-center font-mono">{formatTime(row.time_out)}</td>
                          <td className="px-4 py-3 text-center text-slate-400 font-mono">{row.undertime_minutes ? `${row.undertime_minutes}m` : '---'}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`badge badge-xs text-[10px] font-bold uppercase ${
                              row.status === 'present' ? 'badge-success text-white' : 'badge-ghost'
                            }`}>
                              {row.status || 'present'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-12 text-slate-400 italic">
                          No attendance records found for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StaffDTRManagement;
