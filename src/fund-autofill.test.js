import { describe, it, expect } from 'vitest';
import {
  normalizeFundCode,
  lookupFundDescription,
  autofillDescriptionOnCodeChange,
} from './fund-autofill';
import { FUND_DESCRIPTIONS } from './fundCodes';

// Two real codes from the extracted set, used throughout.
const A = 'A028A'; // Diversified Fixed Income Allocation (Seg)
const B = 'T001I'; // LON 2010 Profile 100/100 (LL)
const descA = FUND_DESCRIPTIONS[A];
const descB = FUND_DESCRIPTIONS[B];

describe('normalizeFundCode', () => {
  it('accepts a bare 5-char code', () => {
    expect(normalizeFundCode('A028A')).toBe('A028A');
  });
  it('strips the CLG prefix', () => {
    expect(normalizeFundCode('CLGA028A')).toBe('A028A');
  });
  it('is case- and whitespace-insensitive', () => {
    expect(normalizeFundCode('  clga028a ')).toBe('A028A');
    expect(normalizeFundCode('t001i')).toBe('T001I');
  });
  it('ignores internal whitespace (e.g. "CLG A028A")', () => {
    expect(normalizeFundCode('CLG A028A')).toBe('A028A');
    expect(normalizeFundCode('A028 A')).toBe('A028A');
  });
  it('rejects malformed codes', () => {
    expect(normalizeFundCode('')).toBeNull();
    expect(normalizeFundCode('A028')).toBeNull();     // too short
    expect(normalizeFundCode('A028AB')).toBeNull();   // too long
    expect(normalizeFundCode('AB28A')).toBeNull();    // letters where digits go
    expect(normalizeFundCode('12345')).toBeNull();
    expect(normalizeFundCode(null)).toBeNull();
  });
});

describe('lookupFundDescription', () => {
  it('resolves recognized codes with and without prefix', () => {
    expect(lookupFundDescription('A028A')).toBe(descA);
    expect(lookupFundDescription('clgA028A')).toBe(descA);
    expect(lookupFundDescription('T001I')).toBe(descB);
  });
  it('returns null for a well-formed but unknown code', () => {
    expect(lookupFundDescription('Z999Z')).toBeNull();
  });
  it('returns null for junk', () => {
    expect(lookupFundDescription('hello')).toBeNull();
    expect(lookupFundDescription('')).toBeNull();
  });
});

describe('autofillDescriptionOnCodeChange', () => {
  it('fills when a recognized code first appears', () => {
    expect(autofillDescriptionOnCodeChange('', 'A028A')).toBe(descA);
    expect(autofillDescriptionOnCodeChange('A02', 'A028A')).toBe(descA);
  });

  it('fills for the prefixed form too', () => {
    expect(autofillDescriptionOnCodeChange('', 'CLGA028A')).toBe(descA);
  });

  it('updates when the code changes to a different recognized code', () => {
    expect(autofillDescriptionOnCodeChange('A028A', 'T001I')).toBe(descB);
  });

  it('does not fire when the code resolves to the same fund (prefix toggle)', () => {
    expect(autofillDescriptionOnCodeChange('A028A', 'CLGA028A')).toBeNull();
    expect(autofillDescriptionOnCodeChange('a028a', 'A028A')).toBeNull();
  });

  it('leaves the description alone while the code is incomplete', () => {
    expect(autofillDescriptionOnCodeChange('', 'A02')).toBeNull();
    expect(autofillDescriptionOnCodeChange('A028A', 'A028')).toBeNull(); // deleting a char
  });

  it('leaves the description alone for an unrecognized full code', () => {
    expect(autofillDescriptionOnCodeChange('', 'Z999Z')).toBeNull();
  });

  it('does not clear the description when the code is cleared', () => {
    // Deleting the code returns null (no change), so the caller keeps the text.
    expect(autofillDescriptionOnCodeChange('A028A', '')).toBeNull();
  });

  it('every code in the map round-trips through an autofill', () => {
    for (const code of Object.keys(FUND_DESCRIPTIONS)) {
      expect(autofillDescriptionOnCodeChange('', code)).toBe(FUND_DESCRIPTIONS[code]);
    }
  });
});
