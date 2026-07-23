// Clipboard formatting for the trade plan.
// Word and Outlook read the text/html clipboard flavor and render real tables;
// plain-text editors fall back to text/plain.
//
// Percentage conventions (matching how processors enter trades):
// - a From amount is also shown as a percent of that fund's starting balance
//   (a switch form accepts "66.67%" of a fund);
// - a To amount is also shown as a percent of the money being moved
//   (destination allocations total 100%);
// - the Results Summary percents are shares of the total account balance.

import { formatMoney, formatPercent, formatPercentValue } from './engine.js';

const BRAND_GREEN = '#157566';
const CELL = 'border:1px solid #b9c4c2;padding:4px 10px;font-size:11pt;';
const HEAD = `${CELL}background:${BRAND_GREEN};color:#ffffff;font-weight:bold;text-align:left;`;
const NUM = `${CELL}text-align:right;font-variant-numeric:tabular-nums;`;

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function lookupFund(lookup, name) {
  return (lookup && lookup.get(name)) || { code: name, description: '', label: name };
}

function startCentsMap(plan) {
  const map = new Map();
  plan.results.forEach(r => map.set(r.name, r.startCents));
  return map;
}

// ─── Plain text ────────────────────────────────────────────

export function buildPlanText(plan, { mode = 'single', order = null, lookup = null } = {}) {
  const lines = [];
  const starts = startCentsMap(plan);
  const label = name => lookupFund(lookup, name).label;

  lines.push('TRADE PLAN');
  lines.push('='.repeat(50));
  lines.push('');

  if (mode === 'multi' && order) {
    lines.push('One consolidated order (multi-from internal transfer)');
    lines.push('');
    lines.push('FROM (money out):');
    order.fromRows.forEach(r => {
      const pct = formatPercent(r.amountCents, starts.get(r.name) || 0);
      lines.push(
        `  - ${label(r.name)}${r.status === 'close' ? ' (closing fund)' : ''}: ` +
          `${formatMoney(r.amountCents)} (${pct} of its starting balance)`
      );
    });
    lines.push('TO (money in):');
    order.toRows.forEach(r => {
      const pct = formatPercent(r.amountCents, order.totalCents);
      lines.push(`  - ${label(r.name)}: ${formatMoney(r.amountCents)} (${pct} of the order)`);
    });
    lines.push(`Total moved: ${formatMoney(order.totalCents)}`);
    lines.push('');
  } else {
    plan.transfers.forEach((t, i) => {
      const totalOut = t.distributions.reduce((s, d) => s + d.amountCents, 0);
      lines.push(`Trade ${i + 1} of ${plan.transfers.length}`);
      lines.push(`FROM: ${label(t.from)}${t.fromStatus === 'close' ? ' (closing fund)' : ''}`);
      t.distributions.forEach(d => {
        const pct = formatPercent(d.amountCents, starts.get(t.from) || 0);
        lines.push(
          `  - Send ${formatMoney(d.amountCents)} (${pct} of ${label(t.from)}) to ${label(d.to)}`
        );
      });
      const outPct = formatPercent(totalOut, starts.get(t.from) || 0);
      lines.push(`Total moved: ${formatMoney(totalOut)} (${outPct} of its starting balance)`);
      lines.push('');
    });
  }

  // Extra blank line so the summary sits apart from the trade list when
  // pasted into Word.
  lines.push('');
  lines.push('RESULTS SUMMARY');
  const width = 130;
  lines.push('-'.repeat(width));
  lines.push(
    'Fund'.padEnd(28) +
      'Starting Balance'.padStart(26) +
      'Target Balance'.padStart(26) +
      'Ending Balance'.padStart(26) +
      'Final %'.padStart(10) +
      'Dev'.padStart(9)
  );
  lines.push('-'.repeat(width));

  plan.results.forEach(r => {
    const start = `${formatMoney(r.startCents)} (${formatPercentValue(r.startPercent)})`;
    const target = `${formatMoney(r.targetCents)} (${formatPercentValue(r.targetPercent)})`;
    const end = `${formatMoney(r.endCents)} (${formatPercentValue(r.endPercent)})`;
    lines.push(
      label(r.name).padEnd(28) +
        start.padStart(26) +
        target.padStart(26) +
        end.padStart(26) +
        formatPercentValue(r.endPercent).padStart(10) +
        formatPercentValue(r.deviationPercent, { signed: true }).padStart(9)
    );
  });

  return lines.join('\n');
}

// ─── HTML ──────────────────────────────────────────────────

