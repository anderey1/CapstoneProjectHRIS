import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
import { MapPin, CheckCircle, XCircle, FileDown, CalendarCheck, Search, Filter, AlertTriangle, Users } from 'lucide-react';
import { exportToCSV } from '../../utils/export';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

import { QRCodeCanvas } from 'qrcode.react';

const AttendanceManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  
  const center = [13.9408, 121.6210]; // Lucena City Center

  const { data: records, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE],
    queryFn: async () => {
      const res = await api.get('attendance/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const { data: qrData } = useQuery({
    queryKey: ['daily-qr'],
    queryFn: async () => {
      const res = await api.get('attendance/get_daily_qr/');
      return res.data;
    },
    refetchInterval: 60000,
  });

  const calculateDuration = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return '---';
    const start = new Date(`1970-01-01T${timeIn}`);
    const end = new Date(`1970-01-01T${timeOut}`);
    const diff = (end - start) / 1000 / 60;
    const hours = Math.floor(diff / 60);
    const mins = Math.floor(diff % 60);
    return `${hours}h ${mins}m`;
  };

  const filteredRecords = records?.filter(rec => {
    const matchesSearch = (rec.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All' || rec.department === deptFilter;
    const matchesFlag = !flaggedOnly || rec.is_geo_flagged;
    return matchesSearch && matchesDept && matchesFlag;
  });

  const stats = {
    total: filteredRecords?.length || 0,
    flagged: filteredRecords?.filter(r => r.is_geo_flagged).length || 0,
    present: filteredRecords?.filter(r => r.status === 'present').length || 0,
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-base-content flex items-center gap-3">
            <CalendarCheck className="w-8 h-8 text-primary" />
            Personnel DTR Management
          </h1>
          <p className="text-sm opacity-50 font-medium mt-1">Review, monitor, and manage the official Daily Time Records of all personnel.</p>
        </div>

        {/* Real-time Stats */}
        <div className="flex gap-4 w-full lg:w-auto">
          <div className="bg-white border border-base-200 p-4 rounded-2xl flex-1 lg:flex-none lg:w-40 shadow-sm">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Logs</p>
             <h3 className="text-2xl font-black">{stats.total}</h3>
          </div>
          <div className="bg-white border border-base-200 p-4 rounded-2xl flex-1 lg:flex-none lg:w-40 shadow-sm">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-error">Geo-Flagged</p>
             <h3 className="text-2xl font-black text-error">{stats.flagged}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Map Column */}
        <div className="xl:col-span-1 space-y-6">
           <div className="card bg-white border border-base-300 shadow-xl rounded-3xl overflow-hidden p-6">
             <h3 className="font-bold mb-4 flex items-center gap-2">
               <MapPin className="w-5 h-5 text-primary" />
               Live Geo-Validation Map
             </h3>
             <div className="h-[300px] rounded-2xl overflow-hidden z-0 border border-base-200">
                <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Circle center={center} radius={500} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }} />
                  {filteredRecords?.filter(r => r.latitude && r.longitude).map((rec) => (
                    <Marker key={rec.id} position={[rec.latitude, rec.longitude]}>
                      <Popup>
                        <div className="text-xs">
                          <p className="font-bold">{rec.employee_name}</p>
                          <p className={rec.is_geo_flagged ? 'text-error font-bold' : 'text-success'}>
                            {rec.is_geo_flagged ? 'Geo-Flagged: OUT' : 'Verified: IN'}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
             </div>
             <div className="mt-4 p-4 bg-base-50 rounded-xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Daily Auth Token</p>
                <div className="flex items-center gap-4">
                   <div className="bg-white p-2 rounded-lg border border-base-200">
                      <QRCodeCanvas value={qrData?.token || 'LOADING'} size={60} />
                   </div>
                   <div>
                      <p className="text-lg font-mono font-black text-primary">{qrData?.token || '...'}</p>
                      <p className="text-[10px] opacity-40 font-bold uppercase tracking-tight">Personnel must scan this to log.</p>
                   </div>
                </div>
             </div>
           </div>
        </div>

        {/* DTR Table Column */}
        <div className="xl:col-span-2 space-y-6">
           <div className="card bg-white border border-base-300 shadow-xl rounded-3xl overflow-hidden">
             {/* Search and Filters */}
             <div className="p-6 border-b border-base-100 bg-base-50/50 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                  <input 
                    type="text" 
                    placeholder="Search personnel name..." 
                    className="input input-bordered w-full pl-11 bg-white rounded-xl font-medium border-base-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <select 
                  className="select select-bordered bg-white rounded-xl border-base-200 font-bold"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                >
                  <option value="All">All Departments</option>
                  <option value="Instructional">Instructional</option>
                  <option value="Administrative">Administrative</option>
                  <option value="Finance">Finance</option>
                </select>

                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-base-200 rounded-xl">
                   <input 
                    type="checkbox" 
                    className="checkbox checkbox-error checkbox-sm" 
                    checked={flaggedOnly}
                    onChange={(e) => setFlaggedOnly(e.target.checked)}
                   />
                   <span className="text-xs font-bold text-error uppercase">Flagged Only</span>
                </div>

                <button 
                  onClick={() => exportToCSV(filteredRecords, 'DTR_Report')}
                  className="btn btn-ghost bg-white border border-base-200 rounded-xl"
                >
                  <FileDown className="w-4 h-4 mr-2" /> Export
                </button>
             </div>

             {/* DTR Table */}
             <div className="overflow-x-auto">
               <table className="table w-full">
                 <thead>
                   <tr className="bg-base-100/30 text-[10px] font-black uppercase tracking-widest opacity-40">
                     <th className="py-4">Personnel</th>
                     <th>Date</th>
                     <th>Time In</th>
                     <th>Time Out</th>
                     <th>Dur.</th>
                     <th>Status</th>
                     <th className="text-center">Flag</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-base-100">
                   {isLoading ? (
                     <tr><td colSpan="7" className="text-center py-20"><span className="loading loading-spinner text-primary" /></td></tr>
                   ) : filteredRecords?.length > 0 ? (
                     filteredRecords.map(rec => (
                       <tr key={rec.id} className="hover:bg-base-50 transition-colors">
                         <td className="py-4">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-base-100 flex items-center justify-center font-bold text-primary text-xs uppercase">
                               {rec.employee_name?.charAt(0)}
                             </div>
                             <div>
                               <p className="font-bold text-sm leading-tight">{rec.employee_name}</p>
                               <p className="text-[10px] opacity-40 font-bold uppercase">{rec.department}</p>
                             </div>
                           </div>
                         </td>
                         <td className="text-xs font-medium text-gray-500">{rec.date}</td>
                         <td><span className="font-mono text-xs text-success">{rec.time_in ? rec.time_in.substring(0, 5) : '---'}</span></td>
                         <td><span className="font-mono text-xs text-error">{rec.time_out ? rec.time_out.substring(0, 5) : '---'}</span></td>
                         <td className="text-[10px] font-black opacity-40">{calculateDuration(rec.time_in, rec.time_out)}</td>
                         <td>
                           <span className={`badge badge-xs font-bold uppercase ${
                             rec.is_geo_flagged 
                               ? 'badge-error text-white px-2 py-2' 
                               : rec.status === 'present' 
                                 ? 'badge-success text-white' 
                                 : 'badge-warning'
                           }`}>
                             {rec.is_geo_flagged ? 'FLAGGED (OUT)' : rec.status}
                           </span>
                         </td>
                         <td className="text-center">
                           {rec.is_geo_flagged ? <AlertTriangle className="w-4 h-4 text-error inline" /> : <CheckCircle className="w-4 h-4 text-success inline" />}
                         </td>
                       </tr>
                     ))
                   ) : (
                     <tr><td colSpan="7" className="text-center py-20 opacity-30 italic">No records matching filters.</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;
