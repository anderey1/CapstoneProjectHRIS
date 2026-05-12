import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { 
  User, Wallet, CalendarCheck, Clock, Award, ChevronRight, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const EmployeeDashboard = () => {
  // Fetch Current Employee Profile
  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('employees/me/').then(res => res.data)
  });

  // Fetch Recent Attendance
  const { data: attendance } = useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE],
    queryFn: () => api.get('attendance/').then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        return data.slice(0, 5); // Just recent 5
    })
  });

  // Fetch Active Loans
  const { data: loans } = useQuery({
    queryKey: [QUERY_KEYS.LOANS],
    queryFn: () => api.get('loans/').then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        return data.filter(l => l.status === 'approved');
    })
  });

  if (meLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-br from-primary to-secondary p-8 md:p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="z-10">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-2">
            Mabuhay, {me?.first_name}!
          </h1>
          <p className="text-white/70 font-medium text-lg uppercase tracking-widest">
            {me?.position} • {me?.department}
          </p>
          <div className="flex gap-4 mt-8">
             <Link to="/attendance" className="btn btn-white bg-white text-primary border-none rounded-2xl font-black px-6 shadow-xl hover:scale-105 transition-transform">
                Quick Check-In
             </Link>
             <Link to="/leave" className="btn btn-ghost bg-white/10 text-white rounded-2xl font-black px-6 hover:bg-white/20">
                Apply Leave
             </Link>
          </div>
        </div>
        <div className="hidden lg:block absolute -right-20 -bottom-20 opacity-10">
            <User size={400} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Leave Balances */}
        <div className="lg:col-span-2 space-y-6">
           <h2 className="text-xl font-black flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              Service Credits & Balances
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card bg-base-100 border border-base-300 shadow-xl rounded-[2.5rem] p-8 group hover:border-success/30 transition-all">
                 <p className="text-xs font-black uppercase opacity-40 mb-1">Sick Leave Remaining</p>
                 <div className="flex items-end gap-2 mb-4">
                    <h3 className="text-5xl font-black text-success">{me?.sick_leave_balance || 0}</h3>
                    <span className="text-sm font-bold opacity-30 mb-2 uppercase">Days</span>
                 </div>
                 <progress className="progress progress-success w-full h-3 rounded-full" value={me?.sick_leave_balance} max="15"></progress>
              </div>
              <div className="card bg-base-100 border border-base-300 shadow-xl rounded-[2.5rem] p-8 group hover:border-info/30 transition-all">
                 <p className="text-xs font-black uppercase opacity-40 mb-1">Vacation Leave Remaining</p>
                 <div className="flex items-end gap-2 mb-4">
                    <h3 className="text-5xl font-black text-info">{me?.vacation_leave_balance || 0}</h3>
                    <span className="text-sm font-bold opacity-30 mb-2 uppercase">Days</span>
                 </div>
                 <progress className="progress progress-info w-full h-3 rounded-full" value={me?.vacation_leave_balance} max="15"></progress>
              </div>
           </div>

           {/* Recent Activity */}
           <div className="card bg-base-100 border border-base-300 shadow-xl rounded-[2.5rem] overflow-hidden">
              <div className="p-6 border-b border-base-200 flex justify-between items-center">
                 <h3 className="font-black">Recent Attendance</h3>
                 <Link to="/attendance" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                    View Logs <ArrowRight className="w-3 h-3" />
                 </Link>
              </div>
              <div className="p-0">
                 <table className="table table-zebra w-full">
                    <tbody>
                       {attendance?.map(rec => (
                          <tr key={rec.id} className="hover:bg-base-200/50">
                             <td className="px-6 py-4 font-bold">{rec.date}</td>
                             <td className="px-6 py-4">
                                <span className={`badge badge-sm font-bold uppercase ${
                                   rec.is_geo_flagged 
                                      ? 'badge-error text-white px-2 py-2' 
                                      : rec.status === 'present' 
                                         ? 'badge-success text-white' 
                                         : 'badge-warning'
                                }`}>
                                   {rec.is_geo_flagged ? 'FLAGGED' : rec.status}
                                </span>
                             </td>
                             <td className="px-6 py-4 text-right opacity-50 font-mono text-xs">{rec.time_in || '--:--'}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        {/* Side Cards: Loans & Performance */}
        <div className="space-y-6">
           <h2 className="text-xl font-black flex items-center gap-2">
              <Wallet className="w-6 h-6 text-secondary" />
              Financials & IPCRF
           </h2>

           {/* Loan Summary */}
           <div className="card bg-neutral text-neutral-content rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                 <p className="text-[10px] font-black uppercase opacity-50 tracking-widest mb-6">Active Provident Loans</p>
                 {loans?.length > 0 ? (
                    <div>
                       <h3 className="text-3xl font-black mb-1">₱{parseFloat(loans[0].loan_amount).toLocaleString()}</h3>
                       <p className="text-xs opacity-60 mb-6">Current active amortization</p>
                       <Link to="/loans" className="btn btn-sm btn-outline border-white/20 text-white rounded-xl">Manage Loans</Link>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       <p className="text-sm font-medium opacity-70">No active loans found. Need financial assistance?</p>
                       <Link to="/loans" className="btn btn-sm btn-white bg-white text-neutral border-none rounded-xl">Apply Now</Link>
                    </div>
                 )}
              </div>
              <Wallet className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
           </div>

           {/* IPCRF Quick Access */}
           <div className="card bg-base-100 border border-base-300 shadow-xl rounded-[2.5rem] p-8 hover:border-primary/30 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                    <Award className="w-6 h-6" />
                 </div>
                 <ChevronRight className="w-5 h-5 opacity-20" />
              </div>
              <h3 className="font-black text-lg mb-1">Performance Ratings</h3>
              <p className="text-xs opacity-50 font-medium mb-6">View your official IPCRF forms and promotion eligibility.</p>
              <Link to="/performance" className="text-sm font-black text-primary flex items-center gap-2">
                 Open Portfolio <ArrowRight className="w-4 h-4" />
              </Link>
           </div>
        </div>

      </div>
    </div>
  );
};

export default EmployeeDashboard;