export function buildPlanHtml(plan, { mode = 'single', order = null, lookup = null } = {}) {
  const parts = [];
  const starts = startCentsMap(plan);
  const fund = name => lookupFund(lookup, name);

  parts.push(
    `<p style="font-family:Calibri,Arial,sans-serif;font-size:12pt;font-weight:bold;color:${BRAND_GREEN};">Trade Plan</p>`
  );

  if (mode === 'multi' && order) {
    parts.push(
      '<p style="font-family:Calibri,Arial,sans-serif;font-size:11pt;">One consolidated order (multi-from internal transfer)</p>'
    );
    const fromRows = order.fromRows
      .map(r => {
        const f = fund(r.name);
        const pct = formatPercent(r.amountCents, starts.get(r.name) || 0);
        return (
          '<tr>' +
          `<td style="${CELL}">From</td>` +
          `<td style="${CELL}">${esc(f.code)}</td>` +
          `<td style="${CELL}">${esc(f.description)}${r.status === 'close' ? ' (closing fund)' : ''}</td>` +
          `<td style="${NUM}">${formatMoney(r.amountCents)}</td>` +
          `<td style="${NUM}">${pct} of fund</td>` +
          '</tr>'
        );
      })
      .join('');
    const toRows = order.toRows
      .map(r => {
        const f = fund(r.name);
        const pct = formatPercent(r.amountCents, order.totalCents);
        return (
          '<tr>' +
          `<td style="${CELL}">To</td>` +
          `<td style="${CELL}">${esc(f.code)}</td>` +
          `<td style="${CELL}">${esc(f.description)}</td>` +
          `<td style="${NUM}">${formatMoney(r.amountCents)}</td>` +
          `<td style="${NUM}">${pct} of order</td>` +
          '</tr>'
        );
      })
      .join('');
    parts.push(
      '<table style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;" cellspacing="0">' +
        '<tr>' +
        `<th style="${HEAD}">Side</th><th style="${HEAD}">Fund Code</th><th style="${HEAD}">Fund Description</th><th style="${HEAD}">Amount</th><th style="${HEAD}">Percent</th>` +
        '</tr>' +
        fromRows +
        toRows +
        '<tr>' +
        `<td style="${CELL}font-weight:bold;" colspan="3">Total moved</td>` +
        `<td style="${NUM}font-weight:bold;">${formatMoney(order.totalCents)}</td>` +
        `<td style="${CELL}"></td>` +
        '</tr>' +
        '</table>'
    );
  } else if (plan.transfers.length > 0) {
    const rows = [];
    plan.transfers.forEach((t, i) => {
      t.distributions.forEach((d, j) => {
        const to = fund(d.to);
        const pct = formatPercent(d.amountCents, starts.get(t.from) || 0);
        rows.push(
          '<tr>' +
            (j === 0
              ? `<td style="${CELL}" rowspan="${t.distributions.length}">${i + 1}</td>` +
                `<td style="${CELL}" rowspan="${t.distributions.length}">${esc(fund(t.from).label)}${
                  t.fromStatus === 'close' ? ' (closing fund)' : ''
                }</td>`
              : '') +
            `<td style="${CELL}">${esc(to.label)}</td>` +
            `<td style="${NUM}">${formatMoney(d.amountCents)}</td>` +
            `<td style="${NUM}">${pct} of fund</td>` +
            '</tr>'
        );
      });
    });
    parts.push(
      '<table style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;" cellspacing="0">' +
        '<tr>' +
        `<th style="${HEAD}">#</th><th style="${HEAD}">From</th><th style="${HEAD}">To</th><th style="${HEAD}">Amount</th><th style="${HEAD}">Percent</th>` +
        '</tr>' +
        rows.join('') +
        '</table>'
    );
  }

  // Spacer paragraph so the summary sits apart from the trade table in Word.
  parts.push('<p style="font-family:Calibri,Arial,sans-serif;font-size:11pt;">&nbsp;</p>');
  parts.push(
    '<p style="font-family:Calibri,Arial,sans-serif;font-size:12pt;font-weight:bold;color:' +
      BRAND_GREEN +
      ';">Results Summary</p>'
  );
  const resultRows = plan.results
    .map(r => {
      const f = fund(r.name);
      return (
        '<tr>' +
        `<td style="${CELL}">${esc(f.code)}</td>` +
        `<td style="${CELL}">${esc(f.description)}</td>` +
        `<td style="${NUM}">${formatMoney(r.startCents)}</td>` +
        `<td style="${NUM}">${formatPercentValue(r.startPercent)}</td>` +
        `<td style="${NUM}">${formatMoney(r.targetCents)}</td>` +
        `<td style="${NUM}">${formatPercentValue(r.targetPercent)}</td>` +
        `<td style="${NUM}">${formatMoney(r.endCents)}</td>` +
        `<td style="${NUM}">${formatPercentValue(r.endPercent)}</td>` +
        `<td style="${NUM}">${formatPercentValue(r.deviationPercent, { signed: true })}</td>` +
        '</tr>'
      );
    })
    .join('');
  const totals = {
    start: plan.results.reduce((s, r) => s + r.startCents, 0),
    target: plan.results.reduce((s, r) => s + r.targetCents, 0),
    end: plan.results.reduce((s, r) => s + r.endCents, 0),
  };
  parts.push(
    '<table style="border-collapse:collapse;font-family:Calibri,Arial,sans-serif;" cellspacing="0">' +
      '<tr>' +
      `<th style="${HEAD}">Fund Code</th><th style="${HEAD}">Fund Description</th>` +
      `<th style="${HEAD}">Starting Balance</th><th style="${HEAD}">Start %</th>` +
      `<th style="${HEAD}">Target Balance</th><th style="${HEAD}">Target %</th>` +
      `<th style="${HEAD}">Ending Balance</th><th style="${HEAD}">Final %</th><th style="${HEAD}">Dev</th>` +
      '</tr>' +
      resultRows +
      '<tr>' +
      `<td style="${CELL}font-weight:bold;" colspan="2">Total</td>` +
      `<td style="${NUM}font-weight:bold;">${formatMoney(totals.start)}</td>` +
      `<td style="${CELL}"></td>` +
      `<td style="${NUM}font-weight:bold;">${formatMoney(totals.target)}</td>` +
      `<td style="${CELL}"></td>` +
      `<td style="${NUM}font-weight:bold;">${formatMoney(totals.end)}</td>` +
      `<td style="${CELL}"></td><td style="${CELL}"></td>` +
      '</tr>' +
      '</table>'
  );

  return parts.join('\n');
}

// Writes both flavors. Returns a promise resolving true on success.
export async function copyPlanToClipboard(plan, options = {}) {
  const text = buildPlanText(plan, options);
  const html = buildPlanHtml(plan, options);
  if (navigator.clipboard && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' }),
        }),
      ]);
      return true;
    } catch {
      // fall through to plain text
    }
  }
  await navigator.clipboard.writeText(text);
  return true;
}
