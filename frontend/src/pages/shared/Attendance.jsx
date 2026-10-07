import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MapPin, CheckCircle2, AlertTriangle, 
  Clock, History, ShieldCheck
} from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';

// Helper to format HH:MM:SS string to 12-hour AM/PM format
const formatTime = (timeStr, fallback = '--:--') => {
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

// Helper to calculate distance in meters via Haversine formula
const haversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371000 * c;
};

/**
 * Attendance Recording - Core HRIS Implementation
 * Civil Service Form 48 terminal with strict Haversine geofence validation.
 */
const Attendance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentPos, setCurrentPos] = useState(null);
  const [geoStatus, setGeoStatus] = useState(() => (typeof navigator !== 'undefined' && !navigator.geolocation ? 'unavailable' : 'locating'));
  const [message, setMessage] = useState(null);
  const [showOtConfirm, setShowOtConfirm] = useState(false);

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
  const distanceMeters = currentPos && workstation?.latitude && workstation?.longitude
    ? haversineDistanceMeters(
        currentPos.lat,
        currentPos.lng,
        parseFloat(workstation.latitude),
        parseFloat(workstation.longitude)
      )
    : null;
  const allowedRadius = workstation?.radius_meters || 100;
  const isWithinGeofence = distanceMeters != null ? distanceMeters <= allowedRadius : null;

  // 4. GPS Tracking (requires real coordinates, no dummy Lucena fallback)
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('unavailable');
      return;
    }

    setGeoStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setGeoStatus('ready');
      },
      (err) => {
        console.error(err);
        setGeoStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    requestLocation();
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
      if (err.response?.data?.requires_ot_confirmation) {
        setShowOtConfirm(true);
      } else {
        setMessage({ 
          type: 'error', 
          text: err.response?.data?.detail || 'Attendance check-in failed.' 
        });
        setTimeout(() => setMessage(null), 5000);
      }
    }
  });

  const handleClockIn = () => {
    if (!currentPos) {
      setMessage({
        type: 'error',
        text: 'Device GPS required. Please enable location permissions and retry.'
      });
      return;
    }

    checkInMutation.mutate({
      qr_token: qrData?.token || 'standard_web_log',
      lat: currentPos.lat,
      lng: currentPos.lng,
      accuracy: currentPos.accuracy || 0
    });
  };

  const isPunchDisabled = checkInMutation.isPending || !currentPos || geoStatus !== 'ready' || isWithinGeofence === false;

  const getButtonLabel = () => {
    if (checkInMutation.isPending) return 'Recording Official Log...';
    if (geoStatus === 'locating') return 'Acquiring GPS Position...';
    if (geoStatus === 'denied') return 'GPS Permission Required';
    if (geoStatus === 'unavailable') return 'Geolocation Unavailable';
    if (isWithinGeofence === false) return `Outside Boundary (${Math.round(distanceMeters)}m away)`;
    return 'Record Attendance Stamp (Form 48)';
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      
      {/* 1. Institutional Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center text-[#0038A8]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                Daily Time Record Check-In Station
              </h1>
              <p className="text-xs text-slate-500">
                Civil Service Commission Form No. 48 Official Attendance Terminal
              </p>
            </div>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Station Assignment</p>
          <p className="text-xs font-semibold text-slate-800">{workstation?.name || 'Division Office of Lucena City'}</p>
        </div>
      </div>

      {/* 2. Utilitarian Digital Clock-in Terminal */}
      <div className="bg-white border border-slate-300 rounded-lg shadow-sm p-6 text-center space-y-4">
        <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono tabular-nums text-slate-700">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
            Official Attendance Punch Terminal
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Record your time-stamp for morning/afternoon arrival or departure.
          </p>
        </div>

        <div className="pt-2">
          <button 
            onClick={handleClockIn}
            disabled={isPunchDisabled}
            className="w-full max-w-sm mx-auto px-6 py-3 bg-[#0038A8] hover:bg-[#002d86] text-white text-xs font-semibold uppercase tracking-wider rounded border border-[#002d86] shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            <Clock className="w-4 h-4" />
            {getButtonLabel()}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs pt-1">
          {geoStatus === 'locating' && (
            <div className="flex items-center gap-2 text-slate-500">
              <span className="loading loading-spinner loading-xs text-[#0038A8]"></span>
              <span>Acquiring device GPS coordinates...</span>
            </div>
          )}

          {geoStatus === 'ready' && isWithinGeofence === true && (
            <div className="flex flex-wrap items-center justify-center gap-2 text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Within station boundary ({Math.round(distanceMeters)}m from {workstation?.name || 'workstation'})</span>
              {currentPos?.accuracy != null && (
                <span className="text-[10px] bg-emerald-100/70 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                  ±{Math.round(currentPos.accuracy)}m accuracy
                </span>
              )}
            </div>
          )}

          {geoStatus === 'ready' && isWithinGeofence === false && (
            <div className="flex flex-wrap items-center justify-center gap-2 text-rose-700 font-semibold bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Outside station boundary: {Math.round(distanceMeters)}m away (limit: {allowedRadius}m)</span>
              {currentPos?.accuracy != null && (
                <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-mono">
                  ±{Math.round(currentPos.accuracy)}m accuracy
                </span>
              )}
            </div>
          )}

          {geoStatus === 'denied' && (
            <div className="flex items-center gap-2 text-rose-700 font-semibold">
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>Location permission denied. GPS access required.</span>
              <button 
                type="button" 
                onClick={requestLocation} 
                className="underline text-xs text-[#0038A8] ml-1 font-bold cursor-pointer"
              >
                Retry
              </button>
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

      {showOtConfirm && (
        <div className="alert alert-warning rounded-xl text-white font-bold shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Your regular workday is already completed. Do you want to log Overtime (OT)?</span>
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end">
            <button 
              onClick={() => {
                setShowOtConfirm(false);
              }}
              className="btn btn-sm btn-ghost text-white font-bold"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                setShowOtConfirm(false);
                if (!currentPos) return;
                checkInMutation.mutate({
                  qr_token: qrData?.token || 'standard_web_log',
                  lat: currentPos.lat,
                  lng: currentPos.lng,
                  accuracy: currentPos.accuracy || 0,
                  is_ot: true
                });
              }}
              className="btn btn-sm btn-active bg-white text-warning font-black uppercase border-none rounded-lg"
            >
              Yes, Log OT
            </button>
          </div>
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
                        <span className="text-success font-black text-[10px] tracking-tight">{formatTime(rec.am_in)}</span>
                        <span className="text-error font-black text-[10px] tracking-tight">{formatTime(rec.am_out)}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex flex-col">
                        <span className="text-success font-black text-[10px] tracking-tight">{formatTime(rec.pm_in)}</span>
                        <span className="text-error font-black text-[10px] tracking-tight">{formatTime(rec.pm_out)}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex flex-col">
                        <span className="text-primary font-black text-[10px] tracking-tight">{formatTime(rec.ot_in)}</span>
                        <span className="text-primary font-black text-[10px] tracking-tight">{formatTime(rec.ot_out)}</span>
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
