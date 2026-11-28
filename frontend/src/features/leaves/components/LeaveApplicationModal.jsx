import { useId, useRef } from 'react';
import { CalendarDays, X, AlertCircle } from 'lucide-react';
import LeaveDocumentUpload from './LeaveDocumentUpload';
import LeaveDatePicker from './LeaveDatePicker';
import { useLeaveCalendar, calculateWorkingDays } from '../hooks/useLeaves';
import { LEAVE_TYPES, getLeaveDocuments, calendarDaysBetween, isCalendarDate, nonWorkingReason } from '../utils/leaveApplication';
import AccessibleDialog from '../../../components/common/AccessibleDialog';

const fieldClass = 'input input-bordered min-h-11 w-full rounded-lg border-slate-300 bg-white text-sm text-slate-900 focus:border-primary';
const selectClass = 'select select-bordered min-h-11 w-full rounded-lg border-slate-300 bg-white text-sm text-slate-900 focus:border-primary';
const labelRowClass = 'flex items-center justify-between gap-2 text-sm font-medium text-slate-800';

export default function LeaveApplicationModal({
  isOpen, onClose, onSubmit, isSubmitting, leaveType, setLeaveType,
  startDate, setStartDate, endDate, setEndDate,
  isWithinPhilippines, setIsWithinPhilippines, initialData, employee,
}) {
  const id = useId();
  const leaveTypeRef = useRef(null);
  const usesCalendarDays = ['maternity', 'adoption'].includes(leaveType);
  const calendar = useLeaveCalendar(startDate, endDate, isOpen);

  if (!isOpen) return null;

  const days = usesCalendarDays
    ? calendarDaysBetween(startDate, endDate)
    : calculateWorkingDays(startDate, endDate, calendar.holidays);
  const minDate = `${calendar.today.slice(0, 7)}-01`;
  const datesReversed = !!(startDate && endDate && endDate < startDate);
  const noWorkingDays = !!(calendar.ready && startDate && endDate && !datesReversed && !usesCalendarDays && days === 0);
  const documents = getLeaveDocuments(leaveType, days, isWithinPhilippines);
  const requiredCount = documents.filter((document) => document.required).length;
  const selectedType = LEAVE_TYPES.find(([value]) => value === leaveType)?.[1];
  const needsLocation = ['vacation', 'special_privilege'].includes(leaveType);
  const needsMedicalDetails = ['sick', 'women_special', 'rehabilitation'].includes(leaveType);
  const hasDates = isCalendarDate(startDate) && isCalendarDate(endDate);
  const invalidFormat = (startDate && !isCalendarDate(startDate)) || (endDate && !isCalendarDate(endDate));
  const beforeMinimum = (isCalendarDate(startDate) && startDate < minDate) || (isCalendarDate(endDate) && endDate < minDate);
  const nonWorkingEndpoint =
    calendar.ready && !usesCalendarDays && (nonWorkingReason(startDate, calendar.holidays) || nonWorkingReason(endDate, calendar.holidays));
  const includesTodayEndpoint = startDate === calendar.today || endDate === calendar.today;
  const dateError = invalidFormat
    ? 'Enter a valid date in YYYY-MM-DD format.'
    : datesReversed
      ? 'End date must be on or after the start date.'
      : includesTodayEndpoint
        ? "Today's date cannot be selected as the start or end date. Choose another date."
        : beforeMinimum
          ? 'Choose dates from the current month onward.'
          : noWorkingDays
            ? 'These dates contain no working days. Weekends and public non-working holidays are excluded.'
            : nonWorkingEndpoint
              ? 'Choose dates that are not PH non-working holidays.'
              : '';
  const filingHint = 'Choose dates from the current month onward. Today and PH non-working holidays cannot be selected.';

  const showCredits = employee && ['vacation', 'forced', 'sick'].includes(leaveType);
  const hasSickBalance = leaveType === 'sick' && employee?.sick_leave_balance != null;
  const hasVacationBalance = employee?.vacation_leave_balance != null;

  return (
    <AccessibleDialog
      onClose={() => { if (!isSubmitting) onClose(); }}
      labelledBy={`${id}-title`}
      describedBy={`${id}-intro`}
      noBackdropClose={isSubmitting}
      initialFocusRef={leaveTypeRef}
      className="flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-xl sm:max-h-[90dvh]"
    >
      {/* Sticky Header */}
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-medium text-primary">CSC Form No. 6 (Revised 2020)</p>
          <h2 id={`${id}-title`} className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">
            {initialData ? 'Correct leave application' : 'Apply for leave'}
          </h2>
          <p id={`${id}-intro`} className="mt-0.5 text-xs text-slate-600">
            Select your leave type, inclusive dates, and supporting attachments.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close leave application"
          className="btn btn-ghost btn-square min-h-11 min-w-11 shrink-0 text-slate-600 hover:text-slate-900"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </header>

      {/* Scrollable Body */}
      <form
        id={`${id}-form`}
        onSubmit={onSubmit}
        className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain bg-white px-5 py-5 sm:px-6"
        aria-busy={isSubmitting}
      >
        {initialData && (
          <div role="alert" className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">Application #{initialData.id} needs a correction</p>
            <p>{initialData.correction_reason}</p>
            <p className="text-xs text-amber-900">
              Existing attachments stay on file. Resubmitting sends the application back to your principal.
            </p>
          </div>
        )}

        {/* 1. Leave Details */}
        <section className="space-y-4" aria-labelledby={`${id}-section-1`}>
          <div className="border-b border-slate-200 pb-2">
            <h3 id={`${id}-section-1`} className="text-sm font-semibold text-slate-900">
              1. Leave details
            </h3>
          </div>

          <div className="min-w-0 space-y-1.5">
            <label htmlFor={`${id}-type`} className={labelRowClass}>
              <span>6.A Type of leave</span>
              <span className="text-xs font-medium text-primary">Required</span>
            </label>
            <select
              ref={leaveTypeRef}
              id={`${id}-type`}
              name="leave_type"
              value={leaveType}
              onChange={(event) => setLeaveType(event.target.value)}
              className={selectClass}
              required
            >
              {LEAVE_TYPES.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {showCredits && (hasSickBalance || hasVacationBalance) && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-700">
              <span className="font-medium text-slate-600">Available leave credits:</span>
              {hasSickBalance && (
                <span className="tabular-nums">
                  Sick leave: <strong className="font-semibold text-slate-900">{Number(employee.sick_leave_balance)} days</strong>
                </span>
              )}
              {hasVacationBalance && (
                <span className="tabular-nums">
                  Vacation leave: <strong className="font-semibold text-slate-900">{Number(employee.vacation_leave_balance)} days</strong>
                </span>
              )}
            </div>
          )}

          {leaveType === 'others' && (
            <div className="min-w-0 space-y-1.5">
              <label htmlFor={`${id}-other`} className={labelRowClass}>
                <span>Specify leave type</span>
                <span className="text-xs font-medium text-primary">Required</span>
              </label>
              <input
                id={`${id}-other`}
                name="other_type_details"
                defaultValue={initialData?.other_type_details || ''}
                className={fieldClass}
                placeholder="Enter the type of leave"
                required
              />
            </div>
          )}

          {needsLocation && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <fieldset className="min-w-0 space-y-1.5">
                <legend className="text-sm font-medium text-slate-800">6.B Where leave will be spent</legend>
                <div className="flex min-h-11 flex-wrap items-center gap-5 rounded-lg border border-slate-300 bg-white px-3.5 py-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                    <input
                      type="radio"
                      name="is_within_philippines"
                      value="true"
                      checked={isWithinPhilippines}
                      onChange={() => setIsWithinPhilippines(true)}
                      className="radio radio-primary radio-sm"
                    />
                    <span>Philippines</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                    <input
                      type="radio"
                      name="is_within_philippines"
                      value="false"
                      checked={!isWithinPhilippines}
                      onChange={() => setIsWithinPhilippines(false)}
                      className="radio radio-primary radio-sm"
                    />
                    <span>Abroad</span>
                  </label>
                </div>
              </fieldset>

              <div className="min-w-0 space-y-1.5">
                <label htmlFor={`${id}-location`} className={labelRowClass}>
                  <span>City / Country</span>
                  <span className="text-xs font-normal text-slate-500">Optional</span>
                </label>
                <input
                  id={`${id}-location`}
                  name="location_details"
                  defaultValue={initialData?.location_details || ''}
                  className={fieldClass}
                  placeholder={isWithinPhilippines ? 'e.g. Lucena City' : 'e.g. Tokyo, Japan'}
                />
              </div>
            </div>
          )}

          {needsMedicalDetails && (
            <div className="space-y-4">
              <fieldset className="space-y-1.5">
                <legend className="text-sm font-medium text-slate-800">Treatment setting</legend>
                <div className="flex min-h-11 flex-wrap items-center gap-5 rounded-lg border border-slate-300 bg-white px-3.5 py-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                    <input
                      type="radio"
                      name="is_in_hospital"
                      value="false"
                      className="radio radio-primary radio-sm"
                      defaultChecked={initialData?.is_in_hospital !== true}
                    />
                    <span>Outpatient / At home</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                    <input
                      type="radio"
                      name="is_in_hospital"
                      value="true"
                      className="radio radio-primary radio-sm"
                      defaultChecked={initialData?.is_in_hospital === true}
                    />
                    <span>In hospital</span>
                  </label>
                </div>
              </fieldset>

              <div className="min-w-0 space-y-1.5">
                <label htmlFor={`${id}-illness`} className={labelRowClass}>
                  <span>Illness / Medical details</span>
                  <span className="text-xs font-normal text-slate-500">Optional</span>
                </label>
                <textarea
                  id={`${id}-illness`}
                  name="illness_details"
                  defaultValue={initialData?.illness_details || ''}
                  rows={2}
                  className="textarea textarea-bordered min-h-22 w-full rounded-lg border-slate-300 bg-white text-sm leading-relaxed text-slate-900 focus:border-primary"
                  placeholder="Briefly describe the reason for this leave."
                />
              </div>
            </div>
          )}

          {leaveType === 'study' && (
            <div className="min-w-0 space-y-1.5">
              <label htmlFor={`${id}-study`} className={labelRowClass}>
                <span>Purpose of study leave</span>
                <span className="text-xs font-medium text-primary">Required</span>
              </label>
              <select
                id={`${id}-study`}
                name="study_type"
                defaultValue={initialData?.study_type || ''}
                className={selectClass}
                required
              >
                <option value="">Choose a purpose</option>
                <option value="masters">Completion of master&apos;s degree</option>
                <option value="board_exam">BAR / Board examination review</option>
              </select>
            </div>
          )}

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium text-slate-800">6.D Commutation of leave credits</legend>
            <div className="flex min-h-11 flex-wrap items-center gap-5 rounded-lg border border-slate-300 bg-white px-3.5 py-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                <input
                  type="radio"
                  name="commutation"
                  value="not_requested"
                  defaultChecked={initialData?.commutation !== 'requested'}
                  className="radio radio-primary radio-sm"
                />
                <span>Not requested</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                <input
                  type="radio"
                  name="commutation"
                  value="requested"
                  defaultChecked={initialData?.commutation === 'requested'}
                  className="radio radio-primary radio-sm"
                />
                <span>Requested</span>
              </label>
            </div>
            <p className="text-xs text-slate-500">Indicate whether you are requesting the cash value of leave credits.</p>
          </fieldset>
        </section>

        {/* 2. Dates and Duration */}
        <section className="space-y-4" aria-labelledby={`${id}-section-2`}>
          <div className="border-b border-slate-200 pb-2">
            <h3 id={`${id}-section-2`} className="text-sm font-semibold text-slate-900">
              2. Inclusive dates and duration
            </h3>
            <p id={`${id}-date-help`} className="text-xs text-slate-500">{filingHint}</p>
          </div>

          {!calendar.ready && (
            <div className="text-sm text-slate-800" role={calendar.error ? 'alert' : 'status'}>
              <p>{calendar.error || 'Loading the reviewed leave calendar...'}</p>
              {calendar.error && (
                <button type="button" className="btn btn-outline btn-sm mt-2 min-h-11" onClick={calendar.retry}>
                  Retry calendar
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <label htmlFor={`${id}-start`} className={labelRowClass}>
                <span>Start date</span>
                <span className="text-xs font-medium text-primary">Required</span>
              </label>
              <LeaveDatePicker
                id={`${id}-start`}
                name="start_date"
                label="Start date"
                min={minDate}
                today={calendar.today}
                value={startDate}
                onChange={setStartDate}
                usesCalendarDays={usesCalendarDays}
                invalid={!!dateError}
                describedBy={dateError ? `${id}-date-error` : `${id}-date-help`}
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <label htmlFor={`${id}-end`} className={labelRowClass}>
                <span>End date</span>
                <span className="text-xs font-medium text-primary">Required</span>
              </label>
              <LeaveDatePicker
                id={`${id}-end`}
                name="end_date"
                label="End date"
                min={isCalendarDate(startDate) && startDate > minDate ? startDate : minDate}
                today={calendar.today}
                value={endDate}
                onChange={setEndDate}
                usesCalendarDays={usesCalendarDays}
                invalid={!!dateError}
                describedBy={dateError ? `${id}-date-error` : `${id}-date-help`}
              />
            </div>
          </div>

          {dateError && (
            <p id={`${id}-date-error`} role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              <span>{dateError}</span>
            </p>
          )}

          <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/80 p-3.5 text-sm" role="status">
            <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 tabular-nums">
                {calendar.ready && hasDates && !dateError
                  ? `${days} ${usesCalendarDays ? 'calendar' : 'working'} day${days === 1 ? '' : 's'} requested`
                  : 'Select your dates to calculate duration'}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                {usesCalendarDays
                  ? 'Includes weekends and holidays. Both the start and end date are counted.'
                  : 'Counts Monday to Friday, excluding public non-working holidays. Both start and end dates are counted.'}
              </p>
              {calendar.ready &&
                !usesCalendarDays &&
                calendar.holidays
                  .filter(
                    (day) =>
                      day.category !== 'special_working' &&
                      day.date >= startDate &&
                      day.date <= endDate &&
                      ![0, 6].includes(new Date(`${day.date}T00:00:00Z`).getUTCDay())
                  )
                  .map((day) => (
                    <p key={`${day.date}-${day.label}`} className="mt-1 text-xs text-slate-700 tabular-nums">
                      {day.date}: {day.label}
                    </p>
                  ))}
            </div>
          </div>
        </section>

        {/* 3. Attachments */}
        <section className="space-y-4" aria-labelledby={`${id}-section-3`}>
          <div className="border-b border-slate-200 pb-2">
            <h3 id={`${id}-section-3`} className="text-sm font-semibold text-slate-900">
              3. Supporting attachments
            </h3>
            <p className="text-xs text-slate-500">
              {requiredCount
                ? `${requiredCount} required document${requiredCount === 1 ? '' : 's'} for this selection. `
                : 'No mandatory attachments for this selection. '}
              Accepted formats: PDF, PNG, or JPEG.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {documents.map((document) => (
              <LeaveDocumentUpload
                key={`${leaveType}-${document.name}`}
                document={document}
                existingUrl={initialData?.[document.name]}
              />
            ))}
          </div>
        </section>
      </form>

      {/* Sticky Footer */}
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5 sm:px-6">
        <div className="min-w-0 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">{selectedType}</p>
          <p className="tabular-nums">
            {calendar.ready && hasDates && !dateError
              ? `${days} ${usesCalendarDays ? 'calendar' : 'working'} day${days === 1 ? '' : 's'}`
              : 'Complete required fields to submit'}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            className="btn btn-ghost min-h-11 text-sm font-medium text-slate-700"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            form={`${id}-form`}
            type="submit"
            className="btn btn-primary min-h-11 px-5 text-sm font-semibold"
            disabled={isSubmitting || !!dateError || !calendar.ready}
          >
            {isSubmitting ? 'Submitting...' : initialData ? 'Resubmit application' : 'Submit application'}
          </button>
        </div>
      </footer>
    </AccessibleDialog>
  );
}
