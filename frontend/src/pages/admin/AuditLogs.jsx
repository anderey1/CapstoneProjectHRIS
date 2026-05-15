import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { Activity, Clock, User, ShieldAlert, Search, ShieldCheck } from 'lucide-react';

/**
 * System Logs (Audit Logs)
 * 
 * Simple, professional redesign for tracking administrative actions.
 */
const AuditLogs = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.AUDIT_LOGS || 'audit-logs'],
    queryFn: async () => {
      const res = await api.get('audit-logs/');
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
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">System Logs</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">History of all activities</p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-base-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr className="bg-base-50/50 border-b border-base-200 uppercase text-[10px] tracking-widest font-black opacity-50">
                <th className="px-6 py-4 text-primary">Timestamp</th>
                <th className="px-6 py-4">Staff Member</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4 text-right">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-100">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-base-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold text-[11px] text-base-content">
                        <Clock className="w-3.5 h-3.5 opacity-30" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center text-[10px] font-black border border-primary/5">
                          {log.user_name?.charAt(0) || 'S'}
                        </div>
                        <span className="font-black text-xs uppercase tracking-tight text-base-content">{log.user_name || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-xs font-medium leading-relaxed opacity-70 line-clamp-1">{log.action}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="px-2 py-0.5 rounded bg-base-100 text-[10px] font-black opacity-40">#{log.id.toString().padStart(5, '0')}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-40 opacity-30 italic font-black text-lg uppercase tracking-widest">
                     No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
