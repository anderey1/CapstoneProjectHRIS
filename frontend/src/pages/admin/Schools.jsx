import { useState } from 'react';
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Pencil, Plus, School, ShieldCheck, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
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
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        icon={School}
        title="Schools"
        subtitle="System administration · The division's school directory, kept in one place."
      >
        <button type="button" className="btn btn-primary btn-sm gap-1.5" onClick={() => open('add')}>
          <Plus size={17} aria-hidden="true" /> Add school
        </button>
      </PageHeader>

      {notice && (
        <p role="status" className="flex items-center gap-2 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <Check size={16} aria-hidden="true" />
          {notice}
        </p>
      )}

      <div className="grid grid-cols-1 gap-8 items-start xl:grid-cols-[1fr_216px]">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm min-w-0" aria-label="School directory">
          <div className="flex items-center justify-between gap-4 px-6 py-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">School directory</h2>
              <p className="mt-1 text-xs text-slate-500">Official school names used in personnel records.</p>
            </div>
            {query.data && (
              <span className="shrink-0 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-600">
                {query.data.count} {query.data.count === 1 ? 'school' : 'schools'}
              </span>
            )}
          </div>

          {query.isPending ? (
            <div className="flex flex-col items-center justify-center gap-3 border-t border-slate-200 py-16 text-sm text-slate-500" role="status">
              <span className="loading loading-spinner loading-md text-primary" aria-hidden="true" />
              <span>Loading schools...</span>
            </div>
          ) : query.isError ? (
            <div role="alert" className="flex flex-col items-center gap-3 border-t border-slate-200 px-6 py-16 text-center text-sm text-slate-500">
              <h3 className="text-base font-semibold text-slate-900">Schools couldn&apos;t be loaded</h3>
              <p>Check your connection and try again.</p>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => query.refetch()}>
                Try again
              </button>
            </div>
          ) : schools.length === 0 ? (
            <div className="flex flex-col items-center gap-3 border-t border-slate-200 px-6 py-16 text-center text-sm text-slate-500">
              <School size={28} aria-hidden="true" />
              <h3 className="text-base font-semibold text-slate-900">No schools yet</h3>
              <p>Add the first school to your division&apos;s directory.</p>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => open('add')}>
                Add the first school
              </button>
            </div>
          ) : (
            <>
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">School records</caption>
                <thead className="border-y border-slate-200 bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-xs font-semibold text-slate-500">School name</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map((school) => (
                    <tr key={school.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <th scope="row" className="px-6 py-4 text-sm font-medium text-slate-900 break-words">
                        <div className="flex items-center gap-3.5">
                          <span className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500">
                            <School size={18} strokeWidth={1.6} aria-hidden="true" />
                          </span>
                          <span>{school.name}</span>
                        </div>
                      </th>
                      <td className="w-32 px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-slate-600 hover:text-primary hover:bg-blue-50 gap-1.5 min-h-9"
                            aria-label={`Edit ${school.name}`}
                            onClick={() => open('edit', school)}
                          >
                            <Pencil size={15} aria-hidden="true" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs btn-square text-slate-400 hover:text-error hover:bg-red-50 min-h-9 min-w-9"
                            aria-label={`Delete ${school.name}`}
                            title={`Delete ${school.name}`}
                            onClick={() => open('delete', school)}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <nav aria-label="School pages" className="flex items-center justify-between gap-4 border-t border-slate-200 px-6 py-3">
                <p className="text-xs text-slate-500">
                  Page <strong className="font-semibold text-slate-700">{page}</strong>
                </p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm gap-1.5"
                    aria-label="Previous"
                    disabled={!query.data.previous}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                    <span>Previous</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm gap-1.5"
                    aria-label="Next"
                    disabled={!query.data.next}
                    onClick={() => setPage(page + 1)}
                  >
                    <span>Next</span>
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </nav>
            </>
          )}
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 text-xs text-slate-600 space-y-3 shadow-sm" aria-label="About school records">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <ShieldCheck size={17} aria-hidden="true" />
            <h2>Admin access</h2>
          </div>
          <p className="leading-relaxed">Only the super admin can add, rename, or remove schools.</p>
          <div className="h-px bg-slate-200 my-3" />
          <h3 className="font-semibold text-slate-900">Before removing a school</h3>
          <p className="leading-relaxed">Reassign its personnel to another school first. Their records stay in the system.</p>
          <Link to="/employees" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline pt-1">
            Personnel directory <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </aside>
      </div>

      {dialog && (
        <SchoolDialog
          school={dialog.school}
          deleting={dialog.action === 'delete'}
          pending={mutation.isPending}
          error={mutation.error}
          onClose={() => setDialog(null)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
