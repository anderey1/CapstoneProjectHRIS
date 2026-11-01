import { useEffect, useId, useRef } from 'react';
import { CalendarDays, X } from 'lucide-react';
import LeaveDocumentUpload from './LeaveDocumentUpload';
import { LEAVE_TYPES, getLeaveDocuments, getMinimumLeaveDate, calendarDaysBetween } from '../utils/leaveApplication';

const fieldClass = 'input input-bordered w-full bg-white text-sm';

function keepFocusInDialog(event) {
  if (event.key !== 'Tab') return;
  const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, a[href]')]
    .filter(element => element.getClientRects().length > 0);
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  }
}

export default function LeaveApplicationModal({
  isOpen, onClose, onSubmit, isSubmitting, leaveType, setLeaveType,
  startDate, setStartDate, endDate, setEndDate,
  isWithinPhilippines, setIsWithinPhilippines, durationDays, initialData, employee,
}) {
  const dialog = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!isOpen) return;
    const element = dialog.current;
    const opener = document.activeElement;
    element.showModal();
    element.querySelector('[name="leave_type"]').focus({ preventScroll: true });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const usesCalendarDays = ['maternity', 'adoption'].includes(leaveType);
  const days = usesCalendarDays ? calendarDaysBetween(startDate, endDate) : durationDays;
  const minDate = getMinimumLeaveDate(leaveType);
  const datesReversed = !!(startDate && endDate && endDate < startDate);
  const noWorkingDays = !!(startDate && endDate && !datesReversed && !usesCalendarDays && days === 0);
  const documents = getLeaveDocuments(leaveType, days, isWithinPhilippines);
  const requiredCount = documents.filter(document => document.required).length;
  const selectedType = LEAVE_TYPES.find(([value]) => value === leaveType)?.[1];
  const needsLocation = ['vacation', 'special_privilege'].includes(leaveType);
  const needsMedicalDetails = ['sick', 'women_special', 'rehabilitation'].includes(leaveType);
  const hasDates = !!(startDate && endDate);
  const dateError = datesReversed ? 'End date must be on or after the start date.' : noWorkingDays ? 'These dates contain no working days. Choose dates that include a weekday.' : '';
  const filingHint = ['vacation', 'solo_parent'].includes(leaveType)
    ? 'Choose a start date at least 5 days from today.'
    : ['sick', 'emergency', 'rehabilitation'].includes(leaveType)
      ? 'You can file for past dates within the last 30 days.'
      : 'Include the first and last day of your requested leave.';

  return (
    <dialog ref={dialog} className="modal z-[80]" style={{ '--color-primary': 'var(--color-deped-blue)' }} aria-labelledby={`${id}-title`} aria-describedby={`${id}-intro`} onKeyDown={keepFocusInDialog}
      onCancel={event => { event.preventDefault(); if (!isSubmitting) onClose(); }}>
      <div className="modal-box flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-3xl flex-col overflow-hidden rounded-xl bg-white p-0 sm:max-h-[90dvh]">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="mb-1 text-xs font-medium text-primary">CSC Form No. 6 ? Revised 2020</p>
            <h2 id={`${id}-title`} className="text-xl font-semibold tracking-tight text-slate-900">{initialData ? 'Correct your leave application' : 'Apply for leave'}</h2>
            <p id={`${id}-intro`} className="mt-1 text-sm text-slate-600">Choose your leave, set the dates, and attach the requested documents.</p>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="Close leave application" className="btn btn-ghost btn-sm btn-square shrink-0"><X className="size-5" /></button>
        </header>

        <form id={`${id}-form`} onSubmit={onSubmit} className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6" aria-busy={isSubmitting}>
          {initialData && <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">Application #{initialData.id} needs a correction</p>
            <p>{initialData.correction_reason}</p>
            <p className="text-xs">Existing attachments stay on file. Resubmitting starts the checking process again.</p>
          </div>}
          <p className="text-xs text-slate-500">Fields marked <span className="font-medium text-primary">Required</span> must be completed.</p>

          <fieldset className="space-y-4">
            <legend className="mb-3 text-base font-semibold text-slate-900">1. Leave details</legend>
            <div>
              <label htmlFor={`${id}-type`} className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium text-slate-800">Type of leave <span className="text-xs text-primary">Required</span></label>
              <select id={`${id}-type`} name="leave_type" value={leaveType} onChange={event => setLeaveType(event.target.value)} className="select select-bordered w-full bg-white text-sm" required>
                {LEAVE_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            {leaveType === 'others' && <div>
              <label htmlFor={`${id}-other`} className="mb-1.5 block text-sm font-medium text-slate-800">Specify your leave <span className="text-xs text-primary">Required</span></label>
              <input id={`${id}-other`} name="other_type_details" defaultValue={initialData?.other_type_details || ''} className={fieldClass} placeholder="Enter the type of leave" required />
            </div>}
            {needsLocation && <div className="grid gap-4 sm:grid-cols-2">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-800">Where will you spend your leave?</legend>
                <div className="flex flex-wrap gap-4 rounded-lg border border-slate-200 px-3 py-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="radio" name="is_within_philippines" value="true" checked={isWithinPhilippines} onChange={() => setIsWithinPhilippines(true)} className="radio radio-primary radio-sm" />Philippines</label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="radio" name="is_within_philippines" value="false" checked={!isWithinPhilippines} onChange={() => setIsWithinPhilippines(false)} className="radio radio-primary radio-sm" />Abroad</label>
                </div>
              </fieldset>
              <div>
                <label htmlFor={`${id}-location`} className="mb-1.5 block text-sm font-medium text-slate-800">City / Country <span className="text-xs font-normal text-slate-500">Optional</span></label>
                <input id={`${id}-location`} name="location_details" defaultValue={initialData?.location_details || ''} className={fieldClass} placeholder={isWithinPhilippines ? 'e.g. Lucena City' : 'e.g. Tokyo, Japan'} />
              </div>
            </div>}
            {needsMedicalDetails && <div className="space-y-4">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-800">Treatment setting</legend>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="radio" name="is_in_hospital" value="false" className="radio radio-primary radio-sm" defaultChecked={initialData?.is_in_hospital !== true} />Outpatient / At home</label>
                  <label className="flex items-center gap-2 text-sm"><input type="radio" name="is_in_hospital" value="true" className="radio radio-primary radio-sm" defaultChecked={initialData?.is_in_hospital === true} />In hospital</label>
                </div>
              </fieldset>
              <div>
                <label htmlFor={`${id}-illness`} className="mb-1.5 block text-sm font-medium text-slate-800">Illness / Medical details <span className="text-xs font-normal text-slate-500">Optional</span></label>
                <textarea id={`${id}-illness`} name="illness_details" defaultValue={initialData?.illness_details || ''} rows={2} className="textarea textarea-bordered w-full bg-white text-sm" placeholder="Briefly describe the reason for this leave." />
              </div>
            </div>}
            {leaveType === 'study' && <div>
              <label htmlFor={`${id}-study`} className="mb-1.5 block text-sm font-medium text-slate-800">Purpose of study leave <span className="text-xs text-primary">Required</span></label>
              <select id={`${id}-study`} name="study_type" defaultValue={initialData?.study_type || ''} className="select select-bordered w-full bg-white text-sm" required>
                <option value="">Choose a purpose</option><option value="masters">Completion of master's degree</option><option value="board_exam">BAR / Board examination review</option>
              </select>
            </div>}
          </fieldset>

          <fieldset className="space-y-4 border-t border-slate-200 pt-5">
            <legend className="pr-3 text-base font-semibold text-slate-900">2. Dates and duration</legend>
            <p id={`${id}-date-help`} className="text-sm text-slate-600">{filingHint}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`${id}-start`} className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-800">Start date <span className="text-xs text-primary">Required</span></label>
                <input id={`${id}-start`} name="start_date" type="date" min={minDate} value={startDate} onChange={event => setStartDate(event.target.value)} required className={fieldClass} aria-describedby={`${id}-date-help`} />
              </div>
              <div>
                <label htmlFor={`${id}-end`} className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-800">End date <span className="text-xs text-primary">Required</span></label>
                <input id={`${id}-end`} name="end_date" type="date" min={startDate && startDate > minDate ? startDate : minDate} value={endDate} onChange={event => setEndDate(event.target.value)} required className={fieldClass} aria-invalid={!!dateError} aria-describedby={dateError ? `${id}-date-error` : `${id}-date-help`} />
              </div>
            </div>
            {dateError && <p id={`${id}-date-error`} role="alert" className="text-sm text-error">{dateError}</p>}
            <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm" role="status">
              <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-semibold text-slate-900">{hasDates && !dateError ? `${days} ${usesCalendarDays ? 'calendar' : 'working'} day${days === 1 ? '' : 's'} requested` : 'Select your dates to calculate the duration'}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{usesCalendarDays ? 'Includes weekends. Both the start and end date are counted.' : 'Counts Monday to Friday, including holidays. Both the start and end date are counted.'}</p>
              </div>
            </div>
            {employee && ['vacation', 'forced', 'sick'].includes(leaveType) && <p className="text-xs text-slate-600">Available credits: {leaveType === 'sick' && employee.sick_leave_balance != null ? `Sick ${Number(employee.sick_leave_balance)} days ? ` : ''}{employee.vacation_leave_balance != null ? `Vacation ${Number(employee.vacation_leave_balance)} days` : ''}</p>}
            <details className="rounded-lg border border-slate-200 p-3">
              <summary className="cursor-pointer text-sm font-medium text-slate-800">Commutation of leave credits <span className="font-normal text-slate-500">(optional)</span></summary>
              <p className="mt-2 text-xs text-slate-600">Indicate whether you are requesting the cash value of leave credits.</p>
              <div className="mt-3 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="commutation" value="not_requested" defaultChecked={initialData?.commutation !== 'requested'} className="radio radio-primary radio-sm" />Not requested</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="commutation" value="requested" defaultChecked={initialData?.commutation === 'requested'} className="radio radio-primary radio-sm" />Requested</label>
              </div>
            </details>
          </fieldset>

          <fieldset className="space-y-4 border-t border-slate-200 pt-5">
            <legend className="pr-3 text-base font-semibold text-slate-900">3. Attachments</legend>
            <p className="text-sm text-slate-600">{requiredCount ? `${requiredCount} required document${requiredCount === 1 ? '' : 's'} for this application.` : 'No mandatory attachments for this selection. You can still add a supporting document.'} Use PDF, PNG, or JPEG files.</p>
            <div className="grid gap-3 sm:grid-cols-2">{documents.map(document => <LeaveDocumentUpload key={`${leaveType}-${document.name}`} document={document} existingUrl={initialData?.[document.name]} />)}</div>
          </fieldset>
        </form>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <div className="min-w-0 text-xs text-slate-600">
            <p className="font-medium text-slate-800">{selectedType}</p>
            <p>{hasDates && !dateError ? `${days} ${usesCalendarDays ? 'calendar' : 'working'} day${days === 1 ? '' : 's'}` : 'Complete the required fields to submit.'}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost btn-sm min-h-11" disabled={isSubmitting} onClick={onClose}>Cancel</button>
            <button form={`${id}-form`} type="submit" className="btn btn-primary btn-sm min-h-11" disabled={isSubmitting || !!dateError}>{isSubmitting ? 'Submitting...' : initialData ? 'Resubmit application' : 'Submit application'}</button>
          </div>
        </footer>
      </div>
    </dialog>
  );
}
