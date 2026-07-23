import { describe, expect, it } from 'vitest';
import { syncTargetsToAccounts } from './target-sync';

const accounts = [
  { id: 1, code: 'Fund A', description: 'Canadian Equity', balance: '100', status: 'keep' },
  { id: 2, code: 'Fund B', description: '', balance: '200', status: 'keep' },
];

const targets = [
  { name: 'Fund A', targetType: 'percentage', targetValue: 40 },
  { name: 'Fund B', targetType: 'percentage', targetValue: 60 },
];

describe('syncTargetsToAccounts', () => {
  it('preserves the existing target list when destination identifiers are unchanged', () => {
    expect(syncTargetsToAccounts(accounts, targets)).toBe(targets);
  });

  it('removes a target when its fund is closed', () => {
    const changed = accounts.map(account =>
      account.code === 'Fund A' ? { ...account, status: 'close' } : account
    );

    expect(syncTargetsToAccounts(changed, targets)).toEqual([targets[1]]);
  });

  it('creates a zero target when a fund code changes', () => {
    const changed = accounts.map(account =>
      account.code === 'Fund A' ? { ...account, code: 'Fund C' } : account
    );

    expect(syncTargetsToAccounts(changed, targets)).toEqual([
      { name: 'Fund C', targetType: 'percentage', targetValue: 0 },
      targets[1],
    ]);
  });

  it('adds a zero target for a new destination fund', () => {
    const changed = [
      ...accounts,
      { id: 3, code: 'Fund C', description: '', balance: '', status: 'new' },
    ];

    expect(syncTargetsToAccounts(changed, targets)).toEqual([
      ...targets,
      { name: 'Fund C', targetType: 'percentage', targetValue: 0 },
    ]);
  });

  it('keys a code-less fund by its description', () => {
    const changed = [
      ...accounts,
      { id: 4, code: '', description: 'Money Market', balance: '50', status: 'keep' },
    ];

    expect(syncTargetsToAccounts(changed, targets)).toEqual([
      ...targets,
      { name: 'Money Market', targetType: 'percentage', targetValue: 0 },
    ]);
  });

  it('skips blank fund rows entirely', () => {
    const changed = [...accounts, { id: 5, code: '', description: '', balance: '', status: 'keep' }];
    expect(syncTargetsToAccounts(changed, targets)).toBe(targets);
  });
});
