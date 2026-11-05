import { useEffect, useRef, useState } from 'react';
import { School, Trash2, X } from 'lucide-react';

export default function SchoolDialog({ school, deleting, pending, error, onClose, onSubmit }) {
  const ref = useRef(null);
  const [name, setName] = useState(school?.name || '');
  useEffect(() => { ref.current.showModal(); }, []);
  const fieldErrors = error?.response?.data;
  return (
    <dialog ref={ref} className="modal" aria-labelledby="school-dialog-title" aria-describedby="school-dialog-description" onCancel={event => {
      event.preventDefault();
      if (!pending) onClose();
    }}>
      <form className="modal-box school-editor" onSubmit={event => {
        event.preventDefault();
        onSubmit({ name });
      }}>
        <div className="school-editor-header">
          <button type="button" className="school-dialog-close" aria-label="Close dialog" disabled={pending} onClick={onClose}><X size={18} aria-hidden="true" /></button>
          <span className={`school-editor-symbol ${deleting ? 'school-editor-symbol-danger' : ''}`}>
            {deleting ? <Trash2 size={21} aria-hidden="true" /> : <School size={22} strokeWidth={1.7} aria-hidden="true" />}
          </span>
          <h2 id="school-dialog-title">{deleting ? 'Delete school' : school ? 'Edit school' : 'Add school'}</h2>
          <p id="school-dialog-description">{deleting
            ? 'This removes the school from the directory. This action cannot be undone.'
            : school ? 'Update the school name across personnel records.' : 'Add a school to the division directory.'}</p>
        </div>
        <div className="school-editor-body">
          {deleting ? <>
            <div className="school-delete-record"><School size={20} aria-hidden="true" /><strong>{school.name}</strong></div>
            <p className="school-field-hint">Personnel must be reassigned before this school can be removed.</p>
          </> : <>
            <label htmlFor="school-name">School name</label>
            <input type="text" id="school-name" maxLength={100} required disabled={pending} value={name}
              placeholder="Enter the official school name" autoComplete="off"
              aria-invalid={Boolean(fieldErrors?.name)} aria-describedby={fieldErrors?.name ? 'error-name' : 'school-name-hint'}
              onChange={event => setName(event.target.value)} />
            {fieldErrors?.name
              ? <p id="error-name" className="school-field-error">{[].concat(fieldErrors.name).join(' ')}</p>
              : <p id="school-name-hint" className="school-field-hint">Use the name shown in official personnel records.</p>}
          </>}
          {error && <p role="alert" className="school-field-error">{fieldErrors?.detail || 'Unable to save this change. Check the school name and try again.'}</p>}
        </div>
        <div className="school-editor-footer">
          <button type="button" className="school-button school-button-secondary" disabled={pending} onClick={onClose}>Cancel</button>
          <button type="submit" className={`school-button ${deleting ? 'school-button-danger' : 'school-button-primary'}`} disabled={pending}>
            {pending ? 'Saving...' : deleting ? 'Delete school' : 'Save school'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
