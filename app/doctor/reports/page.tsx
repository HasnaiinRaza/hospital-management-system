'use client';

import { useAuth } from '@/lib/useAuth';
import Sidebar from '@/components/Sidebar';
import DashboardLayout from '@/components/DashboardLayout';
import ReportView from '@/components/ReportView';

export default function DoctorReportsPage() {
  const { user, loading } = useAuth('doctor');

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
              My Reports
            </h1>
            <p className="text-sm text-emerald-600/70">View and download your patient reports</p>
          </div>
          <ReportView user={user} />
        </div>
      </DashboardLayout>
    </div>
  );
}