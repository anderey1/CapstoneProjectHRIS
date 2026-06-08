import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
import { MapPin } from 'lucide-react';
import AttendanceMap from '../../components/features/attendance/AttendanceMap';

/**
 * Location Tracking Page (Geospatial View)
 * 
 * Dedicated full-page view for staff check-in locations.
 */
const LocationTracking = () => {
  const center = [13.9408, 121.6210]; // Lucena City Center

  const { data: records, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE],
    queryFn: async () => {
      const res = await api.get('attendance/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  if (isLoading) return (
    <div className="p-8 flex justify-center h-[60vh] items-center">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">Location Tracking</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">Geospatial visualization of staff check-ins</p>
        </div>
      </div>

      {/* Full Screen Map Container */}
      <AttendanceMap 
        records={records} 
        center={center} 
        height="700px"
      />
    </div>
  );
};

export default LocationTracking;
