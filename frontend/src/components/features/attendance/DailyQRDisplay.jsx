import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';
import { Clock, RefreshCw, ShieldCheck } from 'lucide-react';

/**
 * Daily QR Display Component
 * 
 * Shows the unique token for the current day to be scanned by employees.
 */
const DailyQRDisplay = () => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['daily-qr'],
    queryFn: () => api.get('attendance/get_daily_qr/').then(res => res.data),
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-8 bg-base-100 rounded-xl border border-base-200">
      <span className="loading loading-spinner loading-md text-primary" />
      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-4">Generating Daily Token...</p>
    </div>
  );

  return (
    <div className="bg-white border border-base-200 rounded-xl shadow-sm p-8 flex flex-col items-center text-center space-y-6">
      <div className="flex flex-col items-center space-y-2">
        <h3 className="text-xs font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Daily Attendance QR
        </h3>
        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
          Ask staff to scan this at the entrance
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border-4 border-primary/10 shadow-inner relative group">
        <QRCodeSVG 
          value={data?.token || ''} 
          size={200} 
          level="H" 
          includeMargin={true}
          className="rounded-lg"
        />
        <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm rounded-xl">
           <button onClick={() => refetch()} className="btn btn-circle btn-ghost text-primary">
              <RefreshCw className={`w-8 h-8 ${isRefetching ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>

      <div className="space-y-3 w-full">
        <div className="bg-base-50 p-3 rounded-lg border border-base-100 flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Active Token</span>
            <code className="text-xs font-black text-primary tracking-tighter">{data?.token}</code>
        </div>
        <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-30">
           <ShieldCheck className="w-3 h-3 text-success" /> Security Seed: {data?.date}
        </div>
      </div>
    </div>
  );
};

export default DailyQRDisplay;
