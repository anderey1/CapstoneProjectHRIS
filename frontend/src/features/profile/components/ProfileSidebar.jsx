import React from 'react';
import { Signature, Loader2, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';

const ProfileSidebar = ({ 
  me, 
  sigInputRef, 
  onSigUpload, 
  isUploadingSig, 
  canUploadSignature = false,
  workstation, 
  pos 
}) => {
  return (
    <div className="space-y-4">
      {/* E-Signature Overlay */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3.5 shadow-sm">
        <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
          <Signature className="w-4 h-4 text-[#0038A8]" />
          <h3 className="text-xs font-bold text-slate-800">Digital Signature (DepEd Form 48)</h3>
        </div>
        
        <div className="space-y-3">
          <div className="h-28 w-full bg-slate-50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center p-2 relative group overflow-hidden">
            {me?.e_signature ? (
              <img 
                src={me.e_signature} 
                alt="Digital Signature" 
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <p className="text-xs text-slate-400 font-medium text-center">No digital signature uploaded</p>
            )}
            {isUploadingSig && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#0038A8]" />
              </div>
            )}
          </div>

          {canUploadSignature ? (
            <div className="space-y-1.5">
              <input 
                type="file" 
                ref={sigInputRef}
                onChange={onSigUpload}
                accept="image/*"
                className="hidden"
              />
              <button 
                type="button"
                onClick={() => sigInputRef.current?.click()}
                disabled={isUploadingSig}
                className="btn btn-sm bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded-lg text-xs font-medium w-full h-9 shadow-sm"
              >
                {me?.e_signature ? 'Update Signature' : 'Upload Signature'}
              </button>
              <p className="text-[11px] text-slate-400 text-center">PNG or JPG with clean signature on white background</p>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <p className="text-xs font-semibold text-slate-700">
                {me?.e_signature ? 'Official Signature on File' : 'No Signature Registered'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Signature upload is restricted to the account owner</p>
            </div>
          )}
        </div>
      </div>

      {/* Work Location Geofence Map */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col min-h-[360px] shadow-sm z-0">
        <div className="p-4 border-b border-slate-100 bg-white">
          <span className="text-xs font-medium text-slate-400 block">Assigned Workstation</span>
          <h3 className="text-sm font-bold text-slate-800 mt-0.5">{workstation?.name || 'Lucena Division Office'}</h3>
        </div>
        <div className="flex-1 min-h-[200px] z-0 relative">
          <MapContainer 
            key={`${pos.lat}-${pos.lng}`}
            center={[pos.lat, pos.lng]} 
            zoom={15} 
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            zoomControl={false}
            scrollWheelZoom={false}
            dragging={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Circle center={[pos.lat, pos.lng]} radius={100} pathOptions={{ color: '#0038A8', fillColor: '#0038A8' }} />
            <Marker position={[pos.lat, pos.lng]} />
          </MapContainer>
        </div>
        <div className="p-3 bg-slate-50 flex items-center gap-2 border-t border-slate-200">
          <MapPin className="text-[#0038A8] w-4 h-4 shrink-0" />
          <span className="text-xs font-mono text-slate-500">
            {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)} • Geofenced (100m)
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;
