// Paste-a-column support for Step 1.
// Advisors copy columns straight out of Excel; Excel puts one row per line,
// columns separated by tabs. Supported shapes:
//   1 column  - fills down whichever field was pasted into
//   2 columns - identifier + balance when the second cell looks like money,
//               otherwise code + description
//   3 columns - code, description, balance

const MONEY_RE = /^-?\$?\s?[\d,]+(\.\d+)?$/;

function looksLikeMoney(cell) {
  return MONEY_RE.test(cell.trim());
}

// Returns null when the pasted text is a single plain value (let the browser
// handle it normally). Otherwise returns an array of
// { code?, description?, balance? } rows.
export function parsePastedRows(text, field) {
  const lines = String(text)
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);
  if (lines.length === 0) return null;
  const hasTabs = lines.some(l => l.includes('\t'));
  if (lines.length === 1 && !hasTabs) return null;

  return lines.map(line => {
    const cells = line.split('\t').map(c => c.trim());

    if (cells.length >= 3) {
      return { code: cells[0], description: cells[1], balance: cells[2] };
    }

    if (cells.length === 2) {
      if (looksLikeMoney(cells[1])) {
        // identifier + balance: land the identifier in the pasted field
        return field === 'description'
          ? { description: cells[0], balance: cells[1] }
          : { code: cells[0], balance: cells[1] };
      }
      return { code: cells[0], description: cells[1] };
    }

    // single column: fill down the field the paste landed in
    if (field === 'balance') return { balance: cells[0] };
    if (field === 'description') return { description: cells[0] };
    return { code: cells[0] };
  });
}

// Applies parsed rows to the fund list starting at the row with startId,
// extending the list with makeAccount() if the paste is longer.
// Returns a new accounts array.
export function applyPastedRows(accounts, startId, rows, makeAccount) {
  const next = accounts.map(a => ({ ...a }));
  let idx = next.findIndex(a => a.id === startId);
  if (idx === -1) return accounts;
  for (const row of rows) {
    if (idx >= next.length) next.push(makeAccount());
    if (row.code !== undefined) next[idx].code = row.code;
    if (row.description !== undefined) next[idx].description = row.description;
    if (row.balance !== undefined && next[idx].status !== 'new') {
      next[idx].balance = row.balance;
    }
    idx += 1;
  }
  return next;
}
