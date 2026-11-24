import { CalendarCheck } from 'lucide-react';

export default function PersonalLeaveCredits({ meProfile }) {
  return (
    <section aria-label="Personal leave credit balances" className="space-y-2">
      <div className="flex items-center gap-2">
        <CalendarCheck className="h-4 w-4 text-primary" />
        <h2 className="text-xs font-semibold text-slate-600">
          CSC Form No. 6 Recorded Credit Balances (Sec 7.B)
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-600 block">
            Vacation Leave (VL)
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold tabular-nums text-slate-900">
              {Number(meProfile.vacation_leave_balance || 0).toFixed(3)}
            </span>
            <span className="text-xs text-slate-600">days</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-600 block">
            Sick Leave (SL)
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold tabular-nums text-slate-900">
              {Number(meProfile.sick_leave_balance || 0).toFixed(3)}
            </span>
            <span className="text-xs text-slate-600">days</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-600 block">
            Total Available Credits
          </span>
          <div className="mt-1 flex items-baseline gap-1">
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
