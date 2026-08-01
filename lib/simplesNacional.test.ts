import { describe, it, expect, vi, afterEach } from 'vitest';
import { calcImposto, computeRBT12, getFaixaIndex, vencimentoDAS } from './simplesNacional';

describe('calcImposto — Anexo III', () => {
  it('R$ 1.440 de receita na faixa 1 → DAS R$ 86,40 conforme guia DAS real', () => {
    // RBT12 = 1440 × 12 = 17280 (faixa 1, alíquota nominal 6%, sem dedução)
    const result = calcImposto(1440, 17280, 12);
    if (result.erro) throw new Error('Erro inesperado no cálculo');

    expect(result.aliqEf).toBeCloseTo(0.06, 6);
    expect(result.breakdown.irpj).toBeCloseTo(3.46, 1);
    expect(result.breakdown.csll).toBeCloseTo(3.02, 1);
    expect(result.breakdown.cofins).toBeCloseTo(11.08, 1);
    expect(result.breakdown.pis).toBeCloseTo(2.40, 1);
    expect(result.breakdown.cpp).toBeCloseTo(37.50, 1);
    expect(result.breakdown.iss).toBeCloseTo(28.94, 1);
    expect(result.total).toBeCloseTo(86.40, 1);
  });

  it('faixa 2 (2ª faixa, com dedução) calcula alíquota efetiva e total corretos', () => {
    const result = calcImposto(25000, 300000, 12);
    if (result.erro) throw new Error('Erro inesperado no cálculo');
    expect(result.idx).toBe(1);
    expect(result.aliqEf).toBeCloseTo(0.0808, 6);
    expect(result.total).toBeCloseTo(2020, 1);
  });

  it('faixa 3 calcula alíquota efetiva e total corretos', () => {
    const result = calcImposto(40000, 500000, 12);
    if (result.erro) throw new Error('Erro inesperado no cálculo');
    expect(result.idx).toBe(2);
    expect(result.aliqEf).toBeCloseTo(0.09972, 6);
    expect(result.total).toBeCloseTo(3988.8, 1);
  });

  it('faixa 4 calcula alíquota efetiva e total corretos', () => {
    const result = calcImposto(80000, 1000000, 12);
    if (result.erro) throw new Error('Erro inesperado no cálculo');
    expect(result.idx).toBe(3);
    expect(result.aliqEf).toBeCloseTo(0.12436, 6);
    expect(result.total).toBeCloseTo(9948.8, 1);
  });

  it('faixa 5, ISS dentro do teto de 5% → usa split padrão (sem cap)', () => {
    // aliqEf ≈ 0.1439; issUncapped = aliqEf × 0.335 ≈ 0.0482 (abaixo do teto de 5%)
    const result = calcImposto(50000, 1900000, 12);
    if (result.erro) throw new Error('Erro inesperado no cálculo');
    expect(result.idx).toBe(4);
    const issUncapped = result.aliqEf * 0.335;
    expect(issUncapped).toBeLessThan(0.05);
    expect(result.breakdown.iss).toBeCloseTo(result.revenue * issUncapped, 1);
    expect(result.total).toBeCloseTo(result.revenue * result.aliqEf, 1);
  });

  it('faixa 5, ISS acima do teto de 5% → ISS é limitado e o excedente é redistribuído', () => {
    // aliqEf ≈ 0.1597; issUncapped = aliqEf × 0.335 ≈ 0.0535 (acima do teto de 5%)
    const result = calcImposto(200000, 2500000, 12);
    if (result.erro) throw new Error('Erro inesperado no cálculo');
    expect(result.idx).toBe(4);
    const issUncapped = result.aliqEf * 0.335;
    expect(issUncapped).toBeGreaterThan(0.05);
    expect(result.breakdown.iss).toBeCloseTo(result.revenue * 0.05, 1);
    // A soma dos componentes continua batendo com o total, mesmo com o cap.
    const soma = Object.values(result.breakdown).reduce((s, v) => s + v, 0);
    expect(soma).toBeCloseTo(result.total, 1);
    expect(result.total).toBeCloseTo(result.revenue * result.aliqEf, 1);
  });

  it('faixa 6: ISS fica de fora do DAS (repartição não inclui ISS)', () => {
    const result = calcImposto(300000, 4000000, 12);
    if (result.erro) throw new Error('Erro inesperado no cálculo');
    expect(result.idx).toBe(5);
    expect(result.aliqEf).toBeCloseTo(0.168, 6);
    expect(result.breakdown.iss).toBe(0);
    expect(result.total).toBeCloseTo(50400, 1);
  });

  it('RBT12 acima de R$ 4,8 milhões → erro (fora do Simples Nacional)', () => {
    const result = calcImposto(100000, 5000000, 12);
    expect(result.erro).toBe(true);
  });
});

describe('getFaixaIndex — limites das faixas', () => {
  it('respeita os limites exatos de cada faixa', () => {
    expect(getFaixaIndex(180000)).toBe(0);
    expect(getFaixaIndex(180000.01)).toBe(1);
    expect(getFaixaIndex(4800000)).toBe(5);
    expect(getFaixaIndex(4800000.01)).toBe(-1);
  });
});

describe('computeRBT12', () => {
  it('sem histórico e sem data de abertura → RBT12 zero, 1 mês ativo (fail-safe)', () => {
    const { rbt12, active, sum } = computeRBT12({}, '2026-07');
    expect(sum).toBe(0);
    expect(rbt12).toBe(0);
    expect(active).toBe(1);
  });

  it('empresa nova (menos de 12 meses de atividade) projeta o RBT12 proporcionalmente', () => {
    const monthRevenues = { '2026-05': 1000, '2026-06': 2000 };
    const { rbt12, active, sum } = computeRBT12(monthRevenues, '2026-07', '2026-05-01');
    expect(active).toBe(2);
    expect(sum).toBe(3000);
    expect(rbt12).toBeCloseTo(18000, 6); // (3000 / 2) × 12
  });

  it('empresa com 12+ meses de atividade usa a soma direta dos últimos 12 meses', () => {
    const monthRevenues: Record<string, number> = {};
    for (let i = 1; i <= 12; i++) {
      const d = new Date(2026, 6 - i, 1); // meses anteriores a julho/2026
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthRevenues[ym] = 1000;
    }
    const { rbt12, active, sum } = computeRBT12(monthRevenues, '2026-07', '2020-01-01');
    expect(active).toBe(12);
    expect(sum).toBe(12000);
    expect(rbt12).toBe(12000);
  });
});

describe('vencimentoDAS', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('empurra o vencimento quando o dia 20 cai num feriado retornado pela API', async () => {
    const alvo = new Date(2026, 1, 20); // fevereiro/2026 (vencimento da competência de janeiro/2026)
    const iso = `${alvo.getFullYear()}-${String(alvo.getMonth() + 1).padStart(2, '0')}-${String(alvo.getDate()).padStart(2, '0')}`;

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ date: iso, name: 'Feriado de teste', type: 'national' }],
    }));

    const venc = await vencimentoDAS('2026-01');
    expect(venc.getTime()).toBeGreaterThan(alvo.getTime());
    expect([0, 6]).not.toContain(venc.getDay());
  });

  it('sem feriados, nunca cai em fim de semana', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));

    const venc = await vencimentoDAS('2026-01');
    expect([0, 6]).not.toContain(venc.getDay());
  });

  it('se a API de feriados falhar, ainda retorna uma data válida (degrada para só fim de semana)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const venc = await vencimentoDAS('2026-03');
    expect(venc).toBeInstanceOf(Date);
    expect([0, 6]).not.toContain(venc.getDay());
  });
});
