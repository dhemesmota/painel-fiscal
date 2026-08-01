import { createClient } from '@/lib/supabase/server';
import { EmpresaForm } from '@/components/EmpresaForm';
import { PageError } from '@/components/PageError';

export default async function EmpresaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: empresa, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('user_id', user!.id)
    .maybeSingle();

  if (error) {
    return (
      <>
        <div className="eyebrow">Dados da empresa</div>
        <PageError message={error.message} />
      </>
    );
  }

  return (
    <>
      <div className="eyebrow">Dados da empresa</div>
      <EmpresaForm empresa={empresa || {}} />
    </>
  );
}
