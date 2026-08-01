import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/Sidebar';
import { PageTransition } from '@/components/PageTransition';

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .select('razao_social, cnpj')
    .eq('user_id', user.id)
    .maybeSingle();

  const razaoSocial = empresa?.razao_social || 'Minha Empresa';
  const cnpj = empresa?.cnpj || '';

  // Sem empresa cadastrada, o resto do painel não tem o que mostrar (RBT12,
  // DAS, notas — tudo depende de data_abertura/CNPJ). Manda direto pro
  // cadastro em vez de deixar o usuário navegar por abas vazias/erradas.
  // Se a leitura falhou (empresaError), não redireciona — evita trancar o
  // usuário fora dos próprios dados por causa de uma falha transitória.
  const pathname = (await headers()).get('x-pathname') || '';
  const cadastroIncompleto = !empresaError && !empresa?.razao_social;
  if (cadastroIncompleto && pathname !== '/painel/empresa') {
    redirect('/painel/empresa?onboarding=1');
  }

  return (
    <div className="app-shell">
      <Sidebar razaoSocial={razaoSocial} cnpj={cnpj} />
      <div className="app-main">
        <main id="main-content" className="app-content">
          <PageTransition>{children}</PageTransition>
        </main>
        <p className="disclaimer">
          Ferramenta de apoio e estimativa, não é um envio oficial. Os valores definitivos são gerados
          pelo PGDAS-D (Receita Federal) e pelo sistema de NFS-e do seu município. Em dúvidas mais
          complexas, consulte um contador ou o Sebrae.
        </p>
      </div>
    </div>
  );
}
