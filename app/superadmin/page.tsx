'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import Sidebar from '@/components/Sidebar';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import ReportChart from '@/components/ReportChart';
import { Users, Building2, Activity, TrendingUp } from 'lucide-react';
import { ReportData } from '@/types';
import { format } from 'date-fns';

export default function SuperAdminDashboard() {
  const { user, loading } = useAuth('superadmin');
  const [stats, setStats] = useState({
    doctors: 0, departments: 0, totalToday: 0, totalMonth: 0,
  });
  const [reportData, setReportData] = useState<ReportData[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchStats();
    fetchWeeklyReport();
  }, [user]);

  const fetchStats = async () => {
    try {
      const [docRes, deptRes, todayRes, monthRes] = await Promise.all([
        fetch('/api/doctors'),
        fetch('/api/departments'),
        fetch(`/api/reports?type=daily&date=${format(new Date(), 'yyyy-MM-dd')}`),
        fetch(`/api/reports?type=monthly&date=${format(new Date(), 'yyyy-MM-dd')}`),
      ]);
      const [docData, deptData, todayData, monthData] = await Promise.all([
        docRes.json(), deptRes.json(), todayRes.json(), monthRes.json(),
      ]);
      const todayTotal = (todayData.report || []).reduce((s: number, r: ReportData) => s + r.total, 0);
      const monthTotal = (monthData.report || []).reduce((s: number, r: ReportData) => s + r.total, 0);
      setStats({
        doctors:     docData.doctors?.length      || 0,
        departments: deptData.departments?.length  || 0,
        totalToday:  todayTotal,
        totalMonth:  monthTotal,
      });
    } catch (e) {
      console.error('fetchStats error', e);
    }
  };

  const fetchWeeklyReport = async () => {
    try {
      const res  = await fetch(`/api/reports?type=weekly&date=${format(new Date(), 'yyyy-MM-dd')}`);
      const data = await res.json();
      setReportData(data.report || []);
    } catch (e) {
      console.error('fetchWeeklyReport error', e);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center medical-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-emerald-600 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen medical-bg">
      <Sidebar user={user} />
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="mb-6">
            <h1
              className="text-xl md:text-2xl font-bold text-emerald-900"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Welcome back, {user.name.split(' ')[0]} 👋
            </h1>
            <p className="text-emerald-600/70 text-sm mt-1">
              {format(new Date(), 'EEEE, MMMM d, yyyy')} · Super Administrator
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <StatsCard
              title="Total Doctors"
              value={stats.doctors}
              subtitle="Active doctors"
              icon={<Users size={22} />}
              color="green"
            />
            <StatsCard
              title="Departments"
              value={stats.departments}
              subtitle="Active departments"
              icon={<Building2 size={22} />}
              color="blue"
            />
            <StatsCard
              title="Today's Patients"
              value={stats.totalToday}
              subtitle="All departments"
              icon={<Activity size={22} />}
              color="pink"
            />
            <StatsCard
              title="This Month"
              value={stats.totalMonth}
              subtitle="Total patients"
              icon={<TrendingUp size={22} />}
              color="amber"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-emerald-100 p-4 md:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-emerald-900 text-sm md:text-base">
                  This Week's Patient Trend
                </h2>
                <span className="badge badge-active text-xs">Live</span>
              </div>
              <div className="w-full overflow-hidden">
                {reportData.length > 0 ? (
                  <ReportChart data={reportData} type="bar" />
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                    No data for this week yet
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-emerald-100 p-4 md:p-6 shadow-sm">
              <h2 className="font-semibold text-emerald-900 mb-4 text-sm md:text-base">
                Gender Distribution
              </h2>
              <div className="w-full overflow-hidden">
                {reportData.length > 0 ? (
                  <ReportChart data={reportData} type="pie" />
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                    No data yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {[
              { label: 'Add New Doctor', href: '/superadmin/doctors',     emoji: '👨‍⚕️', desc: 'Register a new doctor'  },
              { label: 'Add Department', href: '/superadmin/departments', emoji: '🏥',   desc: 'Create a department'     },
              { label: 'View Reports',   href: '/superadmin/reports',     emoji: '📊',   desc: 'Daily, weekly, monthly'  },
            ].map(item => (
              <a
                key={item.href}
                href={item.href}
                className="card-hover bg-white rounded-2xl border border-emerald-100 p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm hover:border-emerald-300 transition-colors"
              >
                <span className="text-2xl md:text-3xl">{item.emoji}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-emerald-900 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500 truncate">{item.desc}</p>
                </div>
              </a>
            ))}
          </div>

        </div>
      </DashboardLayout>
    </div>
  );
}