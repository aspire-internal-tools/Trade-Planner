import { fundIdentifier } from './funds.js';

// Keep the Step 2 target list in step with the Step 1 fund list.
// Targets are keyed by the fund identifier (code, or description as
// fallback). Closing funds and blank rows get no target row.
export function syncTargetsToAccounts(accounts, previousTargets) {
  const destinationNames = accounts
    .filter(account => account.status !== 'close')
    .map(account => fundIdentifier(account))
    .filter(name => name !== '');

  const nextTargets = destinationNames.map(name => {
    const existing = previousTargets.find(target => target.name === name);
    return existing || { name, targetType: 'percentage', targetValue: 0 };
  });

  if (
    nextTargets.length === previousTargets.length
    && nextTargets.every((target, index) => target.name === previousTargets[index].name)
  ) {
    return previousTargets;
  }

  return nextTargets;
}
