'use client';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOutIcon } from '@/components/icons';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <button type="button" onClick={handleLogout} className="logout-link">
      <LogOutIcon width={15} height={15} />
      Sair
    </button>
  );
}
