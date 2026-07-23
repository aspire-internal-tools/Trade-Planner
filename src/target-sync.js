import { fundIdentifier } from './funds.js';

// Keep current holdings represented in Step 2 while preserving target-only
// funds. Current State contains facts only. Every proposed close, allocation
// change, and new fund belongs to Target Funds.
export function syncTargetsToAccounts(accounts, previousTargets) {
  const currentTargets = accounts
    .filter(account => fundIdentifier(account) !== '')
    .map(account => {
      const name = fundIdentifier(account);
      const existing = previousTargets.find(
        target =>
          target.sourceAccountId === account.id ||
          (!target.sourceAccountId && target.source !== 'new' && target.name === name)
      );
      return {
        ...(existing || {}),
        id: existing?.id || `current-${account.id}`,
        source: 'current',
        sourceAccountId: account.id,
        name,
        code: account.code,
        description: account.description,
        targetType: existing?.targetType || 'percentage',
        targetValue: existing?.targetValue ?? 0,
        status: existing?.status || 'target',
      };
    });

  const newTargets = previousTargets.filter(target => target.source === 'new');
  const nextTargets = [...currentTargets, ...newTargets];

  const unchanged =
    nextTargets.length === previousTargets.length &&
    nextTargets.every((target, index) => {
      const previous = previousTargets[index];
      return (
        target.id === previous.id &&
        target.name === previous.name &&
        target.code === previous.code &&
        target.description === previous.description
      );
    });

  return unchanged ? previousTargets : nextTargets;
}
