import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { FORM_DEFS } from './form-defs';
import { amountText } from './fill-form';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');

describe('amountText', () => {
  const row = { amountCents: 1234567, percentText: '66.67%' };
  it('writes dollars by default', () => {
    expect(amountText(row, 'dollar')).toBe('$12,345.67');
  });
  it('writes the two-decimal percentage when requested', () => {
    expect(amountText(row, 'percent')).toBe('66.67%');
  });
});

// Round-trip against the real blank form assets: every mapped field must
// exist, accept a value, and survive a save/reload with the total logical
// field count unchanged and unmapped fields still interactive.
describe('pdf fill round-trip', () => {
  for (const def of FORM_DEFS) {
    it(`${def.id}: fills fund rows and preserves all ${def.expectedFieldCount} fields`, async () => {
      const bytes = readFileSync(join(publicDir, def.file));
      const pdfDoc = await PDFDocument.load(bytes);
      const form = pdfDoc.getForm();
      expect(form.getFields().length).toBe(def.expectedFieldCount);

      const writeRow = (mapRow, i, side) => {
        form.getTextField(mapRow.code).setText(`TST ${side}${i + 1}`);
        form.getTextField(mapRow.name).setText(`Test ${side} Fund ${i + 1}`);
        form.getTextField(mapRow.amount).setText('$1,000.00');
      };
      def.fromRows.forEach((r, i) => writeRow(r, i, 'F'));
      def.toRows.forEach((r, i) => writeRow(r, i, 'T'));

      const saved = await pdfDoc.save();
      const reopened = await PDFDocument.load(saved);
      const reform = reopened.getForm();
      expect(reform.getFields().length).toBe(def.expectedFieldCount);
      expect(reform.getTextField(def.fromRows[0].code).getText()).toBe('TST F1');
      expect(reform.getTextField(def.toRows[9].amount).getText()).toBe('$1,000.00');
      // an unmapped field stays blank and interactive
      const mapped = new Set(
        [...def.fromRows, ...def.toRows].flatMap(r => [r.code, r.name, r.amount])
      );
      const untouched = reform
        .getFields()
        .find(f => !mapped.has(f.getName()) && f.constructor.name === 'PDFTextField');
      expect(untouched).toBeTruthy();
      expect(untouched.getText() || '').toBe('');
    }, 30000);
  }
});
