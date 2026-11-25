import React, { useState, useMemo } from 'react';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import Pagination from '../../components/common/Pagination';
import PageHeader from '../../components/common/PageHeader';
import PageLoader from '../../components/common/PageLoader';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
import { formatCurrency, payrollStatusLabel } from '../../features/payroll/utils/payrollDisplay';
import {
  Wallet,
  Download,
  Eye,
  AlertCircle,
  Printer,
  FileCheck,
} from 'lucide-react';

/**
 * My Payslips (Personal Compensation & Semi-Monthly Earnings History)
 * Conforming to DepEd Payroll Calculator & CSC Institutional Standards.
 */
const MyPayroll = () => {
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  // 1. Data Fetching
  const { records: payrolls, pagination, isLoading, isError, isFetching, refetch } = usePaginatedList(QUERY_KEYS.PAYROLL, 'payroll/');

  // Default selection to latest released payroll
  const activePayroll = useMemo(() => {
    if (isError || isFetching) return null;
    if (selectedPayroll) {
      const selected = payrolls.find(p => p.id === selectedPayroll.id);
      if (selected) return selected;
    }
    if (payrolls && payrolls.length > 0) return payrolls[0];
    return null;
  }, [selectedPayroll, payrolls, isError, isFetching]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async (p) => {
    try {
      const response = await api.get(`payroll/${p.id}/export_payslip/`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `Payslip_${(p.cutoff_period || 'period').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Unable to download payslip PDF. Please verify your connection and try again.');
    }
  };

  if (isLoading) {
    return <PageLoader label="Loading Compensation Archive..." />;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        icon={FileCheck}
        title="My payslips"
        subtitle="Semi-Monthly Salary Disbursements · Civil Service Commission & DBM SSL Schedule"
      >
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-primary border border-blue-200 rounded font-semibold">
            <Wallet className="w-3.5 h-3.5" />
            Semi-Monthly Cutoffs
          </span>
        </div>
      </PageHeader>

      <Pagination pagination={pagination} label="payslips" />
      {isError ? (
        <div role="alert" className="border border-red-200 bg-red-50 rounded-lg p-4 text-sm text-red-800">
          <p>Could not load payslips. No amounts are available.</p>
          <button type="button" className="btn min-h-11 mt-3" onClick={() => refetch()}>Retry payslips</button>
        </div>
      ) : payrolls.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Semi-Monthly Payslip Ledger Table (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-300 rounded-lg overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-800 tracking-wider">
                Salary Release History
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {pagination.count} Recorded Cycles
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-xs uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-bold">Cutoff Period</th>
                    <th className="py-2.5 px-3 font-bold text-right">Gross Pay</th>
                    <th className="py-2.5 px-3 font-bold text-right">Deductions</th>
                    <th className="py-2.5 px-3 font-bold text-right">Net Take-Home</th>
                    <th className="py-2.5 px-3 font-bold text-center">Status</th>
                    <th className="py-2.5 px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payrolls.map((p) => {
                    const isSelected = activePayroll?.id === p.id;
                    const gross = p.gross_salary;
                    const deductions = p.total_deductions;
                    const net = p.net_salary;

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isSelected ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900 text-xs">
                          {p.cutoff_period}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                          {formatCurrency(gross)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-red-700">
                          {formatCurrency(deductions)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-primary">
                          {formatCurrency(net)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded text-sm font-semibold ${
                              p.status === 'released'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : p.status === 'approved'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {payrollStatusLabel(p.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedPayroll(p)}
                            disabled={isFetching}
                            aria-pressed={isSelected}
                            className={`inline-flex min-h-11 items-center gap-1 px-3 py-2 text-sm font-semibold rounded transition-colors ${
                              isSelected
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View payslip
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 border-t border-slate-300 px-4 py-2 text-xs text-slate-500 flex justify-between">
              <span>Select a pay period to view your payslip.</span>
              <span className="font-mono">DepEd Lucena Division</span>
            </div>
          </div>

          {/* RIGHT: Official Electronic Payslip Docket (5 cols) */}
          <div className="lg:col-span-5">
            {activePayroll ? (
              <div
                id="printable-payslip"
                className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden sticky top-6"
              >
                {/* Institutional Docket Top Header */}
                <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      Semi-monthly payslip
                    </h3>
                    <span className="font-mono tabular-nums text-xs font-semibold text-primary">
                      {activePayroll.cutoff_period}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDownloadPDF(activePayroll)}
                      aria-label="Download PDF payslip"
                      title="Download PDF payslip"
                      className="min-h-11 min-w-11 flex items-center justify-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded transition-colors"
                    >
                      <Download className="w-4 h-4 text-primary" />
                    </button>
                    <button
                      onClick={handlePrint}
                      title="Print payslip"
                      aria-label="Print payslip"
                      className="min-h-11 min-w-11 flex items-center justify-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded transition-colors"
                    >
                      <Printer className="w-4 h-4 text-slate-700" />
                    </button>
                  </div>
                </div>

                {/* Ratee & Workstation Metadata */}
                <div className="p-4 border-b border-slate-200 bg-white grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">
                      Employee Personnel
                    </span>
                    <strong className="text-slate-900 block mt-0.5">
                      {activePayroll.employee_name || 'Name not available'}
                    </strong>
                    <span className="text-slate-500 text-xs block">
                      Position: {activePayroll.position || 'Not available'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold">
                      Station / Division
                    </span>
                    <span className="text-slate-800 text-xs block mt-0.5 font-medium">
                      {activePayroll.department || 'Not available'}
                    </span>
                    <span className="text-xs text-slate-500 block font-mono">
                      Ref: #PAY-{activePayroll.id?.toString().padStart(6, '0')}
                    </span>
                  </div>
                </div>

                {/* Earnings & Deductions Breakdown */}
                <div className="p-4 space-y-4 text-xs">
                  {/* Earnings Breakdown */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-900 border-b border-slate-200 pb-1">
                      <span>I. Gross Compensation</span>
                      <span className="font-mono tabular-nums text-slate-700">Amount (₱)</span>
                    </div>

                    <div className="flex justify-between text-slate-700 py-0.5">
                      <span>Basic salary</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(activePayroll.basic_salary)}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-700 py-0.5">
                      <span>PERA allowance</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(activePayroll.pera)}
                      </span>
                    </div>

                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                      <span>Total Gross Compensation</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(activePayroll.gross_salary)}
                      </span>
                    </div>
                  </div>

                  {/* Deductions Breakdown */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-900 border-b border-slate-200 pb-1">
                      <span>II. Statutory &amp; Other Deductions</span>
                      <span className="font-mono tabular-nums text-slate-700">Amount (₱)</span>
                    </div>

                    <div className="flex justify-between text-slate-700 py-0.5">
                      <span>GSIS life &amp; retirement</span>
                      <span className="font-mono tabular-nums text-red-700">
                        {formatCurrency(activePayroll.gsis)}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-700 py-0.5">
                      <span>PhilHealth Contribution</span>
                      <span className="font-mono tabular-nums text-red-700">
                        {formatCurrency(activePayroll.philhealth)}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-700 py-0.5">
                      <span>Pag-IBIG Contribution</span>
                      <span className="font-mono tabular-nums text-red-700">
                        {formatCurrency(activePayroll.pagibig)}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-700 py-0.5">
                      <span>Withholding Tax (TRAIN Law)</span>
                      <span className="font-mono tabular-nums text-red-700">
                        {formatCurrency(activePayroll.tax)}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-700 py-0.5">
                      <span>Provident Loan Deductions</span>
                      <span className="font-mono tabular-nums text-red-700">
                        {formatCurrency(activePayroll.loans)}
                      </span>
                    </div>

                    <div className="flex justify-between font-bold text-red-700 pt-1 border-t border-slate-100">
                      <span>Total Deductions</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(activePayroll.total_deductions)}
                      </span>
                    </div>
                  </div>

                  {/* Net Take-Home Pay Callout */}
                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center space-y-0.5">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">
                      Net Take-Home Pay
                    </span>
                    <span className="text-2xl font-bold font-mono tabular-nums text-primary block">
                      {formatCurrency(activePayroll.net_salary)}
                    </span>
                  </div>
                </div>

                {/* Footer Notes */}
                <div className="bg-slate-50 border-t border-slate-200 p-3 text-center text-xs text-slate-400 font-mono">
                  Official Electronic Document • DepEd Division of Lucena City
                </div>
              </div>
            ) : (
              <div className="h-64 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-xs text-slate-400">
                Select a salary cutoff to display the payslip docket.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-300 rounded-lg p-12 text-center text-slate-500 space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold">No payslip records available yet.</p>
          <p className="text-xs text-slate-400">
            Semi-monthly payslips will appear once generated and released by the Division Accountant.
          </p>
        </div>
      )}
    </div>
  );
};

export default MyPayroll;
