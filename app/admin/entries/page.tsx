'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import Sidebar from '@/components/Sidebar';
import DashboardLayout from '@/components/DashboardLayout';
import { Department, User } from '@/types';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Check, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';

interface EntryForm {
  doctor_id:      string;
  department_id:  string;
  entry_date:     string;
  male_count:     number;
  female_count:   number;
  pediatric_count: number;
  status:         string;
  remarks:        string;
}

const EMPTY_FORM: EntryForm = {
  doctor_id:       '',
  department_id:   '',
  entry_date:      format(new Date(), 'yyyy-MM-dd'),
  male_count:      0,
  female_count:    0,
  pediatric_count: 0,
  status:          'present',
  remarks:         '',
};

export default function AdminEntriesPage() {
  const { user, loading } = useAuth('admin');
  const [entries,     setEntries]     = useState<any[]>([]);
  const [doctors,     setDoctors]     = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showForm,    setShowForm]    = useState(false);
  const [editId,      setEditId]      = useState<string | null>(null);
  const [form,        setForm]        = useState<EntryForm>(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [filterDate,   setFilterDate]   = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    const [entriesRes, doctorsRes, deptsRes] = await Promise.all([
      fetch('/api/entries'),
      fetch('/api/doctors'),
      fetch('/api/departments'),
    ]);
    const [ed, doc, dept] = await Promise.all([entriesRes.json(), doctorsRes.json(), deptsRes.json()]);
    setEntries(ed.entries   || []);
    setDoctors(doc.doctors  || []);
    setDepartments(dept.departments || []);
  };

  const openAdd = () => { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); };

  const openEdit = (entry: any) => {
    setEditId(entry.id);
    setForm({
      doctor_id:       entry.doctor_id,
      department_id:   entry.department_id,
      entry_date:      entry.entry_date,
      male_count:      entry.male_count,
      female_count:    entry.female_count,
      pediatric_count: entry.pediatric_count,
      status:          entry.status || 'present',
      remarks:         entry.remarks || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.doctor_id || !form.department_id) { toast.error('Please select doctor and department'); return; }
    setSubmitting(true);
    try {
      const body = editId ? { id: editId, ...form } : { ...form, created_by: user?.id };
      const res  = await fetch('/api/entries', {
        method:  editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(editId ? 'Entry updated!' : 'Entry added!');
      setShowForm(false);
      fetchAll();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    const res = await fetch('/api/entries', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    });
    if (res.ok) { toast.success('Entry deleted'); fetchAll(); }
    else toast.error('Failed to delete');
  };

  const filtered = entries.filter(e =>
    (!filterDate   || e.entry_date === filterDate) &&
    (!filterDoctor || e.doctor_id  === filterDoctor)
  );

  const isOff = form.status === 'absent' || form.status === 'leave';

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center medical-bg">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen medical-bg">
      <Sidebar user={user} />
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-emerald-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                Patient Entries
              </h1>
              <p className="text-sm text-emerald-600/70">{entries.length} total entries</p>
            </div>
            <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> <span className="hidden sm:inline">Add Entry</span><span className="sm:hidden">Add</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="date"
              className="input-field w-auto flex-1 min-w-[140px]"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
            />
            <select
              className="input-field w-auto flex-1 min-w-[140px]"
              value={filterDoctor}
              onChange={e => setFilterDoctor(e.target.value)}
            >
              <option value="">All Doctors</option>
              {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name}</option>)}
            </select>
            {(filterDate || filterDoctor) && (
              <button
                onClick={() => { setFilterDate(''); setFilterDoctor(''); }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-red-500 border border-gray-200 rounded-xl bg-white transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
            <div className="px-4 py-4 border-b border-emerald-50 flex items-center gap-2">
              <ClipboardList size={16} className="text-emerald-600" />
              <span className="font-semibold text-emerald-900 text-sm">{filtered.length} entries</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]">
                <thead>
                  <tr className="bg-emerald-50 border-b border-emerald-100">
                    <th className="text-left px-4 py-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Doctor</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Department</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-blue-600 uppercase tracking-wide">M</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-pink-600 uppercase tracking-wide">F</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-amber-600 uppercase tracking-wide">P</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Total</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                        <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
                        No entries found
                      </td>
                    </tr>
                  ) : filtered.map((entry: any) => {
                    const status   = entry.status || 'present';
                    const entryOff = status === 'absent' || status === 'leave';
                    const total    = entry.male_count + entry.female_count + entry.pediatric_count;
                    const rowBg    = status === 'absent' ? 'bg-red-50' : status === 'leave' ? 'bg-orange-50' : '';
                    const statusBadge = status === 'absent'
                      ? 'bg-red-100 text-red-700'
                      : status === 'leave'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-emerald-100 text-emerald-700';
                    return (
                      <tr key={entry.id} className={`border-b border-gray-50 hover:bg-emerald-50/30 transition-colors ${rowBg}`}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">{format(new Date(entry.entry_date), 'dd MMM yyyy')}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">Dr. {entry.doctor?.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{entry.department?.name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${statusBadge}`}>
                            {status === 'absent' ? 'Absent' : status === 'leave' ? 'On Leave' : 'Present'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {entryOff ? <span className="text-gray-300">—</span> : <span className="badge badge-male">{entry.male_count}</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {entryOff ? <span className="text-gray-300">—</span> : <span className="badge badge-female">{entry.female_count}</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {entryOff ? <span className="text-gray-300">—</span> : <span className="badge badge-pead">{entry.pediatric_count}</span>}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-700 text-sm">
                          {entryOff ? <span className="text-xs text-gray-400">N/A</span> : total}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(entry)} className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-colors"><Pencil size={15} /></button>
                            <button onClick={() => handleDelete(entry.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </DashboardLayout>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md animate-slide-up sm:animate-fade-in-up">
            <div className="flex items-center justify-between p-5 border-b border-emerald-100">
              <h2 className="font-bold text-emerald-900">{editId ? 'Edit Entry' : 'Add Patient Entry'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1.5">Doctor *</label>
                <select className="input-field" value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })} required>
                  <option value="">Select doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1.5">Department *</label>
                <select className="input-field" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })} required>
                  <option value="">Select department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1.5">Date *</label>
                <input type="date" className="input-field" value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1.5">Status</label>
                <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="present">✅ Present</option>
                  <option value="absent">❌ Absent</option>
                  <option value="leave">🗓️ On Leave</option>
                </select>
              </div>

              {/* Patient counts — hidden when absent/leave */}
              {!isOff && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'male_count',       label: 'Male',      color: 'text-blue-600',  badge: 'border-blue-200 bg-blue-50' },
                    { key: 'female_count',     label: 'Female',    color: 'text-pink-600',  badge: 'border-pink-200 bg-pink-50' },
                    { key: 'pediatric_count',  label: 'Pediatric', color: 'text-amber-600', badge: 'border-amber-200 bg-amber-50' },
                  ].map(({ key, label, color, badge }) => (
                    <div key={key}>
                      <label className={`block text-xs font-bold mb-1.5 ${color}`}>{label}</label>
                      <input
                        type="number" min="0"
                        className={`w-full px-3 py-2.5 rounded-xl border text-center font-bold text-lg ${badge} ${color} focus:outline-none focus:ring-2 focus:ring-emerald-300`}
                        value={form[key as keyof EntryForm]}
                        onChange={e => setForm({ ...form, [key]: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Total preview */}
              {!isOff && (
                <div className="bg-emerald-50 rounded-xl px-4 py-3 text-center border border-emerald-200">
                  <span className="text-xs text-emerald-600 font-semibold">Total Patients: </span>
                  <span className="text-xl font-bold text-emerald-700">
                    {form.male_count + form.female_count + form.pediatric_count}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1.5">Remarks</label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Optional notes..."
                  value={form.remarks}
                  onChange={e => setForm({ ...form, remarks: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-1 pb-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Check size={16} /> {editId ? 'Update' : 'Add Entry'}</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}