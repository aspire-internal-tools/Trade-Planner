// Fund-code autofill.
//
// When a recognized fund code is present in a code field, the fund description
// is filled in automatically. Recognition matches the codes extracted from the
// insurer documents (see src/fundCodes.js), with or without the "CLG" prefix,
// case-insensitively. The description stays a normal, editable field: it is only
// overwritten when a code edit produces a DIFFERENT recognized code.

import { FUND_DESCRIPTIONS } from './fundCodes';

const CODE_RE = /^[A-Z]\d{3}[A-Z]$/;

/**
 * Reduce a raw code entry to its canonical 5-character form, or null if it is
 * not a well-formed fund code. Accepts optional "CLG" prefix and any casing or
 * surrounding whitespace. Does NOT check whether the code is recognized.
 */
export function normalizeFundCode(raw) {
  const s = String(raw ?? '').replace(/\s+/g, '').toUpperCase();
  const stripped = s.startsWith('CLG') ? s.slice(3) : s;
  return CODE_RE.test(stripped) ? stripped : null;
}

/** The description for a raw code entry, or null when the code is not recognized. */
export function lookupFundDescription(raw) {
  const code = normalizeFundCode(raw);
  if (code && Object.prototype.hasOwnProperty.call(FUND_DESCRIPTIONS, code)) {
    return FUND_DESCRIPTIONS[code];
  }
  return null;
}

/**
 * Decide the description after a code field changes from oldCode to newCode.
 * Returns the description string to apply, or null meaning "leave the
 * description as it is". A description is applied only when the new code is
 * recognized and resolves to a different code than the old value did, so
 * manual description edits are never clobbered by unrelated code edits.
 */
export function autofillDescriptionOnCodeChange(oldCode, newCode) {
  const oldNorm = normalizeFundCode(oldCode);
  const newNorm = normalizeFundCode(newCode);
  if (
    newNorm &&
    newNorm !== oldNorm &&
    Object.prototype.hasOwnProperty.call(FUND_DESCRIPTIONS, newNorm)
  ) {
    return FUND_DESCRIPTIONS[newNorm];
  }
  return null;
}
