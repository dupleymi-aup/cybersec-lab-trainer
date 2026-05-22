'use client';

// Recovery page - simple redirect to login since recovery is accessible from login page
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RecoveryPage() {
  const router = useRouter();
  
  // Redirect to login page since recovery is handled there
  useEffect(() => {
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900">
      <p className="text-slate-400">Redirecting...</p>
    </div>
  );
}
