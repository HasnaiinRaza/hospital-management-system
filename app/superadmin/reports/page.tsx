'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import Sidebar from '@/components/Sidebar';
import DashboardLayout from '@/components/DashboardLayout';
import ReportView from '@/components/ReportView';

export default function SuperAdminReportsPage() {
  const { user, loading } = useAuth('superadmin');
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (user) {
      fetch('/api/doctors')
        .then(r => r.json())
        .then(d => setDoctors(d.doctors?.map((doc: any) => ({ id: doc.id, name: doc.name })) || []));
    }
  }, [user]);

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
          <div className="mb-6">
            <h1 className="text-lg md:text-xl font-bold text-emerald-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              Patient Reports
            </h1>
            <p className="text-sm text-emerald-600/70">Generate and download daily, weekly, monthly and custom reports</p>
          </div>
          <ReportView user={user} doctorOptions={doctors} />
        </div>
      </DashboardLayout>
    </div>
  );
}