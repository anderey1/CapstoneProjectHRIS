import React from 'react';
import { Signature, Loader2, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';

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
                width="240"
                height="96"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <p className="text-xs text-slate-600 font-medium text-center">No digital signature uploaded</p>
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
                className="btn min-h-11 bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded-lg text-sm font-medium w-full shadow-sm"
              >
                {me?.e_signature ? 'Update Signature' : 'Upload Signature'}
              </button>
              <p className="text-xs text-slate-600 text-center">PNG or JPG with clean signature on white background</p>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <p className="text-xs font-semibold text-slate-700">
                {me?.e_signature ? 'Official Signature on File' : 'No Signature Registered'}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">Signature upload is restricted to the account owner</p>
            </div>
          )}
        </div>
      </div>

      {/* Assigned Work Location */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col z-0">
        <div className="p-4 border-b border-slate-100 bg-white">
          <span className="text-xs font-medium text-slate-600 block">Assigned Workstation</span>
          <h3 className="text-sm font-bold text-slate-800 mt-0.5">{workstation?.name || 'No workstation recorded'}</h3>
        </div>
        {pos ? <><div className="h-60 z-0 relative">
          <MapContainer 
            key={`${pos.lat}-${pos.lng}`}
            center={[pos.lat, pos.lng]} 
            zoom={15} 
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            zoomControl={false}
            scrollWheelZoom={false}
            dragging={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
            <Marker position={[pos.lat, pos.lng]} />
          </MapContainer>
        </div>
        <div className="p-3 bg-slate-50 flex items-center gap-2 border-t border-slate-200">
          <MapPin className="text-[#0038A8] w-4 h-4 shrink-0" />
          <span className="text-xs tabular-nums text-slate-600">
            {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)} • Assigned school location
          </span>
        </div></> : <p className="p-4 text-sm text-slate-600">{workstation ? 'No map coordinates recorded for this workstation.' : 'Contact HR if your school assignment is missing.'}</p>}
      </div>
    </div>
  );
};

export default ProfileSidebar;
