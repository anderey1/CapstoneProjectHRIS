import React from 'react';
import { Search, Trash2 } from 'lucide-react';

export const RECRUITMENT_COLUMNS = [
  { id: 'applied', label: 'New Applications', color: 'bg-primary/10 text-primary border-primary/20' },
  { id: 'initial_evaluation', label: 'Initial Review', color: 'bg-primary/20 text-primary border-primary/30' },
  { id: 'comparative_assessment', label: 'Comparative Assessment', color: 'bg-primary/10 text-primary border-primary/20' },
  { id: 'interview', label: 'Interviews', color: 'bg-secondary/20 text-base-content border-secondary/30' },
  { id: 'appointment_proposed', label: 'Ready for Hiring', color: 'bg-primary/10 text-primary border-primary/20' },
  { id: 'hired', label: 'Hired', color: 'bg-success/10 text-success border-success/20' },
  { id: 'rejected', label: 'Not Selected', color: 'bg-error/10 text-error border-error/20' },
];

/**
 * Stage filter toolbar and Comparative Assessment Result (CAR) table.
 */
const RecruitmentTable = ({
  applicants = [],
  filteredApplicants = [],
  searchTerm,
  setSearchTerm,
  activeStage,
  setActiveStage,
  stageCounts = {},
  isLoading,
  onSelectApplicant,
  onDeleteApplicant,
}) => {
  return (
    <div className="space-y-4">
      {/* Stage Selector Tabs & Search Bar */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-300 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate by name or position applied..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 focus:bg-white border border-slate-300 focus:border-[#0038A8] rounded text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0038A8]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500 shrink-0 font-medium">
            Showing{' '}
            <span className="font-mono tabular-nums font-semibold text-slate-800">
              {filteredApplicants.length}
            </span>{' '}
            of{' '}
            <span className="font-mono tabular-nums text-slate-800">{applicants.length}</span>{' '}
            candidates
          </div>
        </div>

        {/* Stage Tabs */}
        <div className="flex flex-wrap gap-1.5 border-t border-slate-200 pt-2.5">
          <button
            type="button"
            onClick={() => setActiveStage('all')}
            className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded transition-colors ${
              activeStage === 'all'
                ? 'bg-[#0038A8] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Stages ({applicants.length})
          </button>
          {RECRUITMENT_COLUMNS.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => setActiveStage(col.id)}
              className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 ${
                activeStage === col.id
                  ? 'bg-[#0038A8] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{col.label}</span>
              <span
                className={`px-1 py-0.2 rounded text-[10px] font-mono tabular-nums ${
                  activeStage === col.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {stageCounts[col.id] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* High-Density CAR Evaluation Ledger Table */}
      <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-primary">
            <span className="loading loading-spinner loading-lg text-[#0038A8]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-xs tracking-wider">
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Position Applied</th>
                  <th className="px-4 py-3 text-right">Education</th>
                  <th className="px-4 py-3 text-right">Training</th>
                  <th className="px-4 py-3 text-right">Experience</th>
                  <th className="px-4 py-3 text-right">Demo / Exam</th>
                  <th className="px-4 py-3 text-right">Interview</th>
                  <th className="px-4 py-3 text-right">Total Score</th>
                  <th className="px-4 py-3">Application Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredApplicants.length > 0 ? (
                  filteredApplicants.map((applicant) => (
                    <tr
                      key={applicant.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => onSelectApplicant(applicant)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {applicant.first_name}{' '}
                          {applicant.middle_name ? `${applicant.middle_name} ` : ''}
                          {applicant.last_name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {applicant.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {applicant.position_applied}
                        <div className="text-xs text-slate-500">
                          Applied:{' '}
                          {new Date(applicant.date_applied).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                        {applicant.education_score || 0}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                        {applicant.training_score || 0}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                        {applicant.experience_score || 0}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                        {(
                          (Number(applicant.demo_teaching_score) || 0) +
                          (Number(applicant.exam_score) || 0)
                        ).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                        {applicant.interview_score || 0}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-[#0038A8]">
                        {applicant.total_score || 0}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-tight border ${
                            applicant.status === 'hired'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : applicant.status === 'rejected' ||
                                applicant.status === 'disqualified'
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : applicant.status === 'appointment_proposed'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {RECRUITMENT_COLUMNS.find((c) => c.id === applicant.status)?.label ||
                            applicant.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectApplicant(applicant)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                          >
                            Review
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteApplicant(applicant.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            title="Remove applicant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-4 py-12 text-center text-slate-400 italic">
                      No candidate records found under this evaluation stage.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruitmentTable;
