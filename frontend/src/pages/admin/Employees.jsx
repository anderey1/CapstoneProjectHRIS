import React, { useMemo, useState } from 'react';
import { Users, UserPlus, Search, Filter, FileDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  useEmployees, 
  EmployeeTable, 
  PersonnelFormModal 
} from '../../features/employees';
import { exportToCSV } from '../../utils/export';

/**
 * Employees Management Page
 * 
 * Clean orchestrator powered by useEmployees domain hook.
 */
const Employees = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [appliedRole, setAppliedRole] = useState('');
  const [appliedArea, setAppliedArea] = useState('');

  const {
    employees,
    schools,
    isLoading,
    isSaving,
    saveEmployee,
    deleteEmployee,
  } = useEmployees();

  const closeModal = () => {
    setActiveModal(null);
    setSelectedEmployee(null);
  };

  const handleFormSubmit = async (data) => {
    await saveEmployee(data, selectedEmployee?.id);
    closeModal();
  };

  const roleOptions = useMemo(() => {
    const values = (employees || [])
      .map((emp) => emp.user_details?.role || emp.role || '')
      .filter(Boolean);
    return Array.from(new Set(values)).sort();
  }, [employees]);

  const areaOptions = useMemo(() => {
    const values = (employees || [])
      .map((emp) => emp.department || '')
      .filter(Boolean);
    return Array.from(new Set(values)).sort();
  }, [employees]);

  const applyFilters = () => {
    setAppliedRole(selectedRole);
    setAppliedArea(selectedArea);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setSelectedRole('');
    setSelectedArea('');
    setAppliedRole('');
    setAppliedArea('');
    setShowFilters(false);
  };

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return (employees || []).filter((emp) => {
      const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim().toLowerCase();
      const department = (emp.department || '').toLowerCase();
      const role = (emp.user_details?.role || emp.role || '').toUpperCase();
      const area = (emp.department || '').toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        fullName.includes(normalizedSearch) ||
        department.includes(normalizedSearch);
      const matchesRole = !appliedRole || role === appliedRole.toUpperCase();
      const matchesArea = !appliedArea || area === appliedArea.toLowerCase();

      return matchesSearch && matchesRole && matchesArea;
    });
  }, [employees, searchTerm, appliedRole, appliedArea]);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center h-[60vh] items-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-[#0038A8]">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Personnel Directory</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Official registry of teaching, non-teaching, and administrative personnel</p>
        </div>

        {['HR', 'SUPERINTENDENT'].includes(user?.role) ? (
          <button
            onClick={() => setActiveModal('form')}
            className="btn bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded-lg text-xs font-semibold px-4 h-9 min-h-0 shadow-sm"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Employee
          </button>
        ) : null}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by personnel name or department..."
            className="input input-sm w-full pl-10 bg-slate-50 focus:bg-white border-slate-200 focus:border-[#0038A8] rounded-lg text-xs text-slate-800 transition-colors h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className={`btn btn-sm h-9 min-h-0 rounded-lg text-xs font-medium px-4 border ${
                appliedRole || appliedArea 
                  ? 'bg-blue-50 text-[#0038A8] border-blue-200' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Filters {(appliedRole || appliedArea) ? '(Active)' : ''}
            </button>

            {showFilters && (
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-20 w-[calc(100vw-3rem)] sm:w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Personnel Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="select select-bordered select-sm w-full text-xs"
                  >
                    <option value="">All Roles</option>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Station / District</label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="select select-bordered select-sm w-full text-xs"
                  >
                    <option value="">All Stations</option>
                    {areaOptions.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-1 border-t border-slate-100">
                  <button onClick={applyFilters} className="btn bg-[#0038A8] hover:bg-[#002d86] text-white btn-sm flex-1 text-xs rounded-lg">Apply</button>
                  <button onClick={resetFilters} className="btn btn-ghost btn-sm text-xs rounded-lg text-slate-600">Reset</button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => exportToCSV(filteredEmployees, 'Staff_List')}
            className="btn btn-sm h-9 min-h-0 bg-white text-slate-700 border-slate-200 hover:bg-slate-50 flex-1 lg:flex-none rounded-lg text-xs font-medium px-4"
          >
            <FileDown className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            Export CSV
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
          onDelete={async (id) => {
            if (window.confirm('Remove this employee record?')) {
              await deleteEmployee(id);
            }
          }}
        />
      </div>

      {/* Modal Overlay */}
      {activeModal === 'form' && (
        <PersonnelFormModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={handleFormSubmit}
          isPending={isSaving}
          schools={schools}
          initialData={selectedEmployee}
        />
      )}
    </div>
  );
};

export default Employees;
