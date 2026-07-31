import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { todayYM, vencimentoDAS, daysUntil, monthLabel, fmtDate } from '@/lib/simplesNacional';

// Roda 1x/dia via Vercel Cron (ver vercel.json). Node runtime porque
// @supabase/supabase-js e resend usam APIs que não existem no Edge Runtime.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAS_THRESHOLDS = [5, 1, 0];
const DEFIS_THRESHOLDS = [30, 15, 5, 1, 0];
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function defisDaysLeft(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();
  let deadline = new Date(year, 2, 31); // 31 de março
  if (today > deadline) deadline = new Date(year + 1, 2, 31);
  return Math.round((deadline.getTime() - today.getTime()) / 86400000);
}

function renderEmail(opts: {
  razaoSocial: string;
  mes: string;
  venc: Date;
  dleft: number;
  pendenciasDas: string[];
  defisAlerta: boolean;
  defisDias: number;
}) {
  const { razaoSocial, mes, venc, dleft, pendenciasDas, defisAlerta, defisDias } = opts;

  const dasSection = pendenciasDas.length
    ? `
      <p>${
        dleft === 0
          ? 'O DAS vence <strong>hoje</strong>'
          : dleft < 0
          ? `O DAS venceu há <strong>${-dleft} dia(s)</strong>`
          : `Faltam <strong>${dleft} dia(s)</strong> para o vencimento do DAS`
      } de ${monthLabel(mes)} (${fmtDate(venc)}). Ainda pendente:</p>
      <ul>${pendenciasDas.map(p => `<li>${p}</li>`).join('')}</ul>
      <p>
        Emita a nota em
        <a href="https://iss.fazenda.df.gov.br/online/">iss.fazenda.df.gov.br</a>,
        envie o PGDAS-D e pague o DAS no
        <a href="https://www8.receita.fazenda.gov.br/SimplesNacional/">Portal do Simples Nacional</a>.
        Passo a passo completo: <a href="${APP_URL}/painel/guia">${APP_URL}/painel/guia</a>.
      </p>
    `
    : '';

  const defisSection = defisAlerta
    ? `
      <p>
        ${defisDias <= 0 ? 'A DEFIS vence <strong>hoje</strong> (31/03)' : `Faltam <strong>${defisDias} dia(s)</strong> para a DEFIS (31/03)`} —
        a declaração anual do Simples Nacional. Transmita pelo
        <a href="https://www8.receita.fazenda.gov.br/SimplesNacional/">Portal do Simples Nacional</a>.
      </p>
    `
    : '';

  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; color: #1a1a1a;">
      <h2 style="margin-bottom: 4px;">Painel Fiscal</h2>
      <p style="color: #666; margin-top: 0;">${razaoSocial}</p>
      ${dasSection}
      ${defisSection}
      <p style="margin-top: 24px;">
        <a href="${APP_URL}/painel" style="color: #0a5;">Abrir o painel</a>
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 24px;">
        Ferramenta de apoio e estimativa — a responsabilidade pelo envio das obrigações é sua.
      </p>
    </div>
  `;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const mes = todayYM();
  const venc = await vencimentoDAS(mes);
  const dleft = daysUntil(venc);
  const defisDias = defisDaysLeft();

  const dasCheckToday = DAS_THRESHOLDS.includes(dleft);
  const defisCheckToday = DEFIS_THRESHOLDS.includes(defisDias);

  if (!dasCheckToday && !defisCheckToday) {
    return NextResponse.json({ skipped: true, dleft, defisDias });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY não configurada' }, { status: 500 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabase = createAdminClient();

  const { data: empresas, error } = await supabase
    .from('empresas')
    .select('user_id, razao_social, email');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: { user_id: string; sent: boolean; reason?: string }[] = [];

  for (const empresa of empresas || []) {
    let pendenciasDas: string[] = [];

    if (dasCheckToday) {
      const { data: checklist } = await supabase
        .from('checklist_mensal')
        .select('nf, pgdas, pago')
        .eq('user_id', empresa.user_id)
        .eq('mes', mes)
        .maybeSingle();

      const chk = checklist || { nf: false, pgdas: false, pago: false };
      pendenciasDas = [
        !chk.nf && 'Emitir as notas fiscais do mês',
        !chk.pgdas && 'Enviar o PGDAS-D',
        !chk.pago && 'Pagar o DAS',
      ].filter(Boolean) as string[];
    }

    const defisAlerta = defisCheckToday;
    const deveEnviar = pendenciasDas.length > 0 || defisAlerta;

    if (!deveEnviar || !empresa.email) {
      results.push({ user_id: empresa.user_id, sent: false, reason: !deveEnviar ? 'em dia' : 'sem e-mail cadastrado' });
      continue;
    }

    await resend.emails.send({
      from: process.env.REMINDER_FROM_EMAIL || 'Painel Fiscal <onboarding@resend.dev>',
      to: empresa.email,
      subject: dasCheckToday && pendenciasDas.length
        ? `${dleft <= 0 ? '⚠️ Vence hoje' : `⚠️ Faltam ${dleft} dia(s)`}: obrigações de ${monthLabel(mes)}`
        : '⚠️ DEFIS — declaração anual do Simples Nacional',
      html: renderEmail({
        razaoSocial: empresa.razao_social || 'sua empresa',
        mes,
        venc,
        dleft,
        pendenciasDas,
        defisAlerta,
        defisDias,
      }),
    });

    results.push({ user_id: empresa.user_id, sent: true });
  }

  return NextResponse.json({ mes, dleft, defisDias, results });
}
