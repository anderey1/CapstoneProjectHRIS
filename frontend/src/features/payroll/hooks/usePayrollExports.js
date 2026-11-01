import api from '../../../api/axios';
import { useToast } from '../../../context/ToastContext';

export function usePayrollExports(selectedCutoff) {
  const toast = useToast();

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


  return { exportPayrollSheet, exportDisbursementVoucher };
}
