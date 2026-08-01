export const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

export const FAIXAS = [
  { limite: 180000,  aliq: 0.06,  deduzir: 0 },
  { limite: 360000,  aliq: 0.112, deduzir: 9360 },
  { limite: 720000,  aliq: 0.135, deduzir: 17640 },
  { limite: 1800000, aliq: 0.16,  deduzir: 35640 },
  { limite: 3600000, aliq: 0.21,  deduzir: 125640 },
  { limite: 4800000, aliq: 0.33,  deduzir: 648000 },
];

export const REPART = [
  { cpp: 0.434, iss: 0.335, csll: 0.035, irpj: 0.04, cofins: 0.1282, pis: 0.0278 },
  { cpp: 0.434, iss: 0.320, csll: 0.035, irpj: 0.04, cofins: 0.1405, pis: 0.0305 },
  { cpp: 0.434, iss: 0.325, csll: 0.035, irpj: 0.04, cofins: 0.1364, pis: 0.0296 },
  { cpp: 0.434, iss: 0.325, csll: 0.035, irpj: 0.04, cofins: 0.1364, pis: 0.0296 },
  { cpp: 0.434, iss: 0.335, csll: 0.035, irpj: 0.04, cofins: 0.1282, pis: 0.0278 },
  { cpp: 0.305, iss: 0,     csll: 0.15,  irpj: 0.35, cofins: 0.1603, pis: 0.0347 },
];

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function todayYM(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function parseYM(ym: string): { y: number; m: number } {
  const [y, m] = ym.split('-').map(Number);
  return { y, m };
}

export function ymToDate(ym: string): Date {
  const { y, m } = parseYM(ym);
  return new Date(y, m - 1, 1);
}

export function dateToYM(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function addMonths(ym: string, delta: number): string {
  const d = ymToDate(ym);
  d.setMonth(d.getMonth() + delta);
  return dateToYM(d);
}

export function monthLabel(ym: string): string {
  const { y, m } = parseYM(ym);
  return `${MESES[m - 1].toUpperCase()} ${y}`;
}

export function monthLabelTitle(ym: string): string {
  const { y, m } = parseYM(ym);
  return `${MESES[m - 1]} ${y}`;
}

export function monthLabelShort(ym: string): string {
  const { y, m } = parseYM(ym);
  return `${MESES[m - 1].slice(0, 3)}/${String(y).slice(2)}`;
}

export function fmt(v: number): string {
  return (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function pct(v: number, dec = 2): string {
  return `${(v * 100).toFixed(dec).replace('.', ',')}%`;
}

export function fmtDateBR(iso: string): string {
  const p = iso.split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
}

export function fmtDate(d: Date): string {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function daysUntil(d: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  return Math.round((dd.getTime() - today.getTime()) / 86400000);
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Constrói um Date local a partir de uma string 'YYYY-MM-DD' (com ou sem
// horário) SEM passar por new Date(string), que o JS interpreta como UTC e
// depois lê com getters locais — isso desloca o dia em até 1 unidade sempre
// que o processo que lê roda num fuso diferente do que escreveu (ex.:
// servidor em UTC na Vercel vs. navegador em America/Sao_Paulo). Usar para
// qualquer data-calendário (data_abertura, vencimento do DAS) que precise
// atravessar servidor → cliente ou banco → servidor mantendo o mesmo dia.
export function parseDateOnly(iso: string): Date {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  if (!y || !m || !d) return new Date(NaN);
  return new Date(y, m - 1, d);
}

// Feriados nacionais (BrasilAPI, gratuita e sem chave). Não cobre feriados
// municipais/estaduais — só nacionais, que já são a maioria dos casos em que
// o dia 20 "escapa" de um fim de semana.
async function getFeriadosNacionais(ano: number): Promise<Set<string>> {
  try {
    const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`, {
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return new Set();
    const data: { date: string }[] = await res.json();
    return new Set(data.map(f => f.date));
  } catch {
    return new Set();
  }
}

export async function vencimentoDAS(competenciaYm: string): Promise<Date> {
  const d = ymToDate(addMonths(competenciaYm, 1));
  d.setDate(20);
  const feriados = await getFeriadosNacionais(d.getFullYear());
  while (d.getDay() === 0 || d.getDay() === 6 || feriados.has(toISODate(d))) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

export function getFaixaIndex(rbt12: number): number {
  for (let i = 0; i < FAIXAS.length; i++) {
    if (rbt12 <= FAIXAS[i].limite) return i;
  }
  return -1;
}

export interface Breakdown {
  iss: number;
  cpp: number;
  csll: number;
  irpj: number;
  cofins: number;
  pis: number;
}

function stdSplit(revenue: number, aliqEf: number, r: (typeof REPART)[0]): Breakdown {
  return {
    iss:    revenue * aliqEf * r.iss,
    cpp:    revenue * aliqEf * r.cpp,
    csll:   revenue * aliqEf * r.csll,
    irpj:   revenue * aliqEf * r.irpj,
    cofins: revenue * aliqEf * r.cofins,
    pis:    revenue * aliqEf * r.pis,
  };
}

export type CalcResult =
  | { erro: false; idx: number; aliqEf: number; breakdown: Breakdown; total: number; rbt12: number; active: number; revenue: number }
  | { erro: true; rbt12: number; revenue: number; active: number };

export function calcImposto(revenue: number, rbt12: number, active: number): CalcResult {
  const idx = getFaixaIndex(rbt12);
  if (idx === -1) return { erro: true, rbt12, revenue, active };

  const f = FAIXAS[idx];
  const r = REPART[idx];
  const aliqEf = rbt12 > 0 ? Math.max(0, (rbt12 * f.aliq - f.deduzir) / rbt12) : f.aliq;

  let breakdown: Breakdown;
  if (idx === 4) {
    const issUncapped = aliqEf * r.iss;
    if (issUncapped > 0.05) {
      const leftover = aliqEf - 0.05;
      breakdown = {
        iss:    revenue * 0.05,
        cpp:    revenue * leftover * 0.6526,
        csll:   revenue * leftover * 0.0526,
        irpj:   revenue * leftover * 0.0602,
        cofins: revenue * leftover * 0.1928,
        pis:    revenue * leftover * 0.0418,
      };
    } else {
      breakdown = stdSplit(revenue, aliqEf, r);
    }
  } else {
    breakdown = stdSplit(revenue, aliqEf, r);
  }

  const total = Object.values(breakdown).reduce((s, v) => s + v, 0);
  return { erro: false, idx, aliqEf, breakdown, total, rbt12, active, revenue };
}

export function computeRBT12(
  monthRevenues: Record<string, number>,
  forYm: string,
  dataAbertura?: string | null
): { rbt12: number; active: number; sum: number } {
  const months: string[] = [];
  for (let i = 12; i >= 1; i--) months.push(addMonths(forYm, -i));

  const sum = months.reduce((s, m) => s + (monthRevenues[m] || 0), 0);

  let startYm: string | undefined;
  if (dataAbertura) {
    const d = parseDateOnly(dataAbertura);
    if (!isNaN(d.getTime())) startYm = dateToYM(d);
  }
  if (!startYm) {
    const keys = Object.keys(monthRevenues).filter((k) => k < forYm);
    if (keys.length === 0) return { rbt12: sum, active: 1, sum };
    keys.sort();
    startYm = keys[0];
  }

  let count = 0;
  let cursor = startYm;
  let guard = 0;
  while (cursor < forYm && guard < 240) {
    count++;
    cursor = addMonths(cursor, 1);
    guard++;
  }
  const active = Math.max(1, Math.min(count, 12));
  const rbt12 = active >= 12 ? sum : active > 0 ? (sum / active) * 12 : 0;

  return { rbt12, active, sum };
}
