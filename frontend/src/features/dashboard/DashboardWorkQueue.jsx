import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Banknote,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCheck,
  Landmark,
  Layers,
  RotateCw,
  UserCheck,
} from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';

const workspaces = {
  HR: [
    ['Personnel and registrations', '/employees'],
    ['Leave applications', '/leave-management'],
    ['Attendance review', '/attendance-management'],
    ['Recruitment', '/recruitment'],
  ],
  ACCOUNTANT: [
    ['Payroll preparation and release', '/payroll-management'],
    ['Loan processing', '/loan-management'],
  ],
  SUPERINTENDENT: [
    ['Leave decisions', '/leave-management'],
    ['Payroll approval', '/payroll-management'],
    ['Loan decisions', '/loan-management'],
    ['Performance reviews', '/performance-management'],
  ],
  PRINCIPAL: [
    ['Staff leave approvals', '/my-leaves?tab=approvals'],
    ['Personnel directory', '/employees'],
    ['My attendance', '/attendance'],
  ],
};

const personalLinks = [
  ['My leave applications', '/my-leaves'],
  ['My attendance', '/attendance'],
  ['My payslips', '/my-payslips'],
  ['My profile and documents', '/profile'],
];

const adminLinks = [
  ['Personnel and registrations', '/employees'],
  ['Schools', '/schools'],
  ['Audit logs', '/audit-logs'],
  ['Payroll', '/payroll-management'],
];

const getTaskMeta = (module) => {
  if (module === 'leave') {
    return { icon: Calendar, bg: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
  }
  if (module === 'loan') {
    return { icon: Landmark, bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
  }
  if (module?.startsWith('payroll')) {
    return { icon: Banknote, bg: 'bg-amber-50 text-amber-700 border-amber-100' };
  }
  if (module === 'registration') {
    return { icon: UserCheck, bg: 'bg-blue-50 text-blue-700 border-blue-100' };
  }
  if (module === 'document') {
    return { icon: FileCheck, bg: 'bg-teal-50 text-teal-700 border-teal-100' };
  }
  if (module === 'recruitment') {
    return { icon: Briefcase, bg: 'bg-purple-50 text-purple-700 border-purple-100' };
  }
  return { icon: ClipboardList, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
};

export default function DashboardWorkQueue({ user }) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, user?.id, 'tasks', page],
    queryFn: ({ signal }) =>
      api.get('notifications/tasks/', { params: { page }, signal }).then((response) => response.data),
    retry: false,
  });

  const links = user?.is_superuser ? adminLinks : workspaces[user?.role] || personalLinks;
  const title =
    user?.role === 'PRINCIPAL'
      ? 'Staff approvals and returned requests'
      : ['TEACHING', 'NON_TEACHING'].includes(user?.role)
        ? 'Requests needing your attention'
        : 'Review queue';

  return (
    <section
      aria-labelledby="dashboard-work-title"
      className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs"
    >
      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]">
        <div className="min-w-0 p-5 sm:p-7">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-primary shadow-2xs">
                <ClipboardList className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="dashboard-work-title" className="text-xl font-bold tracking-tight text-slate-900">
                  {title}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Open a record to review its current stage. Tasks dismissed in notifications are excluded.
                </p>
              </div>
            </div>

            {!query.isError && query.data && (
              <div className="shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200/80 shadow-2xs tabular-nums">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                  {query.data.count.toLocaleString()} queued
                </span>
              </div>
            )}
          </div>

          {/* Body */}
          {query.isPending ? (
            <div role="status" className="py-12 text-center space-y-3">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs text-slate-500">Loading your review queue…</p>
            </div>
          ) : query.isError ? (
            <div role="alert" className="my-6 rounded-xl border border-red-200/80 bg-red-50/50 p-5 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Your review queue could not load.</p>
              <p className="mt-1 text-xs text-slate-600">The server was unable to retrieve your current tasks.</p>
              <button
                type="button"
                disabled={query.isFetching}
                onClick={() => query.refetch()}
                className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-primary border border-slate-200 shadow-2xs hover:bg-slate-50 disabled:opacity-60 transition-colors"
              >
                <RotateCw className={`h-3.5 w-3.5 ${query.isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span>Retry review queue</span>
              </button>
            </div>
          ) : query.data.results.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200/70 text-slate-400 mb-3 shadow-inner">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden="true" />
              </div>
              <p className="font-semibold text-slate-900 text-sm">No tasks in this queue</p>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Use the workspace links to check records, including tasks you previously dismissed.
              </p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {query.data.results.map((item) => {
                const meta = getTaskMeta(item.module);
                const Icon = meta.icon;
                return (
                  <li key={item.key}>
                    <Link
                      to={item.path}
                      className="group flex min-h-14 items-center justify-between gap-4 rounded-xl p-3 text-sm transition-all hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-2xs transition-transform group-hover:scale-105 ${meta.bg}`}
                          aria-hidden="true"
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="min-w-0 break-words font-semibold text-slate-900 group-hover:text-primary transition-colors">
                          {item.title}
                        </span>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-primary inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Open
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Pagination */}
          {(page > 1 || (!query.isError && query.data?.count > 10)) && (
            <nav
              aria-label="Review queue pages"
              className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5 text-xs text-slate-600"
            >
              <button
                type="button"
                disabled={page === 1 || query.isFetching}
                onClick={() => setPage((value) => value - 1)}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 font-medium text-primary hover:bg-slate-100 disabled:text-slate-400 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span>Previous</span>
              </button>
              <span className="font-medium text-slate-700 tabular-nums">
                Page {page}
              </span>
              <button
                type="button"
                disabled={
                  query.isFetching ||
                  query.isError ||
                  !query.data ||
                  page * 10 >= query.data.count
                }
                onClick={() => setPage((value) => value + 1)}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 font-medium text-primary hover:bg-slate-100 disabled:text-slate-400 disabled:hover:bg-transparent transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </nav>
          )}
        </div>

        {/* Your workspace sidebar */}
        <nav
          aria-label="Your workspace"
          className="border-t border-slate-200/90 bg-slate-50/60 p-5 sm:p-7 lg:border-l lg:border-t-0 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Your workspace</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">Quick navigation to designated portals</p>
            <ul className="space-y-1.5">
              {links.map(([label, path]) => (
                <li key={path}>
                  <Link
                    to={path}
                    className="group flex min-h-10 items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-white/70 border border-slate-200/60 shadow-2xs hover:bg-white hover:text-primary hover:border-blue-200 transition-all"
                  >
                    <span className="truncate">{label}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </section>
  );
}
