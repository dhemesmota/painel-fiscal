import { createClient } from '@/lib/supabase/server';
import { MonthNav } from '@/components/MonthNav';
import { GuiaWizard } from '@/components/GuiaWizard';
import { todayYM, computeRBT12, calcImposto, vencimentoDAS, monthLabelTitle } from '@/lib/simplesNacional';

export default async function GuiaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const mes = mesParam || todayYM();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [notasRes, historicoRes, checklistRes, empresaRes] = await Promise.all([
    supabase.from('notas_fiscais').select('mes, valor, numero, tomador').eq('user_id', user!.id),
    supabase.from('faturamento_historico').select('mes, valor').eq('user_id', user!.id),
    supabase.from('checklist_mensal').select('nf, pgdas, pago').eq('user_id', user!.id).eq('mes', mes).maybeSingle(),
    supabase.from('empresas').select('data_abertura, inscricao_municipal').eq('user_id', user!.id).maybeSingle(),
  ]);

  const monthRevenues: Record<string, number> = {};
  (notasRes.data || []).forEach(n => {
    monthRevenues[n.mes] = (monthRevenues[n.mes] || 0) + Number(n.valor);
  });
  (historicoRes.data || []).forEach(h => {
    monthRevenues[h.mes] = Number(h.valor);
  });

  const revenue = monthRevenues[mes] || 0;
  const { rbt12, active } = computeRBT12(monthRevenues, mes, empresaRes.data?.data_abertura);
  const calc = calcImposto(revenue, rbt12, active);
  const venc = await vencimentoDAS(mes);
  const chk = checklistRes.data || { nf: false, pgdas: false, pago: false };
  const notasMes = (notasRes.data || []).filter(n => n.mes === mes);

  return (
    <>
      <MonthNav />
      <div className="eyebrow">Obrigações de {monthLabelTitle(mes)} — passo a passo com seus números</div>
      <p className="text-muted small" style={{ marginBottom: 18 }}>
        Isso não substitui os sites oficiais — só te leva até o clique certo, já com os valores da sua competência preenchidos.
      </p>

      <GuiaWizard
        mes={mes}
        notasMes={notasMes.map(n => ({ numero: n.numero, tomador: n.tomador, valor: Number(n.valor) }))}
        revenue={revenue}
        calcErro={calc.erro}
        calcTotal={calc.erro ? 0 : calc.total}
        vencIso={venc.toISOString()}
        chk={chk}
        inscricaoMunicipal={empresaRes.data?.inscricao_municipal ?? null}
      />

      <div className="rule" />
      <div className="eyebrow">Manter o CNPJ regular</div>
      <ul className="task-list">
        <li>Mantenha e-mail e endereço atualizados na Receita Federal e na Junta Comercial.</li>
        <li>
          Não deixe o DAS atrasar — débitos acumulados podem levar à exclusão do Simples Nacional.
        </li>
        <li>Guarde notas e comprovantes de pagamento por pelo menos 5 anos.</li>
        <li>
          Para decisões fora do dia a dia (contratar funcionário, distribuir lucros, mudar de
          atividade), vale consultar um contador ou o{' '}
          <a href="https://www.sebrae.com.br/" target="_blank" rel="noreferrer">
            Sebrae
          </a>
          , que orienta pequenas empresas gratuitamente.
        </li>
      </ul>
    </>
  );
}
