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
  const canImport = ['HR', 'ADMINISTRATIVE'].includes(user?.role);
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
  return <div className="p-4 md:p-8 max-w-[1440px] mx-auto space-y-6">
    <header className="flex flex-wrap justify-between items-start gap-4">
      <div><p className="text-xs font-semibold text-slate-500 tracking-wide mb-2">PERSONNEL ADMINISTRATION / CSC FORM 48</p><h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Attendance management</h1><p className="text-sm text-slate-600 mt-2">Import school time logs, review attendance, and prepare monthly DTRs.</p></div>
      <Link to="/staff-dtr" className="btn btn-outline btn-sm border-slate-300 text-slate-700"><FileText size={16} /> Review staff DTRs <ArrowUpRight size={14} /></Link>
    </header>
    <nav aria-label="Attendance workspace" className="flex flex-wrap border-b border-slate-300 gap-x-6">
      {tabs.map(({ id, label, icon: Icon }) => <Link key={id} to={id === 'records' ? '/attendance-management' : `?view=${id}`} aria-current={active === id ? 'page' : undefined} className={`flex shrink-0 items-center gap-2 pb-3 pt-2 text-sm font-medium border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${active === id ? 'border-[#0038a8] text-[#0038a8]' : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'}`}><Icon size={16} />{label}</Link>)}
    </nav>
    <div hidden={active !== 'records'} className="space-y-4">
      <div className="flex flex-wrap gap-x-8 gap-y-3 py-1" aria-label="Attendance totals for selected filters">
        {[['Daily records', pagination.count], ['Present on time', summary.present || 0], ['Late arrivals', summary.late || 0], ['Pending review', summary.pending || 0]].map(([label, count]) => <div key={label} className="flex items-baseline gap-2"><span className="font-semibold text-xl tabular-nums text-slate-900">{count}</span><span className="text-sm text-slate-600">{label}</span></div>)}
      </div>
      {isError ? <div role="alert" className="p-4 bg-red-50 text-red-800 border border-red-200 rounded">Could not load attendance. <button className="underline" onClick={() => refetch()}>Try again</button></div> : <AttendanceLogs records={records} isLoading={isLoading} searchTerm={searchTerm} setSearchTerm={setSearchTerm} deptFilter={deptFilter} setDeptFilter={setDeptFilter} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} departments={summary.departments || []} />}
      <Pagination pagination={pagination} label="attendance records" />
    </div>
    {canImport && <div hidden={active === 'records'}><AttendanceImport mode={active === 'mappings' ? 'mappings' : 'import'} /></div>}
  </div>;
}
