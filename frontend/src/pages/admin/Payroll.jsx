import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';

/**
 * Payroll admin page
 * Allows HR/Admin to generate payroll for a selected employee and cutoff period.
 */
const Payroll = () => {
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [cutoff, setCutoff] = useState('');
  const [message, setMessage] = useState(null);

  // Fetch employees list
  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES],
    queryFn: async () => {
      const res = await api.get('employees/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
    enabled: true,
  });

  const generateMutation = useMutation({
    mutationFn: async ({ employeeId, cutoffPeriod }) => {
      const res = await api.post(`payroll/generate/${employeeId}/`, { cutoff: cutoffPeriod });
      return res.data;
    },
    onSuccess: (data) => {
      setMessage({ type: 'success', text: `Payroll generated. Net salary: ${data.net_salary}` });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYROLL] });
    },
    onError: (err) => {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to generate payroll' });
    },
  });

  const handleGenerate = () => {
    if (!selectedEmployee || !cutoff) {
      setMessage({ type: 'error', text: 'Select employee and cutoff period' });
      return;
    }
    generateMutation.mutate({ employeeId: selectedEmployee, cutoffPeriod: cutoff });
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Payroll Generation</h1>

      {message && (
        <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'} mb-4`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Employee</label>
          {loadingEmployees ? (
            <span className="loading loading-spinner" />
          ) : (
            <select
              className="select select-bordered w-full"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">Select employee</option>
              {(Array.isArray(employees) ? employees : [])?.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.position})
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block font-medium mb-1">Cutoff Period</label>
          <select
            className="select select-bordered w-full"
            value={cutoff}
            onChange={(e) => setCutoff(e.target.value)}
          >
            <option value="">Select cutoff</option>
            <option value="1st-15th">1st – 15th</option>
            <option value="16th-end">16th – End</option>
          </select>
        </div>
        <button
          className="btn btn-primary w-full"
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? <span className="loading loading-spinner" /> : 'Generate Payroll'}
        </button>
      </div>
    </div>
  );
};

export default Payroll;
