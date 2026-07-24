import { formatMoney, formatPercentValue } from '../engine';
import { fundIdentifier, findDuplicateIdentifiers } from '../funds';
import { autofillDescriptionOnCodeChange } from '../fund-autofill';

function targetIsClosed(target) {
  return target.source === 'current' && (target.status === 'close' || Number(target.targetValue) === 0);
}

export default function TargetFunds({
  targets,
  setTargets,
  totalPoolCents,
  validation,
  makeTarget,
}) {
  const updateTarget = (id, field, value) => {
    setTargets(previous =>
      previous.map(target => {
        if (target.id !== id) return target;
        const next = { ...target, [field]: value };
        if (field === 'code') {
          const description = autofillDescriptionOnCodeChange(target.code, value);
          if (description !== null) next.description = description;
        }
        if (field === 'code' || field === 'description') next.name = fundIdentifier(next);
        if (field === 'targetValue' && Number(value) > 0) next.status = 'target';
        return next;
      })
    );
  };

  const markClosed = id => {
    setTargets(previous =>
      previous.map(target =>
        target.id === id
          ? { ...target, status: 'close', targetValue: 0 }
          : target
      )
    );
  };

  const reopen = id => {
    setTargets(previous =>
      previous.map(target =>
        target.id === id ? { ...target, status: 'target', targetValue: '' } : target
      )
    );
  };

  const addTarget = () => setTargets(previous => [...previous, makeTarget()]);
  const removeTarget = id => setTargets(previous => previous.filter(target => target.id !== id));

  const distributeEvenly = () => {
    const eligible = targets.filter(
      target =>
        target.status !== 'close' &&
        target.targetType === 'percentage' &&
        (!target.targetValue || Number(target.targetValue) === 0)
    );
    const assigned = targets
      .filter(target => target.status !== 'close' && target.targetType === 'percentage')
      .reduce((sum, target) => sum + (Number(target.targetValue) || 0), 0);
    const available = 100 - assigned;
    if (eligible.length === 0 || available <= 0) return;

    const each = Math.floor((available / eligible.length) * 100) / 100;
    const last = Math.round((available - each * (eligible.length - 1)) * 100) / 100;
    let remaining = eligible.length;
    const ids = new Set(eligible.map(target => target.id));
    setTargets(previous =>
      previous.map(target => {
        if (!ids.has(target.id)) return target;
        remaining -= 1;
        return { ...target, status: 'target', targetValue: remaining === 0 ? last : each };
      })
    );
  };

  const duplicates = findDuplicateIdentifiers(targets);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Step 2: Target Funds</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl">
          Describe what should exist after the trades. Set a target for every current fund,
          mark a fund closed, or enter 0% or $0 to close it. Add new destination funds below.
        </p>
      </div>

      {targets.length === 0 ? (
        <p className="text-gray-400 italic text-sm">
          Enter current funds in Step 1, or add a new target fund.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm target-table">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-2">Fund Code</th>
                <th className="pb-2 pr-2">Fund Description</th>
                <th className="pb-2 pr-2">Enter Target As</th>
                <th className="pb-2 pr-2">Target</th>
                <th className="pb-2 pr-2 text-right">Target $</th>
                <th className="pb-2 pr-2 text-right">Target %</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {targets.map(target => {
                const closed = targetIsClosed(target);
                const targetCents = validation.targetMap?.get(target.name) || 0;
                const impliedPercent =
                  totalPoolCents > 0 ? (targetCents / totalPoolCents) * 100 : 0;
                const editableIdentity = target.source === 'new';
                return (
                  <tr
                    key={target.id}
                    className={`border-b last:border-b-0 ${closed ? 'bg-gray-50 text-gray-400' : ''}`}
                  >
                    <td className="py-2 pr-2">
                      {editableIdentity ? (
                        <input
                          type="text"
                          className="w-full min-w-28 border rounded px-2 py-1 text-gray-800 bg-white"
                          placeholder="Fund code"
                          value={target.code}
                          onChange={event => updateTarget(target.id, 'code', event.target.value)}
                          aria-label="New target fund code"
                        />
                      ) : (
                        <span className="font-medium">{target.code}</span>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      {editableIdentity ? (
                        <input
                          type="text"
                          className="w-full min-w-40 border rounded px-2 py-1 text-gray-800 bg-white"
                          placeholder="Fund description"
                          value={target.description}
                          onChange={event =>
                            updateTarget(target.id, 'description', event.target.value)
                          }
                          aria-label="New target fund description"
                        />
                      ) : (
                        target.description
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        className="border rounded px-2 py-1 bg-white text-gray-800"
                        value={target.targetType}
                        disabled={target.status === 'close'}
                        onChange={event =>
                          updateTarget(target.id, 'targetType', event.target.value)
                        }
                        aria-label="Target type"
                      >
                        <option value="percentage">Percentage</option>
                        <option value="dollar">Dollar amount</option>
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-1">
                        {target.targetType === 'dollar' && <span>$</span>}
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-24 border rounded px-2 py-1 text-right bg-white text-gray-800 disabled:bg-gray-100"
                          value={target.targetValue}
                          disabled={target.status === 'close'}
                          onChange={event =>
                            updateTarget(target.id, 'targetValue', event.target.value)
                          }
                          aria-label="Target value"
                        />
                        {target.targetType === 'percentage' && <span>%</span>}
                      </div>
                    </td>
                    <td className="py-2 pr-2 text-right font-mono">{formatMoney(targetCents)}</td>
                    <td className="py-2 pr-2 text-right">{formatPercentValue(impliedPercent)}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      {target.source === 'new' ? (
                        <button
                          type="button"
                          onClick={() => removeTarget(target.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Remove
                        </button>
                      ) : closed ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                            Closed
                          </span>
                          <button
                            type="button"
                            onClick={() => reopen(target.id)}
                            className="text-aspire hover:text-aspire-dark text-xs font-medium"
                          >
                            Set target
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => markClosed(target.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Mark closed
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="mt-3 text-red-600 text-sm bg-red-50 rounded px-3 py-2" role="alert">
          Duplicate target fund identifier{duplicates.length > 1 ? 's' : ''}: {duplicates.join(', ')}.
        </div>
      )}

      {validation.warnings?.map((warning, index) => (
        <div key={index} className="mt-2 text-amber-700 text-sm bg-amber-50 rounded px-3 py-2">
          {warning}
        </div>
      ))}

      {!validation.valid && validation.message && (
        <div className="mt-3 text-red-600 text-sm bg-red-50 rounded px-3 py-2">
          {validation.message}
        </div>
      )}

      {validation.valid && targets.length > 0 && (
        <div className="mt-3 text-green-700 text-sm bg-green-50 rounded px-3 py-2">
          Targets are valid. Total: {formatMoney(validation.totalTargetCents)} (100%)
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <button
          type="button"
          onClick={addTarget}
          className="bg-aspire text-white px-4 py-2 rounded hover:bg-aspire-dark text-sm"
        >
          + Add Target Fund
        </button>
        {targets.length > 0 && (
          <button
            type="button"
            onClick={distributeEvenly}
            className="text-sm text-aspire hover:text-aspire-dark underline"
          >
            Distribute remaining percentage evenly
          </button>
        )}
      </div>
    </div>
  );
}
