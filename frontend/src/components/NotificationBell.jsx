import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { QUERY_KEYS } from '../api/queryKeys';
import { useAuth } from '../context/AuthContext';

const notificationPath = item => item.path || ({ registration: '/employees?tab=pending', leave: '/my-leaves', loan: '/my-loans', payroll: '/my-payslips' }[item.source_type]);

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
  const summary = useQuery({ queryKey: [...key, 'summary'], queryFn: ({ signal }) => api.get('notifications/summary/', { signal }).then(r => r.data), enabled: !!user?.id, refetchInterval: 60000, refetchIntervalInBackground: false });
  const list = useQuery({ queryKey: [...key, tab, page], queryFn: ({ signal }) => api.get(tab === 'tasks' ? 'notifications/tasks/' : 'notifications/', { params: { page }, signal }).then(r => r.data), enabled: open && !!user?.id });
  const dismiss = useMutation({
    mutationFn: item => api.post('notifications/dismiss/', item.id ? { notification_id: item.id } : { task_key: item.key }),
    onSuccess: (_, item) => {
      const dismissedTab = item.id ? 'updates' : 'tasks';
      client.setQueriesData({ queryKey: [...key, dismissedTab] }, data => data && ({
        ...data,
        count: Math.max(0, data.count - 1),
        results: data.results.filter(row => item.id ? row.id !== item.id : row.key !== item.key),
      }));
      client.setQueryData([...key, 'summary'], data => data && ({
        ...data,
        unread_updates: Math.max(0, data.unread_updates - (item.id && !item.read_at ? 1 : 0)),
        action_required: Math.max(0, data.action_required - (item.id ? 0 : 1)),
      }));
      setPage(1);
      setOpen(false);
      client.invalidateQueries({ queryKey: key });
      const path = notificationPath(item);
      if (path) navigate(path);
    },
  });
  useEffect(() => {
    const close = event => { if (container.current && !container.current.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  const unread = summary.data?.unread_updates || 0;
  const actions = summary.data?.action_required || 0;
  return <div ref={container} className="relative" onKeyDown={event => { if (event.key === 'Escape' && open) { setOpen(false); button.current?.focus(); } }}>
    <button ref={button} type="button" className={`btn btn-ghost btn-square min-h-11 min-w-11 relative text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${open ? 'bg-slate-100 text-primary' : ''}`} aria-expanded={open} aria-controls="notification-panel" aria-label={`Notifications: ${unread} unread updates, ${actions} actions required`} onClick={() => { setOpen(!open); if (!open) summary.refetch(); }}>
      <Bell className="h-5 w-5" aria-hidden="true" />
      {unread > 0 && <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-none tabular-nums text-white ring-2 ring-white">{unread > 99 ? '99+' : unread}</span>}
      {actions > 0 && <span className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-amber-600 ring-2 ring-white" />}
    </button>
    {open && <section id="notification-panel" aria-label="Notifications" className="fixed right-4 top-[4.5rem] z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg sm:absolute sm:right-0 sm:top-full sm:mt-2">
      <div className="px-4 pb-3 pt-4">
        <h2 className="text-base font-semibold text-slate-900">Notifications</h2>
        <p className="mt-0.5 text-xs text-slate-600">Review your tasks and updates.</p>
      </div>
      <div className="flex border-b border-slate-200 px-4">
        {[['tasks', 'Action required', actions], ['updates', 'Updates', unread]].map(([value, label, count]) => <button key={value} type="button" className={`-mb-px flex min-h-11 flex-1 items-center justify-center gap-2 border-b-2 px-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${tab === value ? 'border-primary font-semibold text-primary' : 'border-transparent text-slate-600 hover:text-slate-900'}`} onClick={() => { setTab(value); setPage(1); }}>{label}<span className={`rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums ${tab === value ? 'bg-blue-50 text-primary' : 'bg-slate-100 text-slate-600'}`}>{count}</span></button>)}
      </div>
      <div className="max-h-[min(55vh,28rem)] overflow-y-auto">
        {list.isLoading && <p className="px-4 py-8 text-center text-sm text-slate-600">Loading notifications…</p>}
        {list.isError && <button type="button" className="min-h-11 px-4 text-sm text-error underline" onClick={() => list.refetch()}>Could not load notifications. Retry</button>}
        {list.data?.results?.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-600">{tab === 'tasks' ? 'No new tasks.' : 'No updates.'}</p>}
        {list.data?.results?.map(item => <button key={item.key || item.id} type="button" onClick={() => dismiss.mutate(item)} disabled={dismiss.isPending} aria-busy={dismiss.isPending && (item.id ? dismiss.variables?.id === item.id : dismiss.variables?.key === item.key)} className={`block w-full border-b border-slate-100 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary disabled:opacity-60 ${item.id && !item.read_at ? 'bg-blue-50/40' : ''}`}>
          <span className="flex items-start gap-2.5"><span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tab === 'tasks' ? 'bg-amber-600' : item.read_at ? 'bg-slate-300' : 'bg-primary'}`} /><span className="min-w-0"><span className="block break-words font-medium leading-5 text-slate-900">{item.title}</span>
          {item.created_at && <span className="mt-1 block text-xs text-slate-600">{new Date(item.created_at).toLocaleString()}</span>}</span></span>
          <span className="ml-[18px] inline-flex min-h-11 items-center font-medium text-primary underline decoration-slate-300 underline-offset-4">{notificationPath(item) ? 'Open' : 'Dismiss'}</span>
        </button>)}
        {dismiss.isError && <p role="alert" className="p-2 text-sm text-error">Could not dismiss notification. Try again.</p>}
      </div>
      {list.data?.count > 10 && <div className="flex items-center justify-between border-t border-slate-200 px-4 text-sm"><button type="button" className="min-h-11 font-medium text-primary disabled:text-slate-400" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span className="text-slate-600 tabular-nums">Page {page}</span><button type="button" className="min-h-11 font-medium text-primary disabled:text-slate-400" disabled={page * 10 >= list.data.count} onClick={() => setPage(page + 1)}>Next</button></div>}
    </section>}
  </div>;
}
