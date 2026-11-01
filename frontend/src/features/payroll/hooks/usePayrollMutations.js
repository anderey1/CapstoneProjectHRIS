import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { useToast } from '../../../context/ToastContext';

export function usePayrollMutations() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const invalidatePayroll = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYROLL] });
  };

  // 2. Mutations
  const generateMutation = useMutation({
    mutationFn: (data) => api.post('payroll/generate/', data),
    onSuccess: () => {
      invalidatePayroll();
      toast.success('Draft payslip generated.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Generation failed.');
    },
  });

  const bulkGenerateMutation = useMutation({
    mutationFn: (data) => api.post('payroll/bulk_generate/', data),
    onSuccess: (res) => {
      invalidatePayroll();
      const skippedCount = res.data.skipped?.length || 0;
      toast.success(`Bulk generation complete. Generated: ${res.data.generated}, Updated: ${res.data.updated}, Skipped: ${skippedCount}.`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Bulk generation failed.');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id) => api.post(`payroll/${id}/approve/`),
    onSuccess: () => {
      invalidatePayroll();
      toast.success('Payroll record approved.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Approval failed.');
    },
  });

  const releaseMutation = useMutation({
    mutationFn: (id) => api.post(`payroll/${id}/release/`),
    onSuccess: () => {
      invalidatePayroll();
      toast.success('Payroll record released.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Release failed.');
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: (data) => api.post('payroll/bulk_approve/', data),
    onSuccess: () => {
      invalidatePayroll();
      toast.success('General Payroll approved and signed successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Bulk approval failed.');
    },
  });

  const bulkReleaseMutation = useMutation({
    mutationFn: (data) => api.post('payroll/bulk_release/', data),
    onSuccess: () => {
      invalidatePayroll();
      toast.success('All payroll records in cutoff released and credited to LandBank ATM!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Bulk release failed.');
    },
  });


  return { generateMutation, bulkGenerateMutation, approveMutation, releaseMutation, bulkApproveMutation, bulkReleaseMutation };
}
