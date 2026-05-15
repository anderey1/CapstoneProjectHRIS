import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

/**
 * Attendance Map & QR (Station View)
 * 
 * Simple, professional redesign for monitoring check-in locations.
 */
const AttendanceMap = ({ records, qrData, center }) => {
  return (
    <div className="space-y-6">
      {/* Location Map */}
      <div className="bg-white border border-base-200 rounded-xl overflow-hidden p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="text-[11px] font-black uppercase tracking-widest opacity-40">Staff Locations</h3>
        </div>
        <div className="h-[300px] rounded-lg border border-base-100 overflow-hidden z-0 shadow-inner">
          <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {records?.filter(r => r.latitude && r.longitude).map((rec) => (
              <Marker key={rec.id} position={[rec.latitude, rec.longitude]}>
                <Popup>
                  <div className="text-center p-2 space-y-1">
                    <p className="text-xs font-black uppercase tracking-tight text-base-content">{rec.employee_name}</p>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${rec.is_geo_flagged ? 'text-error' : 'text-success'}`}>
                      {rec.is_geo_flagged ? 'Outside' : 'Present'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Station Auth Token */}
      <div className="bg-white border border-base-200 rounded-xl p-6 shadow-sm flex items-center gap-6">
        <div className="bg-white p-3 rounded-lg border border-base-100 shadow-sm">
          <QRCodeCanvas value={qrData?.token || 'N/A'} size={100} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-base-content/30 uppercase tracking-widest">
             <QrCode className="w-3.5 h-3.5" />
             Station Code
          </div>
          <p className="text-3xl font-black text-primary tracking-tight font-mono">{qrData?.token || '---'}</p>
          <p className="text-[10px] font-black opacity-30 uppercase tracking-widest leading-relaxed">
             Staff scan this code at the station to log their daily records.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceMap;
