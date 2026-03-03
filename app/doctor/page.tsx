'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import Sidebar from '@/components/Sidebar';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import { ClipboardList, Users, Activity, TrendingUp } from 'lucide-react';
import { ReportData } from '@/types';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { user, loading } = useAuth('admin');
  const [stats, setStats] = useState({
    totalToday: 0, maleToday: 0, femaleToday: 0, peadToday: 0,
  });
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchTodayStats();
    fetchRecent();
  }, [user]);

  const fetchTodayStats = async () => {
    try {
      const res  = await fetch(`/api/reports?type=daily&date=${format(new Date(), 'yyyy-MM-dd')}`);
      const data = await res.json();
      const report: ReportData[] = data.report || [];
      const totals = report.reduce(
        (a, r) => ({
          total:     a.total     + r.total,
          male:      a.male      + r.male,
          female:    a.female    + r.female,
          pediatric: a.pediatric + r.pediatric,
        }),
        { total: 0, male: 0, female: 0, pediatric: 0 }
      );
      setStats({
        totalToday:  totals.total,
        maleToday:   totals.male,
        femaleToday: totals.female,
        peadToday:   totals.pediatric,
      });
    } catch (e) {
      console.error('fetchTodayStats error', e);
    }
  };

  const fetchRecent = async () => {
    try {
      const res  = await fetch('/api/entries');
      const data = await res.json();
      setRecentEntries((data.entries || []).slice(0, 5));
    } catch (e) {
      console.error('fetchRecent error', e);
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
              className="text-lg md:text-xl font-bold text-emerald-900"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Admin Dashboard
            </h1>
            <p className="text-emerald-600/70 text-sm mt-1">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <StatsCard
              title="Today's Total"
              value={stats.totalToday}
              subtitle="All patients"
              icon={<Activity size={22} />}
              color="green"
            />
            <StatsCard
              title="Male"
              value={stats.maleToday}
              subtitle="Today"
              icon={<Users size={22} />}
              color="blue"
            />
            <StatsCard
              title="Female"
              value={stats.femaleToday}
              subtitle="Today"
              icon={<Users size={22} />}
              color="pink"
            />
            <StatsCard
              title="Pediatric"
              value={stats.peadToday}
              subtitle="Today"
              icon={<TrendingUp size={22} />}
              color="amber"
            />
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6">
            {[
              { label: 'Add Patient Entry', href: '/admin/entries', emoji: '➕', desc: 'Record new patient visits'      },
              { label: 'View Reports',      href: '/admin/reports', emoji: '📊', desc: 'Daily, weekly, monthly reports' },
            ].map(item => (
              <a
                key={item.href}
                href={item.href}
                className="card-hover bg-white rounded-2xl border-2 border-emerald-200 p-4 md:p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all"
              >
                <span className="text-3xl">{item.emoji}</span>
                <div>
                  <p className="font-bold text-emerald-900 text-sm md:text-base">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </a>
            ))}
          </div>

          {/* Recent entries */}
          {recentEntries.length > 0 && (
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
              <div className="px-4 py-4 border-b border-emerald-50">
                <h3 className="font-semibold text-emerald-900 text-sm flex items-center gap-2">
                  <ClipboardList size={16} /> Recent Entries
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px]">
                  <thead>
                    <tr className="bg-emerald-50 border-b border-emerald-100">
                      <th className="text-left px-4 py-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Doctor</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-emerald-700 uppercase tracking-wide">Dept</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-blue-600 uppercase tracking-wide">M</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-pink-600 uppercase tracking-wide">F</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-amber-600 uppercase tracking-wide">P</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEntries.map((e: any) => (
                      <tr key={e.id} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors">
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          {format(new Date(e.entry_date), 'dd MMM yyyy')}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">Dr. {e.doctor?.name}</td>
                        <td className="px-4 py-3 text-sm">{e.department?.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="badge badge-male">{e.male_count}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="badge badge-female">{e.female_count}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="badge badge-pead">{e.pediatric_count}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </DashboardLayout>
    </div>
  );
}