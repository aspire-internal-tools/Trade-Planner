import { describe, expect, it } from 'vitest';
import { syncTargetsToAccounts } from './target-sync';

const accounts = [
  { id: 1, code: 'Fund A', description: 'Canadian Equity', balance: '100' },
  { id: 2, code: 'Fund B', description: '', balance: '200' },
];

const targets = [
  {
    id: 'current-1',
    source: 'current',
    sourceAccountId: 1,
    name: 'Fund A',
    code: 'Fund A',
    description: 'Canadian Equity',
    targetType: 'percentage',
    targetValue: 40,
    status: 'target',
  },
  {
    id: 'current-2',
    source: 'current',
    sourceAccountId: 2,
    name: 'Fund B',
    code: 'Fund B',
    description: '',
    targetType: 'percentage',
    targetValue: 60,
    status: 'target',
  },
];

describe('syncTargetsToAccounts', () => {
  it('preserves the existing target list when destination identifiers are unchanged', () => {
    expect(syncTargetsToAccounts(accounts, targets)).toBe(targets);
  });

  it('keeps closing decisions in Target Funds, not Current State', () => {
    const closingTargets = [{ ...targets[0], status: 'close', targetValue: 0 }, targets[1]];
    expect(syncTargetsToAccounts(accounts, closingTargets)).toBe(closingTargets);
  });

  it('creates a zero target when a fund code changes', () => {
    const changed = accounts.map(account =>
      account.code === 'Fund A' ? { ...account, code: 'Fund C' } : account
    );

    expect(syncTargetsToAccounts(changed, targets)).toEqual([
      { ...targets[0], name: 'Fund C', code: 'Fund C' },
      targets[1],
    ]);
  });

  it('preserves a target-only new fund', () => {
    const newTarget = {
      id: 'new-1',
      source: 'new',
      name: 'Fund C',
      code: 'Fund C',
      description: '',
      targetType: 'percentage',
      targetValue: 20,
      status: 'target',
    };
    expect(syncTargetsToAccounts(accounts, [...targets, newTarget])).toEqual([
      ...targets,
      newTarget,
    ]);
  });

  it('keys a code-less fund by its description', () => {
    const changed = [
      ...accounts,
      { id: 4, code: '', description: 'Money Market', balance: '50' },
    ];

    expect(syncTargetsToAccounts(changed, targets)).toEqual([
      ...targets,
      {
        id: 'current-4',
        source: 'current',
        sourceAccountId: 4,
        name: 'Money Market',
        code: '',
        description: 'Money Market',
        targetType: 'percentage',
        targetValue: 0,
        status: 'target',
      },
    ]);
  });

  it('skips blank fund rows entirely', () => {
    const changed = [...accounts, { id: 5, code: '', description: '', balance: '' }];
    expect(syncTargetsToAccounts(changed, targets)).toBe(targets);
  });
});
