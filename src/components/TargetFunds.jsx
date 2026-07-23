import { formatMoney } from '../engine';

// ─── Step 2: Target Funds ──────────────────────────────────
// Targets are keyed by fund identifier; the table shows both the code and
// the description so the fund is recognizable either way. Every dollar
// figure is paired with its two-decimal percentage.
export default function TargetFunds({ targets, setTargets, totalPoolCents, validation, lookup }) {
  const updateTarget = (name, field, value) => {
    setTargets(prev => prev.map(t => (t.name === name ? { ...t, [field]: value } : t)));
  };

  const distributeEvenly = () => {
    const unset = targets.filter(
      t => t.targetType === 'percentage' && (!t.targetValue || Number(t.targetValue) === 0)
    );
    const setPercent = targets
      .filter(t => t.targetType === 'percentage' && Number(t.targetValue) > 0)
      .reduce((s, t) => s + Number(t.targetValue), 0);

    const availablePercent = 100 - setPercent;

    if (unset.length > 0 && availablePercent > 0) {
      // Two-decimal split whose parts still sum exactly to the available
      // percent: the last unset fund absorbs the rounding remainder
      // (e.g. three ways gives 33.33 / 33.33 / 33.34).
      const each = Math.floor((availablePercent / unset.length) * 100) / 100;
      const last = Math.round((availablePercent - each * (unset.length - 1)) * 100) / 100;
      let remaining = unset.length;
      setTargets(prev =>
        prev.map(t => {
          if (t.targetType === 'percentage' && (!t.targetValue || Number(t.targetValue) === 0)) {
            remaining -= 1;
            return { ...t, targetValue: remaining === 0 ? last : each };
          }
          return t;
        })
      );
    }
  };

  const fundOf = name => (lookup && lookup.get(name)) || { code: name, description: '' };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Step 2: Target Funds</h2>
      <p className="text-sm text-gray-500 mb-4">
        Set the desired allocation for each fund that will remain after trades. Enter a
        percentage or a dollar amount; the tool always shows both.
      </p>

      {targets.length === 0 ? (
        <p className="text-gray-400 italic text-sm">No destination funds yet. Add funds in Step 1.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-2">Fund Code</th>
                <th className="pb-2 pr-2">Fund Description</th>
                <th className="pb-2 pr-2">Target Type</th>
                <th className="pb-2 pr-2">Target Value</th>
                <th className="pb-2 pr-2 text-right">Target $</th>
                <th className="pb-2 pr-2 text-right">Target %</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t, idx) => {
                const f = fundOf(t.name);
                const targetCents = validation.targetMap ? validation.targetMap.get(t.name) || 0 : 0;
                const impliedPct =
                  totalPoolCents > 0 ? ((targetCents / totalPoolCents) * 100).toFixed(2) : '0.00';
                return (
                  <tr key={`${idx}-${t.name}`} className="border-b last:border-b-0">
                    <td className="py-2 pr-2 font-medium">{f.code}</td>
                    <td className="py-2 pr-2">{f.description}</td>
                    <td className="py-2 pr-2">
                      <select
                        className="border rounded px-2 py-1"
                        value={t.targetType}
                        onChange={e => updateTarget(t.name, 'targetType', e.target.value)}
                        aria-label="Target type"
                      >
                        <option value="percentage">Percentage</option>
                        <option value="dollar">Dollar Amount</option>
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-1">
                        {t.targetType === 'dollar' && <span className="text-gray-400">$</span>}
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-32 border rounded px-2 py-1 text-right"
                          value={t.targetValue}
                          onChange={e =>
                            updateTarget(t.name, 'targetValue', parseFloat(e.target.value) || 0)
                          }
                          aria-label="Target value"
                        />
                        {t.targetType === 'percentage' && <span className="text-gray-400">%</span>}
                      </div>
                    </td>
                    <td className="py-2 pr-2 text-right text-gray-500 font-mono">
                      {formatMoney(targetCents)}
                    </td>
                    <td className="py-2 pr-2 text-right text-gray-500">{impliedPct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {validation.warnings &&
        validation.warnings.map((w, i) => (
          <div key={i} className="mt-2 text-amber-600 text-sm bg-amber-50 rounded px-3 py-2">
            {w}
          </div>
        ))}

      {!validation.valid && validation.message && (
        <div className="mt-3 text-red-600 text-sm bg-red-50 rounded px-3 py-2">
          {validation.message}
        </div>
      )}

      {validation.valid && targets.length > 0 && (
        <div className="mt-3 text-green-600 text-sm bg-green-50 rounded px-3 py-2">
          Targets are valid. Total: {formatMoney(validation.totalTargetCents)} (100.00%)
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={distributeEvenly}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Distribute remaining evenly
        </button>
      </div>
    </div>
  );
}
