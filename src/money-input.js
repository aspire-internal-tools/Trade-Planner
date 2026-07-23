// Parse a user-typed dollar value ("$12,345.67", "12345.67", 12345.67).
export function parseDollarInput(val) {
  if (typeof val === 'number') return val;
  return parseFloat(String(val).replace(/[$,]/g, '')) || 0;
}
