import React from 'react';
import { Search } from 'lucide-react';

/**
 * Filter controls, tabs, and search bar for the division leave docket.
 */
const LeaveDocketFilterBar = ({
  activeTab,
  setActiveTab,
  totalPendingCount = 0,
  approvedCount = 0,
  rejectedCount = 0,
  filterType,
  setFilterType,
  searchTerm,
  setSearchTerm,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded border border-slate-200">
      {/* Institutional Tabs */}
      <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50">
        <button
          type="button"
          className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
            activeTab === 'pending'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({totalPendingCount})
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
            activeTab === 'approved'
              ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('approved')}
        >
          Approved ({approvedCount})
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
            activeTab === 'rejected'
              ? 'bg-white text-rose-800 shadow-xs border border-slate-200/80 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('rejected')}
        >
          Disapproved ({rejectedCount})
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
            activeTab === 'all'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('all')}
        >
          All Applications
        </button>
      </div>

      {/* Filter & Search */}
      <div className="flex items-center gap-2">
        <select
          className="select select-bordered select-xs h-8 text-xs font-medium bg-white border-slate-200 rounded"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Leave Types</option>
          <option value="vacation">Vacation Leave</option>
          <option value="forced">Mandatory/Forced Leave</option>
          <option value="sick">Sick Leave</option>
          <option value="maternity">Maternity Leave</option>
          <option value="paternity">Paternity Leave</option>
          <option value="special_privilege">Special Privilege Leave</option>
          <option value="solo_parent">Solo Parent Leave</option>
          <option value="study">Study Leave</option>
          <option value="vawc">10-Day VAWC Leave</option>
          <option value="rehabilitation">Rehabilitation Privilege</option>
          <option value="women_special">Special Benefits for Women</option>
          <option value="emergency">Special Emergency Leave</option>
          <option value="adoption">Adoption Leave</option>
          <option value="others">Others</option>
        </select>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search applicant or station..."
            className="input input-bordered input-xs h-8 pl-8 text-xs bg-white border-slate-200 rounded w-48 lg:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default LeaveDocketFilterBar;
