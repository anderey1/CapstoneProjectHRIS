import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { Activity, Clock, User, ShieldAlert, Search } from 'lucide-react';

const AuditLogs = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.AUDIT_LOGS || 'audit-logs'],
    queryFn: async () => {
      const res = await api.get('audit-logs/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  });

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-base-content flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-primary" />
            System Audit Logs
          </h1>
          <p className="text-sm opacity-50 font-medium mt-1">Traceable history of all administrative and personnel activities.</p>
        </div>
      </div>

      <div className="bg-base-100 rounded-[2.5rem] shadow-xl border border-base-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200/50 text-[10px] font-black uppercase tracking-[0.2em] opacity-50">
                <th className="px-8 py-6">Timestamp</th>
                <th className="px-8 py-6">User</th>
                <th className="px-8 py-6">Action Performed</th>
                <th className="px-8 py-6">Reference ID</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="4" className="text-center py-20"><span className="loading loading-spinner text-primary loading-lg"></span></td></tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-base-200/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Clock className="w-4 h-4 opacity-30" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
                          {log.user_name?.charAt(0) || 'S'}
                        </div>
                        <span className="font-black text-sm">{log.user_name || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <p className="text-sm font-medium leading-relaxed max-w-xl">{log.action}</p>
                    </td>
                    <td className="px-8 py-5">
                       <span className="badge badge-sm font-bold bg-base-200 border-none">#{log.id.toString().padStart(5, '0')}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-40 opacity-30 italic font-black text-2xl uppercase tracking-widest">
                     No audit records found
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
