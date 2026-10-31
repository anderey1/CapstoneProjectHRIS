import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  Shield,
  Calendar,
} from 'lucide-react';
import RoleBadge from '../../components/common/RoleBadge';

/**
 * Maps raw audit action descriptions to authoritative institutional modules.
 */
function resolveAuditModule(action = '') {
  const text = action.toLowerCase();
  if (text.includes('leave') || text.includes('form 6')) {
    return { name: 'CSC Form 6 (Leave)', badge: 'bg-blue-50 text-[#0038A8] border-blue-200' };
  }
  if (text.includes('attendance') || text.includes('dtr') || text.includes('clock')) {
    return { name: 'CSC Form 48 (DTR)', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  }
  if (text.includes('rating') || text.includes('ipcrf') || text.includes('performance')) {
    return { name: 'RPMS / IPCRF', badge: 'bg-purple-50 text-purple-800 border-purple-200' };
  }
  if (text.includes('payroll') || text.includes('salary') || text.includes('voucher')) {
    return { name: 'Division Payroll', badge: 'bg-amber-50 text-amber-800 border-amber-200' };
  }
  if (text.includes('loan') || text.includes('provident')) {
    return { name: 'Provident Fund', badge: 'bg-teal-50 text-teal-800 border-teal-200' };
  }
  if (text.includes('employee') || text.includes('plantilla') || text.includes('registration') || text.includes('onboard')) {
    return { name: 'Personnel (201)', badge: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
  }
  if (text.includes('delete') || text.includes('removed') || text.includes('reject')) {
    return { name: 'Access / Moderation', badge: 'bg-red-50 text-red-800 border-red-200' };
  }
  return { name: 'System / Security', badge: 'bg-slate-100 text-slate-700 border-slate-200' };
}

/**
 * Division Security & Activity Audit Trail
 * Conforming to Data Privacy Act of 2012 (RA 10173) & DepEd Institutional Security Standards.
 */
const AuditLogs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState('ALL');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.AUDIT_LOGS || 'audit-logs'],
    queryFn: async () => {
      const res = await api.get('audit-logs/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    const now = new Date();

    return logs.filter((log) => {
      const moduleInfo = resolveAuditModule(log.action);

      // Search Query Filter
      const matchesSearch =
        !searchQuery ||
        log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.id?.toString().includes(searchQuery) ||
        moduleInfo.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Module Filter
      const matchesModule =
        selectedModule === 'ALL' || moduleInfo.name === selectedModule;

      // Date Range Filter
      let matchesDate = true;
      if (selectedDateRange !== 'ALL' && log.timestamp) {
        const logDate = new Date(log.timestamp);
        const diffMs = now - logDate;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (selectedDateRange === '24H') {
          matchesDate = diffHours <= 24;
        } else if (selectedDateRange === '7D') {
          matchesDate = diffHours <= 24 * 7;
        } else if (selectedDateRange === '30D') {
          matchesDate = diffHours <= 24 * 30;
        }
      }

      return matchesSearch && matchesModule && matchesDate;
    });
  }, [logs, searchQuery, selectedModule, selectedDateRange]);

  // Operational Metrics
  const metrics = useMemo(() => {
    const uniqueActors = new Set();
    let past24Hours = 0;
    let criticalActions = 0;
    const now = new Date();

    logs.forEach((l) => {
      if (l.user_name) uniqueActors.add(l.user_name);
      if (l.timestamp) {
        const diffHours = (now - new Date(l.timestamp)) / (1000 * 60 * 60);
        if (diffHours <= 24) past24Hours += 1;
      }
      const act = (l.action || '').toLowerCase();
      if (act.includes('delete') || act.includes('reject') || act.includes('cancel')) {
        criticalActions += 1;
      }
    });

    return {
      total: logs.length,
      operators: uniqueActors.size,
      recent: past24Hours,
      critical: criticalActions,
    };
  }, [logs]);

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col justify-center h-[60vh] items-center space-y-3">
        <span className="loading loading-spinner loading-lg text-[#0038A8]"></span>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Loading Security Audit Trail...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* DepEd Institutional Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
            Department of Education • SDO Lucena City • Administrative Security
          </span>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center text-[#0038A8]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Division Security &amp; Activity Trail
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Immutable Audit Trail • Republic Act No. 10173 (Data Privacy Act of 2012) Compliance
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-time Audit Active
          </span>
        </div>
      </div>

      {/* 4-Metric Status Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Event Logs
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {metrics.total}
            </span>
            <span className="text-xs text-slate-500">entries</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">Retained in database</span>
        </div>

        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Active System Actors
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#0038A8]">
              {metrics.operators}
            </span>
            <span className="text-xs text-slate-500">personnel</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">Division accounts</span>
        </div>

        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Activity in Past 24 Hours
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              {metrics.recent}
            </span>
            <span className="text-xs text-slate-500">events</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">Recent system operations</span>
        </div>

        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Deletions / Modifications
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-700">
              {metrics.critical}
            </span>
            <span className="text-xs text-slate-500">actions</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">Tracked mutation actions</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-300 rounded-lg p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search actor, action text, or reference ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0038A8] focus:border-[#0038A8]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Module Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0038A8]"
            >
              <option value="ALL">All System Modules</option>
              <option value="CSC Form 6 (Leave)">CSC Form 6 (Leave)</option>
              <option value="CSC Form 48 (DTR)">CSC Form 48 (DTR)</option>
              <option value="RPMS / IPCRF">RPMS / IPCRF</option>
              <option value="Division Payroll">Division Payroll</option>
              <option value="Provident Fund">Provident Fund</option>
              <option value="Personnel (201)">Personnel (201-File)</option>
              <option value="Access / Moderation">Access / Moderation</option>
              <option value="System / Security">System / Security</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0038A8]"
            >
              <option value="ALL">All Time</option>
              <option value="24H">Past 24 Hours</option>
              <option value="7D">Past 7 Days</option>
              <option value="30D">Past 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dense Government Audit Table */}
      <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">Timestamp</th>
                <th className="py-3 px-4 font-bold">Actor Personnel</th>
                <th className="py-3 px-3 font-bold">Target Module</th>
                <th className="py-3 px-4 font-bold">Action Performed</th>
                <th className="py-3 px-4 font-bold text-right">Audit Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const moduleInfo = resolveAuditModule(log.action);
                  const logDate = log.timestamp ? new Date(log.timestamp) : null;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Monospace Tabular Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono tabular-nums text-slate-800 text-xs">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{logDate ? logDate.toLocaleDateString() : '—'}</span>
                          <span className="text-slate-500">
                            {logDate ? logDate.toLocaleTimeString() : ''}
                          </span>
                        </div>
                      </td>

                      {/* Actor Personnel + Role */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-xs">
                            {log.user_name || 'System / Batch Task'}
                          </span>
                          {log.user_role && (
                            <RoleBadge role={log.user_role} size="xs" />
                          )}
                        </div>
                      </td>

                      {/* Target Module */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border font-medium ${moduleInfo.badge}`}
                        >
                          {moduleInfo.name}
                        </span>
                      </td>

                      {/* Action Description */}
                      <td className="py-3 px-4">
                        <span className="text-slate-800 text-xs font-normal leading-relaxed block break-words">
                          {log.action}
                        </span>
                      </td>

                      {/* Monospace Reference ID */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-mono tabular-nums text-[11px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          #AUD-{log.id.toString().padStart(6, '0')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-xs text-slate-500">
                    <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No security audit records found matching the specified parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Audit Ledger Information */}
        <div className="bg-slate-50 border-t border-slate-300 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-600">
          <span>
            Displaying <strong className="font-semibold text-slate-800">{filteredLogs.length}</strong> of{' '}
            <strong className="font-semibold text-slate-800">{logs.length}</strong> system audit records
          </span>
          <span className="font-mono text-slate-500">DepEd SDO Lucena City System Security Trail</span>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
