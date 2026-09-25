'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { UserRole } from '@/types';

interface RoleGuardProps {
  allowedRole: UserRole;
  children: React.ReactNode;
  redirectTo?: string;
}

export function RoleGuard({ allowedRole, children, redirectTo = '/pos' }: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== allowedRole) {
      router.replace(redirectTo);
    }
  }, [session, status, allowedRole, redirectTo, router]);

  if (status === 'loading') return <div>جاري التحميل...</div>;

  const userRole = (session?.user as any)?.role;
  if (!session || userRole !== allowedRole) return null;

  return <>{children}</>;
}
