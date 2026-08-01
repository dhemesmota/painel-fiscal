import { createClient } from '@/lib/supabase/server';
import { EmpresaForm } from '@/components/EmpresaForm';
import { PageError } from '@/components/PageError';

export default async function EmpresaPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const { onboarding } = await searchParams;
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
        <h1 className="page-title">Dados da empresa</h1>
        <PageError message={error.message} />
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">Dados da empresa</h1>
      {onboarding === '1' && (
        <div className="data-error notice" role="alert">
          <strong>Comece por aqui.</strong>
          <p>
            O resto do painel (cálculo do DAS, checklist, guia de obrigações) depende dos dados da sua
            empresa — principalmente CNPJ e data de abertura. Preencha abaixo (ou use &quot;Buscar
            CNPJ&quot; pra preencher sozinho) e salve para liberar as outras abas.
          </p>
        </div>
      )}
      <EmpresaForm empresa={empresa || {}} />
    </>
  );
}
