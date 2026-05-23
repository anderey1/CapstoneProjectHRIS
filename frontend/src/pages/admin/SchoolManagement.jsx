import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { School, Plus } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';

// Subcomponents
import SchoolMap from '../../components/features/school/SchoolMap';
import SchoolList from '../../components/features/school/SchoolList';
import SchoolFormModal from '../../components/features/school/SchoolFormModal';

/**
 * School Geofencing Management Dashboard
 * Orchestrates maps, lists, and forms for workstation configuration.
 */
const SchoolManagement = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [mapCenter, setMapCenter] = useState([13.9408, 121.6210]); // Lucena City center
  const [mapZoom, setMapZoom] = useState(13);
  
  // Modal / Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [tempMarker, setTempMarker] = useState(null);

  // Fetch all schools
  const { data: schools = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.SCHOOLS],
    queryFn: async () => {
      const res = await api.get('schools/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (newSchool) => {
      const res = await api.post('schools/', newSchool);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SCHOOLS] });
      closeModal();
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Error creating school. Please verify your data.');
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updatedData }) => {
      const res = await api.put(`schools/${id}/`, updatedData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SCHOOLS] });
      closeModal();
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Error updating school. Please verify your data.');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`schools/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SCHOOLS] });
      if (selectedSchool && selectedSchool.id === editingSchool?.id) {
        setSelectedSchool(null);
      }
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Error deleting school. It may be linked to employee records.');
    }
  });

  const openAddModal = (coords = null) => {
    setEditingSchool(null);
    if (coords) {
      setTempMarker([coords.lat, coords.lng]);
    } else {
      setTempMarker(null);
    }
    setIsModalOpen(true);
  };

  const openEditModal = (school) => {
    setEditingSchool(school);
    setTempMarker(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSchool(null);
    setTempMarker(null);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSubmit = (data) => {
    const payload = {
      name: data.name,
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      radius_meters: parseInt(data.radius_meters, 10)
    };

    if (editingSchool) {
      updateMutation.mutate({ id: editingSchool.id, updatedData: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const selectAndFocusSchool = (school) => {
    setSelectedSchool(school);
    const coords = [parseFloat(school.latitude), parseFloat(school.longitude)];
    setMapCenter(coords);
    setMapZoom(16);
  };

  const handleMapClick = (latlng) => {
    openAddModal(latlng);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center h-[60vh] items-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <School className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">School Geofencing</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">
            Configure school locations and geofence verification boundaries
          </p>
        </div>

        <button 
          onClick={() => openAddModal()}
          className="btn btn-primary rounded-lg text-xs font-black uppercase tracking-widest shadow-md shadow-primary/20 gap-2 w-full lg:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add School Location
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left/Middle: Map Panel (2/3 width) */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white border border-base-200 rounded-xl overflow-hidden shadow-sm p-6 flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-widest opacity-80 text-base-content">
                  Geofence Mapping
                </h3>
              </div>
              <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">
                💡 Click on the map to instantly create a school boundary
              </span>
            </div>

            {/* Map Container */}
            <div className="flex-1 rounded-lg border border-base-100 overflow-hidden relative z-0 shadow-inner">
              <SchoolMap
                schools={schools}
                selectedSchool={selectedSchool}
                onSelectSchool={setSelectedSchool}
                mapCenter={mapCenter}
                mapZoom={mapZoom}
                tempMarker={tempMarker}
                onMapClick={handleMapClick}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar: School List (1/3 width) */}
        <div className="xl:col-span-1 space-y-4">
          <SchoolList
            schools={schools}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedSchool={selectedSchool}
            onSelectSchool={setSelectedSchool}
            onFocusSchool={selectAndFocusSchool}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        </div>

      </div>

      {/* Add / Edit School Form Modal */}
      <SchoolFormModal
        isOpen={isModalOpen}
        editingSchool={editingSchool}
        tempMarker={tempMarker}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

    </div>
  );
};

export default SchoolManagement;
