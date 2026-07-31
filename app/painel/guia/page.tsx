import { createClient } from '@/lib/supabase/server';
import { MonthNav } from '@/components/MonthNav';
import { ObrigacaoStep } from '@/components/ObrigacaoStep';
import {
  todayYM, computeRBT12, calcImposto, vencimentoDAS,
  fmt, fmtDate, monthLabel, monthLabelTitle,
} from '@/lib/simplesNacional';

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

      <ObrigacaoStep numero={1} titulo="Emitir as notas fiscais" mes={mes} field="nf" checked={chk.nf}>
        {notasMes.length > 0 ? (
          <>
            <p>
              Você já lançou {notasMes.length} nota(s) neste painel para {monthLabel(mes)}, somando{' '}
              <strong>{fmt(revenue)}</strong>. Confirme que elas foram <strong>de fato emitidas</strong> no
              portal — lançar aqui só registra pro cálculo, não emite lá:
            </p>
            <ul className="task-list">
              {notasMes.map((n, i) => (
                <li key={i}>NF {n.numero || '—'} · {n.tomador || 'sem tomador informado'} · {fmt(Number(n.valor))}</li>
              ))}
            </ul>
          </>
        ) : (
          <p>Nenhuma nota lançada ainda neste painel para {monthLabel(mes)}. Se você prestou serviço neste mês, emita a nota antes de seguir para o PGDAS-D.</p>
        )}
        <ol className="steps">
          <li>
            Acesse{' '}
            <a href="https://iss.fazenda.df.gov.br/online/" target="_blank" rel="noreferrer">
              iss.fazenda.df.gov.br/online
            </a>{' '}
            e entre com certificado digital ou conta gov.br.
          </li>
          <li>Abra uma nova DPS (Declaração de Prestação de Serviços).</li>
          <li>
            Informe o tomador, a descrição do serviço e o valor
            {empresaRes.data?.inscricao_municipal
              ? ` (sua inscrição municipal cadastrada: ${empresaRes.data.inscricao_municipal})`
              : ''}
            .
          </li>
          <li>Confirme — o sistema emite a NFS-e automaticamente. Baixe o PDF e envie ao cliente.</li>
        </ol>
      </ObrigacaoStep>

      <ObrigacaoStep numero={2} titulo="Enviar o PGDAS-D" mes={mes} field="pgdas" checked={chk.pgdas}>
        {calc.erro ? (
          <p>Receita acumulada acima do limite do Simples Nacional. Procure um contador para orientação antes de declarar.</p>
        ) : revenue > 0 ? (
          <p>
            Para a competência <strong>{monthLabelTitle(mes)}</strong>, informe receita bruta de{' '}
            <strong>{fmt(revenue)}</strong> no campo correspondente do PGDAS-D.
          </p>
        ) : (
          <p>
            Nenhuma receita registrada para {monthLabel(mes)} neste painel. Sem movimento, geralmente não há
            obrigatoriedade de transmitir o PGDAS-D dessa competência — confirme essa regra no próprio portal
            antes de pular esta etapa.
          </p>
        )}
        <ol className="steps">
          <li>
            Acesse o{' '}
            <a href="https://www8.receita.fazenda.gov.br/SimplesNacional/" target="_blank" rel="noreferrer">
              Portal do Simples Nacional
            </a>{' '}
            e entre em &quot;PGDAS-D e DEFIS&quot;.
          </li>
          <li>
            Selecione o período de apuração: <strong>{monthLabelTitle(mes)}</strong>.
          </li>
          {revenue > 0 && (
            <li>
              No campo de receita bruta do mês, digite exatamente <strong>{fmt(revenue)}</strong>.
            </li>
          )}
          <li>Confirme as demais informações e transmita a declaração.</li>
        </ol>
      </ObrigacaoStep>

      <ObrigacaoStep numero={3} titulo="Pagar o DAS" mes={mes} field="pago" checked={chk.pago}>
        {!calc.erro && (
          <p>
            DAS estimado para esta competência: <strong>{fmt(calc.total)}</strong> (o valor oficial é o que o
            PGDAS-D gerar). Vencimento: <strong>{fmtDate(venc)}</strong> — já ajustado para pular fins de
            semana e feriados nacionais.
          </p>
        )}
        <ol className="steps">
          <li>Depois de transmitir o PGDAS-D, o sistema gera o DAS automaticamente.</li>
          <li>Baixe o PDF da guia ou copie o código Pix.</li>
          <li>
            Pague até <strong>{fmtDate(venc)}</strong> (Pix ou boleto).
          </li>
        </ol>
      </ObrigacaoStep>

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
