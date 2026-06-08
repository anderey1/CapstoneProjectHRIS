import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin } from 'lucide-react';

/**
 * Attendance Map (Geospatial View)
 * 
 * Flexible map component for visualizing staff check-in locations.
 */
const AttendanceMap = ({ records, center, height = "500px" }) => {
  return (
    <div className="w-full rounded-xl overflow-hidden z-0" style={{ height }}>
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {records?.filter(r => r.latitude && r.longitude).map((rec) => (
          <Marker key={rec.id} position={[rec.latitude, rec.longitude]}>
            <Popup>
              <div className="text-center p-2 space-y-1">
                <p className="text-xs font-black uppercase tracking-tight text-base-content">{rec.employee_name}</p>
                <p className={`text-[9px] font-black uppercase tracking-widest ${rec.is_geo_flagged ? 'text-error' : 'text-success'}`}>
                  {rec.is_geo_flagged ? 'Outside' : 'Present'}
                </p>
                <p className="text-[8px] font-bold opacity-40">{rec.date}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default AttendanceMap;
