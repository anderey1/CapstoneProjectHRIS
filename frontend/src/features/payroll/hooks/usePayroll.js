import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { useToast } from '../../../context/ToastContext';
import { getCutoffStatus } from '../components/payrollConstants';

/**
 * Custom Domain Hook for Payroll Cutoffs & Salary Releases
 */
export function usePayroll(initialCutoff = 'May 1-15, 2026') {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedCutoff, setSelectedCutoff] = useState(initialCutoff);

  // 1. Data Fetching
  const { data: rawEmployees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES],
    queryFn: async () => {
      const res = await api.get('employees/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const employees = Array.isArray(rawEmployees) ? rawEmployees : rawEmployees?.results || [];

  const { data: rawPayrolls = [], isLoading: loadingPayrolls } = useQuery({
    queryKey: [QUERY_KEYS.PAYROLL],
    queryFn: async () => {
      const res = await api.get('payroll/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const allPayrolls = Array.isArray(rawPayrolls) ? rawPayrolls : rawPayrolls?.results || [];

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

  // 3. Export Handlers
  const exportPayrollSheet = async (cutoff = selectedCutoff) => {
    try {
      const response = await api.get('payroll/export_payroll_sheet/', {
        params: { cutoff_period: cutoff },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `General_Payroll_${cutoff.replace(/ /g, '_').replace(/,/g, '')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Downloaded General Payroll PDF');
    } catch {
      toast.error('No payroll records found for this period to generate sheet.');
    }
  };

  const exportDisbursementVoucher = async (cutoff = selectedCutoff) => {
    try {
      const response = await api.get('payroll/export_disbursement_voucher/', {
        params: { cutoff_period: cutoff },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Disbursement_Voucher_${cutoff.replace(/ /g, '_').replace(/,/g, '')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Downloaded Disbursement Voucher PDF');
    } catch {
      toast.error('No payroll records found for this period to generate DV.');
    }
  };

  // 4. Cutoff-level Calculations
  const cutoffPayrolls = allPayrolls.filter((p) => p.cutoff_period === selectedCutoff);
  const cutoffStatus = getCutoffStatus(cutoffPayrolls);

  const totalGross = cutoffPayrolls.reduce(
    (sum, p) => sum + parseFloat(p.gross_salary || p.basic_salary || 0),
    0
  );
  const totalDeductions = cutoffPayrolls.reduce(
    (sum, p) => sum + parseFloat(p.total_deductions || 0),
    0
  );
  const totalNet = cutoffPayrolls.reduce(
    (sum, p) => sum + parseFloat(p.net_salary || 0),
    0
  );

  return {
    employees,
    allPayrolls,
    selectedCutoff,
    setSelectedCutoff,
    cutoffPayrolls,
    cutoffStatus,
    totalGross,
    totalDeductions,
    totalNet,
    isLoading: loadingPayrolls || loadingEmployees,
    generatePayroll: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    bulkGeneratePayroll: bulkGenerateMutation.mutateAsync,
    isBulkGenerating: bulkGenerateMutation.isPending,
    approvePayroll: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    releasePayroll: releaseMutation.mutateAsync,
    isReleasing: releaseMutation.isPending,
    bulkApprovePayroll: bulkApproveMutation.mutateAsync,
    isBulkApproving: bulkApproveMutation.isPending,
    bulkReleasePayroll: bulkReleaseMutation.mutateAsync,
    isBulkReleasing: bulkReleaseMutation.isPending,
    exportPayrollSheet,
    exportDisbursementVoucher,
  };
}
