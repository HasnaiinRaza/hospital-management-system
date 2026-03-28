'use client';

import { useState, useCallback, useEffect } from 'react';
import ReportChart from '@/components/ReportChart';
import { ReportData, User } from '@/types';
import { generateReportPDF } from '@/lib/pdf';
import { format } from 'date-fns';
import { Download, BarChart2, LineChart, PieChart, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReportViewProps {
  user: User;
  doctorOptions?: { id: string; name: string }[];
}

type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';
type ChartType  = 'bar' | 'line' | 'pie';

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * For each doctor, collapse all their PRESENT-day entries into one
 * collective row per doctor. ABSENT / LEAVE entries stay as individual rows.
 *
 * Returned array is sorted by date then by doctor name.
 */
function buildDisplayRows(rawData: any[]) {
  // Group present entries: key = `doctorId`
  const presentMap: Record<string, {
    doctorId: string;
    doctorName: string;
    departments: string[];
    dates: string[];
    male: number;
    female: number;
    pediatric: number;
  }> = {};

  const offRows: any[] = [];

  for (const row of rawData) {
    const status = row.status || 'present';
    if (status === 'absent' || status === 'leave') {
      offRows.push(row);
    } else {
      const key = row.doctor_id || row.doctor?.id || row.id;
      if (!presentMap[key]) {
        presentMap[key] = {
          doctorId:    key,
          doctorName:  row.doctor?.name || '—',
          departments: [],
          dates:       [],
          male:        0,
          female:      0,
          pediatric:   0,
        };
      }
      presentMap[key].male      += row.male_count      || 0;
      presentMap[key].female    += row.female_count    || 0;
      presentMap[key].pediatric += row.pediatric_count || 0;

      const deptName = row.department?.name;
      if (deptName && !presentMap[key].departments.includes(deptName))
        presentMap[key].departments.push(deptName);

      const dateStr = row.entry_date;
      if (dateStr && !presentMap[key].dates.includes(dateStr))
        presentMap[key].dates.push(dateStr);
    }
  }

  return { presentCollapsed: Object.values(presentMap), offRows };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ReportView({ user, doctorOptions = [] }: ReportViewProps) {
  const [reportType,        setReportType]        = useState<ReportType>('weekly');
  const [selectedDate,      setSelectedDate]      = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customFrom,        setCustomFrom]        = useState('');
  const [customTo,          setCustomTo]          = useState('');
  const [selectedDoctorId,  setSelectedDoctorId]  = useState(user.role === 'doctor' ? user.id : '');
  const [selectedDeptId,    setSelectedDeptId]    = useState('');
  const [chartType,         setChartType]         = useState<ChartType>('bar');
  const [reportData,        setReportData]        = useState<ReportData[]>([]);
  const [rawData,           setRawData]           = useState<any[]>([]);
  const [period,            setPeriod]            = useState<{ from: string; to: string; type: string } | null>(null);
  const [loading,           setLoading]           = useState(false);
  const [fetched,           setFetched]           = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (user.role === 'doctor') return;
    fetch('/api/departments')
      .then(r => r.json())
      .then(d => setDepartmentOptions(d.departments || []));
  }, [user.role]);

  const fetchReport = useCallback(async () => {
    if (reportType === 'custom') {
      if (!customFrom || !customTo) { toast.error('Please select both From and To dates'); return; }
      if (customFrom > customTo)    { toast.error('"From" date cannot be after "To" date'); return; }
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (reportType === 'custom') {
        params.set('from', customFrom);
        params.set('to',   customTo);
      } else {
        params.set('type', reportType);
        params.set('date', selectedDate);
      }
      if (selectedDoctorId) params.set('doctor_id',     selectedDoctorId);
      if (selectedDeptId)   params.set('department_id', selectedDeptId);

      const res  = await fetch(`/api/reports?${params}`);
      const data = await res.json();
      setReportData(data.report || []);
      setRawData(data.raw       || []);
      setPeriod(data.period);
      setFetched(true);
    } catch {
      toast.error('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  }, [reportType, selectedDate, customFrom, customTo, selectedDoctorId, selectedDeptId]);

  const handleDownload = () => {
    if (!rawData.length && !reportData.length) { toast.error('No data to download'); return; }
    const doctorName = selectedDoctorId
      ? (user.role === 'doctor' ? user.name : doctorOptions.find(d => d.id === selectedDoctorId)?.name)
      : undefined;
    const periodLabel = period
      ? `${format(new Date(period.from), 'dd MMM yyyy')} – ${format(new Date(period.to), 'dd MMM yyyy')}`
      : '';
    generateReportPDF(
      rawData,
      `${reportType === 'custom' ? 'Custom Range' : reportType.charAt(0).toUpperCase() + reportType.slice(1)} Patient Report`,
      periodLabel,
      doctorName
    );
    toast.success('PDF downloaded!');
  };

  const presentRows    = rawData.filter(r => !r.status || r.status === 'present');
  const totalMale      = presentRows.reduce((s, r) => s + (r.male_count      || 0), 0);
  const totalFemale    = presentRows.reduce((s, r) => s + (r.female_count    || 0), 0);
  const totalPediatric = presentRows.reduce((s, r) => s + (r.pediatric_count || 0), 0);
  const grandTotal     = totalMale + totalFemale + totalPediatric;

  const { presentCollapsed, offRows } = buildDisplayRows(rawData);

  return (
    <div className="space-y-6">

      {/* ── FILTERS ── */}
      <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

          <div>
            <label className="block text-xs font-semibold text-emerald-800 mb-1.5">Report Period</label>
            <select
              className="input-field"
              value={reportType}
              onChange={e => { setReportType(e.target.value as ReportType); setFetched(false); }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {reportType !== 'custom' && (
            <div>
              <label className="block text-xs font-semibold text-emerald-800 mb-1.5">
                {reportType === 'daily' ? 'Date' : reportType === 'weekly' ? 'Any Date in Week' : 'Any Date in Month'}
              </label>
              <input
                type="date" className="input-field"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              />
            </div>
          )}

          {reportType === 'custom' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1.5">From Date</label>
                <input type="date" className="input-field" value={customFrom} max={customTo || undefined} onChange={e => setCustomFrom(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1.5">To Date</label>
                <input type="date" className="input-field" value={customTo} min={customFrom || undefined} onChange={e => setCustomTo(e.target.value)} />
              </div>
            </>
          )}

          {user.role !== 'doctor' && (
            <div>
              <label className="block text-xs font-semibold text-emerald-800 mb-1.5">Doctor</label>
              <select className="input-field" value={selectedDoctorId} onChange={e => setSelectedDoctorId(e.target.value)}>
                <option value="">All Doctors</option>
                {doctorOptions.map(d => <option key={d.id} value={d.id}>Dr. {d.name}</option>)}
              </select>
            </div>
          )}

          {user.role !== 'doctor' && (
            <div>
              <label className="block text-xs font-semibold text-emerald-800 mb-1.5">Department</label>
              <select className="input-field" value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)}>
                <option value="">All Departments</option>
                {departmentOptions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button onClick={fetchReport} disabled={loading} className="btn-primary flex items-center justify-center gap-2 px-8">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Loading...</>
              : <><RefreshCw size={15} /> Generate Report</>
            }
          </button>
          {fetched && (
            <button onClick={handleDownload} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors font-semibold text-sm">
              <Download size={16} /> Download PDF
            </button>
          )}
        </div>

        {period && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-1.5 border border-emerald-100">
              📅 {format(new Date(period.from), 'dd MMM yyyy')} – {format(new Date(period.to), 'dd MMM yyyy')}
              {period.type === 'custom' && <span className="ml-1.5 font-bold">(Custom Range)</span>}
            </p>
            {selectedDoctorId && user.role !== 'doctor' && (
              <p className="text-xs text-teal-600 bg-teal-50 rounded-lg px-3 py-1.5 border border-teal-100">
                👨‍⚕️ Dr. {doctorOptions.find(d => d.id === selectedDoctorId)?.name}
              </p>
            )}
            {selectedDeptId && (
              <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-1.5 border border-blue-100">
                🏥 {departmentOptions.find(d => d.id === selectedDeptId)?.name}
              </p>
            )}
          </div>
        )}
      </div>

      {fetched && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Male',      value: totalMale,      color: 'bg-blue-50 border-blue-100 text-blue-700',          dot: 'bg-blue-500'    },
              { label: 'Female',    value: totalFemale,    color: 'bg-pink-50 border-pink-100 text-pink-700',          dot: 'bg-pink-500'    },
              { label: 'Pediatric', value: totalPediatric, color: 'bg-amber-50 border-amber-100 text-amber-700',       dot: 'bg-amber-500'   },
              { label: 'Total',     value: grandTotal,     color: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border p-5 ${s.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{s.label}</span>
                </div>
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-xs opacity-60 mt-0.5">patients</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          {reportData.length > 0 ? (
            <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-emerald-900">Visual Report</h3>
                <div className="flex items-center gap-1 bg-emerald-50 rounded-xl p-1">
                  {([
                    ['bar',  <BarChart2 size={15} />],
                    ['line', <LineChart size={15} />],
                    ['pie',  <PieChart  size={15} />],
                  ] as [ChartType, React.ReactNode][]).map(([t, icon]) => (
                    <button key={t} onClick={() => setChartType(t)}
                      className={`p-2 rounded-lg transition-colors ${chartType === t ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400 hover:text-emerald-500'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <ReportChart data={reportData} type={chartType} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-emerald-100 p-12 text-center text-gray-400 shadow-sm">
              <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No patient entries found for this period</p>
            </div>
          )}

          {/* ── DETAILED TABLE ── */}
          {rawData.length > 0 && (
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-emerald-50 flex items-center justify-between">
                <h3 className="font-semibold text-emerald-900 text-sm">Detailed Entries</h3>
                <button onClick={handleDownload} className="flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors">
                  <Download size={14} /> Download PDF
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-emerald-50 border-b border-emerald-100">
                      {user.role !== 'doctor' && (
                        <th className="text-left px-4 py-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Doctor</th>
                      )}
                      <th className="text-left px-4 py-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Department</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Days Present</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-blue-600 uppercase tracking-wide">Male</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-pink-600 uppercase tracking-wide">Female</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-amber-600 uppercase tracking-wide">Pediatric</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Total</th>
                    </tr>
                  </thead>
                  <tbody>

                    {/* ── PRESENT rows — one collective row per doctor ── */}
                    {presentCollapsed.map(p => (
                      <tr key={`present-${p.doctorId}`} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors">
                        {user.role !== 'doctor' && (
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">
                            Dr. {p.doctorName}
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {p.departments.length > 0 ? p.departments.join(', ') : <span className="text-gray-400 italic text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            ✅ Present · {p.dates.length} {p.dates.length === 1 ? 'day' : 'days'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="badge badge-male">{p.male}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="badge badge-female">{p.female}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="badge badge-pead">{p.pediatric}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-700">
                          {p.male + p.female + p.pediatric}
                        </td>
                      </tr>
                    ))}

                    {/* ── ABSENT / LEAVE rows — individual with date + remarks ── */}
                    {offRows.map((row: any) => {
                      const status      = row.status;
                      const rowBg       = status === 'absent' ? 'bg-red-50 hover:bg-red-100/50' : 'bg-orange-50 hover:bg-orange-100/50';
                      const statusBadge = status === 'absent'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-orange-100 text-orange-700 border border-orange-200';
                      const statusLabel = status === 'absent' ? '❌ Absent' : '🗓️ On Leave';
                      return (
                        <tr key={row.id} className={`border-b border-gray-50 transition-colors ${rowBg}`}>
                          {user.role !== 'doctor' && (
                            <td className="px-4 py-3 text-sm font-medium text-gray-800">
                              Dr. {row.doctor?.name}
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {row.department?.name || <span className="text-gray-400 italic text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold w-fit ${statusBadge}`}>
                                {statusLabel}
                              </span>
                              <span className="text-xs text-gray-500">
                                📅 {format(new Date(row.entry_date), 'dd MMM yyyy')}
                              </span>
                              {row.remarks && (
                                <span className="text-xs italic text-gray-500">
                                  💬 {row.remarks}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-300">—</td>
                          <td className="px-4 py-3 text-center text-gray-300">—</td>
                          <td className="px-4 py-3 text-center text-gray-300">—</td>
                          <td className="px-4 py-3 text-center text-xs text-gray-400 italic">N/A</td>
                        </tr>
                      );
                    })}

                  </tbody>
                  <tfoot>
                    <tr className="bg-emerald-700 text-white">
                      <td colSpan={user.role !== 'doctor' ? 3 : 2} className="px-4 py-3 text-sm font-bold">TOTAL</td>
                      <td className="px-4 py-3 text-center font-bold">{totalMale}</td>
                      <td className="px-4 py-3 text-center font-bold">{totalFemale}</td>
                      <td className="px-4 py-3 text-center font-bold">{totalPediatric}</td>
                      <td className="px-4 py-3 text-center font-bold">{grandTotal}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
