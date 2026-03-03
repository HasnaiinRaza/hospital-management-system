'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import Sidebar from '@/components/Sidebar';
import DashboardLayout from '@/components/DashboardLayout';
import { Department } from '@/types';
import toast from 'react-hot-toast';
import { Plus, Trash2, Building2, X } from 'lucide-react';

export default function DepartmentsPage() {
  const { user, loading } = useAuth('superadmin');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newName,     setNewName]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [showForm,    setShowForm]    = useState(false);

  useEffect(() => { if (user) fetchDepts(); }, [user]);

  const fetchDepts = async () => {
    const res  = await fetch('/api/departments');
    const data = await res.json();
    setDepartments(data.departments || []);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      const res  = await fetch('/api/departments', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('Department added!');
      setNewName('');
      setShowForm(false);
      fetchDepts();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete department "${name}"?`)) return;
    const res = await fetch('/api/departments', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    });
    if (res.ok) { toast.success('Department deleted'); fetchDepts(); }
    else toast.error('Failed to delete');
  };

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
        <div className="max-w-3xl mx-auto">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-emerald-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                Departments
              </h1>
              <p className="text-sm text-emerald-600/70">{departments.length} active departments</p>
            </div>
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> <span className="hidden sm:inline">Add Department</span><span className="sm:hidden">Add</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {departments.map((dept, i) => (
              <div
                key={dept.id}
                className="card-hover bg-white rounded-2xl border border-emerald-100 p-4 md:p-5 flex items-center gap-4 shadow-sm animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Building2 size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-emerald-900 text-sm truncate">{dept.name}</p>
                  <p className="text-xs text-gray-400">Dept #{i + 1}</p>
                </div>
                <button
                  onClick={() => handleDelete(dept.id, dept.name)}
                  className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {departments.length === 0 && (
              <div className="col-span-2 text-center py-16 text-gray-400">
                <Building2 size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No departments added yet</p>
              </div>
            )}
          </div>

        </div>
      </DashboardLayout>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm animate-slide-up sm:animate-fade-in-up">
            <div className="flex items-center justify-between p-5 border-b border-emerald-100">
              <h2 className="font-bold text-emerald-900">Add Department</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1.5">Department Name *</label>
                <input className="input-field" placeholder="e.g. Cardiology" value={newName} onChange={e => setNewName(e.target.value)} required autoFocus />
              </div>
              <div className="flex gap-3 pb-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Adding...' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}