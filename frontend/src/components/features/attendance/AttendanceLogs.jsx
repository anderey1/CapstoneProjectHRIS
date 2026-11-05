import { Link } from 'react-router-dom';

const formatTime = value => value ? value.slice(0, 5) : '--:--';

export default function AttendanceLogs({ records = [], isLoading, searchTerm, setSearchTerm, deptFilter, setDeptFilter, selectedMonth, setSelectedMonth, departments = [] }) {
  return <section className="bg-white border border-slate-300 rounded-lg overflow-hidden" aria-label="Attendance records">
    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-end gap-4">
      <label className="text-xs font-medium text-slate-600 flex-1 min-w-48">Find personnel<input className="input input-bordered w-full block mt-1 text-sm bg-white" type="search" placeholder="Search name or department" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></label>
      <div>
        <label className="text-xs font-medium text-slate-600">Attendance month<input type="month" className="input input-bordered block mt-1 text-sm bg-white" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} /></label>
        {selectedMonth ? <button type="button" className="text-xs text-[#0038a8] underline underline-offset-2 mt-1" onClick={() => setSelectedMonth('')}>Show all months</button> : <p className="text-xs text-slate-500 mt-1">Showing all months</p>}
      </div>
      <label className="text-xs font-medium text-slate-600">Department<select className="select select-bordered block mt-1 text-sm bg-white" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}><option value="All">All departments</option>{departments.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
    </div>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm">
      <thead className="bg-slate-50 text-xs text-slate-600 border-b border-slate-200"><tr><th className="p-4 font-medium">Personnel</th><th className="p-4 font-medium">Date</th><th className="p-4 font-medium">Morning<br /><span className="font-normal">In / Out</span></th><th className="p-4 font-medium">Afternoon<br /><span className="font-normal">In / Out</span></th><th className="p-4 font-medium">Overtime<br /><span className="font-normal">In / Out</span></th><th className="p-4 font-medium">Attendance</th><th className="p-4 font-medium">DTR review</th></tr></thead>
      <tbody className="divide-y divide-slate-100">{isLoading ? <tr><td colSpan={7} className="p-12 text-center text-slate-500" role="status">Loading attendance records...</td></tr> : records.length ? records.map(record => <tr key={record.id} className="hover:bg-slate-50">
        <td className="p-4"><Link className="font-medium text-[#0038a8] whitespace-nowrap hover:underline focus-visible:underline" to={`/staff-dtr?employee_id=${record.employee}&month=${record.date.slice(0, 7)}`}>{record.employee_name}</Link><div className="text-xs text-slate-500 mt-1">{record.department || 'Department not assigned'}</div></td>
        <td className="p-4 text-slate-600 tabular-nums whitespace-nowrap">{record.date}</td>
        {[['am_in', 'am_out'], ['pm_in', 'pm_out'], ['ot_in', 'ot_out']].map(([arrival, departure]) => <td key={arrival} className="p-4 font-mono text-xs whitespace-nowrap text-slate-700">{formatTime(record[arrival])} / {formatTime(record[departure])}</td>)}
        <td className="p-4"><span className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${record.status === 'present' ? 'bg-green-50 text-green-800' : record.status === 'late' ? 'bg-amber-50 text-amber-900' : 'bg-slate-100 text-slate-700'}`}>{record.status}</span></td>
        <td className="p-4 text-xs whitespace-nowrap text-slate-600">{record.is_dtr_approved ? 'Approved' : 'Pending review'}</td>
      </tr>) : <tr><td colSpan={7} className="py-16 px-6 text-center"><p className="font-medium text-slate-900">No attendance records for these filters</p><p className="text-sm text-slate-500 mt-2">Choose another month or import a school file to get started.</p></td></tr>}</tbody>
    </table></div>
  </section>;
}
