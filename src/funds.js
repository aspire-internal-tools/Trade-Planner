// Fund identity helpers.
//
// The insurer forms carry both a fund code and a fund name (description).
// The tool captures both, but only one is required to identify a fund:
// the code when present, otherwise the description. The engine and the
// target list key everything off this identifier, so it must be unique
// across the entered funds (duplicates are warned about in Step 1).

/** The string that identifies a fund inside the tool: code first, description as fallback. */
export function fundIdentifier(fund) {
  const code = (fund.code || '').trim();
  if (code) return code;
  return (fund.description || '').trim();
}

/** True when the fund has neither a code nor a description. */
export function fundIsBlank(fund) {
  return fundIdentifier(fund) === '';
}

/**
 * Display label combining code and description when both exist,
 * e.g. "MFC 3202 (Canadian Bond Fund)". Falls back to whichever exists.
 */
export function fundLabel(fund) {
  const code = (fund.code || '').trim();
  const description = (fund.description || '').trim();
  if (code && description) return `${code} (${description})`;
  return code || description;
}

/**
 * Build a lookup from identifier to { code, description, label } so output
 * builders (clipboard, print, PDF) can show both fields for a plan row that
 * only carries the identifier.
 */
export function buildFundLookup(funds) {
  const map = new Map();
  for (const fund of funds) {
    const id = fundIdentifier(fund);
    if (id && !map.has(id)) {
      map.set(id, {
        code: (fund.code || '').trim(),
        description: (fund.description || '').trim(),
        label: fundLabel(fund),
      });
    }
  }
  return map;
}

/** Identifiers that appear on more than one non-blank fund row. */
export function findDuplicateIdentifiers(funds) {
  const seen = new Map();
  for (const fund of funds) {
    const id = fundIdentifier(fund);
    if (!id) continue;
    seen.set(id, (seen.get(id) || 0) + 1);
  }
  return Array.from(seen.entries())
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
}
