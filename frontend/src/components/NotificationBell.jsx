import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Bell, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { QUERY_KEYS } from '../api/queryKeys';
import { useAuth } from '../context/AuthContext';
import './notification-bell.css';

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
  return <div ref={container} className="notification-center" onKeyDown={event => { if (event.key === 'Escape' && open) { setOpen(false); button.current?.focus(); } }}>
    <button ref={button} type="button" className={`notification-trigger ${open ? 'notification-trigger-open' : ''}`} aria-expanded={open} aria-controls="notification-panel" aria-label={`Notifications: ${unread} unread updates, ${actions} actions required`} onClick={() => { setOpen(!open); if (!open) summary.refetch(); }}>
      <Bell className="h-5 w-5" aria-hidden="true" />
      {unread > 0 && <span className="notification-badge">{unread > 99 ? '99+' : unread}</span>}
      {actions > 0 && <span className="notification-task-dot" />}
    </button>
    {open && <section id="notification-panel" aria-labelledby="notification-heading" className="notification-panel">
      <header className="notification-heading">
        <div><h2 id="notification-heading">Notifications</h2><p>Tasks and updates for your account.</p></div>
        <button type="button" className="notification-close" aria-label="Close notifications" onClick={() => { setOpen(false); button.current?.focus(); }}><X size={18} aria-hidden="true" /></button>
      </header>
      <div className="notification-tabs" aria-label="Notification categories">
        {[['tasks', 'Action required', actions], ['updates', 'Updates', unread]].map(([value, label, count]) => <button key={value} type="button" aria-pressed={tab === value} onClick={() => { setTab(value); setPage(1); }}>{label}<span>{count}</span></button>)}
      </div>
      <div className="notification-list">
        {list.isLoading && <p className="notification-state" role="status">Loading notifications…</p>}
        {list.isError && <div className="notification-state" role="alert"><strong>Notifications couldn’t be loaded.</strong><button type="button" onClick={() => list.refetch()}>Try again</button></div>}
        {list.data?.results?.length === 0 && <div className="notification-state"><strong>{tab === 'tasks' ? 'No tasks requiring action' : 'No updates yet'}</strong><p>{tab === 'tasks' ? 'New requests that need your review will appear here.' : 'Account and request updates will appear here.'}</p></div>}
        {list.data?.results?.map(item => <button key={item.key || item.id} type="button" onClick={() => dismiss.mutate(item)} disabled={dismiss.isPending} aria-busy={dismiss.isPending && (item.id ? dismiss.variables?.id === item.id : dismiss.variables?.key === item.key)} className={`notification-item ${item.id && !item.read_at ? 'notification-item-unread' : ''}`}>
          <span className={`notification-item-marker ${tab === 'tasks' ? 'notification-item-task' : ''}`} aria-hidden="true">{item.id && item.read_at ? <Check size={14} /> : <span />}</span>
          <span className="notification-item-content">
            <span className="notification-item-label">{tab === 'tasks' ? 'Action required' : item.read_at ? 'Update' : 'Unread update'}</span>
            <span className="notification-item-title">{item.title}</span>
            {item.created_at && <time className="notification-item-time" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>}
            <span className="notification-item-action">{notificationPath(item) ? <>Open record <ArrowUpRight size={14} aria-hidden="true" /></> : 'Dismiss notification'}</span>
          </span>
        </button>)}
        {dismiss.isError && <p role="alert" className="notification-error">Could not dismiss notification. Try again.</p>}
      </div>
      {list.data?.count > 10 && <nav aria-label="Notification pages" className="notification-pagination"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={15} aria-hidden="true" />Previous</button><span>Page {page}</span><button type="button" disabled={page * 10 >= list.data.count} onClick={() => setPage(page + 1)}>Next<ChevronRight size={15} aria-hidden="true" /></button></nav>}
    </section>}
  </div>;
}
