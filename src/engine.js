/**
 * Trade Planner Engine
 * All monetary math is done in integer cents to avoid floating-point errors.
 */

/** Convert dollars (number or string) to integer cents */
export function toCents(dollars) {
  if (typeof dollars === 'string') dollars = parseFloat(dollars);
  if (isNaN(dollars)) return 0;
  return Math.round(dollars * 100);
}

/** Convert integer cents to dollar string */
export function toDollars(cents) {
  return (cents / 100).toFixed(2);
}

/** Format a percentage to at most two decimals, without trailing zeros. */
export function formatPercentValue(value, { signed = false } = {}) {
  const rounded = Math.abs(value) < 0.005 ? 0 : value;
  const number = rounded.toFixed(2).replace(/\.?0+$/, '');
  return `${signed && rounded > 0 ? '+' : ''}${number}%`;
}

/**
 * Format a share of a whole as a percentage string with at most two decimals.
 * Advisors and processors plan in percentages, so this appears beside dollar
 * amounts throughout the plan.
 */
export function formatPercent(partCents, wholeCents) {
  if (!wholeCents) return '0%';
  return formatPercentValue((partCents / wholeCents) * 100);
}

/** Format cents as display currency */
export function formatMoney(cents) {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  const formatted = '$' + dollars.toLocaleString('en-US') + '.' + String(remainder).padStart(2, '0');
  return negative ? '-' + formatted : formatted;
}

/**
 * Distribute cents among n buckets as evenly as possible.
 * Returns array of n integers that sum to totalCents.
 */
export function distributeCents(totalCents, n) {
  if (n <= 0) return [];
  const base = Math.floor(totalCents / n);
  const remainder = totalCents - base * n;
  const result = [];
  for (let i = 0; i < n; i++) {
    result.push(base + (i < remainder ? 1 : 0));
  }
  return result;
}

/**
 * Compute target balances in cents for each destination account.
 *
 * accounts: array of { name, balanceCents, status }
 * targets: array of { name, targetType: 'percentage'|'dollar', targetValue: number }
 *   - for percentage: targetValue is 0-100
 *   - for dollar: targetValue is dollar amount
 * totalPoolCents: total money in the system
 *
 * Returns: Map<name, targetCents>
 */
export function computeTargetsCents(accounts, targets, totalPoolCents) {
  const result = new Map();

  // First pass: compute fixed dollar amounts
  let fixedCents = 0;
  let percentageTotal = 0;
  const percentageTargets = [];

  for (const t of targets) {
    if (t.targetType === 'dollar') {
      const cents = toCents(t.targetValue);
      result.set(t.name, cents);
      fixedCents += cents;
    } else {
      percentageTargets.push(t);
      percentageTotal += t.targetValue;
    }
  }

  // Second pass: compute percentage-based targets from remaining pool
  const remainingCents = totalPoolCents - fixedCents;

  if (percentageTargets.length > 0 && percentageTotal > 0) {
    // Distribute remaining cents proportionally, handling rounding
    let allocated = 0;
    for (let i = 0; i < percentageTargets.length; i++) {
      const t = percentageTargets[i];
      let cents;
      if (i === percentageTargets.length - 1) {
        // Last one gets the remainder to ensure exact sum
        cents = remainingCents - allocated;
      } else {
        cents = Math.round(remainingCents * (t.targetValue / percentageTotal));
      }
      result.set(t.name, cents);
      allocated += cents;
    }
  }

  return result;
}

/**
 * Compute the trade plan.
 *
 * accounts: [{ name, balanceCents, status: 'keep'|'close'|'new' }]
 * targetMap: Map<name, targetCents> (from computeTargetsCents)
 * options: { maxTransfers? }
 *
 * Returns: {
 *   transfers: [{ from, distributions: [{ to, amountCents }] }],
 *   results: [{ name, startCents, targetCents, endCents, deviationCents }],
 *   feasible: boolean,
 *   message: string|null,
 *   minTransfersNeeded: number
 * }
 */
