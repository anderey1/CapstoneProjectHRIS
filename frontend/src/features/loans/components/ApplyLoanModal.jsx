import React, { useId, useState } from 'react';
import { X, Info, Calculator, Upload, FileCheck, Trash2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import AccessibleDialog from '../../../components/common/AccessibleDialog';

const PURPOSE_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'medical', label: 'Medical / Hospitalization' },
  { value: 'calamity', label: 'Calamity' },
  { value: 'educational', label: 'Educational' },
  { value: 'emergency', label: 'Emergency' },
];

const CORE_DOC_TYPES = [
  { value: 'laf', label: 'Loan Application Form (LAF)' },
  { value: 'letter_request', label: 'Letter Request' },
  { value: 'auth_deduct', label: 'Authorization to Deduct' },
  { value: 'payslip', label: 'Latest Payslip' },
  { value: 'deped_id', label: 'DepEd ID' },
  { value: 'comaker_payslip', label: 'Co-Maker Payslip' },
];

const PURPOSE_DOCS = {
  medical: { value: 'medical_abstract', label: 'Medical Abstract / Certificate', hint: 'Recommended for medical loans' },
  calamity: { value: 'calamity_cert', label: 'Calamity Certificate', hint: 'Recommended for calamity loans' },
};

const EXTRA_EMPLOYMENT_DOCS = [
  { value: 'appointment', label: 'Approved Appointment' },
  { value: 'service_record', label: 'Updated Service Record' },
  { value: 'contract', label: 'Contract of Service' },
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const labelRowClass = 'flex items-center justify-between gap-2 text-sm font-medium text-slate-800';
const inputClass = 'input input-bordered min-h-11 w-full rounded-lg border-slate-300 bg-white text-sm text-slate-900 focus:border-primary';
const selectClass = 'select select-bordered min-h-11 w-full rounded-lg border-slate-300 bg-white text-sm text-slate-900 focus:border-primary';

function DocumentUploadRow({ id, doc, attached, onSelectFile, onRemove }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3.5">
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <FileCheck
          className={`mt-0.5 size-4 shrink-0 ${attached ? 'text-success' : 'text-slate-400'}`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">{doc.label}</p>
          {doc.hint && <p className="text-xs text-primary">{doc.hint}</p>}
          {attached && (
            <p className="mt-0.5 truncate text-xs text-slate-600" title={attached.file.name}>
              {attached.file.name} ({Math.max(1, Math.round(attached.file.size / 1024))} KB)
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <input
          id={id}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onSelectFile(doc.value, file);
          }}
        />
        <label
          htmlFor={id}
          className="btn btn-outline btn-sm min-h-11 gap-1.5 border-slate-300 bg-white text-slate-800 hover:border-primary hover:text-primary"
        >
          <Upload className="size-3.5" aria-hidden="true" />
          <span>{attached ? 'Replace' : 'Attach'}</span>
        </label>
        {attached && (
          <button
            type="button"
            onClick={() => onRemove(doc.value)}
            aria-label={`Remove ${doc.label}`}
            className="btn btn-ghost btn-square min-h-11 min-w-11 text-slate-600 hover:text-error"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Apply Provident Loan Modal — DepEd Order No. 37, s. 2018
 */
const ApplyLoanModal = ({ isOpen, onClose, onSubmit, isPending, user, employees, initialData }) => {
  const id = useId();
  const fieldId = (name) => `${id}-${name}`;
  const formId = fieldId('form');

  const [formData, setFormData] = useState({
    loan_amount: '',
    interest_rate: '5.0',
    term_months: '12',
    purpose: 'general',
    letter_request: '',
    co_maker_name: '',
  });
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [showExtraDocs, setShowExtraDocs] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(false);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      if (initialData) {
        setFormData({
          loan_amount: initialData.loan_amount,
          interest_rate: initialData.interest_rate,
          term_months: String(initialData.term_months),
          purpose: initialData.purpose,
          letter_request: initialData.letter_request || '',
          co_maker_name: initialData.co_maker_name || '',
          employee: initialData.employee,
        });
      } else {
        setFormData({
          loan_amount: '',
          interest_rate: '5.0',
          term_months: '12',
          purpose: 'general',
          letter_request: '',
          co_maker_name: '',
          employee: user?.employee_id || '',
        });
      }
      setFiles([]);
      setFileError('');
      setShowExtraDocs(false);
    }
  }

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectFile = (docType, file) => {
    setFileError('');
    const dotIndex = file.name.lastIndexOf('.');
    const ext = dotIndex >= 0 ? file.name.slice(dotIndex).toLowerCase() : '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError(`"${file.name}" is not supported. Upload a PDF, JPG, or PNG file.`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError(`"${file.name}" exceeds the 5 MB file size limit.`);
      return;
    }
    setFiles((prev) => [...prev.filter((f) => f.doc_type !== docType), { doc_type: docType, file }]);
  };

  const handleRemoveFile = (docType) => {
    setFiles((prev) => prev.filter((f) => f.doc_type !== docType));
  };

  const amount = parseFloat(formData.loan_amount) || 0;
  const rate = parseFloat(formData.interest_rate) || 0;
  const term = parseInt(formData.term_months, 10) || 1;
  const totalInterest = amount * (rate / 100);
  const totalRepayable = amount + totalInterest;
  const monthlyPayment = totalRepayable / term;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, files);
  };

  const purposeDoc = PURPOSE_DOCS[formData.purpose];
  const visibleDocs = purposeDoc ? [purposeDoc, ...CORE_DOC_TYPES] : CORE_DOC_TYPES;

  return (
    <AccessibleDialog
      onClose={() => { if (!isPending) onClose(); }}
      labelledBy={fieldId('title')}
      describedBy={fieldId('subtitle')}
      noBackdropClose={isPending}
      className="flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-xl sm:max-h-[90dvh]"
    >
      {/* Sticky Header */}
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-medium text-primary">DepEd Order No. 37, s. 2018</p>
          <h2 id={fieldId('title')} className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">
            {initialData ? 'Resubmit provident loan application' : 'Apply for provident loan'}
          </h2>
          <p id={fieldId('subtitle')} className="mt-0.5 text-xs text-slate-600">
            Enter your loan terms, co-maker details, and supporting documents.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          aria-label="Close loan application"
          className="btn btn-ghost btn-square min-h-11 min-w-11 shrink-0 text-slate-600 hover:text-slate-900"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </header>

      {/* Scrollable Body */}
      <form
        id={formId}
        onSubmit={handleFormSubmit}
        className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain bg-white px-5 py-5 sm:px-6"
      >
        {initialData?.remarks && (
          <div role="alert" className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">Previous review remarks</p>
            <p>{initialData.remarks}</p>
          </div>
        )}

        {user?.role === 'HR' && employees && employees.length > 0 ? (
          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId('employee')} className={labelRowClass}>
              <span>Borrower (Staff member)</span>
              <span className="text-xs font-medium text-primary">Required</span>
            </label>
            <select
              id={fieldId('employee')}
              name="employee"
              value={formData.employee || ''}
              onChange={handleInputChange}
              className={selectClass}
              required
            >
              <option value="">Choose staff member</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.position})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs text-slate-700">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              Applying as <strong className="font-semibold text-slate-900">{user?.username}</strong>. Confirm that your net take-home pay covers the monthly deduction.
            </span>
          </div>
        )}

        {/* 1. Loan Terms & Live Computation */}
        <section className="space-y-4" aria-labelledby={fieldId('terms-heading')}>
          <div className="border-b border-slate-200 pb-2">
            <h3 id={fieldId('terms-heading')} className="text-sm font-semibold text-slate-900">
              1. Loan terms and computation
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <label htmlFor={fieldId('purpose')} className={labelRowClass}>
                <span>Loan purpose</span>
                <span className="text-xs font-medium text-primary">Required</span>
              </label>
              <select
                id={fieldId('purpose')}
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                className={selectClass}
                required
              >
                {PURPOSE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="min-w-0 space-y-1.5">
              <label htmlFor={fieldId('loan_amount')} className={labelRowClass}>
                <span>Principal amount (₱)</span>
                <span className="text-xs font-medium text-primary">Required</span>
              </label>
              <div className="relative">
                <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                  ₱
                </span>
                <input
                  id={fieldId('loan_amount')}
                  name="loan_amount"
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.loan_amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className={`${inputClass} pl-7 tabular-nums`}
                  required
                />
              </div>
            </div>

            <div className="min-w-0 space-y-1.5">
              <label htmlFor={fieldId('term_months')} className={labelRowClass}>
                <span>Repayment term</span>
                <span className="text-xs font-medium text-primary">Required</span>
              </label>
              <select
                id={fieldId('term_months')}
                name="term_months"
                value={formData.term_months}
                onChange={handleInputChange}
                className={`${selectClass} tabular-nums`}
                required
              >
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="18">18 months</option>
                <option value="24">24 months</option>
              </select>
            </div>

            <div className="min-w-0 space-y-1.5">
              <label htmlFor={fieldId('interest_rate')} className={labelRowClass}>
                <span>Annual interest rate (%)</span>
                <span className="text-xs font-medium text-primary">Required</span>
              </label>
              <input
                id={fieldId('interest_rate')}
                name="interest_rate"
                type="number"
                step="0.1"
                min="0"
                value={formData.interest_rate}
                onChange={handleInputChange}
                className={`${inputClass} tabular-nums`}
                required
              />
            </div>
          </div>

          {/* Live Computation Summary right under Loan Terms */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" role="status" aria-live="polite">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Calculator className="size-4 text-primary" aria-hidden="true" />
                <span>Computation summary</span>
              </span>
              <span className="text-slate-500 tabular-nums">{term} monthly installments</span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-600">Estimated monthly deduction</p>
                <p className="mt-0.5 text-lg font-bold text-primary tabular-nums">
                  ₱{monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Total repayable (Principal + Interest)</p>
                <p className="mt-0.5 text-lg font-bold text-slate-900 tabular-nums">
                  ₱{totalRepayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Co-Maker & Purpose Justification */}
        <section className="space-y-4" aria-labelledby={fieldId('comaker-heading')}>
          <div className="border-b border-slate-200 pb-2">
            <h3 id={fieldId('comaker-heading')} className="text-sm font-semibold text-slate-900">
              2. Co-maker and justification
            </h3>
          </div>

          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId('co_maker_name')} className={labelRowClass}>
              <span>Co-maker name (plantilla employee)</span>
              <span className="text-xs font-normal text-slate-500">Optional</span>
            </label>
            <input
              id={fieldId('co_maker_name')}
              name="co_maker_name"
              type="text"
              value={formData.co_maker_name}
              onChange={handleInputChange}
              placeholder="Full name of plantilla co-maker"
              className={inputClass}
            />
            <p className="text-xs text-slate-500">
              Co-maker must hold an equal or higher salary grade per DepEd Order No. 37, s. 2018.
            </p>
          </div>

          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId('letter_request')} className={labelRowClass}>
              <span>Letter request / Purpose justification</span>
              <span className="text-xs font-normal text-slate-500">Optional</span>
            </label>
            <textarea
              id={fieldId('letter_request')}
              name="letter_request"
              value={formData.letter_request}
              onChange={handleInputChange}
              placeholder="State the purpose of your loan application..."
              rows={3}
              className="textarea textarea-bordered min-h-24 w-full rounded-lg border-slate-300 bg-white text-sm leading-relaxed text-slate-900 focus:border-primary"
            />
          </div>
        </section>

        {/* 3. Supporting Documents */}
        <section className="space-y-4" aria-labelledby={fieldId('docs-heading')}>
          <div className="border-b border-slate-200 pb-2">
            <h3 id={fieldId('docs-heading')} className="text-sm font-semibold text-slate-900">
              3. Supporting documents
            </h3>
            <p className="text-xs text-slate-500">
              Accepted formats: PDF, JPG, or PNG (max 5 MB per file).
              {initialData?.documents?.length > 0 && ' Previously uploaded documents remain on file unless replaced.'}
            </p>
          </div>

          {fileError && (
            <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-error">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">{fileError}</span>
            </div>
          )}

          <div className="space-y-2.5">
            {visibleDocs.map((doc) => (
              <DocumentUploadRow
                key={doc.value}
                id={fieldId(`doc-${doc.value}`)}
                doc={doc}
                attached={files.find((f) => f.doc_type === doc.value)}
                onSelectFile={handleSelectFile}
                onRemove={handleRemoveFile}
              />
            ))}
          </div>

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              aria-expanded={showExtraDocs}
              onClick={() => setShowExtraDocs((prev) => !prev)}
              className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              {showExtraDocs ? (
                <ChevronUp className="size-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="size-4" aria-hidden="true" />
              )}
              <span>{showExtraDocs ? 'Hide additional employment documents' : 'Show additional employment documents (3)'}</span>
            </button>

            {showExtraDocs && (
              <div className="space-y-2.5">
                {EXTRA_EMPLOYMENT_DOCS.map((doc) => (
                  <DocumentUploadRow
                    key={doc.value}
                    id={fieldId(`doc-${doc.value}`)}
                    doc={doc}
                    attached={files.find((f) => f.doc_type === doc.value)}
                    onSelectFile={handleSelectFile}
                    onRemove={handleRemoveFile}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </form>

      {/* Sticky Footer */}
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5 sm:px-6">
        <div className="min-w-0 text-xs text-slate-600 tabular-nums">
          {amount > 0 ? (
            <>
              <span className="font-semibold text-slate-900">
                ₱{monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
              </span>{' '}
              <span>· {term} months</span>
            </>
          ) : (
            <span>Enter principal amount to calculate amortization</span>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            className="btn btn-ghost min-h-11 text-sm font-medium text-slate-700"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            className="btn btn-primary min-h-11 px-5 text-sm font-semibold"
            disabled={isPending}
          >
            {isPending ? 'Submitting...' : initialData ? 'Resubmit application' : 'Submit application'}
          </button>
        </div>
      </footer>
    </AccessibleDialog>
  );
};

export default ApplyLoanModal;
