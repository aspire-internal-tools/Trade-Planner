// Partially filled PDF output.
//
// Loads a pinned blank insurer form, verifies its SHA-256 fingerprint and
// field inventory, writes ONLY the From and To fund rows, and returns the
// bytes for download. The form is never flattened, so every other field
// stays blank and fillable for the advisor (Jill's requirement).
//
// pdf-lib is imported dynamically so the main app does not pay its
// download cost until someone actually requests a form.

import { formatMoney } from '../engine.js';

export class FormFillError extends Error {}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Amount cell text for one row: dollars or a two-decimal percentage. */
export function amountText(row, amountStyle) {
  if (amountStyle === 'percent') return row.percentText;
  return formatMoney(row.amountCents);
}

/**
 * Fill one form.
 *
 * def: an entry from FORM_DEFS.
 * fromRows / toRows: [{ code, description, amountCents, percentText }]
 *   - percentText for a From row is the percent of that fund's starting
 *     balance; for a To row it is the percent of the money being moved.
 * amountStyle: 'dollar' | 'percent' (processors accept either on these forms).
 * baseUrl: import.meta.env.BASE_URL of the running app.
 *
 * Returns Uint8Array of the filled PDF.
 */
export async function fillForm(def, { fromRows, toRows, amountStyle = 'dollar', baseUrl = '/' }) {
  if (fromRows.length > def.rowLimit || toRows.length > def.rowLimit) {
    throw new FormFillError(
      `This plan needs ${Math.max(fromRows.length, toRows.length)} rows but the ` +
        `${def.shortLabel} form has ${def.rowLimit}. Reduce the number of funds ` +
        `or split the plan across forms.`
    );
  }

  const response = await fetch(`${baseUrl}${def.file}`);
  if (!response.ok) {
    throw new FormFillError(`Could not load the blank form (HTTP ${response.status}).`);
  }
  const bytes = await response.arrayBuffer();

  const hash = await sha256Hex(bytes);
  if (hash !== def.sha256) {
    throw new FormFillError(
      'The blank form on the server does not match the approved revision ' +
        `(${def.formNumber}, ${def.revision}). Filling refused; the form asset ` +
        'needs re-qualification before use.'
    );
  }

  const { PDFDocument } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.load(bytes);
  const form = pdfDoc.getForm();

  const fieldNames = new Set(form.getFields().map(f => f.getName()));
  const required = [...def.fromRows, ...def.toRows].flatMap(r => [r.code, r.name, r.amount]);
  const missing = required.filter(n => !fieldNames.has(n));
  if (missing.length > 0) {
    throw new FormFillError(
      `The form is missing ${missing.length} expected field(s) (first: ${missing[0]}). ` +
        'Filling refused; the mapping needs re-qualification.'
    );
  }
  if (fieldNames.size !== def.expectedFieldCount) {
    throw new FormFillError(
      `The form has ${fieldNames.size} fields but ${def.expectedFieldCount} were approved. ` +
        'Filling refused; the form asset needs re-qualification.'
    );
  }

  const writeRow = (mapRow, row) => {
    form.getTextField(mapRow.code).setText(row.code || '');
    form.getTextField(mapRow.name).setText(row.description || '');
    form.getTextField(mapRow.amount).setText(amountText(row, amountStyle));
  };
  fromRows.forEach((row, i) => writeRow(def.fromRows[i], row));
  toRows.forEach((row, i) => writeRow(def.toRows[i], row));

  // Never flatten: flattening would remove the remaining interactive fields.
  return pdfDoc.save();
}

/** Trigger a browser download of filled PDF bytes. */
export function downloadPdf(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
