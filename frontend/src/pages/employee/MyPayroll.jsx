import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
import { Wallet, Download, Eye, AlertCircle, FileText, Printer } from 'lucide-react';

const MyPayroll = () => {
  const [selectedPayroll, setSelectedPayroll] = useState(null);

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

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-base-content flex items-center gap-3">
            <Wallet className="w-8 h-8 text-primary" />
            My Payroll & Payslips
          </h1>
          <p className="text-sm opacity-50 font-medium mt-1">Access your salary history and official digital payslips.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-20"><span className="loading loading-dots loading-lg" /></div>
      ) : payrolls && payrolls.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* History Table */}
          <div className="xl:col-span-2 bg-base-100 rounded-[2rem] shadow-xl border border-base-300 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead className="bg-base-200/50">
                  <tr className="border-b border-base-300 uppercase text-[10px] tracking-widest font-black opacity-50">
                    <th className="px-6 py-4">Cutoff Period</th>
                    <th className="px-6 py-4">Net Salary</th>
                    <th className="px-6 py-4">Date Processed</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((p) => (
                    <tr key={p.id} className={selectedPayroll?.id === p.id ? 'bg-primary/5' : ''}>
                      <td className="px-6 py-4 font-bold">{p.cutoff_period}</td>
                      <td className="px-6 py-4">
                        <span className="font-black text-primary">₱{(p.basic_salary - p.sss - p.philhealth - p.pagibig - p.tax - p.loans).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-sm opacity-60">
                        {new Date(p.date_generated).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedPayroll(p)}
                          className="btn btn-ghost btn-sm btn-circle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payslip Viewer */}
          <div className="xl:col-span-1">
             {selectedPayroll ? (
                <div className="card bg-base-100 shadow-2xl border border-primary/20 rounded-[2rem] overflow-hidden sticky top-8">
                   <div className="bg-primary p-6 text-white flex justify-between items-center">
                      <div>
                        <h3 className="font-black text-lg">Official Payslip</h3>
                        <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">{selectedPayroll.cutoff_period}</p>
                      </div>
                      <button onClick={handlePrint} className="btn btn-circle btn-sm bg-white/20 border-none text-white hover:bg-white/40">
                         <Printer className="w-4 h-4" />
                      </button>
                   </div>
                   <div className="card-body p-8 space-y-6">
                      <div className="flex justify-between items-end border-b border-base-300 pb-4">
                         <div className="opacity-50 uppercase text-[10px] font-black tracking-tighter">DepEd Lucena City HRIS</div>
                         <div className="text-right">
                            <p className="text-[10px] font-black opacity-30 uppercase tracking-tighter">Gross Salary</p>
                            <p className="font-bold">₱{parseFloat(selectedPayroll.basic_salary).toLocaleString()}</p>
                         </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Deductions Breakdown</p>
                        {[
                          { label: 'SSS Contribution', value: selectedPayroll.sss },
                          { label: 'PhilHealth', value: selectedPayroll.philhealth },
                          { label: 'Pag-IBIG', value: selectedPayroll.pagibig },
                          { label: 'Withholding Tax', value: selectedPayroll.tax },
                          { label: 'Loan Repayment', value: selectedPayroll.loans }
                        ].map((d) => (
                          <div key={d.label} className="flex justify-between text-sm">
                             <span className="opacity-60">{d.label}</span>
                             <span className="font-medium text-error">- ₱{parseFloat(d.value).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 mt-6 text-center">
                         <p className="text-xs font-black uppercase tracking-widest opacity-50 mb-1 text-primary">Net Salary</p>
                         <h2 className="text-4xl font-black text-primary">
                            ₱{(selectedPayroll.basic_salary - selectedPayroll.sss - selectedPayroll.philhealth - selectedPayroll.pagibig - selectedPayroll.tax - selectedPayroll.loans).toLocaleString()}
                         </h2>
                      </div>

                      <div className="pt-4 text-center opacity-30">
                         <p className="text-[8px] italic leading-tight">This is a system-generated document. No signature required for validation within the DepEd Lucena City Division Office.</p>
                      </div>
                   </div>
                </div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 bg-base-100 rounded-[2rem] border border-dashed border-base-300 opacity-40 text-center">
                   <FileText className="w-16 h-16 mb-4 opacity-20" />
                   <p className="font-bold">Select a cutoff period to view digital payslip details.</p>
                </div>
             )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-20 bg-base-100 rounded-[3rem] border border-dashed border-base-300 opacity-50">
          <AlertCircle className="w-12 h-12 mb-4" />
          <p className="font-bold">No payroll records found.</p>
        </div>
      )}
    </div>
  );
};

export default MyPayroll;
