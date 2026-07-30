import { createClient } from '@/lib/supabase/server';
import { MonthNav } from '@/components/MonthNav';
import { NotaForm } from '@/components/NotaForm';
import { todayYM, monthLabel } from '@/lib/simplesNacional';

export default async function NotasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const mes = mesParam || todayYM();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: notas } = await supabase
    .from('notas_fiscais')
    .select('*')
    .eq('user_id', user!.id)
    .eq('mes', mes)
    .order('data_emissao');

  return (
    <>
      <MonthNav />
      <div className="eyebrow">Notas fiscais de {monthLabel(mes)}</div>
      <NotaForm mes={mes} notas={notas || []} />
    </>
  );
}
