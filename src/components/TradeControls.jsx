// ─── Step 3: Trade Structure and Number of Trades ──────────
// The free-sliding range input is replaced with a fixed notch picker:
// every possible trade count is a visible, clickable notch, and counts
// that cannot apply to the current plan are greyed out. MAX_NOTCHES
// matches the ten fund rows on both insurer forms.

export const MAX_NOTCHES = 10;

export default function TradeControls({
  mode,
  setMode,
  constraints,
  setConstraints,
  surplusCount,
  mandatoryCount,
}) {
  const maxUseful = Math.max(surplusCount, 1);
  const minUseful = Math.max(mandatoryCount, 1);

  const pickCount = n => {
    setConstraints(prev => ({ ...prev, maxTransfers: n }));
  };

  const setNoLimit = () => {
    setConstraints(prev => ({ ...prev, maxTransfers: null }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Step 3: Trade Structure and Number of Trades</h2>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Trade Structure</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <label
              className={`flex-1 border rounded-lg p-3 cursor-pointer text-sm ${
                mode === 'single' ? 'border-aspire bg-aspire-tint' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="trade-mode"
                className="mr-2"
                checked={mode === 'single'}
                onChange={() => setMode('single')}
              />
              <span className="font-medium">Single-From trades</span>
              <span className="block text-gray-500 mt-1">
                Each trade moves money out of one fund into one or more funds. Matches segregated
                fund switches and simple mutual fund switches.
              </span>
            </label>
            <label
              className={`flex-1 border rounded-lg p-3 cursor-pointer text-sm ${
                mode === 'multi' ? 'border-aspire bg-aspire-tint' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="trade-mode"
                className="mr-2"
                checked={mode === 'multi'}
                onChange={() => setMode('multi')}
              />
              <span className="font-medium">Multi-From order</span>
              <span className="block text-gray-500 mt-1">
                One consolidated order pulls from several funds at once, shown as a From table and
                a To table. Matches mutual fund internal transfer conversions.
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {mode === 'multi' ? 'Maximum funds to trade from' : 'Maximum Trades'}
          </label>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Maximum trades">
            {Array.from({ length: MAX_NOTCHES }, (_, i) => i + 1).map(n => {
              const usable = n >= minUseful && n <= maxUseful;
              const selected = constraints.maxTransfers === n;
              return (
                <button
                  key={n}
                  onClick={() => usable && pickCount(n)}
                  disabled={!usable}
                  aria-pressed={selected}
                  title={
                    usable
                      ? `${n} trade${n > 1 ? 's' : ''}`
                      : n < minUseful
                        ? `${mandatoryCount} closing fund(s) require at least ${minUseful} trade(s)`
                        : `This plan never needs more than ${maxUseful} trade(s)`
                  }
                  className={`w-9 h-9 rounded-full border text-sm font-mono transition-colors ${
                    selected
                      ? 'bg-aspire text-white border-aspire'
                      : usable
                        ? 'bg-white text-gray-700 border-gray-300 hover:border-aspire hover:text-aspire'
                        : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                  }`}
                >
                  {n}
                </button>
              );
            })}
            <button
              onClick={setNoLimit}
              aria-pressed={constraints.maxTransfers === null}
              className={`px-3 h-9 rounded-full border text-sm transition-colors ${
                constraints.maxTransfers === null
                  ? 'bg-aspire text-white border-aspire'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-aspire hover:text-aspire'
              }`}
            >
              No limit
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Greyed notches cannot apply to this plan: counts above the number of funds with money
            to move are never used, and counts below the number of closing funds cannot empty
            them all.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tolerance</label>
          <div className="flex items-center gap-3">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={constraints.toleranceType}
              onChange={e => setConstraints(prev => ({ ...prev, toleranceType: e.target.value }))}
              aria-label="Tolerance type"
            >
              <option value="exact">Exact (zero tolerance)</option>
              <option value="percent">Ignore imbalances under X% of total</option>
              <option value="dollar">Ignore imbalances under $X</option>
            </select>

            {constraints.toleranceType !== 'exact' && (
              <div className="flex items-center gap-1">
                {constraints.toleranceType === 'dollar' && <span className="text-gray-400">$</span>}
                <input
                  type="number"
                  min="0"
                  step={constraints.toleranceType === 'percent' ? '0.1' : '1'}
                  className="w-24 border rounded px-2 py-1 text-right text-sm"
                  value={constraints.toleranceValue}
                  onChange={e =>
                    setConstraints(prev => ({
                      ...prev,
                      toleranceValue: parseFloat(e.target.value) || 0,
                    }))
                  }
                  aria-label="Tolerance value"
                />
                {constraints.toleranceType === 'percent' && <span className="text-gray-400">%</span>}
              </div>
            )}
          </div>
        </div>

        {surplusCount > 0 && (
          <div className="text-sm text-gray-500">
            Funds with money to move out: <span className="font-semibold">{surplusCount}</span>
            {mandatoryCount > 0 && (
              <span className="ml-2">
                (closing funds: <span className="font-semibold">{mandatoryCount}</span>)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
