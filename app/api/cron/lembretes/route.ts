import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { todayYM, vencimentoDAS, daysUntil, monthLabel, fmtDate } from '@/lib/simplesNacional';
import { URLS, guiaPainelUrl, defisDaysLeft, DAS_LEMBRETE_DIAS, DEFIS_LEMBRETE_DIAS, DEFIS_AVISO_PRORROGACAO } from '@/lib/obrigacoes';

// Roda 1x/dia via Vercel Cron (ver vercel.json). Node runtime porque
// @supabase/supabase-js e resend usam APIs que não existem no Edge Runtime.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAS_THRESHOLDS = DAS_LEMBRETE_DIAS;
const DEFIS_THRESHOLDS = DEFIS_LEMBRETE_DIAS;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Alerta pro próprio dono do sistema se o job falhar (ou se ele mesmo não
// receber e-mail por falta de cadastro) — sem isso, uma falha silenciosa no
// cron anularia o propósito inteiro do lembrete automático.
async function alertarAdmin(resend: Resend, assunto: string, detalhe: string) {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL;
  if (!adminEmail) return;
  try {
    await resend.emails.send({
      from: process.env.REMINDER_FROM_EMAIL || 'Painel Fiscal <onboarding@resend.dev>',
      to: adminEmail,
      subject: `🚨 Painel Fiscal — ${assunto}`,
      html: `<p>${detalhe}</p>`,
    });
  } catch (e) {
    console.error('Falha ao enviar alerta ao admin:', e);
  }
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
        <a href="${URLS.nfseDF}">iss.fazenda.df.gov.br</a>,
        envie o PGDAS-D e pague o DAS no
        <a href="${URLS.simplesPortal}">Portal do Simples Nacional</a>.
        Passo a passo completo: <a href="${guiaPainelUrl(APP_URL)}">${guiaPainelUrl(APP_URL)}</a>.
      </p>
    `
    : '';

  const defisSection = defisAlerta
    ? `
      <p>
        ${defisDias <= 0 ? 'A DEFIS vence <strong>hoje</strong> (31/03)' : `Faltam <strong>${defisDias} dia(s)</strong> para a DEFIS (31/03)`} —
        a declaração anual do Simples Nacional. Transmita pelo
        <a href="${URLS.simplesPortal}">Portal do Simples Nacional</a>.
        ${DEFIS_AVISO_PRORROGACAO}
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

  // Best-effort: usado tanto no fluxo normal (Resend inicializado abaixo)
  // quanto no catch de emergência, então precisa existir fora do try.
  const resendKey = process.env.RESEND_API_KEY;
  const emergencyResend = resendKey ? new Resend(resendKey) : null;

  try {
    const mes = todayYM();
    const venc = await vencimentoDAS(mes);
    const dleft = daysUntil(venc);
    const defisDias = defisDaysLeft();

    const dasCheckToday = DAS_THRESHOLDS.includes(dleft);
    const defisCheckToday = DEFIS_THRESHOLDS.includes(defisDias);

    if (!dasCheckToday && !defisCheckToday) {
      return NextResponse.json({ skipped: true, dleft, defisDias });
    }

    if (!resendKey || !emergencyResend) {
      return NextResponse.json({ error: 'RESEND_API_KEY não configurada' }, { status: 500 });
    }
    const resend = emergencyResend;
    const supabase = createAdminClient();

    const { data: empresas, error } = await supabase
      .from('empresas')
      .select('user_id, razao_social, email');
    if (error) {
      await alertarAdmin(resend, 'cron de lembretes falhou', `Erro ao ler empresas: ${error.message}`);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results: { user_id: string; sent: boolean; reason?: string }[] = [];
    const falhas: string[] = [];

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

      // Uma falha de envio individual não pode derrubar o job inteiro e
      // impedir que os demais usuários recebam o lembrete deles.
      try {
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
      } catch (sendError) {
        const msg = sendError instanceof Error ? sendError.message : 'erro desconhecido';
        console.error(`Falha ao enviar lembrete para user_id ${empresa.user_id}:`, sendError);
        results.push({ user_id: empresa.user_id, sent: false, reason: `falha no envio: ${msg}` });
        falhas.push(`${empresa.user_id}: ${msg}`);
      }
    }

    if (falhas.length > 0) {
      await alertarAdmin(
        resend,
        `${falhas.length} lembrete(s) não enviado(s)`,
        `Falha ao enviar e-mail para: <br>${falhas.join('<br>')}`
      );
    }

    return NextResponse.json({ mes, dleft, defisDias, results });
  } catch (fatalError) {
    const msg = fatalError instanceof Error ? fatalError.message : 'erro desconhecido';
    console.error('Cron de lembretes falhou de forma inesperada:', fatalError);
    if (emergencyResend) {
      await alertarAdmin(emergencyResend, 'cron de lembretes falhou', `Erro inesperado: ${msg}`);
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
