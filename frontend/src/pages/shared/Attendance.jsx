import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, Scan, AlertTriangle, CheckCircle2, MapPin } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { calculateDistance } from '../../utils/haversine';

// Fix for default marker icons
let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

/**
 * Attendance Component
 * 
 * Provides an interface for employees to perform geo-validated check-ins.
 * Visualizes the scan result and recent history.
 */
const Attendance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [currentPos, setCurrentPos] = useState(null);
  const [geoPermission, setGeoPermission] = useState('prompt'); // prompt, granted, denied

  // Fetch Me profile for workstation coordinates
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('employees/me/').then(res => res.data)
  });

  const workstation = me?.school_details;
  const OFFICE_POS = { 
    lat: workstation?.latitude ? parseFloat(workstation.latitude) : 13.9408, 
    lng: workstation?.longitude ? parseFloat(workstation.longitude) : 121.6210 
  };
  const RADIUS = workstation?.radius_meters || 100;

  // Track user location and permission
  React.useEffect(() => {
    // Check permission status
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((status) => {
        setGeoPermission(status.state);
        status.onchange = () => setGeoPermission(status.state);
      });
    }

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoPermission('granted');
      },
      (err) => {
        if (err.code === 1) setGeoPermission('denied');
      },
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  const requestPermission = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
         setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
         setGeoPermission('granted');
      },
      (err) => {
         if (err.code === 1) setGeoPermission('denied');
      }
    );
  };

  const dist = currentPos ? calculateDistance(currentPos.lat, currentPos.lng, OFFICE_POS.lat, OFFICE_POS.lng) : null;
  const isInRange = dist !== null && dist <= RADIUS;
  const { data: qrData } = useQuery({
    queryKey: ['daily-qr'],
    queryFn: async () => {
      const res = await api.get('attendance/get_daily_qr/');
      return res.data;
    },
  });

  // Fetch Attendance History
  const { data: records, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE],
    queryFn: async () => {
      const response = await api.get('attendance/');
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    },
  });

  // Scan Mutation
  const scanMutation = useMutation({
    mutationFn: (data) => api.post('attendance/scan/', data),
    onMutate: (vars) => {
      console.log("Scaning with:", vars);
    },
    onSuccess: (res) => {
      console.log("Scan success:", res.data);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE] });
      setIsScanning(false);
      const flagText = res.data.is_geo_flagged ? " (FLAGGED: Outside Range)" : " (Validated)";
      setMessage(`${res.data.message} - ${res.data.distance}m away${flagText}`);
      setTimeout(() => setMessage(''), 5000);
    },
    onError: (err) => {
      console.error("Scan error:", err.response?.data);
      setIsScanning(false);
      setMessage(err.response?.data?.detail || 'Error: Unable to capture location or unauthorized.');
      setTimeout(() => setMessage(''), 5000);
    }
  });

  const handleScan = () => {
    if (!qrData?.token) {
        setMessage('Unable to fetch daily QR code. Please try again.');
        return;
    }

    if (!isInRange) {
        const proceed = window.confirm('You are currently OUTSIDE the authorized perimeter. Scanning now will FLAG your attendance as "Out of Range". Proceed anyway?');
        if (!proceed) return;
    }

    setIsScanning(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        scanMutation.mutate({
          qr_token: qrData.token, // Use server token
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        setIsScanning(false);
        setMessage('Location access denied. Please enable GPS.');
      }
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Permission Request Banner */}
      {geoPermission !== 'granted' && (
        <div className={`alert ${geoPermission === 'denied' ? 'alert-error' : 'alert-info'} rounded-[2rem] shadow-xl border-none text-white py-6 px-8 flex flex-col md:flex-row items-center justify-between gap-6`}>
           <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl">
                 <MapPin className="w-8 h-8" />
              </div>
              <div>
                 <h3 className="text-xl font-black">{geoPermission === 'denied' ? 'Location Access Denied' : 'Location Permission Required'}</h3>
                 <p className="text-sm opacity-80 font-medium">
                    {geoPermission === 'denied' 
                      ? 'Please enable location services in your browser settings to allow geo-validated attendance.' 
                      : 'The system needs your GPS location to verify you are at the authorized DepEd workstation.'}
                 </p>
              </div>
           </div>
           {geoPermission === 'prompt' && (
              <button onClick={requestPermission} className="btn btn-white bg-white text-info border-none rounded-xl font-black px-10">Grant Access</button>
           )}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-base-content flex items-center gap-3">
            <CalendarCheck className="w-8 h-8 text-accent" />
            Daily Attendance
          </h1>
          <p className="text-sm opacity-50 font-medium mt-1">Show this QR code to HR or use the button to mock a scan.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleScan} 
            disabled={isScanning || scanMutation.isPending}
            className="btn btn-primary btn-lg rounded-2xl shadow-xl shadow-primary/20 px-8"
          >
            {isScanning ? <span className="loading loading-spinner" /> : <><Scan className="w-6 h-6" /> Perform Geo-Scan</>}
          </button>
          
          <button 
            onClick={() => {
              if (!qrData?.token) return;
              scanMutation.mutate({
                qr_token: qrData.token,
                lat: OFFICE_POS.lat,
                lng: OFFICE_POS.lng
              });
            }} 
            disabled={isScanning || scanMutation.isPending}
            className="btn btn-ghost btn-xs opacity-30 hover:opacity-100 transition-opacity"
          >
            [Mock: Inside]
          </button>
          <button 
            onClick={() => {
              if (!qrData?.token) return;
              scanMutation.mutate({
                qr_token: qrData.token,
                lat: 14.5995, // Manila
                lng: 120.9842
              });
            }} 
            disabled={isScanning || scanMutation.isPending}
            className="btn btn-ghost btn-xs opacity-30 hover:opacity-100 transition-opacity text-error"
          >
            [Mock: Outside]
          </button>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="flex flex-col items-center justify-center p-8 bg-base-100 rounded-3xl shadow-xl border border-base-300">
        <p className="text-xs uppercase tracking-widest font-bold opacity-40 mb-4 text-center">Your Personnel QR Code</p>
        <div className="p-4 bg-white rounded-2xl">
          {qrData?.token ? (
            <QRCodeCanvas value={qrData.token} size={200} level="H" />
          ) : (
            <div className="w-[200px] h-[200px] flex items-center justify-center bg-base-200 rounded-xl">
               <span className="loading loading-spinner loading-lg opacity-20" />
            </div>
          )}
        </div>
        <p className="mt-4 font-mono text-[10px] opacity-30">{qrData?.token || 'FETCHING TOKEN...'}</p>
      </div>

      {message && (
        <div className={`alert ${
          message.toLowerCase().includes('failed') || 
          message.toLowerCase().includes('error') || 
          message.toLowerCase().includes('invalid') ||
          message.toLowerCase().includes('wait') ||
          message.toLowerCase().includes('already')
            ? 'alert-error' 
            : 'alert-success'
        } rounded-2xl shadow-lg border-none text-white animate-in slide-in-from-top duration-300`}>
          {message.toLowerCase().includes('success') ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          <span className="font-bold">{message}</span>
        </div>
      )}

      {/* Stats and Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 card bg-base-100 shadow-xl border border-base-300 overflow-hidden">
          <div className={`p-4 text-center font-black text-xs uppercase tracking-widest ${isInRange ? 'bg-success text-white' : 'bg-error text-white'}`}>
             {isInRange ? 'Authorized Zone: IN RANGE' : 'Authorized Zone: OUT OF RANGE'}
          </div>
          <div className="card-body">
            <h2 className="card-title text-sm uppercase opacity-50 tracking-widest">Current Location</h2>
            <div className="flex items-center gap-4 mt-2">
              <div className={`p-4 rounded-2xl ${isInRange ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                <MapPin className="w-8 h-8" />
              </div>
              <div>
                <p className="font-black text-xl leading-tight">{isInRange ? 'DepEd Lucena Office' : 'Outside Perimeter'}</p>
                <p className="text-[10px] opacity-50 font-bold uppercase">{dist ? `${Math.round(dist)}m from center` : 'Locating...'}</p>
              </div>
            </div>
            {!isInRange && (
               <div className="mt-4 p-3 bg-error/5 border border-error/10 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-error mt-0.5" />
                  <p className="text-[10px] font-bold text-error leading-tight uppercase">
                     Attendance will be flagged if you scan outside the 100m authorized circle.
                  </p>
               </div>
            )}
            <div className="mt-4 pt-4 border-t border-base-200">
               <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black opacity-30 uppercase">GPS Signal</span>
                  <div className="flex items-center gap-1.5">
                     <div className={`w-1.5 h-1.5 rounded-full ${currentPos ? 'bg-success animate-pulse' : 'bg-warning'}`}></div>
                     <span className="text-[10px] font-bold uppercase">{currentPos ? 'Stable' : 'Searching...'}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 h-[300px] bg-base-100 rounded-3xl overflow-hidden shadow-xl border border-base-300 z-0">
          <MapContainer 
            key={`${OFFICE_POS.lat}-${OFFICE_POS.lng}`}
            center={[OFFICE_POS.lat, OFFICE_POS.lng]} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Site Geofence */}
            <Circle 
              center={[OFFICE_POS.lat, OFFICE_POS.lng]} 
              radius={RADIUS} 
              pathOptions={{ color: 'accent', fillColor: 'accent', fillOpacity: 0.2 }} 
            />
            <Marker position={[OFFICE_POS.lat, OFFICE_POS.lng]}>
              <Popup>Authorized Zone: {workstation?.name || 'Your Workstation'}</Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-base-100 rounded-3xl p-6 shadow-sm border border-base-300">
        <h2 className="font-bold text-lg mb-6">Recent Records</h2>
        {isLoading ? (
          <div className="flex justify-center p-8"><span className="loading loading-dots loading-lg" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="opacity-50">
                  <th>Date</th>
                  <th>Status</th>
                  <th>GPS Status</th>
                </tr>
              </thead>
              <tbody>
                {records?.map(rec => (
                  <tr key={rec.id} className="hover:bg-base-200/50">
                    <td className="font-medium">{rec.date}</td>
                    <td>
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
                    <td>
                      {rec.is_geo_flagged 
                        ? <span className="text-error font-black text-[10px] flex items-center gap-1 uppercase tracking-tighter"><AlertTriangle className="w-3 h-3" /> Out of Range</span> 
                        : <span className="text-success font-black text-[10px] flex items-center gap-1 uppercase tracking-tighter"><CheckCircle2 className="w-3 h-3" /> Validated</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
