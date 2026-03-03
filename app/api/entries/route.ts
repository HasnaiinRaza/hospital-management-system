import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const doctor_id = searchParams.get('doctor_id');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let query = supabaseAdmin
    .from('patient_entries')
    .select(`
      *,
      doctor:users!patient_entries_doctor_id_fkey(id, name, email),
      department:departments!patient_entries_department_id_fkey(id, name)
    `)
    .order('entry_date', { ascending: false });

  if (doctor_id) query = query.eq('doctor_id', doctor_id);
  if (from) query = query.gte('entry_date', from);
  if (to) query = query.lte('entry_date', to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data });
}

export async function POST(req: NextRequest) {
  const { doctor_id, department_id, entry_date, male_count, female_count, pediatric_count, status, remarks, created_by } = await req.json();

  if (!doctor_id || !department_id || !entry_date) {
    return NextResponse.json({ error: 'Doctor, department and date are required' }, { status: 400 });
  }

  const isAbsent = status === 'absent' || status === 'leave';

  // Upsert: if entry for this doctor+department+date exists, update it
  const { data: existing } = await supabaseAdmin
    .from('patient_entries')
    .select('*')
    .eq('doctor_id', doctor_id)
    .eq('department_id', department_id)
    .eq('entry_date', entry_date)
    .single();

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('patient_entries')
      .update({
        male_count: isAbsent ? 0 : existing.male_count + (male_count || 0),
        female_count: isAbsent ? 0 : existing.female_count + (female_count || 0),
        pediatric_count: isAbsent ? 0 : existing.pediatric_count + (pediatric_count || 0),
        status: status || 'present',
        remarks: remarks || null,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ entry: data });
  }

  const { data, error } = await supabaseAdmin
    .from('patient_entries')
    .insert({
      doctor_id, department_id, entry_date,
      male_count: isAbsent ? 0 : (male_count || 0),
      female_count: isAbsent ? 0 : (female_count || 0),
      pediatric_count: isAbsent ? 0 : (pediatric_count || 0),
      status: status || 'present',
      remarks: remarks || null,
      created_by,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}

export async function PATCH(req: NextRequest) {
  const { id, male_count, female_count, pediatric_count, doctor_id, department_id, entry_date, status, remarks } = await req.json();

  const isAbsent = status === 'absent' || status === 'leave';

  const { data, error } = await supabaseAdmin
    .from('patient_entries')
    .update({
      doctor_id, department_id, entry_date,
      male_count: isAbsent ? 0 : male_count,
      female_count: isAbsent ? 0 : female_count,
      pediatric_count: isAbsent ? 0 : pediatric_count,
      status: status || 'present',
      remarks: remarks || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const { error } = await supabaseAdmin.from('patient_entries').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
