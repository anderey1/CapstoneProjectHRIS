import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  User, Mail, Shield, Briefcase, Building2, MapPin, 
  Calendar, Wallet, Heart, Plane, Camera, Fingerprint,
  UserCircle
} from 'lucide-react';
import api from '../../api/axios';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';

/**
 * My Profile Page
 * 
 * Simple, professional redesign for viewing personal and work details.
 */
const Profile = () => {
  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('employees/me/').then(res => res.data)
  });

  if (isLoading) return (
    <div className="p-8 flex justify-center h-[60vh] items-center">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );

  const workstation = me?.school_details;
  const pos = {
    lat: workstation?.latitude ? parseFloat(workstation.latitude) : 13.9408,
    lng: workstation?.longitude ? parseFloat(workstation.longitude) : 121.6210
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header / Profile Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-base-200 overflow-hidden">
        <div className="h-32 bg-primary/10 relative">
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/20 to-transparent"></div>
        </div>
        <div className="px-8 pb-8 -mt-12 flex flex-col md:flex-row items-end gap-6 relative z-10">
          <div className="p-1.5 bg-white rounded-xl shadow-lg border border-base-100">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-base-100 rounded-lg flex items-center justify-center border border-base-200 overflow-hidden relative group">
              <UserCircle size={60} className="text-primary opacity-20" />
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <Camera className="text-primary w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="flex-1 pb-2">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">
                {me?.first_name} {me?.last_name}
              </h1>
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-primary/10">
                {me?.user_details?.role}
              </div>
            </div>
            <p className="text-xs font-bold opacity-40 uppercase tracking-widest flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5" /> {me?.position} • {me?.department}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Info Area */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Account Info */}
            <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-primary" /> Personal Info
              </h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-base-50 rounded-lg border border-base-100 flex items-center justify-center"><User className="w-4 h-4 opacity-30" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-0.5">Username</p>
                    <p className="text-sm font-bold text-base-content">{me?.user_details?.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-base-50 rounded-lg border border-base-100 flex items-center justify-center"><Mail className="w-4 h-4 opacity-30" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-0.5">Email</p>
                    <p className="text-sm font-bold text-base-content">{me?.user_details?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Info */}
            <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Work Info
              </h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-base-50 rounded-lg border border-base-100 flex items-center justify-center"><Calendar className="w-4 h-4 opacity-30" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-0.5">Joined</p>
                    <p className="text-sm font-bold text-base-content">{new Date(me?.date_hired).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-base-50 rounded-lg border border-base-100 flex items-center justify-center"><Wallet className="w-4 h-4 opacity-30" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-0.5">Monthly Pay</p>
                    <p className="text-sm font-bold text-primary">₱{parseFloat(me?.salary || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leave Summary */}
          <div className="bg-white border border-base-200 shadow-sm rounded-xl p-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-8">Leave Balances</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-base-50 rounded-xl border border-base-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-success/10 text-success rounded-lg flex items-center justify-center border border-success/10">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-base-content">{me?.sick_leave_balance || 0}</h4>
                    <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">Sick Leave</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-base-50 rounded-xl border border-base-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center border border-primary/10">
                    <Plane className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-base-content">{me?.vacation_leave_balance || 0}</h4>
                    <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">Vacation Leave</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar: Map */}
        <div className="space-y-8 h-full">
          <div className="bg-white border border-base-200 shadow-sm rounded-xl overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="p-6 border-b border-base-100">
               <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-1">Work Location</h3>
               <p className="text-xs font-black uppercase tracking-tight text-primary">{workstation?.name || 'Home Office'}</p>
            </div>
            <div className="flex-1 min-h-[200px] z-0">
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
            <div className="p-6 bg-base-50/50 flex items-center gap-3">
               <MapPin className="text-primary w-4 h-4" />
               <span className="text-[9px] font-black uppercase opacity-40 tracking-tighter">
                 {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)} • Office Boundary
               </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
