import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { School, MapPin } from 'lucide-react';

// Custom icons using standard SVG to avoid Vite asset resolution bugs and ensure premium styling
const schoolIcon = L.divIcon({
  html: `<div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-white shadow-lg text-white">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-school"><path d="M12 22v-4h4v4"/><path d="M22 10v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10"/><path d="m22 10-10-8L2 10"/><path d="M6 14v4"/><path d="M10 14v4"/><path d="M14 14v4"/><path d="M18 14v4"/></svg>
         </div>`,
  className: 'custom-school-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const activeSchoolIcon = L.divIcon({
  html: `<div class="w-9 h-9 bg-accent rounded-full flex items-center justify-center border-2 border-white shadow-xl text-accent-content animate-bounce">
           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-school"><path d="M12 22v-4h4v4"/><path d="M22 10v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10"/><path d="m22 10-10-8L2 10"/><path d="M6 14v4"/><path d="M10 14v4"/><path d="M14 14v4"/><path d="M18 14v4"/></svg>
         </div>`,
  className: 'custom-active-school-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

const tempMarkerIcon = L.divIcon({
  html: `<div class="w-8 h-8 bg-warning rounded-full flex items-center justify-center border-2 border-white shadow-lg text-warning-content animate-pulse">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
         </div>`,
  className: 'custom-temp-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Component to dynamically pan and zoom the map
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 15, { animate: true, duration: 1 });
    }
  }, [center, map, zoom]);
  return null;
}

// Component to capture map clicks and send them to the parent component
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}

const SchoolMap = ({
  schools,
  selectedSchool,
  onSelectSchool,
  mapCenter,
  mapZoom,
  tempMarker,
  onMapClick,
  onEdit,
  onDelete
}) => {
  return (
    <MapContainer 
      center={mapCenter} 
      zoom={mapZoom} 
      scrollWheelZoom={true} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ChangeMapView center={mapCenter} zoom={mapZoom} />
      <MapClickHandler onMapClick={onMapClick} />

      {/* Render Existing Schools */}
      {schools.map((school) => {
        const lat = parseFloat(school.latitude);
        const lng = parseFloat(school.longitude);
        const isSelected = selectedSchool && selectedSchool.id === school.id;
        
        return (
          <React.Fragment key={school.id}>
            <Marker 
              position={[lat, lng]} 
              icon={isSelected ? activeSchoolIcon : schoolIcon}
              eventHandlers={{
                click: () => onSelectSchool(school)
              }}
            >
              <Popup>
                <div className="p-2 space-y-2 min-w-[200px]">
                  <div className="flex items-center gap-1.5 font-black uppercase tracking-tight text-base-content border-b pb-1 text-xs">
                    <School className="w-3.5 h-3.5 text-primary" />
                    <span>{school.name}</span>
                  </div>
                  <div className="text-[10px] font-bold text-base-content/60 space-y-1">
                    <p>Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}</p>
                    <p>Geofence Radius: {school.radius_meters} meters</p>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      onClick={() => onEdit(school)}
                      className="btn btn-xs btn-ghost text-primary uppercase text-[9px] font-bold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(school.id, school.name)}
                      className="btn btn-xs btn-ghost text-error uppercase text-[9px] font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
            
            {/* Geofence boundary circle visualizer */}
            <Circle 
              center={[lat, lng]} 
              radius={school.radius_meters} 
              pathOptions={{ 
                color: isSelected ? '#10b981' : '#4f46e5', 
                fillColor: isSelected ? '#10b981' : '#4f46e5', 
                fillOpacity: isSelected ? 0.25 : 0.12,
                weight: isSelected ? 3 : 1.5
              }} 
            />
          </React.Fragment>
        );
      })}

      {/* Render Temporary/Pending Pin */}
      {tempMarker && (
        <>
          <Marker position={tempMarker} icon={tempMarkerIcon} />
          <Circle 
            center={tempMarker} 
            radius={100} 
            pathOptions={{ color: '#eab308', fillColor: '#eab308', fillOpacity: 0.1, dashArray: '5, 5' }} 
          />
        </>
      )}
    </MapContainer>
  );
};

export default SchoolMap;
