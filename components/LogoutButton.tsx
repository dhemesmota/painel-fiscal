'use client';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <button
      onClick={handleLogout}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cream-muted)', fontFamily: 'Inter', fontSize: 12, padding: 0 }}
    >
      Sair
    </button>
  );
}
