import React, { useState } from 'react';
import { MONTHS, createCutoff, getCutoffStatus } from './payrollConstants';
import { payrollStatusLabel } from '../utils/payrollDisplay';

const PayrollCutoffSelector = ({ selectedCutoff, onSelectCutoff, allPayrolls = [], dataAvailable = true }) => {
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [half, setHalf] = useState(() => new Date().getDate() <= 15 ? 1 : 2);
  const period = createCutoff(Number(year), month, half);
  const periods = [...new Set([selectedCutoff, ...allPayrolls.map(p => p.cutoff_period)].filter(Boolean))];
  const fieldClass = 'select select-bordered min-h-11 w-full text-sm bg-white border-slate-300';

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-4 space-y-4" aria-label="Payroll cutoff schedule">
      <h2 className="text-sm font-bold text-slate-800">Payroll cutoff schedule</h2>
      <div>
        <label htmlFor="payroll-recorded-period" className="block text-sm text-slate-700">Selected or recorded period</label>
        <select id="payroll-recorded-period" className={`${fieldClass} mt-1`} value={selectedCutoff} onChange={e => onSelectCutoff(e.target.value)}>
          {periods.map(value => (
            <option key={value} value={value}>
              {value} ({payrollStatusLabel(dataAvailable ? getCutoffStatus(allPayrolls.filter(p => p.cutoff_period === value)) : 'unavailable')})
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div>
          <label htmlFor="payroll-month" className="text-sm text-slate-700">Month</label>
          <select id="payroll-month" className={`${fieldClass} mt-1`} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((name, index) => <option key={name} value={index}>{name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="payroll-year" className="text-sm text-slate-700">Year</label>
          <input id="payroll-year" className="input input-bordered min-h-11 w-full mt-1 text-sm border-slate-300" type="number" min="1000" max="9999" step="1" value={year} onChange={e => setYear(e.target.value)} />
        </div>
        <div>
          <label htmlFor="payroll-half" className="text-sm text-slate-700">Semi-monthly period</label>
          <select id="payroll-half" className={`${fieldClass} mt-1`} value={half} onChange={e => setHalf(Number(e.target.value))}>
            <option value={1}>1st to 15th</option>
            <option value={2}>16th to month end</option>
          </select>
        </div>
        <button type="button" className="btn min-h-11 bg-[#0038A8] text-white hover:bg-[#002d86]" disabled={!period} onClick={() => onSelectCutoff(period)}>Select period</button>
      </div>
      {!period && <p role="alert" className="text-sm text-red-700">Enter a four-digit year from 1000 to 9999.</p>}
      <p className="text-sm text-slate-600">Current selection: {selectedCutoff}</p>
    </section>
  );
};

export default PayrollCutoffSelector;
