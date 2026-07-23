import { describe, it, expect } from 'vitest';
import { DEMOS, getDemo } from './demos';
import { toCents, computeTradePlan, validateTargets } from './engine';
import { fundIdentifier, findDuplicateIdentifiers } from './funds';
import { parseDollarInput } from './money-input';

// Every demo must load into a valid, feasible plan; a broken demo in the
// About section would be worse than no demo at all.
describe('demo scenarios', () => {
  it('has unique ids and titles', () => {
    const ids = DEMOS.map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(getDemo('standard-rebalance')).toBeTruthy();
    expect(getDemo('nope')).toBeNull();
  });

  for (const demo of DEMOS) {
    describe(demo.title, () => {
      const currentAccounts = demo.state.accounts.map(a => ({
        name: fundIdentifier(a),
        balanceCents: toCents(parseDollarInput(a.balance)),
        status:
          demo.state.targets.some(
            target =>
              target.name === fundIdentifier(a) &&
              (target.status === 'close' || Number(target.targetValue) === 0)
          )
            ? 'close'
            : 'keep',
      }));
      const newAccounts = demo.state.targets
        .filter(target => target.source === 'new')
        .map(target => ({ name: fundIdentifier(target), balanceCents: 0, status: 'new' }));
      const accounts = [...currentAccounts, ...newAccounts];

      it('has no blank or duplicate fund identifiers', () => {
        expect(accounts.every(a => a.name !== '')).toBe(true);
        expect(findDuplicateIdentifiers(demo.state.accounts)).toEqual([]);
      });

      it('targets reference existing funds and validate', () => {
        const names = new Set(accounts.map(a => a.name));
        for (const t of demo.state.targets) {
          expect(names.has(t.name)).toBe(true);
        }
        const validation = validateTargets(accounts, demo.state.targets);
        expect(validation.valid).toBe(true);
      });

      it('produces a feasible plan that conserves money', () => {
        const validation = validateTargets(accounts, demo.state.targets);
        const plan = computeTradePlan(accounts, validation.targetMap, demo.state.constraints);
        expect(plan.feasible).toBe(true);
        expect(plan.transfers.length).toBeGreaterThan(0);
        const start = plan.results.reduce((s, r) => s + r.startCents, 0);
        const end = plan.results.reduce((s, r) => s + r.endCents, 0);
        expect(end).toBe(start);
      });

      it('showcases a reduced-trade option and an exact-target option', () => {
        const validation = validateTargets(accounts, demo.state.targets);
        const reducedPlan = computeTradePlan(accounts, validation.targetMap, demo.state.constraints);
        const exactPlan = computeTradePlan(accounts, validation.targetMap);
        expect(exactPlan.minTransfersNeeded).toBeGreaterThan(1);
        expect(reducedPlan.transfers.length).toBeLessThan(exactPlan.transfers.length);
        expect(exactPlan.results.every(r => Math.abs(r.deviationCents) === 0)).toBe(true);
      });
    });
  }
});
