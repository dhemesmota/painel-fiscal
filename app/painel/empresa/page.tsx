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
        <div className="eyebrow">Dados da empresa</div>
        <PageError message={error.message} />
      </>
    );
  }

  return (
    <>
      <div className="eyebrow">Dados da empresa</div>
      {onboarding === '1' && (
        <div className="data-error" style={{ borderColor: 'var(--gold-ink)', background: 'rgba(139, 101, 42, 0.08)' }}>
          <strong style={{ color: 'var(--gold-ink)' }}>Comece por aqui.</strong>
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
