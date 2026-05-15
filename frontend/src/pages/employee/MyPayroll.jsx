import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
import { Wallet, Download, Eye, AlertCircle, FileText, Printer, FileCheck } from 'lucide-react';

/**
 * My Payslips (Employee View)
 * 
 * Simple, professional redesign for staff to view salary history.
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

  if (isLoading) return (
    <div className="p-8 flex justify-center h-[60vh] items-center">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <FileCheck className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">My Payslips</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">Salary history and details</p>
        </div>
      </div>

      {payrolls && payrolls.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* History List */}
          <div className="xl:col-span-2 space-y-4">
             <div className="bg-white rounded-xl shadow-sm border border-base-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="table table-sm w-full">
                    <thead>
                      <tr className="bg-base-50/50 border-b border-base-200 uppercase text-[10px] tracking-widest font-black opacity-50">
                        <th className="px-6 py-4 text-primary">Period</th>
                        <th className="px-6 py-4 text-right">Net Amount</th>
                        <th className="px-6 py-4">Processed</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-100">
                      {payrolls.map((p) => {
                        const netSalary = p.basic_salary - p.sss - p.philhealth - p.pagibig - p.tax - p.loans;
                        return (
                          <tr key={p.id} className={`hover:bg-base-50/30 transition-colors ${selectedPayroll?.id === p.id ? 'bg-primary/5' : ''}`}>
                            <td className="px-6 py-4 font-bold text-sm text-base-content uppercase">{p.cutoff_period}</td>
                            <td className="px-6 py-4 text-right">
                              <span className="font-black text-primary">₱{netSalary.toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4 text-[11px] font-medium opacity-50">
                              {new Date(p.date_generated).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => setSelectedPayroll(p)}
                                className="btn btn-ghost btn-xs text-primary font-black uppercase tracking-widest hover:bg-primary/5"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>

          {/* Payslip Viewer */}
          <div className="xl:col-span-1">
             {selectedPayroll ? (
                <div className="bg-white shadow-xl border border-base-200 rounded-xl overflow-hidden sticky top-8 animate-in fade-in zoom-in-95 duration-300">
                   <div className="bg-primary p-8 text-white">
                      <div className="flex justify-between items-start">
                         <div>
                           <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mb-1">Official Payslip</p>
                           <h3 className="font-black text-2xl uppercase tracking-tighter">{selectedPayroll.cutoff_period}</h3>
                         </div>
                         <button onClick={handlePrint} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
                            <Printer className="w-5 h-5" />
                         </button>
                      </div>
                   </div>
                   
                   <div className="p-8 space-y-8">
                      <div className="flex justify-between items-end border-b border-base-100 pb-4">
                         <div className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">DepEd Lucena HRIS</div>
                         <div className="text-right">
                            <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-1">Gross Salary</p>
                            <p className="font-black text-base-content">₱{parseFloat(selectedPayroll.basic_salary).toLocaleString()}</p>
                         </div>
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Deductions</p>
                        <div className="space-y-2">
                           {[
                             { label: 'SSS Contribution', value: selectedPayroll.sss },
                             { label: 'PhilHealth', value: selectedPayroll.philhealth },
                             { label: 'Pag-IBIG', value: selectedPayroll.pagibig },
                             { label: 'Withholding Tax', value: selectedPayroll.tax },
                             { label: 'Loan Repayment', value: selectedPayroll.loans }
                           ].map((d) => (
                             <div key={d.label} className="flex justify-between items-center py-1">
                                <span className="text-[11px] font-bold opacity-40 uppercase tracking-tight">{d.label}</span>
                                <span className="text-xs font-black text-error">₱{parseFloat(d.value).toLocaleString()}</span>
                             </div>
                           ))}
                        </div>
                      </div>

                      <div className="bg-primary/5 p-6 rounded-xl border border-primary/10 mt-8 text-center shadow-inner">
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-primary">Take Home Amount</p>
                         <h2 className="text-4xl font-black text-primary tracking-tighter">
                            ₱{(selectedPayroll.basic_salary - selectedPayroll.sss - selectedPayroll.philhealth - selectedPayroll.pagibig - selectedPayroll.tax - selectedPayroll.loans).toLocaleString()}
                         </h2>
                      </div>

                      <div className="pt-6 text-center opacity-20">
                         <p className="text-[8px] font-black uppercase leading-relaxed tracking-widest">Digital Copy • System Generated</p>
                      </div>
                   </div>
                </div>
             ) : (
                <div className="h-[400px] flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-base-300 opacity-40 text-center">
                   <FileText className="w-12 h-12 mb-4 opacity-20" />
                   <p className="text-xs font-black uppercase tracking-widest">Select a period to view details</p>
                </div>
             )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-40 bg-white rounded-xl border border-dashed border-base-300 opacity-40 text-center">
          <AlertCircle className="w-12 h-12 mb-3" />
          <p className="text-lg font-black uppercase tracking-widest">No records found</p>
        </div>
      )}
    </div>
  );
};

export default MyPayroll;