export function computeTradePlan(accounts, targetMap, options = {}) {
  const { maxTransfers } = options;

  // Build delta list
  const deltas = []; // { name, deltaCents, status }
  for (const acct of accounts) {
    const target = targetMap.get(acct.name);
    if (acct.status === 'close') {
      deltas.push({ name: acct.name, deltaCents: acct.balanceCents, status: 'close' });
    } else if (acct.status === 'new') {
      deltas.push({ name: acct.name, deltaCents: -(target || 0), status: 'new' });
    } else {
      // keep
      const delta = acct.balanceCents - (target || acct.balanceCents);
      deltas.push({ name: acct.name, deltaCents: delta, status: 'keep' });
    }
  }

  // Separate into surplus and deficit
  const surplusList = deltas
    .filter(d => d.deltaCents > 0)
    .sort((a, b) => {
      // Closing accounts first (mandatory), then by size descending
      if (a.status === 'close' && b.status !== 'close') return -1;
      if (a.status !== 'close' && b.status === 'close') return 1;
      return b.deltaCents - a.deltaCents;
    });

  const deficitList = deltas
    .filter(d => d.deltaCents < 0)
    .map(d => ({ ...d, deltaCents: -d.deltaCents })) // make positive for easier math
    .sort((a, b) => b.deltaCents - a.deltaCents);

  // Count mandatory transfers (closing accounts)
  const mandatoryTransfers = surplusList.filter(s => s.status === 'close').length;

  const minTransfersNeeded = surplusList.length;

  // Check feasibility
  if (maxTransfers !== undefined && maxTransfers !== null && maxTransfers < mandatoryTransfers) {
    return {
      transfers: [],
      results: buildResults(accounts, targetMap, []),
      feasible: false,
      message: `${mandatoryTransfers} fund(s) must close, requiring a minimum of ${mandatoryTransfers} trade(s). Your limit of ${maxTransfers} trade(s) cannot be met.`,
      suggestion: `Relaxing to ${mandatoryTransfers} trades would allow all closing funds to be emptied.`,
      minTransfersNeeded: mandatoryTransfers,
    };
  }

  // If max transfers is set and less than surplus count, only use the top N
  let activeSurplus = surplusList;
  if (maxTransfers !== undefined && maxTransfers !== null && maxTransfers < surplusList.length) {
    // Keep all mandatory (close) accounts, then fill remaining slots with largest surplus
    const mandatory = surplusList.filter(s => s.status === 'close');
    const optional = surplusList.filter(s => s.status !== 'close');
    const remainingSlots = maxTransfers - mandatory.length;
    activeSurplus = [...mandatory, ...optional.slice(0, Math.max(0, remainingSlots))];
  }

  // Greedy assignment
  const transfers = [];
  const remainingDeficits = deficitList.map(d => ({ ...d, remaining: d.deltaCents }));

  for (const surplus of activeSurplus) {
    let remaining = surplus.deltaCents;
    const distributions = [];

    // Sort remaining deficits by size descending for rounder transfers
    remainingDeficits.sort((a, b) => b.remaining - a.remaining);

    for (const deficit of remainingDeficits) {
      if (remaining <= 0) break;
      if (deficit.remaining <= 0) continue;

      const amount = Math.min(remaining, deficit.remaining);
      distributions.push({ to: deficit.name, amountCents: amount });
      deficit.remaining -= amount;
      remaining -= amount;
    }

    if (distributions.length > 0) {
      transfers.push({
        from: surplus.name,
        fromStatus: surplus.status,
        distributions,
      });
    }
  }

  const results = buildResults(accounts, targetMap, transfers);

  // Explain the trade-off when fewer source funds are used.
  let achievedMessage = null;
  if (maxTransfers !== undefined && maxTransfers !== null && maxTransfers < minTransfersNeeded) {
    const maxDev = results.reduce((max, r) => {
      if (r.status === 'close') return max;
      return Math.max(max, Math.abs(r.deviationPercent));
    }, 0);
    achievedMessage = `Using ${maxTransfers} trade${maxTransfers === 1 ? '' : 's'} leaves a largest imbalance of ${formatPercentValue(maxDev)}. Use ${minTransfersNeeded} trades to reach the exact targets.`;
  }

  return {
    transfers,
    results,
    feasible: true,
    message: achievedMessage,
    minTransfersNeeded,
  };
}

function buildResults(accounts, targetMap, transfers) {
  // Calculate ending balances
  const endingBalances = new Map();
  for (const acct of accounts) {
    endingBalances.set(acct.name, acct.balanceCents);
  }

  for (const transfer of transfers) {
    const totalOut = transfer.distributions.reduce((s, d) => s + d.amountCents, 0);
    endingBalances.set(transfer.from, endingBalances.get(transfer.from) - totalOut);
    for (const dist of transfer.distributions) {
      endingBalances.set(dist.to, (endingBalances.get(dist.to) || 0) + dist.amountCents);
    }
  }

  const totalPool = accounts.reduce((sum, a) => sum + a.balanceCents, 0);

  return accounts.map(acct => {
    const target = targetMap.get(acct.name);
    const endCents = endingBalances.get(acct.name) || 0;
    const targetCents = acct.status === 'close' ? 0 : (target || acct.balanceCents);
    const deviationCents = endCents - targetCents;
    const targetPercent = totalPool > 0 ? (targetCents / totalPool) * 100 : 0;
    const endPercent = totalPool > 0 ? (endCents / totalPool) * 100 : 0;
    const startPercent = totalPool > 0 ? (acct.balanceCents / totalPool) * 100 : 0;

    return {
      name: acct.name,
      status: acct.status,
      startCents: acct.balanceCents,
      startPercent,
      targetCents,
      targetPercent,
      endCents,
      endPercent,
      deviationCents,
      deviationPercent: endPercent - targetPercent,
    };
  });
}

