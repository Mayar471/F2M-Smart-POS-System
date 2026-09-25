'use client';
import { useState } from 'react';
import { signIn as nextAuthSignIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await nextAuthSignIn('credentials', {
      username: 'admin', password, redirect: false,
    });

    if (result?.error) {
      setError('كلمة المرور غير صحيحة');
      setLoading(false);
      return;
    }

    const session = await getSession();
    const role = (session?.user as any)?.role;
    router.push(role === 'manager' ? '/manager/dashboard' : '/pos');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--brand-primary)]">f2m Smart POS</h1>
          <p className="text-gray-500 mt-1">تسجيل دخول المدير</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="كلمة المرور"  
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)} 
            autoComplete="current-password" 
          />
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            تسجيل الدخول
          </Button>
        </form>
      </div>
    </main>
  );
}
