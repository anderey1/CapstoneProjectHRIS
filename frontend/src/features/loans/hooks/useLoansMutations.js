import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { useToast } from '../../../context/ToastContext';

export function useLoansMutations() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const invalidateLoans = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LOANS] });
  };

  // 4. Mutations
  const applyMutation = useMutation({
    mutationFn: async ({ formData, files = [] }) => {
      const res = await api.post('loans/', formData);
      const loanId = res.data.id;
      for (const { doc_type, file } of files) {
        const fd = new FormData();
        fd.append('doc_type', doc_type);
        fd.append('file', file);
        await api.post(`loans/${loanId}/upload_document/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return res.data;
    },
    onSuccess: () => {
      invalidateLoans();
      toast.success('Loan application sent successfully!');
    },
    onError: (err) => {
      const errorData = err.response?.data;
      let msg = 'Application failed. Please ensure all data is correct.';
      if (errorData) {
        if (typeof errorData === 'string') msg = errorData;
        else if (Array.isArray(errorData)) msg = errorData[0];
        else if (errorData.detail) msg = errorData.detail;
        else if (typeof errorData === 'object') {
          const firstKey = Object.keys(errorData)[0];
          const val = errorData[firstKey];
          msg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : `${firstKey}: ${val}`;
        }
      }
      toast.error(msg);
    },
  });

  const resubmitMutation = useMutation({
    mutationFn: async ({ id, formData, files = [] }) => {
      const res = await api.post(`loans/${id}/resubmit/`, formData);
      for (const { doc_type, file } of files) {
        const fd = new FormData();
        fd.append('doc_type', doc_type);
        fd.append('file', file);
        await api.post(`loans/${id}/upload_document/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return res.data;
    },
    onSuccess: () => {
      invalidateLoans();
      toast.success('Application resubmitted successfully!');
    },
    onError: (err) => {
      const errorData = err.response?.data;
      let msg = 'Resubmission failed. Please check your data and try again.';
      if (errorData) {
        if (typeof errorData === 'string') msg = errorData;
        else if (Array.isArray(errorData)) msg = errorData[0];
        else if (errorData.detail) msg = errorData.detail;
        else if (typeof errorData === 'object') {
          const firstKey = Object.keys(errorData)[0];
          const val = errorData[firstKey];
          msg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : `${firstKey}: ${val}`;
        }
      }
      toast.error(msg);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (id) => api.post(`loans/${id}/verify/`),
    onSuccess: () => {
      invalidateLoans();
      toast.success('Loan documents verified successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Verification failed.');
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, remarks }) => api.post(`loans/${id}/approve/`, { remarks }),
    onSuccess: () => {
      invalidateLoans();
      toast.success('Loan approved successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Approval failed.');
    },
  });

  const disburseMutation = useMutation({
    mutationFn: (id) => api.post(`loans/${id}/release-funds/`),
    onSuccess: () => {
      invalidateLoans();
      toast.success('Loan funds released successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Disbursement failed.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, remarks }) => api.post(`loans/${id}/reject/`, { remarks }),
    onSuccess: () => {
      invalidateLoans();
      toast.info('Loan rejected.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Rejection failed.');
    },
  });


  return { applyMutation, resubmitMutation, verifyMutation, approveMutation, disburseMutation, rejectMutation };
}
