import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type          = searchParams.get('type') || 'daily';
  const doctor_id     = searchParams.get('doctor_id');
  const department_id = searchParams.get('department_id');
  const date          = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');

  // Custom date range overrides the type-based range
  const customFrom = searchParams.get('from');
  const customTo   = searchParams.get('to');

  let from: string, to: string;

  if (customFrom && customTo) {
    // Custom range mode — ignore type
    from = customFrom;
    to   = customTo;
  } else {
    const d = new Date(date);
    switch (type) {
      case 'weekly':
        from = format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        to   = format(endOfWeek(d,   { weekStartsOn: 1 }), 'yyyy-MM-dd');
        break;
      case 'monthly':
        from = format(startOfMonth(d), 'yyyy-MM-dd');
        to   = format(endOfMonth(d),   'yyyy-MM-dd');
        break;
      default:
        from = format(d, 'yyyy-MM-dd');
        to   = format(d, 'yyyy-MM-dd');
    }
  }

  let query = supabaseAdmin
    .from('patient_entries')
    .select(`
      *,
      doctor:users!patient_entries_doctor_id_fkey(id, name),
      department:departments!patient_entries_department_id_fkey(id, name)
    `)
    .gte('entry_date', from)
    .lte('entry_date', to)
    .order('entry_date', { ascending: true });

  if (doctor_id)     query = query.eq('doctor_id',     doctor_id);
  if (department_id) query = query.eq('department_id', department_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate by date for chart
  const aggregated: Record<string, {
    date: string; male: number; female: number; pediatric: number; total: number;
    doctor?: string; department?: string;
  }> = {};

  for (const entry of (data || [])) {
    if (entry.status === 'absent' || entry.status === 'leave') continue;
    const key = entry.entry_date;
    if (!aggregated[key]) {
      aggregated[key] = { date: key, male: 0, female: 0, pediatric: 0, total: 0 };
    }
    aggregated[key].male      += entry.male_count;
    aggregated[key].female    += entry.female_count;
    aggregated[key].pediatric += entry.pediatric_count;
    aggregated[key].total     += entry.male_count + entry.female_count + entry.pediatric_count;
    if (entry.doctor)     aggregated[key].doctor     = entry.doctor.name;
    if (entry.department) aggregated[key].department = entry.department.name;
  }

  return NextResponse.json({
    report: Object.values(aggregated).sort((a, b) => a.date.localeCompare(b.date)),
    raw:    data || [],
    period: { from, to, type: customFrom && customTo ? 'custom' : type },
  });
}