'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { ReportData } from '@/types';
import { format } from 'date-fns';

interface ReportChartProps {
  data: ReportData[];
  type?: 'bar' | 'line' | 'pie';
}

const COLORS = {
  male: '#3b82f6',
  female: '#ec4899',
  pediatric: '#f59e0b',
};

const PIE_COLORS = ['#3b82f6', '#ec4899', '#f59e0b'];

export default function ReportChart({ data, type = 'bar' }: ReportChartProps) {
  const chartData = data.map(d => ({
    ...d,
    date: (() => {
      try { return format(new Date(d.date), 'dd MMM'); } catch { return d.date; }
    })(),
  }));

  if (type === 'pie') {
    const totals = data.reduce((acc, d) => ({
      male: acc.male + d.male,
      female: acc.female + d.female,
      pediatric: acc.pediatric + d.pediatric,
    }), { male: 0, female: 0, pediatric: 0 });

    const pieData = [
      { name: 'Male', value: totals.male },
      { name: 'Female', value: totals.female },
      { name: 'Pediatric', value: totals.pediatric },
    ].filter(d => d.value > 0);

    return (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [v, '']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #a7f3d0', fontSize: 12 }} />
          <Legend />
          <Line type="monotone" dataKey="male"      stroke={COLORS.male}      strokeWidth={2} dot={{ r: 4 }} name="Male" />
          <Line type="monotone" dataKey="female"    stroke={COLORS.female}    strokeWidth={2} dot={{ r: 4 }} name="Female" />
          <Line type="monotone" dataKey="pediatric" stroke={COLORS.pediatric} strokeWidth={2} dot={{ r: 4 }} name="Pediatric" />
          <Line type="monotone" dataKey="total"     stroke="#059669"          strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} name="Total" />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #a7f3d0', fontSize: 12 }} />
        <Legend />
        <Bar dataKey="male"      fill={COLORS.male}      radius={[4,4,0,0]} name="Male" />
        <Bar dataKey="female"    fill={COLORS.female}    radius={[4,4,0,0]} name="Female" />
        <Bar dataKey="pediatric" fill={COLORS.pediatric} radius={[4,4,0,0]} name="Pediatric" />
      </BarChart>
    </ResponsiveContainer>
  );
}
