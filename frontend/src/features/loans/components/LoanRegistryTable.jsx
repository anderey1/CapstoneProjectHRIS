import React from 'react';
import { Eye, FileSpreadsheet, Search } from 'lucide-react';

const PURPOSE_LABELS = {
  general: 'General Purpose',
  medical: 'Medical Emergency',
  calamity: 'Calamity Relief',
  educational: 'Educational Aid',
  emergency: 'Emergency Need',
};

const PURPOSE_BADGES = {
  general: 'bg-slate-100 text-slate-700 border-slate-200',
  medical: 'bg-rose-50 text-rose-800 border-rose-200',
  calamity: 'bg-amber-50 text-amber-800 border-amber-200',
  educational: 'bg-blue-50 text-blue-800 border-blue-200',
  emergency: 'bg-rose-50 text-rose-800 border-rose-200',
};

const formatCurrency = (val) => {
  const num = parseFloat(val) || 0;
  return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Filter tabs, search toolbar, and table for Provident Fund loans registry.
 */
const LoanRegistryTable = ({
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  tabCounts = {},
  filteredLoans = [],
  onSelectLoan,
}) => {
  const tabs = [
    { key: 'all', label: 'All Applications', count: tabCounts.all || 0 },
    { key: 'pending', label: '1. To Verify', count: tabCounts.pending || 0 },
    { key: 'verified', label: '2. To Approve', count: tabCounts.verified || 0 },
    { key: 'approved', label: '3. Wait Release', count: tabCounts.approved || 0 },
    { key: 'released', label: '4. Active / Servicing', count: tabCounts.released || 0 },
    { key: 'rejected', label: 'Disapproved', count: tabCounts.rejected || 0 },
  ];

  return (
    <div className="space-y-4">
      {/* Segmented Stage Filter Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-2 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#0038A8] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search borrower or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-sm input-bordered w-full pl-8.5 bg-slate-50 border-slate-200 text-xs rounded-md"
          />
        </div>
      </div>

      {/* Main Registry Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Provident Fund Loans ({filteredLoans.length} Records)
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Semi-monthly amortizations automatically deducted via General Payroll
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3">Loan Ref</th>
                <th className="px-4 py-3">Borrower & Station</th>
                <th className="px-3 py-3 text-right">Principal</th>
                <th className="px-3 py-3 text-center">Term / Rate</th>
                <th className="px-3 py-3 text-right">Amortization</th>
                <th className="px-3 py-3">Loan Purpose</th>
                <th className="px-3 py-3 text-center">Audit Stage</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => {
                  const principalVal = parseFloat(loan.loan_amount) || 0;
                  const monthlyVal = parseFloat(loan.monthly_payment) || 0;

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        PF-{loan.id.toString().padStart(4, '0')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {loan.employee_name}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {loan.department || 'Division Office'}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-slate-800">
                        {formatCurrency(principalVal)}
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-slate-600">
                        {loan.term_months} mos @ {loan.interest_rate}%
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-[#0038A8]">
                        {formatCurrency(monthlyVal)}/mo
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
                            PURPOSE_BADGES[loan.purpose] ||
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {PURPOSE_LABELS[loan.purpose] || loan.purpose}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border uppercase ${
                            loan.status === 'released' || loan.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : loan.status === 'approved'
                              ? 'bg-blue-50 text-[#0038A8] border-blue-200'
                              : loan.status === 'verified'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : loan.status === 'pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {loan.status === 'verified' ? 'Awaiting Superintendent' : loan.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectLoan(loan)}
                          className="btn btn-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold px-3 h-8 shadow-xs"
                        >
                          {loan.status === 'released' || loan.status === 'paid' ? (
                            <>
                              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-[#0038A8]" />
                              Payment History
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                              Review
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400 italic">
                    No loan applications found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoanRegistryTable;
export { PURPOSE_LABELS, PURPOSE_BADGES };
