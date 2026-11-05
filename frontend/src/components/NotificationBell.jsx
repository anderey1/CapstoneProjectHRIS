import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const client = useQueryClient();
  const container = useRef(null);
  const button = useRef(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('tasks');
  const [page, setPage] = useState(1);
  const key = ['notifications', user?.id];
  const summary = useQuery({ queryKey: [...key, 'summary'], queryFn: ({ signal }) => api.get('notifications/summary/', { signal }).then(r => r.data), enabled: !!user?.id, refetchInterval: 60000, refetchIntervalInBackground: false });
  const list = useQuery({ queryKey: [...key, tab, page], queryFn: ({ signal }) => api.get(tab === 'tasks' ? 'notifications/tasks/' : 'notifications/', { params: { page }, signal }).then(r => r.data), enabled: open && !!user?.id });
  const read = useMutation({ mutationFn: id => api.post(`notifications/${id}/read/`), onSuccess: () => client.invalidateQueries({ queryKey: key }) });
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
        {list.data?.results?.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-600">{tab === 'tasks' ? 'No actions required.' : 'No updates.'}</p>}
        {list.data?.results?.map(item => <div key={item.key || item.id} className={`border-b border-slate-100 px-4 py-3 text-sm last:border-b-0 ${item.id && !item.read_at ? 'bg-blue-50/40' : ''}`}>
          <div className="flex items-start gap-2.5"><span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tab === 'tasks' ? 'bg-amber-600' : item.read_at ? 'bg-slate-300' : 'bg-primary'}`} /><div className="min-w-0"><div className="break-words font-medium leading-5 text-slate-900">{item.title}</div>
          {item.created_at && <div className="mt-1 text-xs text-slate-600">{new Date(item.created_at).toLocaleString()}</div>}</div></div>
          <div className="ml-[18px] mt-1 flex flex-wrap gap-x-4">{(item.path || ['leave', 'loan', 'payroll'].includes(item.source_type)) && <Link className="inline-flex min-h-11 items-center font-medium text-primary underline decoration-slate-300 underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-primary" to={item.path || ({ leave: '/my-leaves', loan: '/my-loans', payroll: '/my-payslips' }[item.source_type])} onClick={() => setOpen(false)}>Open</Link>}{item.id && !item.read_at && <button className="min-h-11 font-medium text-primary underline decoration-slate-300 underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60" type="button" onClick={() => read.mutate(item.id)} disabled={read.isPending}>Mark as read</button>}</div>
        </div>)}
        {read.isError && <p className="p-2 text-sm text-error">Could not mark update as read. Try again.</p>}
      </div>
      {list.data?.count > 10 && <div className="flex items-center justify-between border-t border-slate-200 px-4 text-sm"><button type="button" className="min-h-11 font-medium text-primary disabled:text-slate-400" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span className="text-slate-600 tabular-nums">Page {page}</span><button type="button" className="min-h-11 font-medium text-primary disabled:text-slate-400" disabled={page * 10 >= list.data.count} onClick={() => setPage(page + 1)}>Next</button></div>}
    </section>}
  </div>;
}
