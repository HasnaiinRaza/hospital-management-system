'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { User, UserRole } from '@/types';

export function useAuth(requiredRole?: UserRole | UserRole[]) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace('/login');
      return;
    }
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(session.role)) {
        router.replace('/login');
        return;
      }
    }
    setUser(session);
    setLoading(false);
  }, []);

  return { user, loading };
}
