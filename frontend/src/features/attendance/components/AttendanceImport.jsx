import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Upload, AlertCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { fetchAllPages } from '../../../api/pagination';
import { QUERY_KEYS } from '../../../api/queryKeys';

export default function AttendanceImport({ mode = 'import' }) {
  const client = useQueryClient();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [mapping, setMapping] = useState({ source_id: '', biometric_id: '', employee_id: '' });
  const showMappings = mode === 'mappings';
  const [mappingSearch, setMappingSearch] = useState('');
  const { data: employees = [], isError: employeeError } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES, 'attendance-mapping'],
    queryFn: ({ signal }) => fetchAllPages('employees/', {}, signal), enabled: showMappings,
  });
  const { data: mappings = [], isLoading: mappingsLoading, isError: mappingsError } = useQuery({
    queryKey: [QUERY_KEYS.BIOMETRIC_MAPPINGS],
    queryFn: () => api.get('attendance/biometric_mappings/').then(r => r.data), enabled: showMappings,
  });

  async function downloadTemplate(fileType = 'xlsx') {
    try {
      const { data } = await api.get('attendance/import_template/', { responseType: 'blob', params: { file_type: fileType } });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url; link.download = `attendance-template.${fileType}`; link.click();
      URL.revokeObjectURL(url);
    } catch { setMessage('Template download failed. Try again.'); }
  }

  async function upload(commit = false) {
    setBusy(true); setMessage('');
    try {
      const form = new FormData(); form.append('file', file);
      if (commit) form.append('preview_token', preview.preview_token);
      const { data } = await api.post(`attendance/import_${commit ? 'commit' : 'preview'}/`, form);
      if (commit) {
        setPreview(null);
        setMessage(data.already_imported ? 'This file has already been imported.' : `Imported ${data.imported} punches. ${data.duplicates} duplicates skipped. DTR review is required.`);
        for (const key of [QUERY_KEYS.ATTENDANCE, QUERY_KEYS.DASHBOARD_STATS, QUERY_KEYS.AUDIT_LOGS, QUERY_KEYS.CHARTS.ATTENDANCE_TRENDS]) {
          client.invalidateQueries({ queryKey: [key] });
        }
      } else setPreview(data);
    } catch (error) {
      if (error.response?.data?.errors) setPreview(error.response.data);
      setMessage(error.response?.data?.detail || 'Upload failed. Check the file and try again.');
    } finally { setBusy(false); }
  }

  async function saveMapping(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      await api.post('attendance/biometric_mappings/', mapping);
      client.invalidateQueries({ queryKey: [QUERY_KEYS.BIOMETRIC_MAPPINGS] });
      setPreview(null); setMapping({ ...mapping, biometric_id: '', employee_id: '' }); setMessage('Mapping saved. Preview the file again.');
    } catch (error) { setMessage(error.response?.data?.detail || 'Could not save mapping.'); }
    finally { setBusy(false); }
  }

  if (showMappings) return <section className="space-y-6" aria-labelledby="mapping-heading">
    <div><h2 id="mapping-heading" className="text-lg font-semibold text-slate-900">Connect machine IDs to personnel</h2><p className="text-sm text-slate-600 mt-1 max-w-3xl">Use a mapping when a school's biometric machine uses its own employee numbers. The source ID keeps identical machine numbers from different schools separate.</p></div>
    <form onSubmit={saveMapping} className="bg-white border border-slate-300 rounded-lg">
      <div className="px-5 py-3 border-b border-slate-200 font-medium text-sm text-slate-800">Add employee mapping</div>
      <div className="grid md:grid-cols-3 gap-4 p-5">
        <label className="text-sm font-medium text-slate-700">Source / device ID<input required placeholder="e.g. SCHOOL-001" maxLength={100} className="input input-bordered block w-full mt-2 font-normal" value={mapping.source_id} onChange={e => setMapping({ ...mapping, source_id: e.target.value })} /></label>
        <label className="text-sm font-medium text-slate-700">Biometric employee ID<input required placeholder="ID shown on the machine" maxLength={100} className="input input-bordered block w-full mt-2 font-normal" value={mapping.biometric_id} onChange={e => setMapping({ ...mapping, biometric_id: e.target.value })} /></label>
        <label className="text-sm font-medium text-slate-700">Personnel record<select required className="select select-bordered block w-full mt-2 font-normal" value={mapping.employee_id} onChange={e => setMapping({ ...mapping, employee_id: e.target.value })}><option value="">Select employee</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.last_name}, {employee.first_name} | {employee.agency_employee_no || 'No agency number'}</option>)}</select></label>
      </div>
      <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">Check both IDs carefully. Existing mappings cannot be reassigned here.</p><button className="btn btn-primary btn-sm" disabled={busy || employeeError}>{busy ? 'Saving...' : 'Save mapping'}</button></div>
    </form>
    {message && <p role="status" className="text-sm p-3 bg-blue-50 border-l-2 border-blue-700 text-slate-800">{message}</p>}
    {(employeeError || mappingsError) && <p role="alert" className="text-red-800 text-sm">Could not load mapping records. Refresh to try again.</p>}
    <div className="border border-slate-300 rounded-lg bg-white overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-wrap justify-between gap-3 items-center"><h3 className="font-medium text-sm">Registered mappings <span className="text-slate-500 font-normal">({mappings.length})</span></h3><label className="sr-only" htmlFor="mapping-search">Search mappings</label><input id="mapping-search" type="search" className="input input-bordered input-sm w-full sm:w-72" placeholder="Search source, ID or employee" value={mappingSearch} onChange={e => setMappingSearch(e.target.value)} /></div>
      <div className="overflow-x-auto"><table className="table text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th>Source / device</th><th>Biometric ID</th><th>Linked employee</th></tr></thead><tbody>{mappingsLoading ? <tr><td colSpan={3} className="text-center py-12">Loading mappings...</td></tr> : mappings.filter(item => `${item.source_id} ${item.biometric_id} ${item.employee__last_name} ${item.employee__first_name}`.toLowerCase().includes(mappingSearch.toLowerCase())).map(item => <tr key={item.id}><td className="font-medium">{item.source_id}</td><td className="font-mono">{item.biometric_id}</td><td>{item.employee__last_name}, {item.employee__first_name}</td></tr>)}</tbody></table></div>
      {!mappingsLoading && !mappings.length && <p className="py-12 text-center text-sm text-slate-500">No mappings yet. Add a machine ID above, or use agency employee numbers in your file.</p>}
    </div>
  </section>;

  return <section className="space-y-5" aria-labelledby="import-heading">
    <div className="flex flex-wrap justify-between gap-4 items-start"><div><h2 id="import-heading" className="text-lg font-semibold text-slate-900">Import school attendance</h2><p className="text-sm text-slate-600 mt-1">Review the file before adding time logs to personnel DTRs.</p></div><button type="button" className="btn btn-sm btn-outline border-slate-300 text-slate-700" onClick={() => downloadTemplate('xlsx')}><Download size={15} /> Excel template</button><button type="button" className="btn btn-sm btn-outline border-slate-300 text-slate-700" onClick={() => downloadTemplate('csv')}><Download size={15} /> CSV template</button></div>
    <ol className="flex flex-wrap gap-x-6 gap-y-2 text-xs border-y border-slate-200 py-3 text-slate-500" aria-label="Import progress"><li className={!preview ? 'text-[#0038a8] font-semibold' : ''}>1. Select file</li><li className={preview ? 'text-[#0038a8] font-semibold' : ''}>2. Review validation</li><li>3. Confirm import</li></ol>
    <div className="grid lg:grid-cols-[minmax(0,1fr)_280px] gap-6 items-start">
      <div className="space-y-5 min-w-0">
        <div className="bg-white border border-slate-300 rounded-lg p-5 space-y-4"><label className="block text-sm font-medium text-slate-800">School attendance file<input type="file" accept=".xlsx,.xls,.csv" disabled={busy} className="file-input file-input-bordered block mt-3 w-full" onChange={event => { setFile(event.target.files?.[0] || null); setPreview(null); setMessage(''); }} /></label><div className="flex flex-wrap gap-3 items-center justify-between"><span className="text-xs text-slate-500">Excel (.xlsx, .xls) or CSV | Up to 5 MB | 10,000 punches</span><button className="btn btn-primary btn-sm" type="button" disabled={!file || busy} onClick={() => upload(false)}><Upload size={15} />{busy ? 'Processing...' : 'Preview file'}</button></div></div>
        {message && <p role="status" className="text-sm p-4 bg-blue-50 border-l-2 border-blue-700 text-slate-800">{message}</p>}
        {preview && <div className="border border-slate-300 rounded-lg bg-white overflow-hidden">
          <div className="p-5 border-b border-slate-200"><h3 className="font-semibold text-slate-900">File validation</h3><p className="text-sm text-slate-600 mt-1">{preview.new_punches} new punches | {preview.duplicates} duplicates skipped | {preview.errors.length} blocking errors</p></div>
          {preview.errors.length > 0 && <div className="m-4 p-4 bg-red-50 border border-red-200 rounded text-red-800" role="alert"><p className="text-sm font-semibold flex items-center gap-2"><AlertCircle size={16} /> Correct these issues and upload the file again</p><ul className="text-sm mt-2 max-h-48 overflow-auto list-disc pl-5">{preview.errors.map((error, i) => <li key={i}>{error.row ? `Row ${error.row}: ` : ''}{error.detail}</li>)}</ul></div>}
          {preview.warnings.length > 0 && <details className="m-4 p-3 border border-amber-200 bg-amber-50 rounded"><summary className="cursor-pointer text-sm font-medium text-amber-900">{preview.warnings.length} incomplete days require HR review</summary><ul className="text-sm max-h-48 overflow-auto mt-2 text-amber-900">{preview.warnings.map((warning, i) => <li key={i}>{warning.employee} | {warning.date}: {warning.missing.join(', ')}</li>)}</ul></details>}
          <div className="overflow-auto max-h-96"><table className="table table-sm"><caption className="text-left px-5 py-2 text-xs text-slate-500">First 100 punches | All rows are validated</caption><thead className="bg-slate-50 text-slate-600"><tr><th>Row</th><th>Employee</th><th>Date</th><th>Punch</th><th>Time</th></tr></thead><tbody>{preview.rows.slice(0, 100).map((row, i) => <tr key={i}><td>{row.row}</td><td>{row.employee}</td><td className="whitespace-nowrap">{row.date}</td><td>{row.punch_type}</td><td className="font-mono">{row.time}</td></tr>)}</tbody></table></div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-600">Imported records remain pending until DTR review.</p><button type="button" className="btn btn-primary btn-sm" disabled={busy || !preview.can_import || !preview.preview_token} onClick={() => upload(true)}>{busy ? 'Importing...' : `Confirm ${preview.new_punches} punches`}</button></div>
        </div>}
      </div>
      <aside className="text-sm text-slate-600 space-y-5 lg:border-l lg:border-slate-200 lg:pl-6"><div><h3 className="font-semibold text-slate-800 mb-2">Before you upload</h3><ul className="space-y-3 list-disc pl-4"><li>Use the downloaded template with one punch per row.</li><li>Keep employee IDs as text, including leading zeros.</li><li>Use local dates and times for Asia/Manila.</li></ul></div><div className="border-t border-slate-200 pt-4"><h3 className="font-semibold text-slate-800 mb-2">Using machine employee IDs?</h3><p className="text-sm">Link each machine ID to a personnel record first.</p><Link className="inline-block mt-2 font-medium text-[#0038a8] underline underline-offset-4" to="?view=mappings">Open employee ID mappings</Link></div><div className="border-t border-slate-200 pt-4"><h3 className="font-semibold text-slate-800 mb-2">After importing</h3><p>Check missing punches, then review and approve the monthly DTR.</p><Link className="inline-block mt-2 font-medium text-[#0038a8] underline underline-offset-4" to="/staff-dtr">Review staff DTRs</Link></div></aside>
    </div>
  </section>;
}
