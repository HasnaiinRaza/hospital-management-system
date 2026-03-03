'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import Sidebar from '@/components/Sidebar';
import DashboardLayout from '@/components/DashboardLayout';
import { User, Department } from '@/types';
import toast from 'react-hot-toast';
import { UserPlus, Pencil, Trash2, X, Check } from 'lucide-react';

interface DoctorWithDept extends User {
  departments?: { name: string };
}

export default function DoctorsPage() {
  const { user, loading } = useAuth('superadmin');
  const [doctors,     setDoctors]     = useState<DoctorWithDept[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showForm,    setShowForm]    = useState(false);
  const [editDoc,     setEditDoc]     = useState<DoctorWithDept | null>(null);
  const [form,        setForm]        = useState({ name: '', email: '', password: '', department_id: '' });
  const [submitting,  setSubmitting]  = useState(false);
  const [search,      setSearch]      = useState('');

  useEffect(() => {
    if (user) { fetchDoctors(); fetchDepartments(); }
  }, [user]);

  const fetchDoctors = async () => {
    const res  = await fetch('/api/doctors');
    const data = await res.json();
    setDoctors(data.doctors || []);
  };

  const fetchDepartments = async () => {
    const res  = await fetch('/api/departments');
    const data = await res.json();
    setDepartments(data.departments || []);
  };

  const openAdd = () => {
    setEditDoc(null);
    setForm({ name: '', email: '', password: '', department_id: '' });
    setShowForm(true);
  };

  const openEdit = (doc: DoctorWithDept) => {
    setEditDoc(doc);
    setForm({ name: doc.name, email: doc.email, password: '', department_id: doc.department_id || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const method = editDoc ? 'PATCH' : 'POST';
      const body   = editDoc
        ? { id: editDoc.id, ...form, ...(form.password ? {} : { password: undefined }) }
        : form;
      const res  = await fetch('/api/doctors', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(editDoc ? 'Doctor updated!' : 'Doctor added!');
      setShowForm(false);
      fetchDoctors();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete Dr. ${name}? This cannot be undone.`)) return;
    const res = await fetch('/api/doctors', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) { toast.success('Doctor deleted'); fetchDoctors(); }
    else toast.error('Failed to delete doctor');
  };

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="max-w-5xl mx-auto">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-emerald-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                Manage Doctors
              </h1>
              <p className="text-sm text-emerald-600/70">{doctors.length} registered doctors</p>
            </div>
            <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
              <UserPlus size={16} /> <span className="hidden sm:inline">Add Doctor</span><span className="sm:hidden">Add</span>
            </button>
          </div>

          <input
            className="input-field mb-4 max-w-sm"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {/* Table — scrollable on mobile */}
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-emerald-50 border-b border-emerald-100">
                    <th className="text-left px-4 py-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Doctor</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Department</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">No doctors found</td>
                    </tr>
                  ) : filtered.map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {doc.name.charAt(0)}
                          </div>
                          <span className="font-medium text-sm text-gray-800 whitespace-nowrap">Dr. {doc.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">{doc.email}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {(doc as any).departments?.name || <span className="text-gray-400 italic text-xs">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`badge ${doc.is_active ? 'badge-active' : 'badge-inactive'}`}>
                          {doc.is_active ? '● Active' : '● Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(doc)} className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(doc.id, doc.name)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
              <h2 className="font-bold text-emerald-900">{editDoc ? 'Edit Doctor' : 'Add New Doctor'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1.5">Full Name *</label>
                <input className="input-field" placeholder="Dr. John Smith" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1.5">Email *</label>
                <input type="email" className="input-field" placeholder="doctor@hospital.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1.5">{editDoc ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input type="password" className="input-field" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editDoc} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1.5">Department</label>
                <select className="input-field" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                  <option value="">Select department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2 pb-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Check size={16} /> {editDoc ? 'Update' : 'Add Doctor'}</>
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