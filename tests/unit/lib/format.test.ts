import { describe, it, expect } from 'vitest';
import { formatPrice, formatDate, calculateDiscount } from '@/lib/format';

describe('formatPrice', () => {
  it('formatea un precio con dos decimales', () => {
    expect(formatPrice(19.99)).toBe('$19.99');
  });

  it('formatea cero', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('formatea miles con separador de miles', () => {
    expect(formatPrice(1000)).toBe('$1,000.00');
  });

  it('retorna $0.00 para precios negativos', () => {
    expect(formatPrice(-5)).toBe('$0.00');
  });
});

describe('formatDate', () => {
  it('formatea una fecha en español', () => {
    expect(formatDate('2026-01-15')).toBe('15 de enero de 2026');
  });

  it('retorna string vacio para string vacio', () => {
    expect(formatDate('')).toBe('');
  });

  it('retorna string vacio para fecha invalida sin lanzar excepcion', () => {
    expect(formatDate('no-es-una-fecha')).toBe('');
  });

  it('formatea febrero', () => {
    expect(formatDate('2026-02-05')).toBe('5 de febrero de 2026');
  });

  it('formatea diciembre', () => {
    expect(formatDate('2026-12-25')).toBe('25 de diciembre de 2026');
  });
});

describe('calculateDiscount', () => {
  it('aplica descuento correctamente', () => {
    expect(calculateDiscount(100, 20)).toBe(80);
  });

  it('retorna el mismo precio con descuento cero', () => {
    expect(calculateDiscount(50, 0)).toBe(50);
  });

  it('retorna cero con descuento del 100%', () => {
    expect(calculateDiscount(100, 100)).toBe(0);
  });

  it('retorna cero si el descuento supera el 100%', () => {
    expect(calculateDiscount(100, 110)).toBe(0);
  });

  it('retorna cero para descuento negativo', () => {
    expect(calculateDiscount(100, -10)).toBe(0);
  });

  it('retorna cero para precio negativo', () => {
    expect(calculateDiscount(-50, 20)).toBe(0);
  });
});
