import { toCents, toDollars, formatMoney, formatPercentValue } from '../engine';
import { parsePastedRows, applyPastedRows } from '../paste';
import { fundIsBlank, findDuplicateIdentifiers } from '../funds';
import { parseDollarInput } from '../money-input';

function balancesFromPercentages(accounts, totalCents) {
  const percentTotal = accounts.reduce(
    (sum, account) => sum + (Number(account.percentage) || 0),
    0
  );
  let allocated = 0;
  return accounts.map((account, index) => {
    const isLast = index === accounts.length - 1;
    const cents =
      isLast && Math.abs(percentTotal - 100) < 0.001
        ? totalCents - allocated
        : Math.round(totalCents * ((Number(account.percentage) || 0) / 100));
    allocated += cents;
    return { ...account, balance: toDollars(cents) };
  });
}

// ─── Step 1: Current State ─────────────────────────────────
// Fund Code and Fund Description are separate columns matching the insurer
// forms. Either one is enough to identify a fund; both is best.
export default function CurrentState({
  accounts,
  setAccounts,
  makeAccount,
  entryMode,
  setEntryMode,
  enteredTotal,
  setEnteredTotal,
}) {
  const totalCents = accounts.reduce(
    (s, a) => s + toCents(parseDollarInput(a.balance)),
    0
  );
  const duplicates = findDuplicateIdentifiers(accounts);
  const enteredTotalCents = toCents(parseDollarInput(enteredTotal));
  const percentTotal = accounts.reduce((sum, account) => sum + (Number(account.percentage) || 0), 0);

  const updateAccount = (id, field, value) => {
    setAccounts(prev => {
      const changed = prev.map(a => (a.id === id ? { ...a, [field]: value } : a));
      return field === 'percentage'
        ? balancesFromPercentages(changed, enteredTotalCents)
        : changed;
    });
  };

  const changeEntryMode = mode => {
    if (mode === entryMode) return;
    if (mode === 'percentage') {
      const nextTotal = totalCents;
      setEnteredTotal(toDollars(nextTotal));
      setAccounts(prev =>
        prev.map(account => ({
          ...account,
          percentage:
            nextTotal > 0
              ? String(Math.round((toCents(parseDollarInput(account.balance)) / nextTotal) * 10000) / 100)
              : '',
        }))
      );
    }
    setEntryMode(mode);
  };

  const updateTotal = value => {
    setEnteredTotal(value);
    const cents = toCents(parseDollarInput(value));
    setAccounts(prev => balancesFromPercentages(prev, cents));
  };

  // Multi-line or tabbed paste (e.g. columns copied from Excel) fills down
  // the table instead of landing in one field.
  const handlePaste = (id, field) => e => {
    const rows = parsePastedRows(e.clipboardData.getData('text'), field);
    if (!rows) return; // single value: normal paste
    e.preventDefault();
    setAccounts(prev => applyPastedRows(prev, id, rows, makeAccount));
  };

  const addAccount = () => {
    setAccounts(prev => [...prev, makeAccount()]);
  };

  const removeAccount = id => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Step 1: Current State</h2>
      <p className="text-sm text-gray-500 mb-4">
        Capture only what the client holds today. Enter each current fund and either its balance,
        or the account total and each fund's current percentage. Decisions about closing, changing,
        or adding funds happen in Step 2.
      </p>

      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 mb-5" role="group" aria-label="Current state entry method">
        <button
          type="button"
          onClick={() => changeEntryMode('amount')}
          className={`px-3 py-1.5 rounded-md text-sm ${entryMode === 'amount' ? 'bg-white text-aspire shadow-sm font-medium' : 'text-gray-500'}`}
          aria-pressed={entryMode === 'amount'}
        >
          Enter fund amounts
        </button>
        <button
          type="button"
          onClick={() => changeEntryMode('percentage')}
          className={`px-3 py-1.5 rounded-md text-sm ${entryMode === 'percentage' ? 'bg-white text-aspire shadow-sm font-medium' : 'text-gray-500'}`}
          aria-pressed={entryMode === 'percentage'}
        >
          Enter total + percentages
        </button>
      </div>

      {entryMode === 'percentage' && (
        <div className="mb-5 max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="current-total">
            Current account total
          </label>
          <div className="flex items-center rounded border bg-white focus-within:ring-2 focus-within:ring-aspire/20">
            <span className="pl-3 text-gray-400">$</span>
            <input
              id="current-total"
              type="text"
              inputMode="decimal"
              className="w-full px-2 py-2 text-right outline-none rounded"
              value={enteredTotal}
              onChange={e => updateTotal(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-2">Fund Code</th>
              <th className="pb-2 pr-2">Fund Description</th>
              <th className="pb-2 pr-2">{entryMode === 'amount' ? 'Current Balance' : 'Current %'}</th>
              <th className="pb-2 pr-2 text-right">{entryMode === 'amount' ? '% of Total' : 'Calculated Balance'}</th>
              <th className="pb-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(acct => {
              const cents = toCents(parseDollarInput(acct.balance));
              const pct = totalCents > 0 ? (cents / totalCents) * 100 : 0;
              return (
                <tr key={acct.id} className="border-b last:border-b-0">
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      className="w-full border rounded px-2 py-1"
                      placeholder="e.g. FND 101"
                      value={acct.code}
                      onChange={e => updateAccount(acct.id, 'code', e.target.value)}
                      onPaste={handlePaste(acct.id, 'code')}
                      aria-label="Fund code"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      className="w-full border rounded px-2 py-1"
                      placeholder="e.g. Canadian Equity"
                      value={acct.description}
                      onChange={e => updateAccount(acct.id, 'description', e.target.value)}
                      onPaste={handlePaste(acct.id, 'description')}
                      aria-label="Fund description"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    {entryMode === 'amount' ? (
                      <input
                        type="text"
                        className="w-full border rounded px-2 py-1 text-right"
                        placeholder="$0.00"
                        value={acct.balance}
                        onChange={e => updateAccount(acct.id, 'balance', e.target.value)}
                        onPaste={handlePaste(acct.id, 'balance')}
                        aria-label="Current balance"
                      />
                    ) : (
                      <div className="flex items-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className="w-full border rounded px-2 py-1 text-right"
                          value={acct.percentage}
                          onChange={e => updateAccount(acct.id, 'percentage', e.target.value)}
                          aria-label="Current percentage"
                        />
                        <span className="ml-1 text-gray-400">%</span>
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-2 text-right text-gray-500">
                    {entryMode === 'amount' ? formatPercentValue(pct) : formatMoney(cents)}
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => removeAccount(acct.id)}
                      className="text-red-400 hover:text-red-600 px-1"
                      aria-label="Remove fund"
                      title="Remove"
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {duplicates.length > 0 && (
        <div className="mt-3 text-red-600 text-sm bg-red-50 rounded px-3 py-2" role="alert">
          Duplicate fund identifier{duplicates.length > 1 ? 's' : ''}:{' '}
          {duplicates.join(', ')}. Each fund needs a unique code (or description when no code is
          entered) so targets and trades match the right fund. The plan is paused until this is
          fixed.
        </div>
      )}

      {accounts.some(a => fundIsBlank(a)) && (
        <div className="mt-3 text-amber-600 text-sm bg-amber-50 rounded px-3 py-2">
          Every fund needs at least a code or a description before the plan can compute.
        </div>
      )}

      {entryMode === 'percentage' && Math.abs(percentTotal - 100) > 0.001 && (
        <div className="mt-3 text-amber-700 text-sm bg-amber-50 rounded px-3 py-2" role="alert">
          Current percentages total {formatPercentValue(percentTotal)}. They must total 100%.
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={addAccount}
          className="bg-aspire text-white px-4 py-2 rounded hover:bg-aspire-dark text-sm"
        >
          + Add Current Fund
        </button>
        <div className="text-sm font-medium text-gray-700">
          {entryMode === 'percentage' ? 'Calculated total' : 'Total Balance'}:{' '}
          <span className="font-bold">{formatMoney(totalCents)}</span>
        </div>
      </div>
    </div>
  );
}
