import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Banknote,
  Bell,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Inbox,
  Landmark,
  RotateCw,
  UserCheck,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { QUERY_KEYS } from '../api/queryKeys';
import { useAuth } from '../context/AuthContext';

const notificationPath = item =>
  item.path ||
  ({
    registration: '/employees?tab=pending',
    leave: '/my-leaves',
    loan: '/my-loans',
    payroll: '/my-payslips',
  }[item.source_type]);

const getSourceMeta = (item, tab) => {
  const type = item.source_type || item.module || '';
  if (type === 'leave') {
    return {
      icon: Calendar,
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      label: 'Leave',
    };
  }
  if (type === 'loan') {
    return {
      icon: Landmark,
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      label: 'Loan',
    };
  }
  if (type.startsWith('payroll')) {
    return {
      icon: Banknote,
      bg: 'bg-amber-50 text-amber-700 border-amber-100',
      label: 'Payroll',
    };
  }
  if (type === 'registration') {
    return {
      icon: UserCheck,
      bg: 'bg-blue-50 text-blue-700 border-blue-100',
      label: 'Registration',
    };
  }
  if (type === 'document') {
    return {
      icon: FileCheck,
      bg: 'bg-teal-50 text-teal-700 border-teal-100',
      label: 'Document',
    };
  }
  if (type === 'recruitment') {
    return {
      icon: Briefcase,
      bg: 'bg-purple-50 text-purple-700 border-purple-100',
      label: 'Recruitment',
    };
  }
  return {
    icon: tab === 'tasks' ? CheckCircle2 : Bell,
    bg:
      tab === 'tasks'
        ? 'bg-amber-50 text-amber-700 border-amber-100'
        : 'bg-slate-100 text-slate-700 border-slate-200',
    label: tab === 'tasks' ? 'Task' : 'Update',
  };
};

