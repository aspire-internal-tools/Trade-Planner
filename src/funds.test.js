import { describe, it, expect } from 'vitest';
import {
  fundIdentifier,
  fundIsBlank,
  fundLabel,
  buildFundLookup,
  findDuplicateIdentifiers,
} from './funds';

describe('fundIdentifier', () => {
  it('prefers the code', () => {
    expect(fundIdentifier({ code: 'FND 101', description: 'Canadian Equity' })).toBe('FND 101');
  });

  it('falls back to the description when there is no code', () => {
    expect(fundIdentifier({ code: '', description: 'Canadian Equity' })).toBe('Canadian Equity');
    expect(fundIdentifier({ code: '  ', description: 'Canadian Equity' })).toBe('Canadian Equity');
  });

  it('is empty when both are empty', () => {
    expect(fundIdentifier({ code: '', description: '' })).toBe('');
    expect(fundIsBlank({ code: ' ', description: '' })).toBe(true);
    expect(fundIsBlank({ code: 'X', description: '' })).toBe(false);
  });
});

describe('fundLabel', () => {
  it('combines code and description', () => {
    expect(fundLabel({ code: 'FND 101', description: 'Canadian Equity' })).toBe(
      'FND 101 (Canadian Equity)'
    );
  });

  it('uses whichever exists alone', () => {
    expect(fundLabel({ code: 'FND 101', description: '' })).toBe('FND 101');
    expect(fundLabel({ code: '', description: 'Canadian Equity' })).toBe('Canadian Equity');
  });
});

describe('buildFundLookup', () => {
  it('maps identifiers to code, description, and label', () => {
    const lookup = buildFundLookup([
      { code: 'FND 101', description: 'Canadian Equity' },
      { code: '', description: 'Money Market' },
    ]);
    expect(lookup.get('FND 101')).toEqual({
      code: 'FND 101',
      description: 'Canadian Equity',
      label: 'FND 101 (Canadian Equity)',
    });
    expect(lookup.get('Money Market')).toEqual({
      code: '',
      description: 'Money Market',
      label: 'Money Market',
    });
  });

  it('skips blank rows', () => {
    const lookup = buildFundLookup([{ code: '', description: '' }]);
    expect(lookup.size).toBe(0);
  });
});

describe('findDuplicateIdentifiers', () => {
  it('reports identifiers used by more than one fund', () => {
    const dups = findDuplicateIdentifiers([
      { code: 'FND 101', description: 'A' },
      { code: 'FND 101', description: 'B' },
      { code: 'FND 102', description: 'C' },
    ]);
    expect(dups).toEqual(['FND 101']);
  });

  it('counts a code colliding with another fund description', () => {
    const dups = findDuplicateIdentifiers([
      { code: 'Canadian Equity', description: '' },
      { code: '', description: 'Canadian Equity' },
    ]);
    expect(dups).toEqual(['Canadian Equity']);
  });

  it('ignores blank rows', () => {
    expect(findDuplicateIdentifiers([{ code: '', description: '' }, { code: '', description: '' }])).toEqual([]);
  });
});
