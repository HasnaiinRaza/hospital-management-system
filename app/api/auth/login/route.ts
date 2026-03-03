import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { comparePassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch user by email and role
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('role', role)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid credentials or account not found' },
        { status: 401 }
      );
    }

    // Verify password
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Return user without password
    const { password: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
