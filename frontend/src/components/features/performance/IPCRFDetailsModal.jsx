import React from 'react';
import { X, Award, Printer, Download, FileText, CheckCircle2 } from 'lucide-react';
import { computeRPMSScore, getAdjectivalRating } from '../../../utils/performance';

/**
 * Performance Details Modal (IPCRF Official Docket View)
 * Conforming to DepEd Order No. 2, s. 2015 & CSC Resolution No. 1200481
 */
const IPCRFDetailsModal = ({ review, onClose }) => {
  if (!review) return null;

  const finalScore = computeRPMSScore(
    review.quality_score,
    review.behavior_score,
    review.punctuality_score
  );
  const adjectival = getAdjectivalRating(finalScore);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ipcrf-details-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-lg border border-slate-300 shadow-xl w-full max-w-2xl overflow-hidden my-8">
        {/* Institutional DepEd Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              Republic of the Philippines • Department of Education • SDO Lucena City
            </span>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#0038A8] shrink-0" />
              <h2 id="ipcrf-details-title" className="text-base font-bold text-slate-900">
                IPCRF Official Evaluation Summary Docket
              </h2>
            </div>
            <p className="text-xs text-slate-600">
              Results-Based Performance Management System (RPMS) • DepEd Order No. 2, s. 2015
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Docket Body */}
        <div className="p-6 space-y-6">
          {/* Ratee Information Ledger */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-md p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Ratee Personnel
                </span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  {review.employee_name || 'Plantilla Employee'}
                </span>
                <span className="text-slate-600 text-xs block mt-0.5">
                  Position: <strong className="font-semibold text-slate-800">{review.position || 'Plantilla Staff'}</strong>
                </span>
                <span className="text-slate-500 text-xs block">
                  Station / Dept: {review.department || 'SDO Lucena City'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Rating Period &amp; Date
                </span>
                <span className="text-sm font-bold text-[#0038A8] font-mono tabular-nums block mt-0.5">
                  {review.period}
                </span>
                <span className="text-slate-600 text-xs block mt-0.5">
                  Date Evaluated:{' '}
                  <span className="font-mono tabular-nums">
                    {review.date_evaluated
                      ? new Date(review.date_evaluated).toLocaleDateString()
                      : 'Pending'}
                  </span>
                </span>
                <span className="text-slate-500 text-xs block">
                  Official Record ID:{' '}
                  <span className="font-mono tabular-nums">#RPMS-{review.id?.toString().padStart(5, '0')}</span>
                </span>
              </div>
            </div>
          </div>

          {/* RPMS Dimension Scoring Matrix */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              RPMS Dimensions &amp; Weighted Computations
            </h3>

            <div className="border border-slate-200 rounded-md overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 font-bold">Dimension</th>
                    <th className="py-2.5 px-3 font-bold text-center">Weight</th>
                    <th className="py-2.5 px-3 font-bold text-center">Rating (1–5)</th>
                    <th className="py-2.5 px-3 font-bold text-right">Weighted Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-800">
                      Quality <span className="text-slate-500 text-[11px]">(Effectiveness &amp; Accuracy)</span>
                    </td>
                    <td className="py-2 px-3 text-center font-mono tabular-nums text-slate-600">40%</td>
                    <td className="py-2 px-3 text-center font-mono tabular-nums font-semibold text-slate-900">
                      {review.quality_score !== null && review.quality_score !== undefined
                        ? Number(review.quality_score).toFixed(2)
                        : '—'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {review.quality_score !== null && review.quality_score !== undefined
                        ? (Number(review.quality_score) * 0.4).toFixed(3)
                        : '—'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-800">
                      Efficiency <span className="text-slate-500 text-[11px]">(Resource Management &amp; Output)</span>
                    </td>
                    <td className="py-2 px-3 text-center font-mono tabular-nums text-slate-600">30%</td>
                    <td className="py-2 px-3 text-center font-mono tabular-nums font-semibold text-slate-900">
                      {review.behavior_score !== null && review.behavior_score !== undefined
                        ? Number(review.behavior_score).toFixed(2)
                        : '—'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {review.behavior_score !== null && review.behavior_score !== undefined
                        ? (Number(review.behavior_score) * 0.3).toFixed(3)
                        : '—'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-800">
                      Timeliness <span className="text-slate-500 text-[11px]">(Punctuality &amp; Deadlines)</span>
                    </td>
                    <td className="py-2 px-3 text-center font-mono tabular-nums text-slate-600">30%</td>
                    <td className="py-2 px-3 text-center font-mono tabular-nums font-semibold text-slate-900">
                      {review.punctuality_score !== null && review.punctuality_score !== undefined
                        ? Number(review.punctuality_score).toFixed(2)
                        : '—'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {review.punctuality_score !== null && review.punctuality_score !== undefined
                        ? (Number(review.punctuality_score) * 0.3).toFixed(3)
                        : '—'}
                    </td>
                  </tr>

                  {/* Summary Composite Row */}
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                    <td className="py-2.5 px-3 text-slate-900 uppercase">Composite Numerical Rating</td>
                    <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-700">100%</td>
                    <td className="py-2.5 px-3 text-center text-slate-400">—</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-sm text-[#0038A8]">
                      {finalScore !== null ? finalScore.toFixed(3) : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Adjectival Rating & Promotion Endorsement Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="border border-slate-200 rounded-md p-3 bg-white space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Official Adjectival Rating
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${adjectival.badgeClass}`}
                >
                  {adjectival.label} ({adjectival.code})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{adjectival.description}</p>
            </div>

            <div className="border border-slate-200 rounded-md p-3 bg-white space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Civil Service Promotion Endorsement
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border font-medium ${
                    review.is_promotion_eligible
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {review.is_promotion_eligible ? 'Endorsed for Promotion' : 'Regular Rating Recorded'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Minimum composite rating of 4.000 required for institutional promotion.
              </p>
            </div>
          </div>

          {/* Evaluation Remarks */}
          <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50 text-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Performance Remarks &amp; Division Assessment
            </span>
            <p className="text-slate-800 italic leading-relaxed">
              "{review.ai_summary || (review.ipcrf_file ? 'Official IPCRF portfolio uploaded for division records.' : 'No formal assessment notes recorded.')}"
            </p>
          </div>

          {/* Attached Portfolio File Link */}
          {review.ipcrf_file && (
            <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-200 rounded-md text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0038A8]" />
                <span className="font-semibold text-slate-800">
                  Signed IPCRF Portfolio Document
                </span>
              </div>
              <a
                href={review.ipcrf_file}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-[#0038A8] border border-blue-300 rounded font-semibold text-xs hover:bg-blue-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Attachment
              </a>
            </div>
          )}

          <div className="text-center pt-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
              Electronic Record • DepEd Division of Lucena City HRIS
            </p>
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0038A8] rounded-md hover:bg-[#002c85] transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Official Docket
          </button>
        </div>
      </div>
    </div>
  );
};

export default IPCRFDetailsModal;
