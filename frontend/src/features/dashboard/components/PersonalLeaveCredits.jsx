import { Briefcase, CalendarCheck, HeartPulse } from 'lucide-react';

export default function PersonalLeaveCredits({ meProfile }) {
  return (
    <section aria-labelledby="personal-leave-credits-title" className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarCheck className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 id="personal-leave-credits-title" className="text-base font-semibold text-slate-900">
          Leave credit balances
        </h2>
        <span className="text-xs text-slate-500">CSC Form No. 6 (Sec. 7.B)</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600">
              Vacation Leave (VL)
            </span>
            <Briefcase className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums text-slate-900">
              {Number(meProfile.vacation_leave_balance || 0).toFixed(3)}
            </span>
            <span className="text-xs text-slate-500">days</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600">
              Sick Leave (SL)
            </span>
            <HeartPulse className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums text-slate-900">
              {Number(meProfile.sick_leave_balance || 0).toFixed(3)}
            </span>
            <span className="text-xs text-slate-500">days</span>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700">
              Total Available Credits
            </span>
            <CalendarCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums text-primary">
              {Number(meProfile.leave_balance ?? (Number(meProfile.vacation_leave_balance || 0) + Number(meProfile.sick_leave_balance || 0))).toFixed(3)}
            </span>
            <span className="text-xs text-slate-600">days</span>
          </div>
        </div>
      </div>
    </section>
  );
}
