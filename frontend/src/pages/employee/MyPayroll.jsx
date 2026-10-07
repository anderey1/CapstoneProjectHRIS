import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
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
  const { data: payrolls = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.PAYROLL],
    queryFn: async () => {
      const res = await api.get('payroll/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  // Default selection to latest released payroll
  const activePayroll = useMemo(() => {
    if (selectedPayroll) return selectedPayroll;
    if (payrolls && payrolls.length > 0) return payrolls[0];
    return null;
  }, [selectedPayroll, payrolls]);

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
    } catch {
      alert('Unable to download payslip PDF. Please verify your connection and try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col justify-center h-[60vh] items-center space-y-3">
        <span className="loading loading-spinner loading-lg text-[#0038A8]"></span>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Loading Compensation Archive...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* DepEd Institutional Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
            Republic of the Philippines • Department of Education • SDO Lucena City
          </span>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center text-[#0038A8]">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Personal Compensation &amp; Payslip Archive
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Semi-Monthly Salary Disbursements • Civil Service Commission &amp; DBM SSL Schedule
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#0038A8] border border-blue-200 rounded font-semibold">
            <Wallet className="w-3.5 h-3.5" />
            Semi-Monthly Cutoffs
          </span>
        </div>
      </div>

      {payrolls.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Semi-Monthly Payslip Ledger Table (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-300 rounded-lg overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Salary Release History
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">
                {payrolls.length} Recorded Cycles
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px] uppercase tracking-wider">
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
                    const gross = Number(p.gross_salary || p.basic_salary || 0);
                    const deductions = Number(p.total_deductions || 0);
                    const net = Number(p.net_salary || gross - deductions);

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
                          ₱{gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-red-700">
                          -₱{deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-[#0038A8]">
                          ₱{net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              p.status === 'released'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : p.status === 'approved'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {p.status === 'released' ? 'Disbursed' : p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedPayroll(p)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                              isSelected
                                ? 'bg-[#0038A8] text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Docket
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 border-t border-slate-300 px-4 py-2 text-[11px] text-slate-500 flex justify-between">
              <span>Select any cutoff cycle to preview the itemized payslip breakdown.</span>
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
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      Department of Education • SDO Lucena City
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      Official Semi-Monthly Payslip Docket
                    </h3>
                    <span className="font-mono tabular-nums text-xs font-semibold text-[#0038A8]">
                      {activePayroll.cutoff_period}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDownloadPDF(activePayroll)}
                      title="Download signed PDF payslip"
                      className="p-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded transition-colors"
                    >
                      <Download className="w-4 h-4 text-[#0038A8]" />
                    </button>
                    <button
                      onClick={handlePrint}
                      title="Print payslip"
                      className="p-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded transition-colors"
                    >
                      <Printer className="w-4 h-4 text-slate-700" />
                    </button>
                  </div>
                </div>

                {/* Ratee & Workstation Metadata */}
                <div className="p-4 border-b border-slate-200 bg-white grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                      Employee Personnel
                    </span>
                    <strong className="text-slate-900 block mt-0.5">
                      {activePayroll.employee_name || 'Plantilla Employee'}
                    </strong>
                    <span className="text-slate-500 text-[11px] block">
                      Position: {activePayroll.position || 'Plantilla Staff'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                      Station / Division
                    </span>
                    <span className="text-slate-800 text-xs block mt-0.5 font-medium">
                      {activePayroll.department || 'SDO Lucena City'}
                    </span>
                    <span className="text-[11px] text-slate-500 block font-mono">
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
                      <span>Basic Salary (Attendance Computed)</span>
                      <span className="font-mono tabular-nums">
                        {Number(activePayroll.basic_salary || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-700 py-0.5">
                      <span>PERA Allowance (₱1,000 / semi-monthly)</span>
                      <span className="font-mono tabular-nums">
                        {Number(activePayroll.pera || 1000).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                      <span>Total Gross Compensation</span>
                      <span className="font-mono tabular-nums">
                        ₱
                        {Number(
                          activePayroll.gross_salary ||
                            Number(activePayroll.basic_salary) + Number(activePayroll.pera || 1000)
                        ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                      <span>GSIS Life &amp; Retirement (9%)</span>
                      <span className="font-mono tabular-nums text-red-700">
                        {Number(activePayroll.gsis || activePayroll.sss || 0).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 }
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-700 py-0.5">
                      <span>PhilHealth Contribution</span>
                      <span className="font-mono tabular-nums text-red-700">
                        {Number(activePayroll.philhealth || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-700 py-0.5">
                      <span>Pag-IBIG Contribution</span>
                      <span className="font-mono tabular-nums text-red-700">
                        {Number(activePayroll.pagibig || 100).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-700 py-0.5">
                      <span>Withholding Tax (TRAIN Law)</span>
                      <span className="font-mono tabular-nums text-red-700">
                        {Number(activePayroll.tax || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-700 py-0.5">
                      <span>Provident Loan Deductions</span>
                      <span className="font-mono tabular-nums text-red-700">
                        {Number(activePayroll.loans || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between font-bold text-red-700 pt-1 border-t border-slate-100">
                      <span>Total Deductions</span>
                      <span className="font-mono tabular-nums">
                        -₱
                        {Number(activePayroll.total_deductions || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Net Take-Home Pay Callout */}
                  <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      Net Take-Home Pay
                    </span>
                    <span className="text-2xl font-bold font-mono tabular-nums text-[#0038A8] block">
                      ₱
                      {Number(activePayroll.net_salary || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Disbursed to official LandBank payroll account
                    </span>
                  </div>
                </div>

                {/* Footer Notes */}
                <div className="bg-slate-50 border-t border-slate-200 p-3 text-center text-[10px] text-slate-400 font-mono">
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
