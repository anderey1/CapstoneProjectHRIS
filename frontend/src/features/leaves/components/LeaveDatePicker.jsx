import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLeaveCalendar } from '../hooks/useLeaves';
import { isCalendarDate, nonWorkingReason } from '../utils/leaveApplication';
import { trapFocus } from '../../../components/common/AccessibleDialog';

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
  const calendar = useLeaveCalendar(first, last, open);
  const dates = Array.from({ length: lastDate.getUTCDate() }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`);
  const unavailable = day => day === today || day < min || !calendar.ready || (!usesCalendarDays && !!nonWorkingReason(day, calendar.holidays));
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
    const initial = isCalendarDate(value) && value >= min ? value : today;
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
          if (event.key === 'Tab') event.stopPropagation();
          trapFocus(event);
        }}>
        <section role="region" aria-label={`${label} calendar`} className="modal-box flex max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-md flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-2xl">
          <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{label}</h3>
              <p className="mt-0.5 text-xs text-slate-500">Philippine non-working holidays</p>
            </div>
            <button type="button" aria-label="Close calendar" className="btn btn-ghost btn-sm btn-square shrink-0 text-slate-500 hover:text-slate-900" onClick={close}>
              <X className="size-4" aria-hidden="true" />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button type="button" aria-label="Previous month" className="btn btn-ghost btn-square btn-sm min-h-10 text-slate-700" onClick={() => navigate(-1)} disabled={month <= min.slice(0, 7)}>
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <p className="text-sm font-semibold text-slate-900 tabular-nums" aria-live="polite">{monthLabel}</p>
              <button type="button" aria-label="Next month" className="btn btn-ghost btn-square btn-sm min-h-10 text-slate-700" onClick={() => navigate(1)}>
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div>
              <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs" aria-hidden="true">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <span key={day} className={`py-1.5 font-semibold ${index === 0 || index === 6 ? 'text-slate-400' : 'text-slate-600'}`}>{day}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: new Date(`${first}T00:00:00Z`).getUTCDay() }, (_, index) => <span key={`blank-${index}`} />)}
                {dates.map(day => {
                  const holiday = calendar.holidays.find(item => item.date === day && item.category !== 'special_working');
                  const reason = day === today ? 'Today (filing date)' : nonWorkingReason(day, calendar.holidays);
                  const disabled = unavailable(day);
                  const isSelected = value === day;
                  const isToday = day === today;
                  const cellClass = isSelected
                    ? 'bg-primary font-semibold text-white shadow-sm'
                    : holiday
                      ? `border border-amber-200 bg-amber-50 font-medium text-amber-900 ${disabled ? 'cursor-not-allowed' : 'hover:bg-amber-100'}`
                      : isToday
                        ? 'cursor-not-allowed bg-slate-100 font-semibold text-slate-700 ring-1 ring-slate-300'
                        : disabled
                          ? 'cursor-not-allowed bg-slate-50 text-slate-400'
                          : 'font-medium text-slate-800 hover:bg-blue-50 hover:text-primary';

                  return (
                    <button key={day} ref={element => { daysRef.current[day] = element; }} type="button"
                      disabled={disabled} tabIndex={day === focusDate ? 0 : -1} aria-label={`${day}${reason ? `: ${reason}` : ''}`}
                      aria-current={isToday ? 'date' : undefined} aria-pressed={isSelected} title={reason || undefined}
                      className={`relative flex min-h-11 min-w-0 flex-col items-center justify-center rounded-md text-sm tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${cellClass}`}
                      onKeyDown={event => onDayKey(event, day)} onClick={() => { onChange(day); close(); }}>
                      <span>{Number(day.slice(-2))}</span>
                      {holiday && !isSelected && (
                        <span aria-hidden="true" className="mt-0.5 h-1 w-1 rounded-full bg-amber-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="h-3 w-3 rounded bg-primary" />
                Selected
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="h-3 w-3 rounded border border-amber-300 bg-amber-50" />
                PH holiday
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="h-3 w-3 rounded border border-slate-200 bg-slate-100" />
                Unavailable
              </span>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-800">PH non-working holidays in {monthLabel}</p>
              {!calendar.ready ? (
                <div className="mt-1.5 text-xs text-slate-600" role={calendar.error ? 'alert' : 'status'}>
                  <p>{calendar.error || 'Loading Philippine holidays...'}</p>
                  {calendar.error && <button type="button" className="btn btn-xs btn-outline mt-2" onClick={calendar.retry}>Retry</button>}
                </div>
              ) : (() => {
                const monthHolidays = calendar.holidays
                  .filter(item => item.date.startsWith(month) && item.category !== 'special_working')
                  .sort((a, b) => a.date.localeCompare(b.date));
                if (!monthHolidays.length) {
                  return <p className="mt-1 text-xs text-slate-500">No public non-working holidays this month.</p>;
                }
                return (
                  <ul className="mt-2 space-y-1.5">
                    {monthHolidays.map(item => (
                      <li key={`${item.date}-${item.label}`} className="flex items-baseline gap-2 text-xs">
                        <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-900 tabular-nums">
                          {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${item.date}T00:00:00Z`))}
                        </span>
                        <span className="text-slate-700">{item.label}</span>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3">
            <p className="text-xs text-slate-500">
              {usesCalendarDays ? 'Dates before this month and today cannot be selected.' : 'Dates before this month, today, and PH non-working holidays cannot be selected.'}
            </p>
            <button type="button" className="btn btn-outline btn-sm shrink-0 border-slate-300 bg-white text-slate-700" onClick={close}>Close</button>
          </footer>
        </section>
      </dialog>}
    </div>
  );
}
