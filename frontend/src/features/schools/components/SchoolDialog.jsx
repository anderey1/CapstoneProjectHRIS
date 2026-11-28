import { useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import { Crosshair, LocateFixed, MapPin, School, Trash2, X } from 'lucide-react';
import { CircleMarker, MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import AccessibleDialog from '../../../components/common/AccessibleDialog';

const DIVISION_OFFICE = [13.937200, 121.617800];

function LocationPicker({ point, onChange }) {
  useMapEvents({ click: event => onChange([event.latlng.lat, event.latlng.lng]) });
  const schoolIcon = useMemo(() => L.divIcon({
    className: 'school-map-pin-wrapper',
    html: `<span class="school-map-pin">${renderToStaticMarkup(<School size={18} strokeWidth={2} aria-hidden="true" />)}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  }), []);
  if (!point) return null;
  return (
    <>
      <CircleMarker center={point} radius={24} pathOptions={{ stroke: false, fillColor: '#0038a8', fillOpacity: 0.16 }} />
      <Marker position={point} icon={schoolIcon} />
    </>
  );
}

export default function SchoolDialog({ school, deleting, pending, error, onClose, onSubmit }) {
  const mapRef = useRef(null);
  const mapWrapRef = useRef(null);
  const [name, setName] = useState(school?.name || '');
  const [point, setPoint] = useState(school?.latitude != null && school?.longitude != null
    ? [Number(school.latitude), Number(school.longitude)] : null);

  useEffect(() => {
    const invalidate = () => mapRef.current?.invalidateSize();
    const frameId = requestAnimationFrame(invalidate);
    const timerId = setTimeout(invalidate, 150);
    const observer = typeof ResizeObserver !== 'undefined' && mapWrapRef.current
      ? new ResizeObserver(invalidate)
      : null;
    if (observer && mapWrapRef.current) observer.observe(mapWrapRef.current);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timerId);
      observer?.disconnect();
    };
  }, []);

  const fieldErrors = error?.response?.data;
  const hasMap = !deleting;

  const handleUseCenter = () => {
    const center = mapRef.current?.getCenter();
    if (center) setPoint([center.lat, center.lng]);
  };

  const handleCenterOnPin = () => {
    if (point && mapRef.current) {
      mapRef.current.setView(point, Math.max(mapRef.current.getZoom(), 15), { animate: true });
    }
  };

  const handleResetView = () => {
    mapRef.current?.setView(DIVISION_OFFICE, 15, { animate: true });
  };

  return (
    <AccessibleDialog
      onClose={() => { if (!pending) onClose(); }}
      labelledBy="school-dialog-title"
      describedBy="school-dialog-description"
      noBackdropClose={deleting || pending}
      className={`flex flex-col overflow-hidden bg-white p-0 rounded-xl border border-slate-200 shadow-2xl max-h-[calc(100dvh-24px)] ${
        hasMap ? 'w-full max-w-[920px]' : 'w-full max-w-[500px]'
      }`}
    >
      <form
        className="flex flex-col flex-1 min-h-0"
        onSubmit={event => {
          event.preventDefault();
          onSubmit({
            name,
            ...(hasMap && point ? { latitude: point[0].toFixed(6), longitude: point[1].toFixed(6) } : {}),
          });
        }}
      >
        <div className="relative flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0 pr-10">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                deleting ? 'border-red-200 bg-red-50 text-error' : 'border-blue-200 bg-blue-50 text-primary'
              }`}
            >
              {deleting ? <Trash2 size={20} aria-hidden="true" /> : <School size={21} strokeWidth={1.7} aria-hidden="true" />}
            </span>
            <div>
              <h2 id="school-dialog-title" className="text-lg font-semibold tracking-tight text-slate-900">
                {deleting ? 'Delete school' : school ? 'Edit school' : 'Add school'}
              </h2>
              <p id="school-dialog-description" className="mt-0.5 text-xs text-slate-500">
                {deleting
                  ? 'This removes the school from the directory. This action cannot be undone.'
                  : school
                    ? 'Update the school name and map pin across personnel records.'
                    : 'Enter the official school name and pin its location on the map.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="absolute right-3.5 top-3.5 btn btn-ghost btn-square btn-sm text-slate-400 hover:text-slate-700"
            aria-label="Close dialog"
            disabled={pending}
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0 space-y-5">
          {deleting ? (
            <>
              <div className="flex items-center gap-3 rounded border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <School size={20} className="shrink-0 text-slate-500" aria-hidden="true" />
                <strong className="break-words">{school.name}</strong>
              </div>
              <p className="text-xs text-slate-500">Personnel must be reassigned before this school can be removed.</p>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="school-name" className="block text-sm font-semibold text-slate-700 mb-2">
                  School name
                </label>
                <input
                  type="text"
                  id="school-name"
                  maxLength={100}
                  required
                  disabled={pending}
                  value={name}
                  placeholder="Enter the official school name"
                  autoComplete="off"
                  className={`input input-bordered w-full text-sm ${fieldErrors?.name ? 'input-error' : ''}`}
                  aria-invalid={Boolean(fieldErrors?.name)}
                  aria-describedby={fieldErrors?.name ? 'error-name' : 'school-name-hint'}
                  onChange={event => setName(event.target.value)}
                />
                {fieldErrors?.name ? (
                  <p id="error-name" className="mt-2 text-xs text-error">
                    {[].concat(fieldErrors.name).join(' ')}
                  </p>
                ) : (
                  <p id="school-name-hint" className="mt-1.5 text-xs text-slate-500">
                    Use the name shown in official personnel records.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span id="school-location-label" className="text-sm font-semibold text-slate-700">
                    School location
                  </span>
                  {point ? (
                    <p role="status" className="inline-flex items-center gap-1.5 rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium tabular-nums text-primary">
                      <MapPin size={14} aria-hidden="true" />
                      <span>{point[0].toFixed(6)}, {point[1].toFixed(6)}</span>
                    </p>
                  ) : (
                    <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                      No pin placed
                    </span>
                  )}
                </div>

                <div
                  ref={mapWrapRef}
                  id="school-location"
                  className="h-[clamp(250px,45dvh,480px)] w-full rounded-lg border border-slate-300 overflow-hidden bg-slate-50 [&_.leaflet-container]:cursor-crosshair"
                  role="application"
                  aria-labelledby="school-location-label"
                  aria-describedby="school-location-hint"
                >
                  <MapContainer ref={mapRef} center={point || DIVISION_OFFICE} zoom={15} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                    <LocationPicker point={point} onChange={setPoint} />
                  </MapContainer>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <p id="school-location-hint" className="text-xs text-slate-500">
                    {point ? 'Click anywhere on the map to move the pin, or scroll to zoom.' : 'Click anywhere on the map to place the pin, or scroll to zoom.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className="btn btn-outline btn-xs gap-1.5 min-h-9" disabled={pending} onClick={handleUseCenter}>
                      <Crosshair size={14} aria-hidden="true" />
                      <span>Use map center</span>
                    </button>
                    {point && (
                      <button type="button" className="btn btn-outline btn-xs gap-1.5 min-h-9" disabled={pending} onClick={handleCenterOnPin}>
                        <LocateFixed size={14} aria-hidden="true" />
                        <span>Center on pin</span>
                      </button>
                    )}
                    <button type="button" className="btn btn-outline btn-xs min-h-9" disabled={pending} onClick={handleResetView}>
                      <span>Division office</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
          {error && (
            <p role="alert" className="text-xs text-error">
              {fieldErrors?.detail || 'Unable to save this change. Check the school name and try again.'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 shrink-0">
          {hasMap && !point && (
            <p className="text-xs text-slate-500">Place a pin on the map to enable saving.</p>
          )}
          <div className="flex items-center gap-2.5 ml-auto">
            <button type="button" className="btn btn-outline btn-sm" disabled={pending} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn-sm ${deleting ? 'btn-error text-white' : 'btn-primary'}`}
              disabled={pending || (hasMap && !point)}
            >
              {pending ? 'Saving...' : deleting ? 'Delete school' : 'Save school'}
            </button>
          </div>
        </div>
      </form>
    </AccessibleDialog>
  );
}
