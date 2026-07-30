import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TabNav } from '@/components/TabNav';
import { MastheadPill } from '@/components/MastheadPill';
import { LogoutButton } from '@/components/LogoutButton';

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: empresa } = await supabase
    .from('empresas')
    .select('razao_social, cnpj')
    .eq('user_id', user.id)
    .single();

  const razaoSocial = empresa?.razao_social || 'Minha Empresa';
  const cnpj = empresa?.cnpj || '';

  return (
    <div id="app" style={{ minHeight: '100vh' }}>
      <div className="shell">
        <header className="masthead">
          <div>
            <div className="eyebrow" style={{ color: 'var(--cream-muted)' }}>Painel Fiscal · Simples Nacional</div>
            <h1>{razaoSocial}</h1>
            {cnpj && <div className="cnpj">CNPJ {cnpj}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <MastheadPill />
            <LogoutButton />
          </div>
        </header>
        <TabNav />
        <main className="paper">{children}</main>
        <p className="disclaimer">
          Ferramenta de apoio e estimativa, não é um envio oficial. Os valores definitivos são gerados
          pelo PGDAS-D (Receita Federal) e pelo sistema de NFS-e do seu município. Em dúvidas mais
          complexas, consulte um contador ou o Sebrae.
        </p>
      </div>
    </div>
  );
}
