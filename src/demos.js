// Loadable demo scenarios for the About section.
//
// Each demo pre-fills the whole tool with example data so a new user can
// watch a complete use case work. The scenarios come from the acceptance
// scenarios in the project's User Story (standard rebalance, closing a
// fund, adding a new fund) plus the two v2 additions (percentage-first
// planning and a multi-from internal transfer).
//
// All fund codes and descriptions are anonymous examples, never real
// client data.

export const DEMOS = [
  {
    id: 'standard-rebalance',
    title: 'Standard rebalance',
    blurb:
      'Three funds have drifted away from a 40/40/20 mix. The tool finds the smallest set of trades that restores the target allocation.',
    state: {
      mode: 'single',
      accounts: [
        { code: 'FND 101', description: 'Canadian Equity', balance: '52400.00', status: 'keep' },
        { code: 'FND 102', description: 'Global Equity', balance: '31250.00', status: 'keep' },
        { code: 'FND 103', description: 'Fixed Income', balance: '16350.00', status: 'keep' },
      ],
      targets: [
        { name: 'FND 101', targetType: 'percentage', targetValue: 40 },
        { name: 'FND 102', targetType: 'percentage', targetValue: 40 },
        { name: 'FND 103', targetType: 'percentage', targetValue: 20 },
      ],
      constraints: { maxTransfers: null, toleranceType: 'exact', toleranceValue: 0 },
    },
  },
  {
    id: 'close-into-several',
    title: 'Close one fund into several targets',
    blurb:
      'One fund is being closed out completely. Its entire balance is distributed across the two funds that remain, and the plan never sends money back into it.',
    state: {
      mode: 'single',
      accounts: [
        { code: 'FND 201', description: 'Money Market', balance: '24000.00', status: 'close' },
        { code: 'FND 202', description: 'Global Balanced', balance: '48000.00', status: 'keep' },
        { code: 'FND 203', description: 'Canadian Bond', balance: '28000.00', status: 'keep' },
      ],
      targets: [
        { name: 'FND 202', targetType: 'percentage', targetValue: 60 },
        { name: 'FND 203', targetType: 'percentage', targetValue: 40 },
      ],
      constraints: { maxTransfers: null, toleranceType: 'exact', toleranceValue: 0 },
    },
  },
  {
    id: 'add-new-fund',
    title: 'Add a brand-new fund',
    blurb:
      'A new fund starts at zero and receives a 25% allocation. Money flows into it from the existing funds, and it is never used as a source.',
    state: {
      mode: 'single',
      accounts: [
        { code: 'FND 301', description: 'Dividend Growth', balance: '61000.00', status: 'keep' },
        { code: 'FND 302', description: 'Global Bond', balance: '39000.00', status: 'keep' },
        { code: 'FND 303', description: 'Emerging Markets', balance: '', status: 'new' },
      ],
      targets: [
        { name: 'FND 301', targetType: 'percentage', targetValue: 45 },
        { name: 'FND 302', targetType: 'percentage', targetValue: 30 },
        { name: 'FND 303', targetType: 'percentage', targetValue: 25 },
      ],
      constraints: { maxTransfers: null, toleranceType: 'exact', toleranceValue: 0 },
    },
  },
  {
    id: 'percent-planning',
    title: 'Plan entirely in percentages',
    blurb:
      'Some advisors think in percentages from start to finish. Every dollar figure in the plan is paired with a two-decimal percentage, so an even three-way split shows as 33.33% / 33.33% / 33.34% and processors can enter trades either way.',
    state: {
      mode: 'single',
      accounts: [
        { code: 'FND 401', description: 'Canadian Equity', balance: '90000.00', status: 'keep' },
        { code: 'FND 402', description: 'US Equity', balance: '15000.00', status: 'keep' },
        { code: 'FND 403', description: 'International Equity', balance: '15000.00', status: 'keep' },
      ],
      targets: [
        { name: 'FND 401', targetType: 'percentage', targetValue: 33.33 },
        { name: 'FND 402', targetType: 'percentage', targetValue: 33.33 },
        { name: 'FND 403', targetType: 'percentage', targetValue: 33.34 },
      ],
      constraints: { maxTransfers: null, toleranceType: 'exact', toleranceValue: 0 },
    },
  },
  {
    id: 'multi-from-order',
    title: 'Multi-from internal transfer (mutual funds)',
    blurb:
      'A mutual fund internal transfer conversion pulls from several From funds in one consolidated order. The plan shows one two-sided order (a From table and a To table) matching the Quadrus Two Sided Transaction Form.',
    state: {
      mode: 'multi',
      accounts: [
        { code: 'MF 510', description: 'Balanced Fund A-Series', balance: '42000.00', status: 'close' },
        { code: 'MF 511', description: 'Income Fund A-Series', balance: '23000.00', status: 'close' },
        { code: 'MF 512', description: 'Growth Fund A-Series', balance: '35000.00', status: 'close' },
        { code: 'MF 610', description: 'Balanced Fund F-Series', balance: '', status: 'new' },
        { code: 'MF 611', description: 'Growth Fund F-Series', balance: '', status: 'new' },
      ],
      targets: [
        { name: 'MF 610', targetType: 'percentage', targetValue: 60 },
        { name: 'MF 611', targetType: 'percentage', targetValue: 40 },
      ],
      constraints: { maxTransfers: null, toleranceType: 'exact', toleranceValue: 0 },
    },
  },
];

export function getDemo(id) {
  return DEMOS.find(d => d.id === id) || null;
}
