import { useState, useEffect, useRef } from 'react';
import { formatMoney, formatPercent } from '../engine';
import { copyPlanToClipboard } from '../clipboard';
import FormOutput from './FormOutput.jsx';

// ─── Step 4: Trade Plan Output ─────────────────────────────
// Single-From mode shows one card per trade; Multi-From mode shows one
// consolidated two-sided order. Every dollar amount is paired with a
// two-decimal percentage: From amounts as a share of that fund's starting
// balance (what a processor types on a switch), To amounts as a share of
// the money being moved, and summary rows as shares of the total account.
export default function TradePlan({ plan, mode, order, lookup }) {
  const [copyState, setCopyState] = useState(null); // null | 'copied' | 'failed'
  const copiedTimer = useRef(null);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  if (!plan) return null;

  const label = name => (lookup && lookup.get(name) ? lookup.get(name).label : name);
  const starts = new Map(plan.results.map(r => [r.name, r.startCents]));

  const copyToClipboard = () => {
    setCopyState('copied');
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopyState(null), 4000);
    copyPlanToClipboard(plan, { mode, order, lookup }).catch(() => setCopyState('failed'));
  };
  const copied = copyState === 'copied';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 no-print">Step 4: Trade Plan</h2>
      <h2 className="text-xl font-semibold mb-4 print-only">Trade Plan</h2>

      {!plan.feasible && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-700 font-medium">{plan.message}</p>
          {plan.suggestion && <p className="text-red-600 text-sm mt-1">{plan.suggestion}</p>}
        </div>
      )}

      {plan.message && plan.feasible && (
        <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-4">
          <p className="text-amber-700 text-sm">{plan.message}</p>
        </div>
      )}

      {plan.transfers.length === 0 && plan.feasible && (
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
          <p className="text-green-700">
            No trades needed. All funds are at or within tolerance of their targets.
          </p>
        </div>
      )}

      {mode === 'multi' && order && order.fromRows.length > 0 ? (
        <div className="border rounded-lg p-4 bg-gray-50 mb-6">
          <div className="font-semibold text-blue-800 mb-2">
            One consolidated order (multi-from internal transfer)
          </div>
          <div className="font-medium mb-1">FROM (money out):</div>
          <ul className="ml-4 space-y-1 mb-3">
            {order.fromRows.map((r, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{label(r.name)}</span>
                {r.status === 'close' && (
                  <span className="text-red-600 text-xs ml-1">(closing fund)</span>
                )}
                : <span className="font-mono font-medium">{formatMoney(r.amountCents)}</span>{' '}
                <span className="text-gray-500">
                  ({formatPercent(r.amountCents, starts.get(r.name) || 0)} of its starting balance)
                </span>
              </li>
            ))}
          </ul>
          <div className="font-medium mb-1">TO (money in):</div>
          <ul className="ml-4 space-y-1">
            {order.toRows.map((r, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{label(r.name)}</span>:{' '}
                <span className="font-mono font-medium">{formatMoney(r.amountCents)}</span>{' '}
                <span className="text-gray-500">
                  ({formatPercent(r.amountCents, order.totalCents)} of the order)
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 text-xs text-gray-500">
            Total moved: {formatMoney(order.totalCents)}
          </div>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {plan.transfers.map((t, i) => {
            const totalOut = t.distributions.reduce((s, d) => s + d.amountCents, 0);
            const fromStart = starts.get(t.from) || 0;
            const fromResult = plan.results.find(r => r.name === t.from);
            const remainingCents = fromResult ? fromResult.endCents : 0;
            return (
              <div key={i} className="border rounded-lg p-4 bg-gray-50">
                <div className="font-semibold text-blue-800 mb-2">
                  Trade {i + 1} of {plan.transfers.length}
                </div>
                <div className="font-medium mb-2">
                  FROM: {label(t.from)}
                  {t.fromStatus === 'close' && (
                    <span className="text-red-600 text-sm ml-2">(closing fund)</span>
                  )}
                </div>
                <ul className="ml-4 space-y-1">
                  {t.distributions.map((d, j) => (
                    <li key={j} className="text-sm">
                      Send <span className="font-mono font-medium">{formatMoney(d.amountCents)}</span>{' '}
                      <span className="text-gray-500">
                        ({formatPercent(d.amountCents, fromStart)} of the fund)
                      </span>{' '}
                      to <span className="font-medium">{label(d.to)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 text-xs text-gray-500">
                  Total moved: {formatMoney(totalOut)} ({formatPercent(totalOut, fromStart)}) |
                  Remaining in {label(t.from)}: {formatMoney(remainingCents)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {plan.results.length > 0 && (
        <>
          <h3 className="font-semibold mb-2">Results Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-2">Fund</th>
                  <th className="pb-2 pr-2 text-right">Starting Balance</th>
                  <th className="pb-2 pr-2 text-right">Start %</th>
                  <th className="pb-2 pr-2 text-right">Target Balance</th>
                  <th className="pb-2 pr-2 text-right">Target %</th>
                  <th className="pb-2 pr-2 text-right">Ending Balance</th>
                  <th className="pb-2 pr-2 text-right">Final %</th>
                  <th className="pb-2 pr-2 text-right">Deviation</th>
                </tr>
              </thead>
              <tbody>
                {plan.results.map((r, idx) => (
                  <tr
                    key={`${idx}-${r.name}`}
                    className={`border-b last:border-b-0 ${
                      r.status === 'close' ? 'text-gray-400' : ''
                    }`}
                  >
                    <td className="py-1 pr-2 font-medium">
                      {label(r.name)}
                      {r.status === 'close' && <span className="text-xs ml-1">(closed)</span>}
                      {r.status === 'new' && (
                        <span className="text-xs text-green-600 ml-1">(new)</span>
                      )}
                    </td>
                    <td className="py-1 pr-2 text-right font-mono">{formatMoney(r.startCents)}</td>
                    <td className="py-1 pr-2 text-right text-gray-500">
                      {r.startPercent.toFixed(2)}%
                    </td>
                    <td className="py-1 pr-2 text-right font-mono">{formatMoney(r.targetCents)}</td>
                    <td className="py-1 pr-2 text-right text-gray-500">
                      {r.targetPercent.toFixed(2)}%
                    </td>
                    <td className="py-1 pr-2 text-right font-mono">{formatMoney(r.endCents)}</td>
                    <td className="py-1 pr-2 text-right">{r.endPercent.toFixed(2)}%</td>
                    <td
                      className={`py-1 pr-2 text-right ${
                        Math.abs(r.deviationPercent) > 0.05
                          ? r.deviationPercent > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {r.deviationPercent >= 0 ? '+' : ''}
                      {r.deviationPercent.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-medium">
                  <td className="pt-2">Total</td>
                  <td className="pt-2 text-right font-mono">
                    {formatMoney(plan.results.reduce((s, r) => s + r.startCents, 0))}
                  </td>
                  <td className="pt-2 text-right">100.00%</td>
                  <td className="pt-2 text-right font-mono">
                    {formatMoney(plan.results.reduce((s, r) => s + r.targetCents, 0))}
                  </td>
                  <td className="pt-2 text-right">100.00%</td>
                  <td className="pt-2 text-right font-mono">
                    {formatMoney(plan.results.reduce((s, r) => s + r.endCents, 0))}
                  </td>
                  <td className="pt-2 text-right">100.00%</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      <div className="flex items-center gap-3 mt-6 no-print">
        <button
          onClick={copyToClipboard}
          className={`${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-aspire hover:bg-aspire-dark'} text-white px-4 py-2 rounded text-sm`}
        >
          {copied ? '✓ Copied' : 'Copy to Clipboard'}
        </button>
        <button
          onClick={() => window.print()}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
        >
          Print
        </button>
        {copied && (
          <span className="text-green-700 text-sm" role="status">
            Copied to clipboard
          </span>
        )}
        {copyState === 'failed' && (
          <span className="text-red-600 text-sm" role="status">
            Copy failed. Try again or use Print.
          </span>
        )}
      </div>

      {plan.feasible && plan.transfers.length > 0 && (
        <FormOutput plan={plan} mode={mode} order={order} lookup={lookup} />
      )}
    </div>
  );
}
