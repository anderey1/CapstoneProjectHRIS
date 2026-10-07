import React from 'react';
import { Check, Circle } from 'lucide-react';

const PayrollWorkflowStepper = ({ cutoffStatus }) => {
  const steps = [
    {
      num: 1,
      name: 'Preparation & Calculation',
      actor: 'Division Accountant',
      isComplete: cutoffStatus === 'draft' || cutoffStatus === 'approved' || cutoffStatus === 'released',
      isCurrent: cutoffStatus === 'unprepared',
      desc: 'Computes gross earnings, statutory GSIS 9%, PhilHealth, Pag-IBIG, and loan deductions from DTR.',
    },
    {
      num: 2,
      name: 'Certification & Approval',
      actor: 'Schools Division Superintendent',
      isComplete: cutoffStatus === 'approved' || cutoffStatus === 'released',
      isCurrent: cutoffStatus === 'draft',
      desc: 'Audits General Payroll summary, signs Form 7, and authorizes the Disbursement Voucher (DV).',
    },
    {
      num: 3,
      name: 'Disbursement & ATM Credit',
      actor: 'LandBank of the Philippines',
      isComplete: cutoffStatus === 'released',
      isCurrent: cutoffStatus === 'approved',
      desc: 'Credits net salaries to employee ATM accounts, locks ledger, and releases digital payslips.',
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Division Payroll Processing Pipeline
          </h2>
          <p className="text-[11px] text-slate-500">
            Civil Service Commission & Commission on Audit (COA) compliance chain
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map((step) => {
          let badgeBorder = 'border-slate-200 bg-slate-50 text-slate-600';
          let icon = <Circle className="w-3.5 h-3.5 text-slate-400" />;

          if (step.isComplete) {
            badgeBorder = 'border-emerald-200 bg-emerald-50/60 text-emerald-900';
            icon = (
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <Check className="w-3 h-3 stroke-3" />
              </span>
            );
          } else if (step.isCurrent) {
            badgeBorder = 'border-[#0038A8] bg-blue-50/70 text-slate-900 ring-1 ring-[#0038A8]';
            icon = (
              <span className="w-4 h-4 rounded-full bg-[#0038A8] text-white flex items-center justify-center text-[10px] font-bold">
                {step.num}
              </span>
            );
          }

          return (
            <div
              key={step.num}
              className={`p-3 rounded-md border flex flex-col justify-between transition-colors ${badgeBorder}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-xs font-bold">{step.name}</span>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-slate-600 mb-1">
                  Responsible: <span className="font-bold text-slate-800">{step.actor}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  {step.desc}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-semibold">
                <span className="text-slate-400 uppercase tracking-wider">Status</span>
                <span className={step.isComplete ? 'text-emerald-700' : step.isCurrent ? 'text-[#0038A8]' : 'text-slate-500'}>
                  {step.isComplete ? 'Completed' : step.isCurrent ? 'Active In Progress' : 'Pending Previous Step'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PayrollWorkflowStepper;
