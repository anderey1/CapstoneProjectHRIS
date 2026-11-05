import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLeaveCalendar } from '../hooks/useLeaves';
import { isCalendarDate, nonWorkingReason } from '../utils/leaveApplication';

function monthAfter(month, offset) {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

export default function LeaveDatePicker({ id, name, label, value, onChange, min, today, usesCalendarDays, describedBy, invalid }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [active, setActive] = useState('');
  const trigger = useRef(null);
  const modal = useRef(null);
  const daysRef = useRef({});
  const first = `${month}-01`;
  const lastDate = new Date(`${monthAfter(month, 1)}-01T00:00:00Z`);
  lastDate.setUTCDate(0);
  const last = lastDate.toISOString().slice(0, 10);
  const calendar = useLeaveCalendar(first, last, open, false);
  const dates = Array.from({ length: lastDate.getUTCDate() }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`);
  const unavailable = day => day === today || day < min || (!usesCalendarDays && (!calendar.ready || !!nonWorkingReason(day, calendar.holidays)));
  const focusDate = dates.includes(active) && !unavailable(active) ? active : dates.find(day => day >= active && !unavailable(day)) || dates.find(day => !unavailable(day));
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(lastDate);

  useEffect(() => {
    if (!open) return;
    const element = modal.current;
    element.showModal();
    return () => element.close();
  }, [open]);

  useEffect(() => {
    if (open) daysRef.current[focusDate]?.focus({ preventScroll: true });
  }, [open, month, focusDate]);

  const close = () => {
    modal.current?.close();
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  };
  const toggle = () => {
    if (open) return close();
    const initial = isCalendarDate(value) ? value : today > min ? today : min;
    setMonth(initial.slice(0, 7));
    setActive(initial);
    setOpen(true);
  };
  const navigate = offset => {
    const next = monthAfter(month, offset);
    setMonth(next);
    setActive(`${next}-01`);
  };
  const onDayKey = (event, day) => {
    const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (!offset) return;
    event.preventDefault();
    let index = dates.indexOf(day) + offset;
    const step = Math.sign(offset);
    while (index >= 0 && index < dates.length && unavailable(dates[index])) index += step;
    if (index >= 0 && index < dates.length) setActive(dates[index]);
    else navigate(step);
  };

  return (
    <div onKeyDown={event => {
      if (open && event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    }}>
      <div className="flex gap-2">
        <input id={id} name={name} type="text" placeholder="YYYY-MM-DD" pattern="\d{4}-\d{2}-\d{2}" min={min}
          value={value} onChange={event => onChange(event.target.value)} required
          className="input input-bordered min-w-0 w-full bg-white text-sm" aria-describedby={describedBy} aria-invalid={invalid}
          onKeyDown={event => { if (event.altKey && event.key === 'ArrowDown') { event.preventDefault(); toggle(); } }} />
        <button ref={trigger} type="button" aria-label={`Choose ${label.toLowerCase()}`} aria-haspopup="dialog" aria-expanded={open} aria-controls={`${id}-calendar`}
          className="btn btn-outline btn-square min-h-11 shrink-0 border-slate-300 text-slate-700" onClick={toggle}>
          <CalendarDays className="size-5" aria-hidden="true" />
        </button>
      </div>
      {open && <dialog ref={modal} id={`${id}-calendar`} aria-label={`Choose ${label.toLowerCase()}`} className="modal z-[90]"
        onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }}
        onClick={event => { if (event.target === event.currentTarget) close(); }}
        onKeyDown={event => {
          if (event.key !== 'Tab') return;
          event.stopPropagation();
          const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled)')].filter(element => element.tabIndex >= 0);
          const firstControl = controls[0];
          const lastControl = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === firstControl) { event.preventDefault(); lastControl?.focus(); }
          else if (!event.shiftKey && document.activeElement === lastControl) { event.preventDefault(); firstControl?.focus(); }
        }}>
        <section role="region" aria-label={`${label} calendar`} className="modal-box max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-lg border border-slate-300 bg-white p-4 shadow-xl">
        <h3 className="mb-2 text-base font-semibold text-slate-900">{label}</h3>
        <div className="mb-2 flex items-center justify-between gap-1">
          <button type="button" aria-label="Previous month" className="btn btn-ghost btn-square min-h-11" onClick={() => navigate(-1)} disabled={month <= min.slice(0, 7)}><ChevronLeft className="size-4" /></button>
          <p className="text-sm font-semibold text-slate-900" aria-live="polite">{monthLabel}</p>
          <button type="button" aria-label="Next month" className="btn btn-ghost btn-square min-h-11" onClick={() => navigate(1)}><ChevronRight className="size-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-xs" aria-hidden="true">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <span key={day} className="py-2 font-medium text-slate-600">{day}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: new Date(`${first}T00:00:00Z`).getUTCDay() }, (_, index) => <span key={`blank-${index}`} />)}
          {dates.map(day => {
            const reason = day === today ? 'Today (filing date)' : nonWorkingReason(day, calendar.holidays);
            const disabled = unavailable(day);
            return <button key={day} ref={element => { daysRef.current[day] = element; }} type="button"
              disabled={disabled} tabIndex={day === focusDate ? 0 : -1} aria-label={`${day}${reason ? `: ${reason}` : ''}`}
              aria-current={day === today ? 'date' : undefined} aria-pressed={value === day} title={reason || undefined}
              className={`min-h-11 min-w-0 rounded text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${disabled ? 'cursor-not-allowed bg-slate-100 text-slate-500 line-through' : value === day ? 'bg-primary font-semibold text-white' : 'text-slate-800 hover:bg-blue-50'}`}
              onKeyDown={event => onDayKey(event, day)} onClick={() => { onChange(day); close(); }}>
              {Number(day.slice(-2))}
            </button>;
          })}
        </div>
        {!calendar.ready && <p className="mt-2 text-xs text-slate-700" role={calendar.error ? 'alert' : 'status'}>{calendar.error || 'Loading holidays...'}</p>}
        {calendar.error && <button type="button" className="btn btn-sm btn-outline mt-2" onClick={calendar.retry}>Retry month calendar</button>}
        <p className="mt-2 text-xs text-slate-600">{usesCalendarDays ? 'Today is unavailable. Weekends and holidays are selectable for calendar-day leave.' : 'Gray dates are unavailable: today, weekends, holidays, or dates outside the filing rules.'}</p>
        <button type="button" className="btn btn-ghost btn-sm mt-1 min-h-11 w-full" onClick={close}>Close calendar</button>
        </section>
      </dialog>}
    </div>
  );
}
