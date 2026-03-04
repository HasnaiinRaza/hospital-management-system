'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import Sidebar from '@/components/Sidebar';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import ReportChart from '@/components/ReportChart';
import { Activity, TrendingUp, Users, Calendar } from 'lucide-react';
import { ReportData } from '@/types';
import { format } from 'date-fns';

export default function DoctorDashboard() {
  const { user, loading } = useAuth('doctor');
  const [todayStats, setTodayStats] = useState({
    total: 0, male: 0, female: 0, pediatric: 0,
  });
  const [weeklyData, setWeeklyData] = useState<ReportData[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchToday(user.id);
    fetchWeekly(user.id);
  }, [user]);

  const fetchToday = async (doctorId: string) => {
    try {
      const res  = await fetch(
        `/api/reports?type=daily&date=${format(new Date(), 'yyyy-MM-dd')}&doctor_id=${doctorId}`
      );
      const data = await res.json();
      const r    = (data.report || []).reduce(
        (a: any, x: ReportData) => ({
          total:     a.total     + x.total,
          male:      a.male      + x.male,
          female:    a.female    + x.female,
          pediatric: a.pediatric + x.pediatric,
        }),
        { total: 0, male: 0, female: 0, pediatric: 0 }
      );
      setTodayStats(r);
    } catch (e) {
      console.error('fetchToday error', e);
    }
  };

  const fetchWeekly = async (doctorId: string) => {
    try {
      const res  = await fetch(
        `/api/reports?type=weekly&date=${format(new Date(), 'yyyy-MM-dd')}&doctor_id=${doctorId}`
      );
      const data = await res.json();
      setWeeklyData(data.report || []);
    } catch (e) {
      console.error('fetchWeekly error', e);
    }
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
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-6">
            <h1
              className="text-lg md:text-2xl font-bold text-emerald-900"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Dr. {user.name}
            </h1>
            <p className="text-emerald-600/70 text-sm mt-1">
              {format(new Date(), 'EEEE, MMMM d, yyyy')} · Your patient overview
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <StatsCard title="Today's Total"  value={todayStats.total}     subtitle="Your patients" icon={<Activity size={22} />}   color="green" />
            <StatsCard title="Male"           value={todayStats.male}      subtitle="Today"         icon={<Users size={22} />}       color="blue"  />
            <StatsCard title="Female"         value={todayStats.female}    subtitle="Today"         icon={<Users size={22} />}       color="pink"  />
            <StatsCard title="Pediatric"      value={todayStats.pediatric} subtitle="Today"         icon={<TrendingUp size={22} />}  color="amber" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-emerald-100 p-4 md:p-6 shadow-sm">
              <h2 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2 text-sm md:text-base">
                <Calendar size={16} className="text-emerald-500" /> This Week's Patients
              </h2>
              <div className="w-full overflow-hidden">
                {weeklyData.length > 0 ? (
                  <ReportChart data={weeklyData} type="bar" />
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                    No data for this week yet
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-emerald-100 p-4 md:p-6 shadow-sm">
              <h2 className="font-semibold text-emerald-900 mb-4 text-sm md:text-base">
                Gender Breakdown
              </h2>
              <div className="w-full overflow-hidden">
                {weeklyData.length > 0 ? (
                  <ReportChart data={weeklyData} type="pie" />
                ) : (
                  <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                    No data yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Link to reports */}
         <a
            href="/doctor/reports"
            className="card-hover bg-white rounded-2xl border-2 border-emerald-200 p-4 md:p-5 flex items-center gap-4 shadow-sm hover:shadow-md block transition-all"
          >
            <span className="text-3xl md:text-4xl">📊</span>
            <div>
              <p className="font-bold text-emerald-900 text-sm md:text-base">View Full Reports</p>
              <p className="text-xs text-gray-500">Daily, weekly, monthly & custom range — download as PDF</p>
            </div>
          </a>

        </div>
      </DashboardLayout>
    </div>
  );
}
