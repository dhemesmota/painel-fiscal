import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

// Cliente com service role — ignora RLS. Só pode ser usado em código que
// roda no servidor sem sessão de usuário (ex: cron jobs), nunca no client.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      // Node < 22 não tem WebSocket nativo, exigido pelo cliente realtime
      // interno do supabase-js mesmo quando não usamos realtime de fato.
      realtime: { transport: ws as unknown as typeof WebSocket },
    }
  );
}
