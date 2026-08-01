import { createClient } from '@/lib/supabase/server';
import { MonthNav } from '@/components/MonthNav';
import { HistoricoTable } from '@/components/HistoricoTable';
import { PageError } from '@/components/PageError';
import {
  todayYM, addMonths, computeRBT12, calcImposto,
  fmt, pct, FAIXAS,
} from '@/lib/simplesNacional';
import { monthLabelShort } from '@/lib/simplesNacional';

export default async function ImpostoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const mes = mesParam || todayYM();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [notasRes, historicoRes, empresaRes] = await Promise.all([
    supabase.from('notas_fiscais').select('mes, valor').eq('user_id', user!.id),
    supabase.from('faturamento_historico').select('mes, valor, origem').eq('user_id', user!.id),
    supabase.from('empresas').select('data_abertura').eq('user_id', user!.id).maybeSingle(),
  ]);

  const readError = notasRes.error || historicoRes.error || empresaRes.error;
  if (readError) {
    return (
      <>
        <MonthNav />
        <PageError message={readError.message} />
      </>
    );
  }

  const monthRevenues: Record<string, number> = {};
  (notasRes.data || []).forEach(n => {
    monthRevenues[n.mes] = (monthRevenues[n.mes] || 0) + Number(n.valor);
  });
  const historicoMap: Record<string, { valor: number; origem: string }> = {};
  (historicoRes.data || []).forEach(h => {
    historicoMap[h.mes] = { valor: Number(h.valor), origem: h.origem };
    monthRevenues[h.mes] = Number(h.valor);
  });

  const months: string[] = [];
  for (let i = 12; i >= 0; i--) months.push(addMonths(mes, -i));

  const rows = months.map(m => {
    const auto = (notasRes.data || []).filter(n => n.mes === m).reduce((s, n) => s + Number(n.valor), 0);
    const override = historicoMap[m];
    const val = override ? override.valor : auto;
    const tag = m === mes ? 'mês atual' : override ? 'manual' : auto > 0 ? 'das notas' : '—';
    return { mes: m, val, tag, isCurrent: m === mes };
  });

  const revenue = monthRevenues[mes] || 0;
  const { rbt12, active } = computeRBT12(monthRevenues, mes, empresaRes.data?.data_abertura);
  const calc = calcImposto(revenue, rbt12, active);

  return (
    <>
      <MonthNav />
      <div className="eyebrow">Histórico de faturamento (para calcular o RBT12)</div>
      <p className="text-muted">
        Valores marcados "das notas" vêm da aba Notas Fiscais. Você pode sobrescrever qualquer mês
        manualmente — útil para registrar meses anteriores a este painel.
      </p>
      <HistoricoTable rows={rows} />

      <div className="rule" />
      <div className="eyebrow">Cálculo do DAS — {monthLabelShort(mes).toUpperCase()}</div>
      {calc.erro ? (
        <p>Receita acumulada acima de R$ 4,8 milhões. Procure um contador.</p>
      ) : (
        <>
          <div className="kv-row"><span>Meses de empresa considerados</span><strong>{calc.active} de 12</strong></div>
          <div className="kv-row"><span>RBT12</span><strong>{fmt(calc.rbt12)}</strong></div>
          <div className="kv-row"><span>Faixa / alíquota nominal</span><strong>{calc.idx + 1}ª faixa · {pct(FAIXAS[calc.idx].aliq)}</strong></div>
          <div className="kv-row"><span>Alíquota efetiva</span><strong>{pct(calc.aliqEf)}</strong></div>
          <div className="rule-light" />
          <div className="kv-row"><span>1001 · IRPJ</span><strong>{fmt(calc.breakdown.irpj)}</strong></div>
          <div className="kv-row"><span>1002 · CSLL</span><strong>{fmt(calc.breakdown.csll)}</strong></div>
          <div className="kv-row"><span>1004 · COFINS</span><strong>{fmt(calc.breakdown.cofins)}</strong></div>
          <div className="kv-row"><span>1005 · PIS</span><strong>{fmt(calc.breakdown.pis)}</strong></div>
          <div className="kv-row"><span>1006 · INSS (CPP)</span><strong>{fmt(calc.breakdown.cpp)}</strong></div>
          <div className="kv-row">
            <span>1010 · ISS{calc.idx === 5 ? ' (fora do DAS nesta faixa)' : ''}</span>
            <strong>{fmt(calc.breakdown.iss)}</strong>
          </div>
          <div className="kv-row total"><span>Total estimado do DAS</span><strong>{fmt(calc.total)}</strong></div>
        </>
      )}
      <p className="text-muted small">
        Estimativa baseada na tabela do Anexo III (LC 123/2006, vigente em 2026). O valor final é
        calculado pelo sistema PGDAS-D no momento da declaração.
      </p>
    </>
  );
}
