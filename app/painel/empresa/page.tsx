import { createClient } from '@/lib/supabase/server';
import { EmpresaForm } from '@/components/EmpresaForm';

export default async function EmpresaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: empresa } = await supabase
    .from('empresas')
    .select('*')
    .eq('user_id', user!.id)
    .maybeSingle();

  return (
    <>
      <div className="eyebrow">Dados da empresa</div>
      <EmpresaForm empresa={empresa || {}} />
    </>
  );
}
