import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Search, Filter, CheckCircle2, FileDown } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import EmployeeTable from '../../components/features/employees/EmployeeTable';
import PersonnelFormModal from '../../components/features/employees/PersonnelFormModal';
import { exportToCSV } from '../../utils/export';

/**
 * Employees Management Page
 * 
 * Simple, professional redesign with clean filters and actions.
 */
const Employees = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Data Fetching
  const { data: employees, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES],
    queryFn: async () => {
      const response = await api.get('employees/');
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    },
  });

  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const res = await api.get('schools/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  });

  // 2. Mutations
  const addMutation = useMutation({
    mutationFn: (newEmployee) => api.post('employees/', newEmployee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
      closeModal();
      showToast('Employee added!');
    },
    onError: () => alert('Failed to add employee.')
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.patch(`employees/${selectedEmployee.id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
      closeModal();
      showToast('Record updated!');
    },
    onError: () => alert('Update failed.')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`employees/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
      showToast('Employee removed.');
    },
  });

  // 3. Handlers
  const closeModal = () => {
    setActiveModal(null);
    setSelectedEmployee(null);
  };

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleFormSubmit = (data) => {
    if (selectedEmployee) {
      updateMutation.mutate(data);
    } else {
      addMutation.mutate(data);
    }
  };

  const filteredEmployees = (employees || []).filter(emp =>
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return (
    <div className="p-8 flex justify-center h-[60vh] items-center">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Toast Notification */}
      {successMsg && (
        <div className="toast toast-top toast-end z-[100] mt-16">
          <div className="alert bg-primary text-white shadow-xl border-none rounded-lg flex items-center gap-3 py-3 px-6">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-bold text-xs uppercase tracking-widest">{successMsg}</span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">Employees</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">Staff Management Portal</p>
        </div>
        
        <button 
          onClick={() => setActiveModal('form')} 
          className="btn btn-primary rounded-lg shadow-lg shadow-primary/20 px-6"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Employee
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-base-200 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
          <input
            type="text"
            placeholder="Search by name or department..."
            className="input input-bordered w-full pl-12 bg-base-50/50 focus:bg-white border-base-200 focus:border-primary transition-all rounded-lg text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <button className="btn btn-ghost bg-base-50 border-base-200 flex-1 lg:flex-none rounded-lg text-xs font-bold uppercase tracking-widest px-6">
            <Filter className="w-3 h-3 mr-2 opacity-50" />
            Filter
          </button>
          
          <button
            onClick={() => exportToCSV(employees, 'Staff_List')}
            className="btn btn-ghost bg-primary/5 text-primary border-primary/10 hover:bg-primary/10 flex-1 lg:flex-none rounded-lg text-xs font-bold uppercase tracking-widest px-6"
          >
            <FileDown className="w-3 h-3 mr-2" />
            Download List
          </button>
        </div>
      </div>

      {/* Data Section */}
      <div className="animate-in slide-in-from-bottom-4 duration-700">
        <EmployeeTable
          employees={filteredEmployees}
          onEdit={(emp) => {
            setSelectedEmployee(emp);
            setActiveModal('form');
          }}
          onDelete={(id) => {
            if (window.confirm('Remove this employee record?')) {
              deleteMutation.mutate(id);
            }
          }}
        />
      </div>

      {/* Modal Overlay */}
      <PersonnelFormModal
        isOpen={activeModal === 'form'}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        isPending={addMutation.isPending || updateMutation.isPending}
        schools={schools}
        initialData={selectedEmployee}
      />
    </div>
  );
};

export default Employees;
