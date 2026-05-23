import React from 'react';
import { Search, AlertCircle, Locate, Compass, Edit2, Trash2 } from 'lucide-react';

const SchoolList = ({
  schools,
  searchTerm,
  setSearchTerm,
  selectedSchool,
  onSelectSchool,
  onFocusSchool,
  onEdit,
  onDelete
}) => {
  // Filter schools by search query
  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white border border-base-200 rounded-xl p-6 shadow-sm flex flex-col h-[600px]">
      
      {/* Search Input */}
      <div className="relative mb-6">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-base-content/30" />
        </span>
        <input 
          type="text" 
          placeholder="Search registered schools..." 
          className="input input-bordered w-full pl-10 rounded-lg text-sm font-semibold placeholder:font-normal focus:outline-none focus:border-primary bg-base-50/50"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* School List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {filteredSchools.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-40">
            <AlertCircle className="w-10 h-10 mb-2 text-base-content/30" />
            <p className="text-xs font-black uppercase tracking-widest">No schools found</p>
            <p className="text-[10px] mt-1">Register a new school using the map or button above.</p>
          </div>
        ) : (
          filteredSchools.map((school) => {
            const isSelected = selectedSchool && selectedSchool.id === school.id;
            return (
              <div 
                key={school.id}
                onClick={() => onSelectSchool(school)}
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                  isSelected 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-base-200 bg-white hover:border-base-300 hover:shadow-xs'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h4 className="font-black text-sm text-base-content uppercase tracking-tight leading-tight">
                      {school.name}
                    </h4>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-base-content/50">
                      <span className="flex items-center gap-1">
                        <Locate className="w-3 h-3 text-primary opacity-60" />
                        {parseFloat(school.latitude).toFixed(5)}, {parseFloat(school.longitude).toFixed(5)}
                      </span>
                      <span>•</span>
                      <span>Radius: {school.radius_meters}m</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onFocusSchool(school)}
                      title="Center on map"
                      className="btn btn-xs btn-ghost btn-circle text-primary hover:bg-primary/10"
                    >
                      <Compass className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(school)}
                      title="Edit coordinates"
                      className="btn btn-xs btn-ghost btn-circle text-info hover:bg-info/10"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(school.id, school.name)}
                      title="Remove school"
                      className="btn btn-xs btn-ghost btn-circle text-error hover:bg-error/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SchoolList;
