/**
 * DepEd Results-Based Performance Management System (RPMS) Utilities
 * Compliance: DepEd Order No. 2, s. 2015 & CSC Resolution No. 1200481
 */

/**
 * Calculates weighted numerical composite rating based on RPMS dimension weights:
 * Quality: 40%, Efficiency: 30%, Timeliness: 30%
 */
export function computeRPMSScore(quality, efficiency, timeliness) {
  const q = Number(quality);
  const e = Number(efficiency);
  const t = Number(timeliness);

  if (isNaN(q) || isNaN(e) || isNaN(t) || !quality || !efficiency || !timeliness) {
    return null;
  }

  const weighted = (q * 0.40) + (e * 0.30) + (t * 0.30);
  return Number(weighted.toFixed(3));
}

/**
 * Maps numerical rating (1.000 - 5.000) to official CSC / DepEd adjectival rating.
 */
export function getAdjectivalRating(score) {
  if (score === null || score === undefined || isNaN(score)) {
    return {
      label: 'Not Evaluated',
      code: 'NE',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
      description: 'Pending evaluation breakdown',
    };
  }

  const num = Number(score);

  if (num >= 4.500) {
    return {
      label: 'Outstanding',
      code: 'O',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
      description: 'Exceeds target commitments (130% and above)',
    };
  }

  if (num >= 3.500) {
    return {
      label: 'Very Satisfactory',
      code: 'VS',
      badgeClass: 'bg-blue-50 text-[#0038A8] border-blue-300 font-semibold',
      description: 'Meets 100% to 129% of target commitments',
    };
  }

  if (num >= 2.500) {
    return {
      label: 'Satisfactory',
      code: 'S',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
      description: 'Meets 80% to 99% of target commitments',
    };
  }

  if (num >= 1.500) {
    return {
      label: 'Unsatisfactory',
      code: 'US',
      badgeClass: 'bg-orange-50 text-orange-800 border-orange-300 font-semibold',
      description: 'Meets 51% to 79% of target commitments',
    };
  }

  return {
    label: 'Poor',
    code: 'P',
    badgeClass: 'bg-red-50 text-red-800 border-red-300 font-semibold',
    description: 'Fails to meet commitments (50% or below)',
  };
}
