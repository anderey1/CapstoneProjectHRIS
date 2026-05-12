import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import {
  Users, Wallet, CalendarCheck, AlertCircle, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';

const COLORS = ['#4f46e5', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6'];

const Dashboard = () => {
  // Fetch Data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_STATS],
    queryFn: () => api.get('dashboard/').then(res => res.data)
  });

  const { data: deptData, isLoading: deptLoading } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.DEPARTMENT],
    queryFn: () => api.get('charts/department/').then(res => res.data)
  });

  const { data: loanData, isLoading: loanLoading } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.LOAN_STATUS],
    queryFn: () => api.get('charts/loan-status/').then(res => res.data)
  });

  const { data: attData, isLoading: attLoading } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.ATTENDANCE_TRENDS],
    queryFn: () => api.get('charts/attendance-trends/').then(res => res.data)
  });

  const { data: aiSummary, isLoading: aiLoading } = useQuery({
    queryKey: [QUERY_KEYS.AI_SUMMARY],
    queryFn: () => api.get('dashboard/summary/').then(res => res.data)
  });

  const isLoading = statsLoading || deptLoading || loanLoading || attLoading;

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Format data for Recharts
  const formattedLoanData = loanData?.map(item => ({
    name: item.status.toUpperCase(),
    value: item.count
  })) || [];

  const formattedDeptData = deptData?.map(item => ({
    name: item.department || 'Unassigned',
    count: item.count
  })) || [];

  const formattedAttData = attData?.map(item => ({
    name: item.status.toUpperCase(),
    count: item.count
  })) || [];

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      {/* Header & AI Insights */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        <div className="flex-1 flex flex-col justify-center gap-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Overview
          </h1>
          <p className="text-sm opacity-60 font-medium max-w-md">
            Real-time analytics and human resource metrics for DepEd Lucena City Division.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="card bg-base-100 shadow-xl border border-base-300 hover:border-primary transition-colors">
          <div className="card-body p-6 flex-row items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest font-bold opacity-40">Total Employees</p>
              <h2 className="text-3xl font-black">{stats?.total_employees || 0}</h2>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-300 hover:border-secondary transition-colors">
          <div className="card-body p-6 flex-row items-center gap-4">
            <div className="p-4 bg-secondary/10 rounded-2xl text-secondary">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest font-bold opacity-40">Total Loans</p>
              <h2 className="text-3xl font-black">{stats?.total_loans || 0}</h2>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-300 hover:border-accent transition-colors">
          <div className="card-body p-6 flex-row items-center gap-4">
            <div className="p-4 bg-accent/10 rounded-2xl text-accent">
              <CalendarCheck className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest font-bold opacity-40">Approved Loans</p>
              <h2 className="text-3xl font-black">{stats?.approved_loans || 0}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Department Distribution (Bar) */}
        <div className="card bg-base-100 shadow-xl border border-base-300 xl:col-span-2">
          <div className="card-body p-6">
            <h3 className="font-bold text-lg mb-4">Department Distribution</h3>
            <div className="h-[300px] w-full">
              {formattedDeptData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedDeptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} opacity={0.5} />
                    <YAxis tick={{ fontSize: 12 }} opacity={0.5} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center opacity-40 text-sm">No department data available</div>
              )}
            </div>
          </div>
        </div>

        {/* Loan Status (Pie) */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body p-6">
            <h3 className="font-bold text-lg mb-4">Loan Status</h3>
            <div className="h-[300px] w-full">
              {formattedLoanData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formattedLoanData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {formattedLoanData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center opacity-40 text-sm">No loan data available</div>
              )}
            </div>
            {/* Custom Legend */}
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {formattedLoanData.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-xs font-bold opacity-70">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  {item.name} ({item.value})
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Attendance Trends (Area) */}
        <div className="card bg-base-100 shadow-xl border border-base-300 xl:col-span-3">
          <div className="card-body p-6">
            <h3 className="font-bold text-lg mb-4">Attendance Status Overview</h3>
            <div className="h-[300px] w-full">
              {formattedAttData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={formattedAttData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} opacity={0.5} />
                    <YAxis tick={{ fontSize: 12 }} opacity={0.5} />
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center opacity-40 text-sm">No attendance data available</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
