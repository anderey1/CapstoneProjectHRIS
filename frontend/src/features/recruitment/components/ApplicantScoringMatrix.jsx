import React from 'react';
import { Star } from 'lucide-react';

export const SCORE_CRITERIA = [
  { key: 'education_score', label: 'Education', max: 10 },
  { key: 'training_score', label: 'Training', max: 10 },
  { key: 'experience_score', label: 'Experience', max: 10 },
  { key: 'demo_teaching_score', label: 'Demo Teaching', max: 35 },
  { key: 'exam_score', label: 'TRF / Exam', max: 25 },
  { key: 'interview_score', label: 'Interview', max: 10 },
];

/**
 * Comparative Assessment Rubrics & Score Editor.
 */
const ApplicantScoringMatrix = ({
  applicant,
  scores,
  setScores,
  isEditingScores,
  setIsEditingScores,
  onSaveScores,
  isSaving,
}) => {
  if (!applicant) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold tracking-wide text-slate-600 flex items-center gap-2">
          <Star className="w-3 h-3" /> Applicant Assessment Scores
        </h4>
        {!isEditingScores ? (
          <button
            type="button"
            onClick={() => {
              setScores({
                education_score: applicant.education_score || 0,
                training_score: applicant.training_score || 0,
                experience_score: applicant.experience_score || 0,
                demo_teaching_score: applicant.demo_teaching_score || 0,
                exam_score: applicant.exam_score || 0,
                interview_score: applicant.interview_score || 0,
              });
              setIsEditingScores(true);
            }}
            className="btn btn-xs btn-ghost text-primary font-semibold uppercase tracking-wide"
          >
            Edit Scores
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsEditingScores(false)}
              className="btn btn-xs btn-ghost text-error font-semibold uppercase tracking-wide"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSaveScores}
              className="btn btn-xs btn-primary font-semibold uppercase tracking-wide"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Points'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {SCORE_CRITERIA.map((s) => (
          <div
            key={s.key}
            className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center group"
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-tighter">
                {s.label}
              </p>
              <span className="text-xs font-bold text-primary/40 uppercase">
                (Max {s.max})
              </span>
            </div>
            {isEditingScores ? (
              <input
                type="number"
                step="0.01"
                max={s.max}
                className={`input input-xs input-bordered w-full text-center font-black rounded-md ${
                  scores[s.key] > s.max
                    ? 'border-error text-error bg-error/5'
                    : 'text-primary bg-white'
                }`}
                value={scores[s.key] ?? 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setScores({ ...scores, [s.key]: val });
                }}
              />
            ) : (
              <p className="text-xl font-semibold text-primary">{applicant[s.key] ?? 0}</p>
            )}
          </div>
        ))}
        <div className="bg-primary border-2 border-primary rounded-xl p-4 text-center shadow-lg shadow-primary/20">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-tighter mb-1">
            Total Points
          </p>
          <p className="text-xl font-semibold text-white">
            {isEditingScores
              ? Object.values(scores)
                  .reduce((a, b) => Number(a) + Number(b), 0)
                  .toFixed(2)
              : applicant.total_score}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ApplicantScoringMatrix;
