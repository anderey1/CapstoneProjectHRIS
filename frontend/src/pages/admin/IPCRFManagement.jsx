import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
import {
  Award,
  Plus,
  Trash2,
  Search,
  Filter,
  Eye,
  Download,
  BarChart3,
} from 'lucide-react';
import { useRBAC } from '../../hooks/useRBAC';
import IPCRFFormModal from '../../features/performance/components/IPCRFFormModal';
import IPCRFDetailsModal from '../../features/performance/components/IPCRFDetailsModal';
import { computeRPMSScore, getAdjectivalRating } from '../../utils/performance';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import Pagination from '../../components/common/Pagination';
import PageHeader from '../../components/common/PageHeader';
import StatCards from '../../components/common/StatCards';
import PageLoader from '../../components/common/PageLoader';

/**
 * Performance Ratings (RPMS / IPCRF Division Master Ledger)
 * Conforming to DepEd Order No. 2, s. 2015 & CSC Institutional Standards.
 */
const IPCRFManagement = () => {
  const { can } = useRBAC();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [editingReview, setEditingReview] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('ALL');

  const canRate = can('RATE_PERFORMANCE');

  // Data Fetching
  const { records: filteredReviews, summary, pagination, isLoading } = usePaginatedList(QUERY_KEYS.PERFORMANCE, 'performance/', {
    search: searchQuery, period: selectedPeriod, rating: selectedRatingFilter,
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`performance/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERFORMANCE] });
    },
  });

  const handleDelete = (id, employeeName) => {
    if (window.confirm(`Are you sure you want to remove the IPCRF performance record for ${employeeName || 'this employee'}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const uniquePeriods = summary.periods || [];
  const metrics = { total: 0, outstanding: 0, verySatisfactory: 0, eligible: 0, ...summary };

  if (isLoading) {
    return <PageLoader label="Loading RPMS Division Master Ledger..." />;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        icon={Award}
        title="Performance reviews (RPMS / IPCRF)"
        subtitle="Results-Based Performance Management System (RPMS) · DepEd Order No. 2, s. 2015 & CSC Standards"
      >
        {canRate && (
          <button
            type="button"
            onClick={() => {
              setEditingReview(null);
              setShowModal(true);
            }}
            className="btn btn-primary btn-sm gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New RPMS Assessment
          </button>
        )}
      </PageHeader>

      <StatCards
        ariaLabel="RPMS performance metrics"
        stats={[
          { label: 'Evaluations Recorded', value: metrics.total, description: 'Division personnel' },
          { label: 'Outstanding (O)', value: metrics.outstanding, valueClass: 'text-emerald-700', description: 'Score: 4.500 – 5.000' },
          { label: 'Very Satisfactory (VS)', value: metrics.verySatisfactory, valueClass: 'text-primary', description: 'Score: 3.500 – 4.499' },
          { label: 'Promotion Eligible', value: metrics.eligible, description: 'Meets CSC rating threshold' },
        ]}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-300 rounded-lg p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Search performance reviews"
              placeholder="Search employee, plantilla, or period..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Period Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              aria-label="Filter by review period"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Rating Periods</option>
              {uniquePeriods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Adjectival Rating Filter */}
          <select
            aria-label="Filter by rating"
              value={selectedRatingFilter}
            onChange={(e) => setSelectedRatingFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Adjectival Ratings</option>
            <option value="O">Outstanding (O)</option>
            <option value="VS">Very Satisfactory (VS)</option>
            <option value="S">Satisfactory (S)</option>
            <option value="US">Unsatisfactory (US)</option>
            <option value="P">Poor (P)</option>
          </select>
        </div>
      </div>

      {/* Master RPMS Evaluation Table */}
      <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">Ratee Personnel</th>
                <th className="py-3 px-4 font-bold">Plantilla Position</th>
                <th className="py-3 px-4 font-bold">Rating Period</th>
                <th className="py-3 px-3 font-bold text-center">RPMS Breakdown (Q / E / T)</th>
                <th className="py-3 px-3 font-bold text-center">Numerical Score</th>
                <th className="py-3 px-4 font-bold text-center">Adjectival Rating</th>
                <th className="py-3 px-3 font-bold text-center">Promotion</th>
                <th className="py-3 px-3 font-bold text-center">Signed Portfolio</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((r) => {
                  const finalScore = computeRPMSScore(
                    r.quality_score,
                    r.behavior_score,
                    r.punctuality_score
                  );
                  const adjectival = getAdjectivalRating(finalScore);

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Ratee Personnel */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-xs">
                          {r.employee_name || 'Plantilla Employee'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {r.department || 'SDO Lucena City'}
                        </div>
                      </td>

                      {/* Plantilla Position */}
                      <td className="py-3 px-4 text-slate-700 font-medium text-xs">
                        {r.position || 'Plantilla Personnel'}
                      </td>

                      {/* Rating Period */}
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-800 text-xs">
                        {r.period}
                      </td>

                      {/* RPMS Breakdown (Q: 40%, E: 30%, T: 30%) */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1 font-mono tabular-nums text-xs">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200" title="Quality (40%)">
                            Q:{r.quality_score ?? '—'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200" title="Efficiency (30%)">
                            E:{r.behavior_score ?? '—'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200" title="Timeliness (30%)">
                            T:{r.punctuality_score ?? '—'}
                          </span>
                        </div>
                      </td>

                      {/* Numerical Score */}
                      <td className="py-3 px-3 text-center font-mono tabular-nums font-bold text-slate-900 text-xs">
                        {finalScore !== null ? finalScore.toFixed(3) : '—'}
                      </td>

                      {/* Adjectival Rating */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border ${adjectival.badgeClass}`}
                        >
                          {adjectival.label}
                        </span>
                      </td>

                      {/* Promotion Eligibility */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded border font-medium ${
                            r.is_promotion_eligible
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {r.is_promotion_eligible ? 'Eligible' : 'Regular'}
                        </span>
                      </td>

                      {/* Signed IPCRF Portfolio */}
                      <td className="py-3 px-3 text-center">
                        {r.ipcrf_file ? (
                          <a
                            href={r.ipcrf_file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-xs"
                            title="Download official signed document"
                          >
                            <Download className="w-3.5 h-3.5" />
                            PDF/File
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReview(r)}
                            title="View official evaluation docket"
                            className="p-1 text-slate-600 hover:text-primary rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canRate && (
                            <button
                              onClick={() => {
                                setEditingReview(r);
                                setShowModal(true);
                              }}
                              title="Edit evaluation"
                              className="p-1 text-slate-600 hover:text-slate-900 rounded transition-colors text-xs font-semibold"
                            >
                              Edit
                            </button>
                          )}
                          {canRate && (
                            <button
                              onClick={() => handleDelete(r.id, r.employee_name)}
                              title="Delete record"
                              className="p-1 text-slate-400 hover:text-red-700 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-xs text-slate-500">
                    <BarChart3 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No RPMS / IPCRF evaluation records matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination pagination={pagination} label="performance reviews" />
        </div>

        {/* Footer Ledger Metadata */}
        <div className="bg-slate-50 border-t border-slate-300 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing <strong className="font-semibold text-slate-800">{filteredReviews.length}</strong> of{' '}
            <strong className="font-semibold text-slate-800">{pagination.count}</strong> matching evaluation records
          </span>
          <span className="font-mono text-slate-500">Official DepEd Lucena City Division Ledger</span>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <IPCRFFormModal
          review={editingReview}
          onClose={() => {
            setShowModal(false);
            setEditingReview(null);
          }}
        />
      )}

      {selectedReview && (
        <IPCRFDetailsModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      )}
    </div>
  );
};

export default IPCRFManagement;
