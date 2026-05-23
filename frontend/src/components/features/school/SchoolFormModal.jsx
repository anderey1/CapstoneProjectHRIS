import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, MapPin } from 'lucide-react';

const SchoolFormModal = ({
  isOpen,
  editingSchool,
  tempMarker,
  onClose,
  onSubmit,
  isPending
}) => {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      latitude: '',
      longitude: '',
      radius_meters: 100
    }
  });

  // Reset form values when inputs change (e.g. edit mode vs add mode vs temp pin)
  useEffect(() => {
    if (isOpen) {
      if (editingSchool) {
        reset({
          name: editingSchool.name,
          latitude: parseFloat(editingSchool.latitude).toFixed(6),
          longitude: parseFloat(editingSchool.longitude).toFixed(6),
          radius_meters: editingSchool.radius_meters
        });
      } else if (tempMarker) {
        reset({
          name: '',
          latitude: parseFloat(tempMarker[0]).toFixed(6),
          longitude: parseFloat(tempMarker[1]).toFixed(6),
          radius_meters: 100
        });
      } else {
        reset({
          name: '',
          latitude: '',
          longitude: '',
          radius_meters: 100
        });
      }
    }
  }, [isOpen, editingSchool, tempMarker, reset]);

  // Watch fields for rendering active preview description
  const previewRadius = watch('radius_meters');
  const previewLat = watch('latitude');
  const previewLng = watch('longitude');

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box rounded-xl p-0 overflow-hidden border border-base-200 max-w-md shadow-2xl bg-white flex flex-col animate-in fade-in zoom-in-95 duration-300">
        
        {/* Modal Header */}
        <div className="bg-base-50/50 border-b border-base-100 p-6 flex items-center justify-between">
          <div>
            <h3 className="font-black text-lg text-base-content uppercase tracking-tight">
              {editingSchool ? 'Update School Location' : 'Add School Location'}
            </h3>
            <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mt-1">
              {editingSchool ? 'Refine school details and radius' : 'Define new geo-validated office'}
            </p>
          </div>
          <button 
            type="button"
            className="btn btn-ghost btn-sm btn-circle opacity-30 hover:opacity-100" 
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <div className="p-6 space-y-4">
            
            {/* School Name */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-[10px] font-black uppercase tracking-wider opacity-60">School Name</span>
              </label>
              <input 
                type="text" 
                placeholder="e.g. Lucena East I Elementary School"
                className={`input input-bordered w-full rounded-lg text-sm focus:outline-none focus:border-primary ${errors.name ? 'input-error' : ''}`}
                {...register('name', { required: 'School name is required' })}
              />
              {errors.name && (
                <span className="text-xs text-error mt-1 font-semibold">{errors.name.message}</span>
              )}
            </div>

            {/* Coords Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Latitude */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-[10px] font-black uppercase tracking-wider opacity-60">Latitude</span>
                </label>
                <input 
                  type="number" 
                  step="any"
                  placeholder="e.g. 13.940800"
                  className={`input input-bordered w-full rounded-lg text-sm focus:outline-none focus:border-primary ${errors.latitude ? 'input-error' : ''}`}
                  {...register('latitude', { 
                    required: 'Latitude is required',
                    validate: val => !isNaN(parseFloat(val)) || 'Must be a valid number'
                  })}
                />
                {errors.latitude && (
                  <span className="text-xs text-error mt-1 font-semibold">{errors.latitude.message}</span>
                )}
              </div>

              {/* Longitude */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-[10px] font-black uppercase tracking-wider opacity-60">Longitude</span>
                </label>
                <input 
                  type="number" 
                  step="any"
                  placeholder="e.g. 121.621000"
                  className={`input input-bordered w-full rounded-lg text-sm focus:outline-none focus:border-primary ${errors.longitude ? 'input-error' : ''}`}
                  {...register('longitude', { 
                    required: 'Longitude is required',
                    validate: val => !isNaN(parseFloat(val)) || 'Must be a valid number'
                  })}
                />
                {errors.longitude && (
                  <span className="text-xs text-error mt-1 font-semibold">{errors.longitude.message}</span>
                )}
              </div>
            </div>

            {/* Radius Meters */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text text-[10px] font-black uppercase tracking-wider opacity-60 flex justify-between w-full">
                  <span>Geofence Radius (meters)</span>
                  <span className="text-primary font-black">{previewRadius || 100}m</span>
                </span>
              </label>
              <input 
                type="range" 
                min="20" 
                max="1000" 
                step="10"
                className="range range-primary range-xs"
                {...register('radius_meters', { required: true })}
              />
              <div className="w-full flex justify-between text-[9px] px-1 font-black opacity-30 uppercase tracking-widest mt-1">
                <span>20m</span>
                <span>250m</span>
                <span>500m</span>
                <span>750m</span>
                <span>1000m</span>
              </div>
            </div>

            {/* Info Note */}
            {previewLat && previewLng && (
              <div className="p-3 bg-base-50 rounded-lg border border-base-200 flex items-start gap-2 text-[10px] font-bold text-base-content/60 leading-normal">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  Registered location: <span className="text-base-content font-black">{parseFloat(previewLat).toFixed(5)}, {parseFloat(previewLng).toFixed(5)}</span> with a {previewRadius}m radial geofence. Employees scanning outside this radius will be automatically flagged.
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-base-50/50 border-t border-base-100 flex items-center justify-end gap-3">
            <button 
              type="button" 
              className="btn btn-ghost text-xs font-black uppercase tracking-widest opacity-40" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={`btn btn-primary rounded-lg text-xs font-black uppercase tracking-widest px-8 shadow-md shadow-primary/20 ${isPending ? 'loading' : ''}`}
              disabled={isPending}
            >
              {isPending ? 'Saving...' : (editingSchool ? 'Update Location' : 'Add School')}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose}></div>
    </div>
  );
};

export default SchoolFormModal;
