import { toCents, formatMoney, formatPercentValue } from '../engine';
import { parsePastedRows, applyPastedRows } from '../paste';
import { fundIsBlank, findDuplicateIdentifiers } from '../funds';
import { parseDollarInput } from '../money-input';

// ─── Step 1: Current State ─────────────────────────────────
// Fund Code and Fund Description are separate columns matching the insurer
// forms. Either one is enough to identify a fund; both is best.
export default function CurrentState({ accounts, setAccounts, makeAccount }) {
  const totalCents = accounts.reduce(
    (s, a) => s + (a.status === 'new' ? 0 : toCents(parseDollarInput(a.balance))),
    0
  );
  const duplicates = findDuplicateIdentifiers(accounts);

  const updateAccount = (id, field, value) => {
    setAccounts(prev => prev.map(a => (a.id === id ? { ...a, [field]: value } : a)));
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
        Enter your existing funds, their balances, and whether each will be kept, closed, or is
        new. Fund code or fund description is enough to identify a fund; enter both when you have
        them, matching the insurer form. Tip: you can paste whole columns (code, description,
        balance) straight from Excel into any field below and they fill down the table.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-2">Fund Code</th>
              <th className="pb-2 pr-2">Fund Description</th>
              <th className="pb-2 pr-2">Current Balance</th>
              <th className="pb-2 pr-2">Status</th>
              <th className="pb-2 pr-2 text-right">% of Total</th>
              <th className="pb-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(acct => {
              const cents = acct.status === 'new' ? 0 : toCents(parseDollarInput(acct.balance));
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
                    {acct.status === 'new' ? (
                      <span className="text-gray-400 italic px-2">$0.00 (new)</span>
                    ) : (
                      <input
                        type="text"
                        className="w-full border rounded px-2 py-1 text-right"
                        placeholder="$0.00"
                        value={acct.balance}
                        onChange={e => updateAccount(acct.id, 'balance', e.target.value)}
                        onPaste={handlePaste(acct.id, 'balance')}
                        aria-label="Current balance"
                      />
                    )}
                  </td>
                  <td className="py-2 pr-2">
                    <select
                      className="border rounded px-2 py-1"
                      value={acct.status}
                      onChange={e => updateAccount(acct.id, 'status', e.target.value)}
                      aria-label="Fund status"
                    >
                      <option value="keep">Keep</option>
                      <option value="close">Close</option>
                      <option value="new">New</option>
                    </select>
                  </td>
                  <td className="py-2 pr-2 text-right text-gray-500">
                    {formatPercentValue(pct)}
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

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={addAccount}
          className="bg-aspire text-white px-4 py-2 rounded hover:bg-aspire-dark text-sm"
        >
          + Add Fund
        </button>
        <div className="text-sm font-medium text-gray-700">
          Total Balance: <span className="font-bold">{formatMoney(totalCents)}</span>
        </div>
      </div>
    </div>
  );
}
