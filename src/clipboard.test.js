import { describe, it, expect } from 'vitest';
import { computeTradePlan, buildOrder } from './engine';
import { buildPlanText, buildPlanHtml } from './clipboard';

function samplePlan() {
  const accounts = [
    { name: 'Account A', balanceCents: 1000000, status: 'keep' },
    { name: 'Account B', balanceCents: 500000, status: 'close' },
    { name: 'Account C', balanceCents: 0, status: 'new' },
  ];
  const targetMap = new Map([
    ['Account A', 750000],
    ['Account B', 0],
    ['Account C', 750000],
  ]);
  return computeTradePlan(accounts, targetMap, { toleranceType: 'exact', toleranceValue: 0 });
}

function sampleLookup() {
  return new Map([
    ['Account A', { code: 'Account A', description: 'Canadian Equity', label: 'Account A (Canadian Equity)' }],
    ['Account B', { code: 'Account B', description: 'Money Market', label: 'Account B (Money Market)' }],
    ['Account C', { code: 'Account C', description: 'Global Bond', label: 'Account C (Global Bond)' }],
  ]);
}

describe('buildPlanText', () => {
  it('produces the plain text plan with headers and amounts', () => {
    const text = buildPlanText(samplePlan());
    expect(text).toContain('TRADE PLAN');
    expect(text).toContain('RESULTS SUMMARY');
    expect(text).toContain('Account B (closing fund)');
    expect(text).toContain('$7,500.00');
  });

  it('pairs every trade amount with a two-decimal percentage', () => {
    const text = buildPlanText(samplePlan());
    // Account B (closing) sends its full $5,000.00, which is 100.00% of its balance
    expect(text).toContain('$5,000.00 (100.00% of Account B)');
    // Account A sends $2,500.00 of its $10,000.00, which is 25.00%
    expect(text).toContain('$2,500.00 (25.00% of Account A)');
  });

  it('shows two-decimal percentages in the results summary rows', () => {
    const text = buildPlanText(samplePlan());
    // Account A ends at $7,500.00 of $15,000.00, which is 50.00%
    expect(text).toContain('(50.00%)');
  });

  it('uses the renamed column headers', () => {
    const text = buildPlanText(samplePlan());
    expect(text).toContain('Fund');
    expect(text).toContain('Starting Balance');
    expect(text).toContain('Target Balance');
    expect(text).toContain('Ending Balance');
    expect(text).toContain('Final %');
  });

  it('leaves an extra blank line before the results summary', () => {
    const text = buildPlanText(samplePlan());
    expect(text).toMatch(/\n\n\nRESULTS SUMMARY/);
  });

  it('uses code and description labels when a lookup is supplied', () => {
    const text = buildPlanText(samplePlan(), { lookup: sampleLookup() });
    expect(text).toContain('Account B (Money Market) (closing fund)');
  });

  it('formats the multi-from order as one consolidated From and To listing', () => {
    const plan = samplePlan();
    const order = buildOrder(plan);
    const text = buildPlanText(plan, { mode: 'multi', order });
    expect(text).toContain('One consolidated order (multi-from internal transfer)');
    expect(text).toContain('FROM (money out):');
    expect(text).toContain('TO (money in):');
    // Account C receives the full $7,500.00 moved, 100.00% of the order
    expect(text).toContain('$7,500.00 (100.00% of the order)');
  });
});

describe('buildPlanHtml', () => {
  it('produces real HTML tables for Word paste', () => {
    const html = buildPlanHtml(samplePlan());
    expect(html).toContain('<table');
    expect(html).toContain('</table>');
    // two tables: transfers and results summary
    expect(html.match(/<table/g).length).toBe(2);
    // inline styles, since Word ignores classes
    expect(html).toContain('border-collapse:collapse');
    expect(html).toContain('$7,500.00');
  });

  it('adds a percent column to the trade table', () => {
    const html = buildPlanHtml(samplePlan());
    expect(html).toContain('>Percent</th>');
    expect(html).toContain('100.00% of fund');
  });

  it('carries fund code and description columns in the results summary', () => {
    const html = buildPlanHtml(samplePlan(), { lookup: sampleLookup() });
    expect(html).toContain('>Fund Code</th>');
    expect(html).toContain('>Fund Description</th>');
    expect(html).toContain('Canadian Equity');
    expect(html).toContain('>Start %</th>');
    expect(html).toContain('>Target %</th>');
  });

  it('renders the multi-from order as one two-sided table', () => {
    const plan = samplePlan();
    const order = buildOrder(plan);
    const html = buildPlanHtml(plan, { mode: 'multi', order, lookup: sampleLookup() });
    expect(html).toContain('One consolidated order');
    expect(html).toContain('>Side</th>');
    expect(html).toContain('Total moved');
    // order table + results summary
    expect(html.match(/<table/g).length).toBe(2);
  });

  it('inserts a spacer paragraph between the trade table and the results summary', () => {
    const html = buildPlanHtml(samplePlan());
    const spacerIdx = html.indexOf('&nbsp;');
    const summaryIdx = html.indexOf('Results Summary');
    const firstTableEnd = html.indexOf('</table>');
    expect(spacerIdx).toBeGreaterThan(firstTableEnd);
    expect(spacerIdx).toBeLessThan(summaryIdx);
  });

  it('escapes HTML in fund identifiers', () => {
    const plan = samplePlan();
    plan.results[0].name = 'A<script>&';
    const html = buildPlanHtml(plan);
    expect(html).toContain('A&lt;script&gt;&amp;');
    expect(html).not.toContain('A<script>');
  });

  it('renders a results table but no transfers table when no transfers are needed', () => {
    const accounts = [
      { name: 'Account A', balanceCents: 500000, status: 'keep' },
      { name: 'Account B', balanceCents: 500000, status: 'keep' },
    ];
    const targetMap = new Map([
      ['Account A', 500000],
      ['Account B', 500000],
    ]);
    const plan = computeTradePlan(accounts, targetMap, {
      toleranceType: 'exact',
      toleranceValue: 0,
    });
    expect(plan.transfers.length).toBe(0);
    const html = buildPlanHtml(plan);
    expect(html.match(/<table/g).length).toBe(1);
  });
});
