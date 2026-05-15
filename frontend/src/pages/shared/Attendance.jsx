import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Navigation, CheckCircle2, AlertTriangle, Clock, History } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { calculateDistance } from '../../utils/haversine';

const Attendance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentPos, setCurrentPos] = useState(null);
  const [geoStatus, setGeoStatus] = useState('locating'); // locating, ready, denied
  const [message, setMessage] = useState(null);

  // 1. Fetch User Profile (for workstation coordinates)
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('employees/me/').then(res => res.data)
  });

  // 2. Fetch Daily Token (Security layer)
  const { data: qrData } = useQuery({
    queryKey: ['daily-qr'],
    queryFn: () => api.get('attendance/get_daily_qr/').then(res => res.data),
    refetchInterval: 300000, // Refresh every 5 mins
  });

  // 3. Fetch Recent Attendance History
  const { data: records, isLoading: historyLoading } = useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE],
    queryFn: () => api.get('attendance/').then(res => res.data.results || res.data)
  });

  const workstation = me?.school_details;
  const OFFICE_POS = { 
    lat: workstation?.latitude ? parseFloat(workstation.latitude) : 13.9408, 
    lng: workstation?.longitude ? parseFloat(workstation.longitude) : 121.6210 
  };
  const RADIUS = workstation?.radius_meters || 100;

  // 4. GPS Tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }

    const watcher = navigator.geolocation.watchPosition(
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

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  const distance = currentPos ? calculateDistance(currentPos.lat, currentPos.lng, OFFICE_POS.lat, OFFICE_POS.lng) : null;
  const isInRange = distance !== null && distance <= RADIUS;

  // 5. Check-In Mutation
  const checkInMutation = useMutation({
    mutationFn: (data) => api.post('attendance/scan/', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE] });
      setMessage({ 
        type: res.data.is_geo_flagged ? 'warning' : 'success', 
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

  const handleAction = () => {
    if (!qrData?.token) {
      alert("Unable to verify daily session. Please try again.");
      return;
    }
    
    if (!isInRange) {
      const proceed = window.confirm("You are outside the station perimeter. Your attendance will be FLAGGED. Proceed?");
      if (!proceed) return;
    }

    checkInMutation.mutate({
      qr_token: qrData.token,
      lat: currentPos.lat,
      lng: currentPos.lng
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      
      {/* 1. Header & Quick Summary */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            Check In / Out
          </h1>
          <p className="text-xs opacity-50 font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold opacity-40 uppercase">Station</p>
          <p className="text-sm font-bold">{workstation?.name || 'Main Office'}</p>
        </div>
      </div>

      {/* 2. Proximity Radar Card */}
      <div className={`card border shadow-sm overflow-hidden ${isInRange ? 'border-success/20 bg-success/5' : 'border-base-300 bg-base-100'}`}>
        <div className="p-8 flex flex-col items-center text-center space-y-4">
          
          {/* Radar Animation */}
          <div className="relative">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center z-10 relative bg-white border-2 shadow-md ${isInRange ? 'border-success text-success' : 'border-base-300 text-base-content/20'}`}>
              <Navigation className={`w-10 h-10 ${isInRange ? 'animate-pulse' : ''}`} />
            </div>
            {isInRange && (
              <div className="absolute top-0 left-0 w-24 h-24 rounded-full bg-success/20 animate-ping"></div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-black uppercase">
              {geoStatus === 'locating' ? 'Finding you...' : (isInRange ? 'At Work' : 'Outside Office')}
            </h2>
            <p className="text-xs opacity-50 font-semibold uppercase tracking-widest mt-1">
              {distance ? `${Math.round(distance)} meters from office` : 'Checking your location...'}
            </p>
          </div>

          <button 
            onClick={handleAction}
            disabled={geoStatus !== 'ready' || checkInMutation.isPending}
            className={`btn btn-lg w-full max-w-xs rounded-xl shadow-lg border-none text-white ${isInRange ? 'btn-success' : 'btn-neutral opacity-50 hover:opacity-100'}`}
          >
            {checkInMutation.isPending ? <span className="loading loading-spinner" /> : (isInRange ? 'Record Attendance' : 'Record (Outside)')}
          </button>

          {geoStatus === 'denied' && (
            <div className="text-error text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> GPS Access Required
            </div>
          )}
        </div>
      </div>

      {/* 3. Feedback Message */}
      {message && (
        <div className={`alert rounded-xl text-white font-bold shadow-md animate-in slide-in-from-top-4 ${message.type === 'success' ? 'alert-success' : (message.type === 'warning' ? 'alert-warning' : 'alert-error')}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 4. Recent History Table */}
      <div className="bg-white border border-base-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-base-100 flex items-center gap-2 bg-base-50/50">
          <History className="w-4 h-4 opacity-40" />
          <h3 className="text-xs font-bold uppercase tracking-widest opacity-60">Recent Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr className="bg-base-50/30 text-[10px] uppercase opacity-40">
                <th>Date</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                <tr><td colSpan="4" className="text-center py-10"><span className="loading loading-spinner" /></td></tr>
              ) : records?.length > 0 ? (
                records.slice(0, 5).map(rec => (
                  <tr key={rec.id} className="hover:bg-base-50/50">
                    <td className="font-semibold text-xs">{rec.date}</td>
                    <td className="text-success font-mono text-[11px]">{rec.time_in?.substring(0, 5) || '--:--'}</td>
                    <td className="text-error font-mono text-[11px]">{rec.time_out?.substring(0, 5) || '--:--'}</td>
                    <td>
                      <span className={`badge badge-xs font-bold uppercase py-2 px-2 ${rec.is_geo_flagged ? 'badge-error' : (rec.status === 'present' ? 'badge-success text-white' : 'badge-warning')}`}>
                        {rec.is_geo_flagged ? 'Flagged' : rec.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="text-center py-10 opacity-30 italic text-xs">No recent logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Attendance;
