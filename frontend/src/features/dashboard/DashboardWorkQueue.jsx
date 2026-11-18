import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
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
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
    >
      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(15rem,1fr)]">
        <div className="min-w-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="dashboard-work-title" className="text-xl font-semibold text-slate-900">
              {title}
            </h2>
            {!query.isError && query.data && (
              <span className="text-sm tabular-nums text-slate-600">
                {query.data.count.toLocaleString()} queued
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Open a record to review its current stage. Tasks dismissed in notifications are excluded.
          </p>
          {query.isPending ? (
            <p role="status" className="py-8 text-sm text-slate-600">
              Loading your review queue…
            </p>
          ) : query.isError ? (
            <div role="alert" className="py-6 text-sm text-slate-700">
              <p>Your review queue could not load.</p>
              <button
                type="button"
                disabled={query.isFetching}
                onClick={() => query.refetch()}
                className="mt-2 min-h-11 text-primary underline disabled:opacity-60"
              >
                Retry review queue
              </button>
            </div>
          ) : query.data.results.length === 0 ? (
            <div className="py-8">
              <p className="font-medium text-slate-900">No tasks in this queue</p>
              <p className="mt-2 text-sm text-slate-600">
                Use the workspace links to check records, including tasks you previously dismissed.
              </p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-slate-200">
              {query.data.results.map((item) => (
                <li key={item.key}>
                  <Link
                    to={item.path}
                    className="flex min-h-14 items-center justify-between gap-4 rounded px-2 py-3 text-sm text-primary underline-offset-4 hover:bg-slate-50 hover:underline"
                  >
                    <span className="min-w-0 break-words font-medium">{item.title}</span>
                    <span className="shrink-0 text-xs text-slate-600">Open</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {(page > 1 || (!query.isError && query.data?.count > 10)) && (
            <nav
              aria-label="Review queue pages"
              className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 text-sm"
            >
              <button
                type="button"
                disabled={page === 1 || query.isFetching}
                onClick={() => setPage((value) => value - 1)}
                className="min-h-11 px-2 text-primary disabled:text-slate-500"
              >
                Previous
              </button>
              <span className="text-slate-600">Page {page}</span>
              <button
                type="button"
                disabled={
                  query.isFetching ||
                  query.isError ||
                  !query.data ||
                  page * 10 >= query.data.count
                }
                onClick={() => setPage((value) => value + 1)}
                className="min-h-11 px-2 text-primary disabled:text-slate-500"
              >
                Next
              </button>
            </nav>
          )}
        </div>
        <nav
          aria-label="Your workspace"
          className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-6 lg:border-l lg:border-t-0"
        >
          <h2 className="text-base font-semibold text-slate-900">Your workspace</h2>
          <ul className="mt-3 space-y-1">
            {links.map(([label, path]) => (
              <li key={path}>
                <Link
                  to={path}
                  className="flex min-h-11 items-center rounded px-2 py-2 text-sm font-medium text-primary underline-offset-4 hover:bg-white hover:underline"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
