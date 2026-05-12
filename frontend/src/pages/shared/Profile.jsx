import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  User, Mail, Shield, Briefcase, Building2, MapPin, 
  Calendar, Wallet, Heart, Plane, Camera, Fingerprint 
} from 'lucide-react';
import api from '../../api/axios';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';

const Profile = () => {
  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('employees/me/').then(res => res.data)
  });

  if (isLoading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );

  const workstation = me?.school_details;
  const pos = {
    lat: workstation?.latitude ? parseFloat(workstation.latitude) : 13.9408,
    lng: workstation?.longitude ? parseFloat(workstation.longitude) : 121.6210
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Premium Profile Header */}
      <div className="relative bg-base-100 rounded-[3rem] shadow-2xl border border-base-300 overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-primary via-secondary to-accent opacity-90" />
        <div className="px-8 pb-8 -mt-20 flex flex-col md:flex-row items-end gap-6 relative z-10">
          <div className="p-2 bg-white rounded-[2.5rem] shadow-2xl">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-base-200 rounded-[2rem] flex items-center justify-center border-4 border-white overflow-hidden relative group">
              <User size={80} className="text-base-300 group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <Camera className="text-white w-8 h-8" />
              </div>
            </div>
          </div>
          <div className="flex-1 pb-4">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-base-content">
                {me?.first_name} {me?.last_name}
              </h1>
              <span className="badge badge-primary badge-lg font-black rounded-xl uppercase tracking-widest text-[10px] px-4 py-4">
                {me?.user_details?.role}
              </span>
            </div>
            <p className="text-lg font-medium opacity-50 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> {me?.position} • {me?.department}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Account & Personal Info */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="card bg-base-100 border border-base-300 shadow-xl rounded-[2.5rem] p-8 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-30 flex items-center gap-2">
                <Fingerprint className="w-4 h-4" /> Personnel Credentials
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-base-200 rounded-2xl"><User className="w-5 h-5 opacity-40" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-40">Username</p>
                    <p className="font-bold">{me?.user_details?.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-base-200 rounded-2xl"><Mail className="w-5 h-5 opacity-40" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-40">Email Address</p>
                    <p className="font-bold">{me?.user_details?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-base-200 rounded-2xl"><Shield className="w-5 h-5 opacity-40" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-40">System Privilege</p>
                    <p className="font-bold">{me?.user_details?.role}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="card bg-base-100 border border-base-300 shadow-xl rounded-[2.5rem] p-8 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-30 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Service Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-base-200 rounded-2xl"><Calendar className="w-5 h-5 opacity-40" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-40">Date Hired</p>
                    <p className="font-bold">{me?.date_hired}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-base-200 rounded-2xl"><Wallet className="w-5 h-5 opacity-40" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-40">Monthly Salary</p>
                    <p className="font-bold">₱{parseFloat(me?.salary || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-base-200 rounded-2xl"><MapPin className="w-5 h-5 opacity-40" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-40">Current Station</p>
                    <p className="font-bold">{workstation?.name || 'Unassigned'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Credits / Leave Balances */}
          <div className="card bg-base-100 border border-base-300 shadow-xl rounded-[2.5rem] p-8">
            <h3 className="text-xs font-black uppercase tracking-widest opacity-30 mb-8">Leave Balances & Service Credits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-success/5 rounded-3xl border border-success/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-success text-white rounded-2xl shadow-lg shadow-success/20">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-success">{me?.sick_leave_balance || 0}</h4>
                    <p className="text-[10px] font-black uppercase opacity-50">Sick Leave Balance</p>
                  </div>
                </div>
                <div className="radial-progress text-success/20" style={{"--value": (me?.sick_leave_balance/15)*100, "--size": "3rem"}} role="progressbar">
                  <span className="text-[10px] font-black text-success">{(me?.sick_leave_balance/15*100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="p-6 bg-info/5 rounded-3xl border border-info/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-info text-white rounded-2xl shadow-lg shadow-info/20">
                    <Plane className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-info">{me?.vacation_leave_balance || 0}</h4>
                    <p className="text-[10px] font-black uppercase opacity-50">Vacation Leave Balance</p>
                  </div>
                </div>
                <div className="radial-progress text-info/20" style={{"--value": (me?.vacation_leave_balance/15)*100, "--size": "3rem"}} role="progressbar">
                   <span className="text-[10px] font-black text-info">{(me?.vacation_leave_balance/15*100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar: Location & Workstation */}
        <div className="space-y-8">
          <div className="card bg-base-100 border border-base-300 shadow-xl rounded-[2.5rem] overflow-hidden flex flex-col h-full">
            <div className="p-8 border-b border-base-200">
               <h3 className="text-xs font-black uppercase tracking-widest opacity-30 mb-2">Workstation Map</h3>
               <p className="text-sm font-bold">{workstation?.name || 'No assigned school'}</p>
            </div>
            <div className="flex-1 min-h-[300px] z-0">
               <MapContainer 
                 key={`${pos.lat}-${pos.lng}`}
                 center={[pos.lat, pos.lng]} 
                 zoom={16} 
                 style={{ height: '100%', width: '100%' }}
                 zoomControl={false}
                 scrollWheelZoom={false}
                 dragging={false}
               >
                 <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                 <Circle center={[pos.lat, pos.lng]} radius={100} pathOptions={{ color: 'primary', fillColor: 'primary' }} />
                 <Marker position={[pos.lat, pos.lng]} />
               </MapContainer>
            </div>
            <div className="p-6 bg-base-200/50 flex items-center gap-3">
               <MapPin className="text-primary w-5 h-5" />
               <span className="text-[10px] font-black uppercase opacity-50 tracking-tighter">
                 {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)} • Authorized Zone
               </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
