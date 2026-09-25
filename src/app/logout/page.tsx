'use client';
import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

export default function LogoutPage() {
  useEffect(() => {
    const performLogout = async () => {
      await signOut({ redirect: false });
      window.location.href = '/';
    };
    performLogout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">جاري تسجيل الخروج...</p>
    </div>
  );
}
