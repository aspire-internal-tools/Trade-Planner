import { useState } from 'react';
import { formatPercent } from '../engine';
import { FORM_DEFS, getFormDef } from '../pdf/form-defs';
import { fillForm, downloadPdf, FormFillError } from '../pdf/fill-form';

// ─── Form Output: partially filled insurer PDFs ────────────
// Fills ONLY the From and To fund rows (code, description, amount) on the
// selected blank form and downloads it. Every other field stays blank and
// fillable. Amounts can be written as dollars or as percentages with up to two
// percentages, since processors set up trades either way.
export default function FormOutput({ plan, mode, order, lookup }) {
  const [formId, setFormId] = useState(mode === 'multi' ? 'quadrus-two-sided' : 'seg-switch');
  const [amountStyle, setAmountStyle] = useState('dollar');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const def = getFormDef(formId);
  if (!def || !order) return null;

  const starts = new Map(plan.results.map(r => [r.name, r.startCents]));
  const fundOf = name =>
    (lookup && lookup.get(name)) || { code: name, description: '' };

  // Both insurer forms are two-sided (From rows and To rows), so the
  // consolidated order drives the PDF in both trade structures.
  const fromRows = order.fromRows.map(r => ({
    ...fundOf(r.name),
    amountCents: r.amountCents,
    percentText: formatPercent(r.amountCents, starts.get(r.name) || 0),
  }));
  const toRows = order.toRows.map(r => ({
    ...fundOf(r.name),
    amountCents: r.amountCents,
    percentText: formatPercent(r.amountCents, order.totalCents),
  }));

  const overRowLimit = Math.max(fromRows.length, toRows.length) > def.rowLimit;

  const generate = async () => {
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const bytes = await fillForm(def, {
        fromRows,
        toRows,
        amountStyle,
        baseUrl: import.meta.env.BASE_URL,
      });
      downloadPdf(bytes, `Trade Plan - ${def.shortLabel}.pdf`);
      setDone(true);
    } catch (e) {
      setError(
        e instanceof FormFillError
          ? e.message
          : 'The form could not be generated. Try again, or use Copy or Print instead.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 border-t pt-5 no-print">
      <h3 className="font-semibold mb-2">Form Output</h3>
      <p className="text-sm text-gray-500 mb-3">
        Download the selected insurer form with the fund rows pre-filled ({fromRows.length} From,{' '}
        {toRows.length} To). Every other field stays blank and fillable. Review the generated form
        before use; it does not replace the back office's own form generation.
      </p>

      <div className="flex flex-wrap items-center gap-4 mb-3">
        <select
          className="border rounded px-2 py-1 text-sm"
          value={formId}
          onChange={e => {
            setFormId(e.target.value);
            setDone(false);
            setError(null);
          }}
          aria-label="Insurer form"
        >
          {FORM_DEFS.map(d => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-3 text-sm" role="group" aria-label="Amount style">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="amount-style"
              checked={amountStyle === 'dollar'}
              onChange={() => setAmountStyle('dollar')}
            />
            Dollar amounts
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="amount-style"
              checked={amountStyle === 'percent'}
              onChange={() => setAmountStyle('percent')}
            />
            Percentages
          </label>
        </div>

        <button
          onClick={generate}
          disabled={busy || overRowLimit}
          className={`px-4 py-2 rounded text-sm text-white ${
            busy || overRowLimit ? 'bg-gray-400 cursor-not-allowed' : 'bg-aspire hover:bg-aspire-dark'
          }`}
        >
          {busy ? 'Generating…' : 'Download Partially Filled PDF'}
        </button>
      </div>

      {overRowLimit && (
        <div className="text-amber-600 text-sm bg-amber-50 rounded px-3 py-2 mb-2">
          This plan has more fund rows than the form's {def.rowLimit}. Reduce the number of funds
          or split the plan across forms.
        </div>
      )}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 rounded px-3 py-2 mb-2" role="alert">
          {error}
        </div>
      )}
      {done && !error && (
        <div className="text-green-700 text-sm bg-green-50 rounded px-3 py-2 mb-2" role="status">
          PDF downloaded. Open it in Adobe Acrobat Reader to complete the remaining fields.
        </div>
      )}

      <p className="text-xs text-gray-400">
        Form {def.formNumber}, revision {def.revision}, verified against its approved fingerprint
        before filling. {def.notes}
      </p>
    </div>
  );
}
