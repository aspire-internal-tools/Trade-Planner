import { describe, it, expect } from 'vitest';
import { parsePastedRows, applyPastedRows } from './paste';

let id = 100;
const makeAccount = (code = '', description = '', balance = '', status = 'keep') => ({
  id: id++,
  code,
  description,
  balance,
  status,
});

describe('parsePastedRows', () => {
  it('returns null for a single plain value (normal paste)', () => {
    expect(parsePastedRows('15234.67', 'balance')).toBeNull();
    expect(parsePastedRows('FND 101', 'code')).toBeNull();
    expect(parsePastedRows('Canadian Equity', 'description')).toBeNull();
  });

  it('parses an Excel column of balances (CRLF lines)', () => {
    const rows = parsePastedRows('$10,000.00\r\n$5,000.00\r\n2500\r\n', 'balance');
    expect(rows).toEqual([
      { balance: '$10,000.00' },
      { balance: '$5,000.00' },
      { balance: '2500' },
    ]);
  });

  it('parses a column of descriptions into the description field', () => {
    const rows = parsePastedRows('Canadian Equity\nGlobal Bond', 'description');
    expect(rows).toEqual([
      { description: 'Canadian Equity' },
      { description: 'Global Bond' },
    ]);
  });

  it('parses two-column code+balance paste into the code field', () => {
    const rows = parsePastedRows('FND 101\t10000\nFND 102\t$5,000.00', 'code');
    expect(rows).toEqual([
      { code: 'FND 101', balance: '10000' },
      { code: 'FND 102', balance: '$5,000.00' },
    ]);
  });

  it('parses two-column code+description paste when the second cell is not money', () => {
    const rows = parsePastedRows('FND 101\tCanadian Equity\nFND 102\tGlobal Bond', 'code');
    expect(rows).toEqual([
      { code: 'FND 101', description: 'Canadian Equity' },
      { code: 'FND 102', description: 'Global Bond' },
    ]);
  });

  it('parses three-column code+description+balance paste', () => {
    const rows = parsePastedRows('FND 101\tCanadian Equity\t10000\nFND 102\tGlobal Bond\t5000', 'code');
    expect(rows).toEqual([
      { code: 'FND 101', description: 'Canadian Equity', balance: '10000' },
      { code: 'FND 102', description: 'Global Bond', balance: '5000' },
    ]);
  });

  it('lands identifier+balance in the description field when pasted there', () => {
    const rows = parsePastedRows('Canadian Equity\t10000', 'description');
    expect(rows).toEqual([{ description: 'Canadian Equity', balance: '10000' }]);
  });

  it('parses a single tabbed row (one Excel row of code+balance)', () => {
    const rows = parsePastedRows('FND 101\t10000', 'code');
    expect(rows).toEqual([{ code: 'FND 101', balance: '10000' }]);
  });

  it('skips blank lines', () => {
    const rows = parsePastedRows('100\n\n200\n', 'balance');
    expect(rows).toEqual([{ balance: '100' }, { balance: '200' }]);
  });
});

describe('applyPastedRows', () => {
  it('fills down from the pasted account and extends the list', () => {
    const accounts = [makeAccount('A', '', '1'), makeAccount('B', '', '2')];
    const rows = [{ balance: '100' }, { balance: '200' }, { balance: '300' }];
    const next = applyPastedRows(accounts, accounts[0].id, rows, makeAccount);
    expect(next).toHaveLength(3);
    expect(next.map(a => a.balance)).toEqual(['100', '200', '300']);
    expect(next[0].code).toBe('A');
  });

  it('does not overwrite the balance of a new account', () => {
    const accounts = [makeAccount('A', '', '1'), makeAccount('C', '', '', 'new')];
    const rows = [{ balance: '100' }, { balance: '200' }];
    const next = applyPastedRows(accounts, accounts[0].id, rows, makeAccount);
    expect(next[1].balance).toBe('');
  });

  it('fills codes, descriptions, and balances together for three-column paste', () => {
    const accounts = [makeAccount(), makeAccount()];
    const rows = [
      { code: 'FND 101', description: 'Canadian Equity', balance: '100' },
      { code: 'FND 102', description: 'Global Bond', balance: '200' },
    ];
    const next = applyPastedRows(accounts, accounts[0].id, rows, makeAccount);
    expect(next[0]).toMatchObject({ code: 'FND 101', description: 'Canadian Equity', balance: '100' });
    expect(next[1]).toMatchObject({ code: 'FND 102', description: 'Global Bond', balance: '200' });
  });

  it('returns the original list when startId is unknown', () => {
    const accounts = [makeAccount('A', '', '1')];
    const next = applyPastedRows(accounts, 9999, [{ balance: '5' }], makeAccount);
    expect(next).toBe(accounts);
  });
});
