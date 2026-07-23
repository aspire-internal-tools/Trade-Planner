import { describe, it, expect } from 'vitest';
import { computeTradePlan, buildOrder, formatPercent } from './engine';

describe('formatPercent', () => {
  it('formats a share to two decimals', () => {
    expect(formatPercent(6667, 10000)).toBe('66.67%');
    expect(formatPercent(5000, 10000)).toBe('50.00%');
    expect(formatPercent(10000, 10000)).toBe('100.00%');
  });

  it('handles a zero whole without dividing by zero', () => {
    expect(formatPercent(0, 0)).toBe('0.00%');
    expect(formatPercent(500, 0)).toBe('0.00%');
  });
});

describe('results carry startPercent', () => {
  it('reports each fund starting share of the total pool', () => {
    const accounts = [
      { name: 'A', balanceCents: 750000, status: 'keep' },
      { name: 'B', balanceCents: 250000, status: 'keep' },
    ];
    const targetMap = new Map([
      ['A', 500000],
      ['B', 500000],
    ]);
    const plan = computeTradePlan(accounts, targetMap, {});
    const a = plan.results.find(r => r.name === 'A');
    const b = plan.results.find(r => r.name === 'B');
    expect(a.startPercent).toBeCloseTo(75, 5);
    expect(b.startPercent).toBeCloseTo(25, 5);
  });
});

describe('buildOrder (multi-from consolidated order)', () => {
  const accounts = [
    { name: 'MF 510', balanceCents: 4200000, status: 'close' },
    { name: 'MF 511', balanceCents: 2300000, status: 'close' },
    { name: 'MF 512', balanceCents: 3500000, status: 'close' },
    { name: 'MF 610', balanceCents: 0, status: 'new' },
    { name: 'MF 611', balanceCents: 0, status: 'new' },
  ];
  const targetMap = new Map([
    ['MF 510', 0],
    ['MF 511', 0],
    ['MF 512', 0],
    ['MF 610', 6000000],
    ['MF 611', 4000000],
  ]);

  it('aggregates every From fund and To fund exactly once', () => {
    const plan = computeTradePlan(accounts, targetMap, {});
    const order = buildOrder(plan);
    expect(order.fromRows.map(r => r.name).sort()).toEqual(['MF 510', 'MF 511', 'MF 512']);
    expect(order.toRows.map(r => r.name).sort()).toEqual(['MF 610', 'MF 611']);
  });

  it('conserves money: From total equals To total equals order total', () => {
    const plan = computeTradePlan(accounts, targetMap, {});
    const order = buildOrder(plan);
    const fromTotal = order.fromRows.reduce((s, r) => s + r.amountCents, 0);
    const toTotal = order.toRows.reduce((s, r) => s + r.amountCents, 0);
    expect(fromTotal).toBe(10000000);
    expect(toTotal).toBe(10000000);
    expect(order.totalCents).toBe(10000000);
  });

  it('carries the closing status onto From rows', () => {
    const plan = computeTradePlan(accounts, targetMap, {});
    const order = buildOrder(plan);
    expect(order.fromRows.every(r => r.status === 'close')).toBe(true);
  });

  it('returns empty tables when no trades are needed', () => {
    const flat = [
      { name: 'A', balanceCents: 500000, status: 'keep' },
      { name: 'B', balanceCents: 500000, status: 'keep' },
    ];
    const flatTargets = new Map([
      ['A', 500000],
      ['B', 500000],
    ]);
    const order = buildOrder(computeTradePlan(flat, flatTargets, {}));
    expect(order.fromRows).toEqual([]);
    expect(order.toRows).toEqual([]);
    expect(order.totalCents).toBe(0);
  });
});
