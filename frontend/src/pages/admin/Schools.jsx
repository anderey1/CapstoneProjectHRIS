import { useState } from 'react';
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Pencil, Plus, School, ShieldCheck, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../features/schools/schools.css';
import { useSchools } from '../../features/schools/hooks/useSchools';
import SchoolDialog from '../../features/schools/components/SchoolDialog';

export default function Schools() {
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState('');
  const { query, mutation } = useSchools(page);
  const schools = query.data?.results || [];
  function open(action, school = null) {
    mutation.reset();
    setNotice('');
    setDialog({ action, school });
  }
  async function submit(values) {
    try {
      await mutation.mutateAsync({ action: dialog.action, id: dialog.school?.id, values });
      setNotice(dialog.action === 'delete' ? 'School deleted.' : 'School saved.');
      if (dialog.action === 'delete' && schools.length === 1 && page > 1) setPage(page - 1);
      setDialog(null);
    } catch {
      // Keep the dialog and entered values visible while the user resolves the error.
    }
  }
  return (
    <section className="school-workspace">
      <header className="school-page-heading">
        <div>
          <p className="school-eyebrow">System administration <span>/</span> School records</p>
          <h1>Schools</h1>
          <p className="school-intro">The division's school directory, kept in one place.</p>
        </div>
        <button className="school-button school-button-primary" onClick={() => open('add')}>
          <Plus size={17} aria-hidden="true" /> Add school
        </button>
      </header>

      {notice && <p role="status" className="school-notice"><Check size={16} aria-hidden="true" />{notice}</p>}

      <div className="school-content-layout">
        <div className="school-register">
          <div className="school-register-heading">
            <div><h2>School directory</h2><p>Official school names used in personnel records.</p></div>
            {query.data && <span className="school-count">{query.data.count} {query.data.count === 1 ? 'school' : 'schools'}</span>}
          </div>
          {query.isPending ? <div className="school-empty" role="status">Loading schools...</div> : query.isError ? (
            <div role="alert" className="school-empty"><h3>Schools couldn't be loaded</h3><p>Check your connection and try again.</p><button className="school-button school-button-secondary" onClick={() => query.refetch()}>Try again</button></div>
          ) : schools.length === 0 ? (
            <div className="school-empty"><School size={28} aria-hidden="true" /><h3>No schools yet</h3><p>Add the first school to your division's directory.</p><button className="school-button school-button-secondary" onClick={() => open('add')}>Add the first school</button></div>
          ) : <>
            <table className="school-table">
              <caption className="sr-only">School records</caption>
              <thead><tr><th scope="col">School name</th><th scope="col" className="school-actions-heading">Actions</th></tr></thead>
              <tbody>{schools.map(school => <tr key={school.id}>
                <th scope="row"><div className="school-name-cell"><span className="school-row-icon"><School size={19} strokeWidth={1.6} aria-hidden="true" /></span><span>{school.name}</span></div></th>
                <td><div className="school-row-actions">
                  <button className="school-edit" aria-label={`Edit ${school.name}`} onClick={() => open('edit', school)}><Pencil size={15} aria-hidden="true" /><span>Edit</span></button>
                  <button className="school-delete" aria-label={`Delete ${school.name}`} title={`Delete ${school.name}`} onClick={() => open('delete', school)}><Trash2 size={16} aria-hidden="true" /></button>
                </div></td>
              </tr>)}</tbody>
            </table>
            <nav aria-label="School pages" className="school-pagination">
              <p>Page <strong>{page}</strong></p>
              <div><button aria-label="Previous" disabled={!query.data.previous} onClick={() => setPage(page - 1)}><ChevronLeft size={16} aria-hidden="true" /><span>Previous</span></button>
                <button aria-label="Next" disabled={!query.data.next} onClick={() => setPage(page + 1)}><span>Next</span><ChevronRight size={16} aria-hidden="true" /></button></div>
            </nav>
          </>}
        </div>

        <aside className="school-guidance" aria-label="About school records">
          <div className="school-guidance-heading"><ShieldCheck size={17} aria-hidden="true" /><h2>Admin access</h2></div>
          <p>Only the super admin can add, rename, or remove schools.</p>
          <div className="school-guidance-divider" />
          <h3>Before removing a school</h3>
          <p>Reassign its personnel to another school first. Their records stay in the system.</p>
          <Link to="/employees">Personnel directory <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </aside>
      </div>
      {dialog && <SchoolDialog school={dialog.school} deleting={dialog.action === 'delete'} pending={mutation.isPending}
        error={mutation.error} onClose={() => setDialog(null)} onSubmit={submit} />}
    </section>
  );
}
