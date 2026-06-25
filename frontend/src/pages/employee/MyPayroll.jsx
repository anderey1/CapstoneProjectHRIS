import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
import { Wallet, Download, Eye, AlertCircle, FileText, Printer, FileCheck, Info } from 'lucide-react';

/**
 * My Payslips (Employee View)
 * Redesigned, clean visual layout for staff to view salary history and download payslips.
 */
const MyPayroll = () => {
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  // 1. Data Fetching
  const { data: payrolls, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.PAYROLL],
    queryFn: async () => {
      const res = await api.get('payroll/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async (p) => {
    try {
      const response = await api.get(`payroll/${p.id}/export_payslip/`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip_${p.cutoff_period.replace(/ /g, '_').replace(/,/g, '')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download payslip PDF. Please try again.");
    }
  };

  const calculateNet = (p) => {
    if (!p) return 0;
    return parseFloat(p.basic_salary) - parseFloat(p.sss) - parseFloat(p.philhealth) - parseFloat(p.pagibig) - parseFloat(p.tax) - parseFloat(p.loans);
  };

  if (isLoading) return (
    <div className="p-8 flex justify-center h-[60vh] items-center">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 rotate-3 hover:rotate-0 transition-transform duration-300">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">My Payslips / Salaries</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                <p className="text-[10px] font-black opacity-45 uppercase tracking-widest">Personal Salary Records</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tip Box */}
        <div className="text-[10px] bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-blue-800 flex items-center gap-2 max-w-xs">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>Payslips are generated twice a month and are released after Accountant and Superintendent sign-offs.</span>
        </div>
      </div>

      {payrolls && payrolls.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: History List Table */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-base-200 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-base-100 bg-base-50/10">
                <h3 className="text-sm font-black uppercase tracking-wider text-base-content">Salary Release History</h3>
                <p className="text-[10px] font-bold opacity-30 mt-0.5 uppercase tracking-wide">Select a period to view details</p>
             </div>
             
             <div className="overflow-x-auto">
                <table className="table table-md w-full">
                  <thead>
                    <tr className="bg-base-50/20 border-b border-base-100 uppercase text-[9px] tracking-widest font-black opacity-40">
                      <th className="px-6 py-4">Pay Period</th>
                      <th className="px-6 py-4 text-right">Net Take-Home Pay</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Option</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-100 text-xs font-bold">
                    {payrolls.map((p) => {
                      const netSalary = calculateNet(p);
                      const isSelected = selectedPayroll?.id === p.id;
                      return (
                        <tr 
                          key={p.id} 
                          className={`hover:bg-base-50/50 transition-colors ${
                            isSelected ? 'bg-blue-50/40 text-blue-900' : ''
                          }`}
                        >
                          <td className="px-6 py-4 font-black text-sm uppercase">{p.cutoff_period}</td>
                          <td className="px-6 py-4 text-right font-black text-blue-700">
                            ₱{netSalary.toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider border ${
                                p.status === 'released' 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                  : p.status === 'approved' 
                                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                  : 'bg-amber-50 border-amber-200 text-amber-700'
                             }`}>
                                {p.status === 'released' ? 'Paid' : p.status}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => setSelectedPayroll(p)}
                              disabled={p.status !== 'released'}
                              className={`btn btn-xs rounded-lg uppercase tracking-wider ${
                                p.status === 'released'
                                  ? isSelected
                                    ? 'btn-primary'
                                    : 'btn-outline border-blue-200 hover:bg-blue-50 hover:text-blue-700 text-blue-600'
                                  : 'btn-disabled opacity-30'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              {p.status === 'released' ? 'View' : 'Processing'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
          </div>

          {/* RIGHT: Redesigned Interactive Payslip Viewer Card */}
          <div className="lg:col-span-5">
             {selectedPayroll ? (
                <div id="printable-payslip" className="bg-white shadow-xl border border-base-200 rounded-3xl overflow-hidden sticky top-8 animate-in fade-in zoom-in-95 duration-300">
                   
                   {/* Payslip Header Card */}
                   <div className="bg-gradient-to-br from-blue-900 to-blue-950 p-6 text-white relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none scale-150 rotate-12">
                        <Wallet className="w-40 h-40" />
                      </div>
                      
                      <div className="flex justify-between items-start">
                         <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase text-amber-400 tracking-[0.2em]">DEPED LUCENA CITY DIVISION</p>
                            <h3 className="font-black text-xl uppercase tracking-tight">{selectedPayroll.cutoff_period}</h3>
                            <p className="text-[8px] opacity-60">OFFICIAL DIGITAL PAYSLIP</p>
                         </div>
                         
                         {/* Action Buttons Row */}
                         <div className="flex gap-2">
                            <button 
                              onClick={() => handleDownloadPDF(selectedPayroll)} 
                              title="Download PDF Copy"
                              className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors text-white hover:text-amber-400"
                            >
                               <Download className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={handlePrint} 
                              title="Print Payslip"
                              className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors text-white"
                            >
                               <Printer className="w-4 h-4" />
                            </button>
                         </div>
                      </div>
                   </div>
                   
                   {/* Payslip Info Grid */}
                   <div className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4 border-b border-base-100 pb-4 text-xs">
                         <div>
                            <span className="block text-[8px] font-black uppercase opacity-35">Employee Name</span>
                            <span className="font-black text-sm text-base-content">{selectedPayroll.employee_name}</span>
                         </div>
                         <div>
                            <span className="block text-[8px] font-black uppercase opacity-35">Position</span>
                            <span className="font-black text-sm text-base-content">{selectedPayroll.employee_role || 'Teacher'}</span>
                         </div>
                      </div>

                      {/* Earnings vs Deductions Split Columns */}
                      <div className="grid grid-cols-2 gap-6 text-xs">
                        
                        {/* Left Side: Earnings */}
                        <div className="space-y-3">
                           <h4 className="text-[9px] font-black uppercase tracking-widest text-blue-700 border-b border-blue-100 pb-1">Earnings</h4>
                           <div className="space-y-2 font-bold">
                              <div className="flex justify-between">
                                 <span className="opacity-40 uppercase text-[9px]">Basic Rate</span>
                                 <span>₱{parseFloat(selectedPayroll.basic_salary).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                              </div>
                              <div className="flex justify-between text-blue-700">
                                 <span className="opacity-40 uppercase text-[9px]">Gross Pay</span>
                                 <span>₱{parseFloat(selectedPayroll.basic_salary).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                              </div>
                           </div>
                        </div>

                        {/* Right Side: Deductions */}
                        <div className="space-y-3">
                           <h4 className="text-[9px] font-black uppercase tracking-widest text-rose-600 border-b border-rose-100 pb-1">Deductions</h4>
                           <div className="space-y-1.5 font-bold">
                              <div className="flex justify-between">
                                 <span className="opacity-40 uppercase text-[9px]">SSS/GSIS</span>
                                 <span className="text-rose-600">₱{parseFloat(selectedPayroll.sss).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="opacity-40 uppercase text-[9px]">PhilHealth</span>
                                 <span className="text-rose-600">₱{parseFloat(selectedPayroll.philhealth).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="opacity-40 uppercase text-[9px]">Pag-IBIG</span>
                                 <span className="text-rose-600">₱{parseFloat(selectedPayroll.pagibig).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="opacity-40 uppercase text-[9px]">Loans</span>
                                 <span className="text-rose-600">₱{parseFloat(selectedPayroll.loans).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="opacity-40 uppercase text-[9px]">Tax</span>
                                 <span className="text-rose-600">₱{parseFloat(selectedPayroll.tax).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* Sub-total Summary Box */}
                      <div className="border-t border-base-100 pt-4 grid grid-cols-2 gap-4 text-xs font-black">
                         <div>
                            <span className="block text-[8px] uppercase opacity-35">Total Deductions</span>
                            <span className="text-rose-600 font-black text-sm">₱{parseFloat(selectedPayroll.total_deductions).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                         </div>
                         <div className="text-right">
                            <span className="block text-[8px] uppercase opacity-35">Gross Pay</span>
                            <span className="text-base-content font-black text-sm">₱{parseFloat(selectedPayroll.basic_salary).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                         </div>
                      </div>

                      {/* NET Pay Giant Callout */}
                      <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 mt-6 text-center">
                         <p className="text-[9px] font-black uppercase tracking-widest opacity-45 text-blue-700 mb-1">Your Net Pay (Take-Home)</p>
                         <h2 className="text-3xl font-black text-blue-800 tracking-tight">
                            ₱{calculateNet(selectedPayroll).toLocaleString(undefined, {minimumFractionDigits: 2})}
                         </h2>
                      </div>

                      <div className="pt-2 text-center opacity-30 text-[8px] font-bold uppercase tracking-widest leading-relaxed">
                         This is a digital copy generated by the DepEd HRIS system.
                      </div>
                   </div>
                </div>
             ) : (
                <div className="h-[380px] flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-dashed border-base-300 opacity-40 text-center">
                   <FileText className="w-12 h-12 mb-4 opacity-25" />
                   <p className="text-xs font-black uppercase tracking-widest leading-relaxed">Select a pay period to view detailed payslip breakdowns</p>
                </div>
             )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-base-300 opacity-40 text-center">
          <AlertCircle className="w-12 h-12 mb-3" />
          <p className="text-base font-black uppercase tracking-widest">No payslip records available yet</p>
        </div>
      )}
    </div>
  );
};

export default MyPayroll;
