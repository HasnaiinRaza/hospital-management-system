import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role, department_id, is_active, created_at, departments(name)')
    .eq('role', 'doctor')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ doctors: data });
}

export async function POST(req: NextRequest) {
  const { name, email, password, department_id } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
  }

  const hashed = await hashPassword(password);

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({ name, email: email.toLowerCase().trim(), password: hashed, role: 'doctor', department_id })
    .select('id, name, email, role, department_id, is_active, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ doctor: data });
}

export async function PATCH(req: NextRequest) {
  const { id, name, email, department_id, is_active, password } = await req.json();
  const updates: Record<string, unknown> = { name, email, department_id, is_active };
  if (password) updates.password = await hashPassword(password);

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', id)
    .select('id, name, email, role, department_id, is_active, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ doctor: data });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const { error } = await supabaseAdmin.from('users').delete().eq('id', id).eq('role', 'doctor');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
