import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
import {
  Award,
  Plus,
  Eye,
  Download,
  BarChart3,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import IPCRFDetailsModal from '../../components/features/performance/IPCRFDetailsModal';
import IPCRFFormModal from '../../components/features/performance/IPCRFFormModal';
import { computeRPMSScore, getAdjectivalRating } from '../../utils/performance';

/**
 * My Performance Ratings (Personal RPMS / IPCRF Portfolio)
 * Conforming to DepEd Order No. 2, s. 2015 & CSC Regulations.
 */
const MyIPCRF = () => {
  const [selectedReview, setSelectedReview] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.PERFORMANCE],
    queryFn: async () => {
      const res = await api.get('performance/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  // Latest Evaluation Record
  const latestReview = useMemo(() => {
    if (!reviews || reviews.length === 0) return null;
    return reviews[0];
  }, [reviews]);

  const latestScore = useMemo(() => {
    if (!latestReview) return null;
    return computeRPMSScore(
      latestReview.quality_score,
      latestReview.behavior_score,
      latestReview.punctuality_score
    );
  }, [latestReview]);

  const latestAdjectival = useMemo(() => {
    return getAdjectivalRating(latestScore);
  }, [latestScore]);

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col justify-center h-[60vh] items-center space-y-3">
        <span className="loading loading-spinner loading-lg text-[#0038A8]"></span>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Loading Personal RPMS Portfolio...
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
            Department of Education • SDO Lucena City
          </span>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center text-[#0038A8]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                My RPMS / IPCRF Portfolio
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Civil Service Commission &amp; DepEd Order No. 2, s. 2015 Personal Performance Records
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0038A8] text-white rounded-md text-xs font-semibold hover:bg-[#002c85] transition-colors shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Submit Signed IPCRF Portfolio
        </button>
      </div>

      {/* Personal Status Summary Strip */}
      {latestReview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Latest Period
            </span>
            <span className="text-lg font-bold font-mono text-slate-900 block mt-1">
              {latestReview.period}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Evaluated:{' '}
              {latestReview.date_evaluated
                ? new Date(latestReview.date_evaluated).toLocaleDateString()
                : 'Pending'}
            </span>
          </div>

          <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Composite Rating
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold font-mono tabular-nums text-[#0038A8]">
                {latestScore !== null ? latestScore.toFixed(3) : '—'}
              </span>
              <span className="text-xs text-slate-500">/ 5.000</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">RPMS Weighted score</span>
          </div>

          <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Adjectival Rating
            </span>
            <div className="mt-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${latestAdjectival.badgeClass}`}
              >
                {latestAdjectival.label} ({latestAdjectival.code})
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1 truncate">
              {latestAdjectival.description}
            </span>
          </div>

          <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Promotion Standing
            </span>
            <div className="mt-1">
              <span
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium ${
                  latestReview.is_promotion_eligible
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                {latestReview.is_promotion_eligible ? 'Endorsed Eligible' : 'Standard Rating'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">CSC Minimum ≥ 4.000</span>
          </div>
        </div>
      )}

      {/* Chronological Rating History Table */}
      <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Chronological IPCRF Rating History
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            Total Records: <strong className="font-semibold text-slate-800">{reviews.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 font-bold">Evaluation Period</th>
                <th className="py-3 px-4 font-bold">Date Evaluated</th>
                <th className="py-3 px-3 font-bold text-center">Quality (40%)</th>
                <th className="py-3 px-3 font-bold text-center">Efficiency (30%)</th>
                <th className="py-3 px-3 font-bold text-center">Timeliness (30%)</th>
                <th className="py-3 px-3 font-bold text-center">Final Score</th>
                <th className="py-3 px-4 font-bold text-center">Adjectival Rating</th>
                <th className="py-3 px-3 font-bold text-center">Promotion</th>
                <th className="py-3 px-3 font-bold text-center">Signed Portfolio</th>
                <th className="py-3 px-4 font-bold text-right">Official Docket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reviews.length > 0 ? (
                reviews.map((r) => {
                  const finalScore = computeRPMSScore(
                    r.quality_score,
                    r.behavior_score,
                    r.punctuality_score
                  );
                  const adjectival = getAdjectivalRating(finalScore);

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Period */}
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 text-xs">
                        {r.period}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-600 text-xs">
                        {r.date_evaluated
                          ? new Date(r.date_evaluated).toLocaleDateString()
                          : 'Pending'}
                      </td>

                      {/* Quality */}
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-800 text-xs">
                        {r.quality_score !== null && r.quality_score !== undefined
                          ? Number(r.quality_score).toFixed(2)
                          : '—'}
                      </td>

                      {/* Efficiency */}
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-800 text-xs">
                        {r.behavior_score !== null && r.behavior_score !== undefined
                          ? Number(r.behavior_score).toFixed(2)
                          : '—'}
                      </td>

                      {/* Timeliness */}
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-800 text-xs">
                        {r.punctuality_score !== null && r.punctuality_score !== undefined
                          ? Number(r.punctuality_score).toFixed(2)
                          : '—'}
                      </td>

                      {/* Final Composite Score */}
                      <td className="py-3 px-3 text-center font-mono tabular-nums font-bold text-[#0038A8] text-xs">
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

                      {/* Promotion Standing */}
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

                      {/* Attached Portfolio File */}
                      <td className="py-3 px-3 text-center">
                        {r.ipcrf_file ? (
                          <a
                            href={r.ipcrf_file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#0038A8] hover:underline font-medium text-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            File
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedReview(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#0038A8] bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Docket
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-xs text-slate-500">
                    <BarChart3 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No official RPMS / IPCRF evaluation records on file.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedReview && (
        <IPCRFDetailsModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      )}

      {showUploadModal && (
        <IPCRFFormModal
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
};

export default MyIPCRF;
