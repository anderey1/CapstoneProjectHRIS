import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MapPin, CheckCircle2, AlertTriangle, 
  Clock, History, ShieldCheck
} from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';

/**
 * Attendance Recording - Core HRIS Implementation
 * Simple Clock In / Out flow without Biometric or Geo-blocking (removed for pre-oral defense)
 */
const Attendance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentPos, setCurrentPos] = useState({ lat: 13.9408, lng: 121.6210 });
  const [geoStatus, setGeoStatus] = useState('locating');
  const [message, setMessage] = useState(null);

  // 1. Fetch User Profile
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('employees/me/').then(res => res.data)
  });

  // 2. Fetch Daily Token
  const { data: qrData } = useQuery({
    queryKey: ['daily-qr'],
    queryFn: () => api.get('attendance/get_daily_qr/').then(res => res.data),
    refetchInterval: 300000,
  });

  // 3. Fetch Recent Attendance History
  const { data: records, isLoading: historyLoading } = useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE],
    queryFn: () => api.get('attendance/').then(res => res.data.results || res.data)
  });

  const workstation = me?.school_details;

  // 4. GPS Tracking (for recording coordinate stamp, but no range block)
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus('ready');
      },
      (err) => {
        console.error(err);
        setGeoStatus('denied');
      },
      { enableHighAccuracy: true }
    );
  }, []);

  // 5. Check-In Mutation
  const checkInMutation = useMutation({
    mutationFn: (data) => api.post('attendance/scan/', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE] });
      setMessage({ 
        type: 'success', 
        text: res.data.message 
      });
      setTimeout(() => setMessage(null), 5000);
    },
    onError: (err) => {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.detail || 'Attendance check-in failed.' 
      });
      setTimeout(() => setMessage(null), 5000);
    }
  });

  const handleClockIn = () => {
    checkInMutation.mutate({
      qr_token: qrData?.token || 'legacy_face_only',
      lat: currentPos.lat,
      lng: currentPos.lng
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      
      {/* 1. Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            Check In / Out
          </h1>
          <p className="text-xs opacity-50 font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold opacity-40 uppercase">Station</p>
          <p className="text-sm font-bold">{workstation?.name || 'Main Office'}</p>
        </div>
      </div>

      {/* 2. Simplified Clock-in Card */}
      <div className="card border border-base-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col items-center text-center space-y-6">
          
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center bg-primary/10 text-primary border-2 border-primary/5">
            <Clock className="w-8 h-8 md:w-10 md:h-10 animate-pulse" />
          </div>

          <div>
            <h2 className="text-lg md:text-xl font-black uppercase">
              Time Clock Recorder
            </h2>
            <p className="text-[10px] md:text-xs opacity-50 font-semibold uppercase tracking-widest mt-1">
              Click the button below to submit your daily clock stamp
            </p>
          </div>

          <button 
            onClick={handleClockIn}
            disabled={checkInMutation.isPending}
            className="btn btn-primary btn-md md:btn-lg w-full max-w-xs rounded-xl shadow-lg font-black uppercase text-xs tracking-widest text-white border-none"
          >
            {checkInMutation.isPending ? (
              <span className="loading loading-spinner" />
            ) : (
              'Submit Attendance Log'
            )}
          </button>

          <div className="flex items-center gap-2 text-[9px] font-black uppercase opacity-40">
             <ShieldCheck className="w-3 h-3 text-success" /> Standard DTR Logging Active
          </div>

          {geoStatus === 'denied' && (
            <div className="text-warning text-xs font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Location services disabled (defaulting coordinates)
            </div>
          )}
        </div>
      </div>

      {/* 3. Feedback Message */}
      {message && (
        <div className={`alert rounded-xl text-white font-bold shadow-md animate-in slide-in-from-top-4 ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 4. Recent History Table */}
      <div className="bg-white border border-base-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-base-100 flex items-center gap-2 bg-base-50/50">
          <History className="w-4 h-4 opacity-40" />
          <h3 className="text-xs font-black uppercase tracking-widest opacity-60">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-lg w-full">
            <thead>
              <tr className="bg-base-50/30 text-[10px] uppercase tracking-widest opacity-40 border-b border-base-100">
                <th className="px-6 py-4">Date</th>
                <th className="text-center">AM In/Out</th>
                <th className="text-center">PM In/Out</th>
                <th className="text-center">OT In/Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-100">
              {historyLoading ? (
                <tr><td colSpan="5" className="text-center py-20"><span className="loading loading-spinner text-primary" /></td></tr>
              ) : records?.length > 0 ? (
                records.slice(0, 5).map(rec => (
                  <tr key={rec.id} className="hover:bg-base-50/50 transition-colors">
                    <td className="font-bold text-xs px-6">{rec.date}</td>
                    <td className="text-center">
                      <div className="flex flex-col">
                        <span className="text-success font-black text-[10px] tracking-tight">{rec.am_in?.substring(0, 5) || '--:--'}</span>
                        <span className="text-error font-black text-[10px] tracking-tight">{rec.am_out?.substring(0, 5) || '--:--'}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex flex-col">
                        <span className="text-success font-black text-[10px] tracking-tight">{rec.pm_in?.substring(0, 5) || '--:--'}</span>
                        <span className="text-error font-black text-[10px] tracking-tight">{rec.pm_out?.substring(0, 5) || '--:--'}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex flex-col">
                        <span className="text-primary font-black text-[10px] tracking-tight">{rec.ot_in?.substring(0, 5) || '--:--'}</span>
                        <span className="text-primary font-black text-[10px] tracking-tight">{rec.ot_out?.substring(0, 5) || '--:--'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${rec.status === 'present' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="text-center py-20 opacity-30 italic font-bold uppercase text-[10px] tracking-widest">No attendance history</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Attendance;
