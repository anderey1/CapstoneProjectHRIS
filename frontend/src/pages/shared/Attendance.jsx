import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MapPin, Navigation, CheckCircle2, AlertTriangle, 
  Clock, History, Camera, ShieldCheck, Loader2, X 
} from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { calculateDistance } from '../../utils/haversine';
import { loadFaceModels, extractFaceDescriptor, isFaceMatch } from '../../utils/faceAuth';

/**
 * Attendance Recording with Biometric Verification
 * 
 * Triple-factor authentication:
 * 1. Time (Daily Session Token)
 * 2. Location (Geo-fencing within school radius)
 * 3. Identity (Face-API.js local recognition)
 */
const Attendance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentPos, setCurrentPos] = useState(null);
  const [geoStatus, setGeoStatus] = useState('locating'); // locating, ready, denied
  const [message, setMessage] = useState(null);
  
  // QR & Face Verification State
  const [showScanner, setShowScanner] = useState(false);
  const [showFaceAuth, setShowFaceAuth] = useState(false);
  const [faceStatus, setFaceStatus] = useState('idle'); // idle, loading, ready, verifying, success, fail
  const videoRef = useRef(null);

  // 1. Fetch User Profile (for workstation coordinates and face descriptor)
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

  // ... (keep history and GPS logic)

  // 5. Check-In Mutation
  const checkInMutation = useMutation({
    mutationFn: (data) => api.post('attendance/scan/', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE] });
      setMessage({ 
        type: res.data.is_geo_flagged ? 'warning' : 'success', 
        text: res.data.message 
      });
      setShowFaceAuth(false);
      setShowScanner(false);
      setTimeout(() => setMessage(null), 5000);
    },
    onError: (err) => {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.detail || 'Attendance check-in failed.' 
      });
      setFaceStatus('fail');
      setTimeout(() => setMessage(null), 5000);
    }
  });

  const handleStartQRScan = () => {
    setShowScanner(true);
  };

  const handleQRDetected = () => {
    // Mocking a successful scan
    setShowScanner(false);
    handleStartAuth();
  };

  const handleStartAuth = async () => {
    if (!qrData?.token) {
      alert("Unable to verify daily session. Please try again.");
      return;
    }

    if (!me?.face_descriptor) {
      alert("Please enroll your face in the Profile page first before checking in.");
      return;
    }
    
    setShowFaceAuth(true);
    setFaceStatus('loading');

    const loaded = await loadFaceModels();
    if (!loaded) {
      alert("Failed to load biometric engine.");
      setShowFaceAuth(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setFaceStatus('ready');
      }
    } catch (err) {
      console.error(err);
      alert("Camera access denied.");
      setShowFaceAuth(false);
    }
  };

  const handleVerifyAndSubmit = async () => {
    if (!videoRef.current) return;
    setFaceStatus('verifying');

    const currentDescriptor = await extractFaceDescriptor(videoRef.current);
    
    // Stop camera
    const stream = videoRef.current.srcObject;
    stream.getTracks().forEach(track => track.stop());

    if (!currentDescriptor) {
      alert("Face not detected. Look directly at camera.");
      setFaceStatus('ready');
      // Restart camera
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      videoRef.current.srcObject = newStream;
      return;
    }

    const savedDescriptor = JSON.parse(me.face_descriptor);
    const isMatch = isFaceMatch(currentDescriptor, savedDescriptor);

    if (isMatch) {
      setFaceStatus('success');
      // Proceed to submission
      checkInMutation.mutate({
        qr_token: qrData.token,
        lat: currentPos.lat,
        lng: currentPos.lng
      });
    } else {
      setFaceStatus('fail');
      alert("Identity verification failed. Account owner must be the one checking in.");
      setShowFaceAuth(false);
    }
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
        <div className="p-6 md:p-8 flex flex-col items-center text-center space-y-4">
          
          {/* Radar Animation */}
          <div className="relative">
            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center z-10 relative bg-white border-2 shadow-md ${isInRange ? 'border-success text-success' : 'border-base-300 text-base-content/20'}`}>
              <Navigation className={`w-8 h-8 md:w-10 md:h-10 ${isInRange ? 'animate-pulse' : ''}`} />
            </div>
            {isInRange && (
              <div className="absolute top-0 left-0 w-20 h-20 md:w-24 md:h-24 rounded-full bg-success/20 animate-ping"></div>
            )}
          </div>

          <div>
            <h2 className="text-lg md:text-xl font-black uppercase">
              {geoStatus === 'locating' ? 'Finding you...' : (isInRange ? 'At Work' : 'Outside Office')}
            </h2>
            <p className="text-[10px] md:text-xs opacity-50 font-semibold uppercase tracking-widest mt-1">
              {distance ? `${Math.round(distance)} meters from office` : 'Checking your location...'}
            </p>
          </div>

          <button 
            onClick={handleStartQRScan}
            disabled={geoStatus !== 'ready' || checkInMutation.isPending}
            className={`btn btn-md md:btn-lg w-full max-w-xs rounded-xl shadow-lg border-none text-white ${isInRange ? 'btn-success' : 'btn-neutral'}`}
          >
            {checkInMutation.isPending ? <span className="loading loading-spinner" /> : (isInRange ? 'Scan School QR' : 'Record (Outside)')}
          </button>

          <div className="flex items-center gap-2 text-[9px] font-black uppercase opacity-40">
             <ShieldCheck className="w-3 h-3 text-success" /> Identity + Geo + Time Verification Active
          </div>

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

      {/* 4. QR Scanner Modal (Mock) */}
      {showScanner && (
        <div className="modal modal-open">
          <div className="modal-box p-0 rounded-2xl overflow-hidden max-w-sm bg-black border border-white/10 shadow-2xl">
            <div className="relative aspect-square flex items-center justify-center bg-zinc-900">
               <div className="w-64 h-64 border-2 border-primary/40 rounded-3xl flex items-center justify-center relative">
                  <div className="absolute inset-0 border-4 border-primary rounded-3xl animate-pulse opacity-20"></div>
                  <Camera className="w-12 h-12 text-primary opacity-20" />
                  
                  {/* Scanning Line Animation */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_rgba(79,70,229,0.8)] animate-[scan_2s_linear_infinite]"></div>
               </div>
               
               <div className="absolute bottom-8 left-0 w-full text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Align QR Code within frame</p>
               </div>
            </div>

            <div className="p-8 bg-white flex flex-col gap-6">
               <div className="text-center space-y-1">
                  <h3 className="text-base font-black uppercase tracking-tight text-base-content">QR Attendance Scanner</h3>
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Scanning for school terminal...</p>
               </div>
               
               <button onClick={handleQRDetected} className="btn btn-primary w-full rounded-xl uppercase font-black text-xs h-16 shadow-lg shadow-primary/20">
                  Simulate QR Detect
               </button>
               
               <button onClick={() => setShowScanner(false)} className="btn btn-ghost btn-sm text-[10px] font-black uppercase tracking-widest">
                  Cancel
               </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Face Auth Modal */}
      {showFaceAuth && (
        <div className="modal modal-open">
          <div className="modal-box p-0 rounded-2xl overflow-hidden max-w-sm bg-black border border-white/10 shadow-2xl">
             <div className="relative aspect-square">
                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
                
                {/* Overlays */}
                <div className="absolute inset-0 border-[40px] border-black/60 pointer-events-none flex items-center justify-center">
                   <div className="w-full h-full border-2 border-primary/50 rounded-full" />
                </div>

                {faceStatus === 'loading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-4">
                     <Loader2 className="w-10 h-10 animate-spin text-primary" />
                     <p className="text-[10px] font-black uppercase tracking-widest">Biometric Init...</p>
                  </div>
                )}

                {faceStatus === 'verifying' && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary/20 backdrop-blur-sm text-white">
                      <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-black uppercase tracking-widest mt-4">Verifying Identity...</p>
                   </div>
                )}

                {faceStatus === 'success' && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-success text-white">
                      <CheckCircle2 className="w-20 h-20 animate-bounce" />
                      <p className="text-sm font-black uppercase tracking-widest mt-4">Identity Confirmed</p>
                   </div>
                )}
             </div>

             <div className="p-8 bg-white flex flex-col gap-6">
                <div className="text-center space-y-1">
                   <h3 className="text-base font-black uppercase tracking-tight text-base-content">Facial Authentication</h3>
                   <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Look directly at camera to verify</p>
                </div>
                
                {faceStatus === 'ready' && (
                   <button onClick={handleVerifyAndSubmit} className="btn btn-primary w-full rounded-xl uppercase font-black text-xs h-16 shadow-lg shadow-primary/20">
                      Verify Face
                   </button>
                )}
                
                <button 
                  onClick={() => {
                    if (videoRef.current?.srcObject) {
                      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
                    }
                    setShowFaceAuth(false);
                  }} 
                  className="btn btn-ghost btn-sm text-[10px] font-black uppercase tracking-widest"
                >
                  Cancel
                </button>
             </div>
          </div>
        </div>
      )}

      {/* 5. Recent History Table */}
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
                <th>Time In</th>
                <th>Time Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-100">
              {historyLoading ? (
                <tr><td colSpan="4" className="text-center py-20"><span className="loading loading-spinner text-primary" /></td></tr>
              ) : records?.length > 0 ? (
                records.slice(0, 5).map(rec => (
                  <tr key={rec.id} className="hover:bg-base-50/50 transition-colors">
                    <td className="font-bold text-xs px-6">{rec.date}</td>
                    <td className="text-success font-black text-[11px] tracking-tight">{rec.time_in?.substring(0, 5) || '--:--'}</td>
                    <td className="text-error font-black text-[11px] tracking-tight">{rec.time_out?.substring(0, 5) || '--:--'}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${rec.is_geo_flagged ? 'bg-error/10 text-error' : (rec.status === 'present' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}`}>
                        {rec.is_geo_flagged ? 'Flagged' : rec.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="text-center py-20 opacity-30 italic font-bold uppercase text-[10px] tracking-widest">No attendance history</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Attendance;
