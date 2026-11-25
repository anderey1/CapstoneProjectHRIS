import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText, Upload, Users, ArrowUpRight } from 'lucide-react';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';
import AttendanceImport from '../../features/attendance/components/AttendanceImport';
import AttendanceLogs from '../../components/features/attendance/AttendanceLogs';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import Pagination from '../../components/common/Pagination';

export default function AttendanceManagement() {
  const { user } = useAuth();
  const canImport = user?.is_superuser || user?.role === 'HR';
  const [params] = useSearchParams();
  const active = canImport && ['import', 'mappings'].includes(params.get('view')) ? params.get('view') : 'records';
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [year, month] = selectedMonth.split('-');
  const { records, summary, pagination, isLoading, isError, refetch } = usePaginatedList(QUERY_KEYS.ATTENDANCE, 'attendance/', {
    search: searchTerm, department: deptFilter, year, month,
  });
  const tabs = [{ id: 'records', label: 'Attendance records', icon: FileText }, ...(canImport ? [{ id: 'import', label: 'Import file', icon: Upload }, { id: 'mappings', label: 'Employee ID mappings', icon: Users }] : [])];
  return <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto [&_:is(button,a,input,select):focus-visible]:outline-2 [&_:is(button,a,input,select):focus-visible]:outline-offset-2 [&_:is(button,a,input,select):focus-visible]:outline-primary">
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-primary"><FileText size={20} aria-hidden="true" /></div>
        <div><h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance management</h1><p className="mt-1 text-xs leading-relaxed text-slate-600">CSC Form 48 · Personnel time logs and monthly DTR review</p></div>
      </div>
      <Link to="/staff-dtr" className="btn btn-primary btn-sm shrink-0"><FileText size={16} aria-hidden="true" /> Review staff DTRs <ArrowUpRight size={14} aria-hidden="true" /></Link>
    </header>
    <div hidden={active !== 'records'}>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Attendance totals for selected filters">
        {[['Daily records', pagination.count, 'text-slate-900', 'Matching personnel time logs'], ['Present on time', summary.present || 0, 'text-emerald-700', 'On-time attendance records'], ['Late arrivals', summary.late || 0, 'text-amber-800', 'Records marked late'], ['Pending review', summary.pending || 0, 'text-primary', 'Awaiting DTR approval']].map(([label, count, color, description]) => <div key={label} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"><dt className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</dt><dd className={`mt-1 font-mono text-xl font-bold tabular-nums ${color}`}>{isLoading || isError ? '—' : count}</dd><dd className="mt-0.5 text-xs text-slate-500">{description}</dd></div>)}
      </dl>
    </div>
    <section className="min-w-0 overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm" aria-label="Attendance workspace">
      <nav aria-label="Attendance workspace" className="flex overflow-x-auto border-b border-slate-200 px-3 sm:px-5">
        {tabs.map(({ id, label, icon: Icon }) => <Link key={id} to={id === 'records' ? '/attendance-management' : `?view=${id}`} aria-current={active === id ? 'page' : undefined} className={`inline-flex min-h-14 shrink-0 items-center justify-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold sm:px-4 ${active === id ? 'border-primary text-primary' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'}`}><Icon size={16} aria-hidden="true" />{label}</Link>)}
      </nav>
      <div hidden={active !== 'records'}>
        {isError ? <div role="alert" className="m-4 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">Could not load attendance. <button className="underline" onClick={() => refetch()}>Try again</button></div> : <AttendanceLogs records={records} isLoading={isLoading} searchTerm={searchTerm} setSearchTerm={setSearchTerm} deptFilter={deptFilter} setDeptFilter={setDeptFilter} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} departments={summary.departments || []} totalCount={pagination.count} />}
        <Pagination pagination={pagination} label="attendance records" />
      </div>
      {canImport && <div hidden={active === 'records'} className="p-4 sm:p-5"><AttendanceImport mode={active === 'mappings' ? 'mappings' : 'import'} /></div>}
    </section>
  </div>;
}
