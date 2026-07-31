import { createClient } from '@/lib/supabase/server';
import { MonthNav } from '@/components/MonthNav';
import { ChecklistClient } from '@/components/ChecklistClient';
import {
  todayYM, computeRBT12, calcImposto, vencimentoDAS, fmt, pct,
} from '@/lib/simplesNacional';

export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const mes = mesParam || todayYM();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [notasRes, historicoRes, checklistRes, empresaRes] = await Promise.all([
    supabase.from('notas_fiscais').select('mes, valor').eq('user_id', user!.id),
    supabase.from('faturamento_historico').select('mes, valor').eq('user_id', user!.id),
    supabase.from('checklist_mensal').select('nf, pgdas, pago').eq('user_id', user!.id).eq('mes', mes).maybeSingle(),
    supabase.from('empresas').select('data_abertura').eq('user_id', user!.id).maybeSingle(),
  ]);

  // Build revenue map: historico overrides notas
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
  const allDone = chk.nf && chk.pgdas && chk.pago;

  const notasMesCount = (notasRes.data || []).filter(n => n.mes === mes).length;

  return (
    <>
      <MonthNav />
      <div className="painel-grid">
        <div className={`stamp ${allDone ? 'done' : 'pending'}`}>
          {allDone ? 'EM DIA' : 'PENDENTE'}
        </div>
        <div>
          <div className="eyebrow">Receita da competência</div>
          <div className="big-number">{fmt(revenue)}</div>
          <div className="text-muted">
            {notasMesCount} nota(s) emitida(s) este mês
            {notasMesCount >= 2 ? ' · limite de 2 atingido' : ''}
          </div>
        </div>
      </div>

      <div className="rule" />
      <div className="eyebrow">Checklist do mês</div>
      <ChecklistClient mes={mes} initial={chk} vencDate={venc.toISOString()} />

      <div className="rule" />
      <div className="eyebrow">Estimativa do imposto (Anexo III)</div>
      {calc.erro ? (
        <p>Receita acumulada acima do limite do Simples Nacional. Procure um contador para orientação.</p>
      ) : (
        <>
          <div className="kv-row"><span>RBT12 (receita 12 meses)</span><strong>{fmt(calc.rbt12)}</strong></div>
          <div className="kv-row"><span>Faixa</span><strong>{calc.idx + 1}ª faixa</strong></div>
          <div className="kv-row"><span>Alíquota efetiva</span><strong>{pct(calc.aliqEf)}</strong></div>
          <div className="kv-row total"><span>DAS estimado deste mês</span><strong>{fmt(calc.total)}</strong></div>
        </>
      )}
    </>
  );
}