const formatTime = isoString => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const diffSec = Math.floor((new Date() - date) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const client = useQueryClient();
  const container = useRef(null);
  const button = useRef(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('tasks');
  const [page, setPage] = useState(1);
  const key = [QUERY_KEYS.NOTIFICATIONS, user?.id];

  const summary = useQuery({
    queryKey: [...key, 'summary'],
    queryFn: ({ signal }) => api.get('notifications/summary/', { signal }).then(r => r.data),
    enabled: !!user?.id,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });

  const list = useQuery({
    queryKey: [...key, tab, page],
    queryFn: ({ signal }) =>
      api.get(tab === 'tasks' ? 'notifications/tasks/' : 'notifications/', { params: { page }, signal }).then(r => r.data),
    enabled: open && !!user?.id,
  });

  const dismiss = useMutation({
    mutationFn: item =>
      api.post('notifications/dismiss/', item.id ? { notification_id: item.id } : { task_key: item.key }),
    onSuccess: (_, item) => {
      const dismissedTab = item.id ? 'updates' : 'tasks';
      client.setQueriesData({ queryKey: [...key, dismissedTab] }, data =>
        data && {
          ...data,
          count: Math.max(0, data.count - 1),
          results: data.results.filter(row => (item.id ? row.id !== item.id : row.key !== item.key)),
        }
      );
      client.setQueryData([...key, 'summary'], data =>
        data && {
          ...data,
          unread_updates: Math.max(0, data.unread_updates - (item.id && !item.read_at ? 1 : 0)),
          action_required: Math.max(0, data.action_required - (item.id ? 0 : 1)),
        }
      );
      setPage(1);
      setOpen(false);
      client.invalidateQueries({ queryKey: key });
      const path = notificationPath(item);
      if (path) navigate(path);
    },
  });

  useEffect(() => {
    const close = event => {
      if (container.current && !container.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const unread = summary.data?.unread_updates || 0;
  const actions = summary.data?.action_required || 0;

  return (
    <div
      ref={container}
      className="relative"
      onKeyDown={event => {
        if (event.key === 'Escape' && open) {
          setOpen(false);
          button.current?.focus();
        }
      }}
    >
      <button
        ref={button}
        type="button"
        className={`btn btn-ghost btn-square min-h-11 min-w-11 relative rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
          open ? 'bg-slate-100 text-primary' : ''
        }`}
        aria-expanded={open}
        aria-controls="notification-panel"
        aria-label={`Notifications: ${unread} unread updates, ${actions} actions required`}
        onClick={() => {
          setOpen(!open);
          if (!open) summary.refetch();
        }}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-none tabular-nums text-white ring-2 ring-white shadow-xs">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
        {actions > 0 && (
          <span
            className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white"
            aria-hidden="true"
          />
        )}
      </button>

      {open && (
        <section
          id="notification-panel"
          role="region"
          aria-label="Notifications"
          className="fixed right-2 top-16 z-50 flex w-[calc(100vw-1rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[26rem] sm:max-w-[calc(100vw-2rem)]"
        >
          {/* Header */}
          <header className="flex items-start justify-between border-b border-slate-200/80 px-4 py-3.5 bg-gradient-to-b from-slate-50/70 to-white">
            <div>
              <div className="flex items-center gap-2">
                <h2 id="notification-heading" className="text-sm font-semibold text-slate-900 tracking-tight">
                  Notifications
                </h2>
                {(actions > 0 || unread > 0) && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {actions + unread} new
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">Tasks and updates for your account.</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-square text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                title="Refresh notifications"
                onClick={() => {
                  summary.refetch();
                  list.refetch();
                }}
                disabled={list.isFetching}
              >
                <RotateCw className={`h-3.5 w-3.5 ${list.isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span className="sr-only">Refresh</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-square text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                aria-label="Close notifications"
                onClick={() => {
                  setOpen(false);
                  button.current?.focus();
                }}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </header>

          {/* Categories Tabs */}
          <div className="border-b border-slate-200/80 px-3 py-2 bg-slate-50/60" aria-label="Notification categories">
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-200/70">
              <button
                type="button"
                aria-pressed={tab === 'tasks'}
                onClick={() => {
                  setTab('tasks');
                  setPage(1);
                }}
                className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium transition-all ${
                  tab === 'tasks'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>Action required</span>
                <span
                  className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums leading-none ${
                    tab === 'tasks'
                      ? actions > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      : actions > 0 ? 'bg-amber-200/80 text-amber-900' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {actions}
                </span>
              </button>

              <button
                type="button"
                aria-pressed={tab === 'updates'}
                onClick={() => {
                  setTab('updates');
                  setPage(1);
                }}
                className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium transition-all ${
                  tab === 'updates'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>Updates</span>
                <span
                  className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums leading-none ${
                    tab === 'updates'
                      ? unread > 0 ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'
                      : unread > 0 ? 'bg-blue-100 text-primary' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {unread}
                </span>
              </button>
            </div>
          </div>

          {/* List Area */}
          <div className="max-h-[min(60vh,30rem)] overflow-y-auto divide-y divide-slate-100">
            {list.isLoading && (
              <div className="p-4 space-y-3" role="status">
                <p className="sr-only">Loading notifications…</p>
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start gap-3 p-3 animate-pulse rounded-xl bg-slate-50">
                    <div className="h-9 w-9 rounded-xl bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/3 bg-slate-200 rounded" />
                      <div className="h-4 w-3/4 bg-slate-200 rounded" />
                      <div className="h-3 w-1/4 bg-slate-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {list.isError && (
              <div className="p-6 text-center" role="alert">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-error mb-2">
                  <AlertCircle className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-sm font-semibold text-slate-900">Notifications couldn’t be loaded</p>
                <p className="mt-1 text-xs text-slate-500">There was a problem fetching your records.</p>
                <button
                  type="button"
                  onClick={() => list.refetch()}
                  className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                >
                  Try again
                </button>
              </div>
            )}

            {list.data?.results?.length === 0 && (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100/80 text-slate-400 mb-3 border border-slate-200/50 shadow-inner">
                  {tab === 'tasks' ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Inbox className="h-6 w-6 text-slate-400" aria-hidden="true" />
                  )}
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {tab === 'tasks' ? 'No tasks requiring action' : 'No updates yet'}
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-[220px]">
                  {tab === 'tasks' ? 'No new tasks.' : 'No updates.'}
                </p>
              </div>
            )}

            {list.data?.results?.map(item => {
              const meta = getSourceMeta(item, tab);
              const Icon = meta.icon;
              const isUnread = item.id && !item.read_at;
              const isTask = tab === 'tasks';
              const isItemPending =
                dismiss.isPending &&
                (item.id ? dismiss.variables?.id === item.id : dismiss.variables?.key === item.key);

              return (
                <button
                  key={item.key || item.id}
                  type="button"
                  onClick={() => dismiss.mutate(item)}
                  disabled={dismiss.isPending}
                  aria-busy={isItemPending}
                  className={`group relative flex w-full items-start gap-3.5 p-3.5 text-left transition-all hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary disabled:opacity-60 ${
                    isUnread ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'bg-white'
                  }`}
                >
                  {isUnread && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" aria-hidden="true" />
                  )}

                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105 shadow-xs ${meta.bg}`}
                    aria-hidden="true"
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`inline-flex items-center text-[11px] font-semibold tracking-wide uppercase ${
                          isTask ? 'text-amber-700' : isUnread ? 'text-primary font-bold' : 'text-slate-500'
                        }`}
                      >
                        {isTask ? 'Action required' : isUnread ? 'Unread update' : meta.label}
                      </span>
                      {item.created_at && (
                        <time
                          className="text-[11px] text-slate-600 shrink-0 tabular-nums"
                          dateTime={item.created_at}
                          title={new Date(item.created_at).toLocaleString()}
                        >
                          {formatTime(item.created_at)}
                        </time>
                      )}
                    </div>

                    <p
                      className={`text-sm leading-snug break-words transition-colors ${
                        isUnread || isTask
                          ? 'font-semibold text-slate-900 group-hover:text-primary'
                          : 'font-normal text-slate-700 group-hover:text-slate-900'
                      }`}
                    >
                      {item.title}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
                      {notificationPath(item) ? (
                        <>
                          <span>Open record</span>
                          <ArrowUpRight
                            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            aria-hidden="true"
                          />
                        </>
                      ) : (
                        <>
                          <span>Dismiss notification</span>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {dismiss.isError && (
              <p
                role="alert"
                className="p-3 mx-4 my-2 rounded-lg bg-red-50 text-xs font-medium text-error border border-red-200/80"
              >
                Could not dismiss notification. Try again.
              </p>
            )}
          </div>

          {/* Pagination */}
          {list.data?.count > 10 && (
            <nav
              aria-label="Notification pages"
              className="flex items-center justify-between border-t border-slate-200/80 px-4 py-2.5 bg-slate-50/50 text-xs text-slate-600"
            >
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="inline-flex min-h-9 items-center gap-1 rounded-md px-2.5 font-medium text-primary hover:bg-slate-200/60 disabled:text-slate-400 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span>Previous</span>
              </button>
              <span className="font-medium tabular-nums text-slate-700">
                Page {page} of {Math.ceil(list.data.count / 10)}
              </span>
              <button
                type="button"
                disabled={page * 10 >= list.data.count}
                onClick={() => setPage(page + 1)}
                className="inline-flex min-h-9 items-center gap-1 rounded-md px-2.5 font-medium text-primary hover:bg-slate-200/60 disabled:text-slate-400 disabled:hover:bg-transparent transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </nav>
          )}
        </section>
      )}
    </div>
  );
}
