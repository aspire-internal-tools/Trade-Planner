import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { FORM_DEFS, getFormDef } from './form-defs';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');

describe('form definitions', () => {
  it('exposes both approved forms', () => {
    expect(FORM_DEFS.map(d => d.id).sort()).toEqual(['quadrus-two-sided', 'seg-switch']);
    expect(getFormDef('seg-switch').formNumber).toBe('70-0019');
    expect(getFormDef('unknown')).toBeNull();
  });

  for (const def of FORM_DEFS) {
    describe(def.id, () => {
      it('defines exactly ten From and ten To rows with unique field names', () => {
        expect(def.fromRows).toHaveLength(10);
        expect(def.toRows).toHaveLength(10);
        const all = [...def.fromRows, ...def.toRows].flatMap(r => [r.code, r.name, r.amount]);
        expect(new Set(all).size).toBe(all.length);
      });

      it('ships a blank form asset matching the approved SHA-256', () => {
        const bytes = readFileSync(join(publicDir, def.file));
        const hash = createHash('sha256').update(bytes).digest('hex');
        expect(hash).toBe(def.sha256);
      });
    });
  }

  it('keeps the Quadrus To-table arrays explicit (numbering gaps are real)', () => {
    const def = getFormDef('quadrus-two-sided');
    const names = def.toRows.flatMap(r => [r.code, r.name, r.amount]);
    // TextField_106 and TextField_113 do not exist on the form
    expect(names).not.toContain('TextField_106');
    expect(names).not.toContain('TextField_113');
    expect(def.toRows[5].name).toBe('TextField_110');
    expect(def.toRows[6].amount).toBe('TextField_118');
  });
});
