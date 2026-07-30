import { describe, it, expect } from 'vitest';
import { calcImposto } from './simplesNacional';

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
});
