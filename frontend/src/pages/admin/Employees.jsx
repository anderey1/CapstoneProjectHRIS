import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Search, Filter, CheckCircle2, FileDown } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import EmployeeTable from '../../components/features/employees/EmployeeTable';
import PersonnelFormModal from '../../components/features/employees/PersonnelFormModal';
import { exportToCSV } from '../../utils/export';



const Employees = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch Employees
  const { data: employees, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES],
    queryFn: async () => {
      const response = await api.get('employees/');
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    },
  });

  // Fetch Schools for the modal
  const { data: schools } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const res = await api.get('schools/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  });

  // Mutations
  const addMutation = useMutation({
    mutationFn: (newEmployee) => api.post('employees/', newEmployee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
      closeModal();
      showToast('Employee added successfully!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.patch(`employees/${selectedEmployee.id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
      closeModal();
      showToast('Profile updated successfully.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`employees/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
      showToast('Employee removed.');
    },
  });

  const closeModal = () => {
    setActiveModal(null);
    setSelectedEmployee(null);
  };

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    if (selectedEmployee) {
      updateMutation.mutate(data);
    } else {
      addMutation.mutate(data);
    }
  };

  const employeeList = Array.isArray(employees) ? employees : (employees?.results || []);
  const filteredEmployees = employeeList.filter(emp =>
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return (
    <div className="p-8 flex justify-center">
      <span className="loading loading-dots loading-lg text-primary"></span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      {successMsg && (
        <div className="toast toast-top toast-end z-[100]">
          <div className="alert alert-success shadow-xl border-none text-white rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold text-sm">{successMsg}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-base-content flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Employees
          </h1>
          <p className="text-sm opacity-50 font-medium mt-1">Manage your workforce and division personnel.</p>
        </div>
        <button onClick={() => setActiveModal('form')} className="btn btn-primary shadow-lg shadow-primary/20 rounded-2xl group">
          <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Add New Employee
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-base-100 p-4 rounded-3xl shadow-sm border border-base-300">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
          <input
            type="text"
            placeholder="Search by name or department..."
            className="input input-bordered w-full pl-11 bg-base-200/50 focus:bg-base-100 transition-all rounded-2xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-ghost bg-base-200/50 rounded-2xl px-6 border-base-300">
          <Filter className="w-4 h-4 mr-2 opacity-50" />
          Filter
        </button>
        <button
          onClick={() => exportToCSV(employeeList, 'Employees')}
          className="btn btn-ghost bg-base-200/50 rounded-2xl px-6 border-base-300 text-primary"
        >
          <FileDown className="w-4 h-4 mr-2" />
          Export Personnel
        </button>
      </div>

      <EmployeeTable
        employees={filteredEmployees}
        onEdit={(emp) => {
          setSelectedEmployee(emp);
          setActiveModal('form');
        }}
        onDelete={(id) => {
          if (window.confirm('Are you sure you want to delete this employee?')) {
            deleteMutation.mutate(id);
          }
        }}
      />

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
