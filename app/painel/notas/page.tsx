import { createClient } from '@/lib/supabase/server';
import { MonthNav } from '@/components/MonthNav';
import { NotaForm } from '@/components/NotaForm';
import { PageError } from '@/components/PageError';
import { todayYM } from '@/lib/simplesNacional';

export default async function NotasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const mes = mesParam || todayYM();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: notas, error } = await supabase
    .from('notas_fiscais')
    .select('*')
    .eq('user_id', user!.id)
    .eq('mes', mes)
    .order('data_emissao');

  if (error) {
    return (
      <>
        <h1 className="page-title">Notas fiscais</h1>
        <MonthNav />
        <PageError message={error.message} />
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">Notas fiscais</h1>
      <MonthNav />
      <NotaForm mes={mes} notas={notas || []} />
    </>
  );
}