/**
 * Aggregate a computed plan into one consolidated two-sided order:
 * a From table (each source fund with its total amount out) and a
 * To table (each destination fund with its total amount in).
 *
 * This is the multi-from trade structure used by mutual fund internal
 * transfer conversions, where a single order pulls from several From
 * funds at once. Both insurer forms are two-sided (From rows and To
 * rows), so this shape also drives the PDF output.
 *
 * Returns { fromRows: [{ name, status, amountCents }], toRows: [{ name, amountCents }], totalCents }
 */
export function buildOrder(plan) {
  const fromTotals = new Map();
  const toTotals = new Map();

  for (const transfer of plan.transfers) {
    const out = transfer.distributions.reduce((s, d) => s + d.amountCents, 0);
    const existing = fromTotals.get(transfer.from);
    if (existing) {
      existing.amountCents += out;
    } else {
      fromTotals.set(transfer.from, {
        name: transfer.from,
        status: transfer.fromStatus,
        amountCents: out,
      });
    }
    for (const dist of transfer.distributions) {
      toTotals.set(dist.to, (toTotals.get(dist.to) || 0) + dist.amountCents);
    }
  }

  const fromRows = Array.from(fromTotals.values());
  const toRows = Array.from(toTotals.entries()).map(([name, amountCents]) => ({
    name,
    amountCents,
  }));
  const totalCents = fromRows.reduce((s, r) => s + r.amountCents, 0);

  return { fromRows, toRows, totalCents };
}

/**
 * Validate that targets sum correctly.
 * Returns { valid, message, totalTargetCents, totalPoolCents, gapCents }
 */
export function validateTargets(accounts, targets) {
  const totalPoolCents = accounts.reduce((sum, a) => sum + a.balanceCents, 0);

  // Check if there are any percentage targets
  const percentTargets = targets.filter(t => t.targetType === 'percentage');
  const dollarTargets = targets.filter(t => t.targetType === 'dollar');

  const fixedCents = dollarTargets.reduce((sum, t) => sum + toCents(t.targetValue), 0);
  const percentSum = percentTargets.reduce((sum, t) => sum + t.targetValue, 0);

  // Compute total target cents
  const targetMap = computeTargetsCents(accounts, targets, totalPoolCents);
  const totalTargetCents = Array.from(targetMap.values()).reduce((s, v) => s + v, 0);
  const gapCents = totalPoolCents - totalTargetCents;

  let message = null;
  let valid = true;

  if (dollarTargets.length > 0 && percentTargets.length === 0) {
    // All dollar targets - must sum to total pool
    if (Math.abs(gapCents) > 0) {
      valid = false;
      message = `Dollar targets sum to ${formatMoney(totalTargetCents)} but the total balance is ${formatMoney(totalPoolCents)}. Gap: ${formatMoney(gapCents)}.`;
    }
  } else if (percentTargets.length > 0 && dollarTargets.length === 0) {
    // All percentage targets - must sum to 100%
    if (Math.abs(percentSum - 100) > 0.001) {
      valid = false;
      message = `Percentage targets sum to ${formatPercentValue(percentSum)}, not 100%.`;
    }
  } else {
    // Mixed: percentages should represent remaining pool after fixed dollars
    if (fixedCents > totalPoolCents) {
      valid = false;
      message = `Fixed dollar amounts (${formatMoney(fixedCents)}) exceed the total balance (${formatMoney(totalPoolCents)}).`;
    } else if (Math.abs(percentSum - 100) > 0.001) {
      valid = false;
      message = `Percentage targets must sum to 100% of the remaining balance. Currently: ${formatPercentValue(percentSum)}.`;
    }
  }

  // Check for zero-target accounts
  const warnings = [];
  for (const t of targets) {
    const cents = targetMap.get(t.name) || 0;
    if (cents === 0) {
      warnings.push(`${t.name} has a 0% target. No money will be allocated to it. Did you mean to include it?`);
    }
  }

  return { valid, message, totalTargetCents, totalPoolCents, gapCents, warnings, targetMap };
}
