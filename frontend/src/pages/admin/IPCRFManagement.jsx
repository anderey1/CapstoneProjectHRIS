import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { useAuth } from '../../context/AuthContext';
import { useRBAC, PERMISSIONS } from '../../hooks/useRBAC';
import IPCRFFormModal from '../../components/features/performance/IPCRFFormModal';
import IPCRFDetailsModal from '../../components/features/performance/IPCRFDetailsModal';
import { computeRPMSScore, getAdjectivalRating } from '../../utils/performance';

/**
 * Performance Ratings (RPMS / IPCRF Division Master Ledger)
 * Conforming to DepEd Order No. 2, s. 2015 & CSC Institutional Standards.
 */
const IPCRFManagement = () => {
  const { user } = useAuth();
  const { can } = useRBAC();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [editingReview, setEditingReview] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('ALL');

  const canRate = can(PERMISSIONS.RATE_PERFORMANCE) || ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'].includes(user?.role);

  // Data Fetching
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.PERFORMANCE],
    queryFn: async () => {
      const res = await api.get('performance/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
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

  // Distinct Periods for filter dropdown
  const uniquePeriods = useMemo(() => {
    const periods = new Set();
    reviews.forEach((r) => {
      if (r.period) periods.add(r.period);
    });
    return Array.from(periods);
  }, [reviews]);

  // Filtered Reviews & Summary Computations
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const finalScore = computeRPMSScore(r.quality_score, r.behavior_score, r.punctuality_score);
      const adjectival = getAdjectivalRating(finalScore);

      const matchesSearch =
        !searchQuery ||
        r.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.period?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPeriod = selectedPeriod === 'ALL' || r.period === selectedPeriod;
      const matchesRating = selectedRatingFilter === 'ALL' || adjectival.code === selectedRatingFilter;

      return matchesSearch && matchesPeriod && matchesRating;
    });
  }, [reviews, searchQuery, selectedPeriod, selectedRatingFilter]);

  // Operational Metrics
  const metrics = useMemo(() => {
    let outstandingCount = 0;
    let verySatisfactoryCount = 0;
    let eligibleCount = 0;

    reviews.forEach((r) => {
      const score = computeRPMSScore(r.quality_score, r.behavior_score, r.punctuality_score);
      if (score !== null) {
        if (score >= 4.5) outstandingCount += 1;
        else if (score >= 3.5) verySatisfactoryCount += 1;
      }
      if (r.is_promotion_eligible) eligibleCount += 1;
    });

    return {
      total: reviews.length,
      outstanding: outstandingCount,
      verySatisfactory: verySatisfactoryCount,
      eligible: eligibleCount,
    };
  }, [reviews]);

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col justify-center h-[60vh] items-center space-y-3">
        <span className="loading loading-spinner loading-lg text-[#0038A8]"></span>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Loading RPMS Division Master Ledger...
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
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                RPMS / IPCRF Performance Ledger
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Results-Based Performance Management System (RPMS) • DepEd Order No. 2, s. 2015 &amp; CSC Standards
          </p>
        </div>

        {canRate && (
          <button
            onClick={() => {
              setEditingReview(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0038A8] text-white rounded-md text-xs font-semibold hover:bg-[#002c85] transition-colors shadow-sm self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            New RPMS Assessment
          </button>
        )}
      </div>

      {/* 4-Metric Institutional Status Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Evaluations Recorded
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {metrics.total}
            </span>
            <span className="text-xs text-slate-500">records</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">Division personnel</span>
        </div>

        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Outstanding (O)
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              {metrics.outstanding}
            </span>
            <span className="text-xs text-slate-500">personnel</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">Score: 4.500 – 5.000</span>
        </div>

        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Very Satisfactory (VS)
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#0038A8]">
              {metrics.verySatisfactory}
            </span>
            <span className="text-xs text-slate-500">personnel</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">Score: 3.500 – 4.499</span>
        </div>

        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Promotion Eligible
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {metrics.eligible}
            </span>
            <span className="text-xs text-slate-500">qualified</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">Meets CSC rating threshold</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-300 rounded-lg p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee, plantilla, or period..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0038A8] focus:border-[#0038A8]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Period Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0038A8]"
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
            value={selectedRatingFilter}
            onChange={(e) => setSelectedRatingFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0038A8]"
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
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px] uppercase tracking-wider">
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
                        <div className="text-[11px] text-slate-500">
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
                        <div className="inline-flex items-center gap-1 font-mono tabular-nums text-[11px]">
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
                            className="inline-flex items-center gap-1 text-[#0038A8] hover:underline font-medium text-xs"
                            title="Download official signed document"
                          >
                            <Download className="w-3.5 h-3.5" />
                            PDF/File
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReview(r)}
                            title="View official evaluation docket"
                            className="p-1 text-slate-600 hover:text-[#0038A8] rounded transition-colors"
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
        </div>

        {/* Footer Ledger Metadata */}
        <div className="bg-slate-50 border-t border-slate-300 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-600">
          <span>
            Showing <strong className="font-semibold text-slate-800">{filteredReviews.length}</strong> of{' '}
            <strong className="font-semibold text-slate-800">{reviews.length}</strong> evaluation records
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
