import bcrypt from 'bcryptjs';
import { User, UserRole } from '@/types';

const SESSION_KEY = 'hospital_session';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function saveSession(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
}

export function getSession(): User | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as User;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function getRoleDashboard(role: UserRole): string {
  switch (role) {
    case 'superadmin': return '/superadmin';
    case 'admin': return '/admin';
    case 'doctor': return '/doctor';
  }
}
