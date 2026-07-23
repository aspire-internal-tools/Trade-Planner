// Loadable demo scenarios for the About section.
//
// Each demo pre-fills the whole tool with example data so a new user can
// compare a reduced-trade plan with the exact-target plan. Each scenario
// intentionally has at least two valid trade counts.
//
// All fund codes and descriptions are anonymous examples, never real
// client data.

export const DEMOS = [
  {
    id: 'standard-rebalance',
    title: 'Standard rebalance',
    blurb:
      'One trade gets every fund within 3 percentage points of target. Two trades reach the exact mix.',
    state: {
      mode: 'single',
      accounts: [
        { code: 'FND 101', description: 'Canadian Equity', balance: '44000.00', status: 'keep' },
        { code: 'FND 102', description: 'Global Equity', balance: '33000.00', status: 'keep' },
        { code: 'FND 103', description: 'Fixed Income', balance: '14000.00', status: 'keep' },
        { code: 'FND 104', description: 'Cash', balance: '9000.00', status: 'keep' },
      ],
      targets: [
        { name: 'FND 101', targetType: 'percentage', targetValue: 40 },
        { name: 'FND 102', targetType: 'percentage', targetValue: 30 },
        { name: 'FND 103', targetType: 'percentage', targetValue: 15 },
        { name: 'FND 104', targetType: 'percentage', targetValue: 15 },
      ],
      constraints: { maxTransfers: 1 },
    },
  },
  {
    id: 'close-into-several',
    title: 'Close one fund into several targets',
    blurb:
      'One required closing trade lands within 5 percentage points. A second trade reaches every target exactly.',
    state: {
      mode: 'single',
      accounts: [
        { code: 'FND 201', description: 'Money Market', balance: '20000.00', status: 'close' },
        { code: 'FND 202', description: 'Global Balanced', balance: '40000.00', status: 'keep' },
        { code: 'FND 203', description: 'Canadian Bond', balance: '25000.00', status: 'keep' },
        { code: 'FND 204', description: 'Global Equity', balance: '15000.00', status: 'keep' },
      ],
      targets: [
        { name: 'FND 202', targetType: 'percentage', targetValue: 45 },
        { name: 'FND 203', targetType: 'percentage', targetValue: 20 },
        { name: 'FND 204', targetType: 'percentage', targetValue: 35 },
      ],
      constraints: { maxTransfers: 1 },
    },
  },
  {
    id: 'add-new-fund',
    title: 'Add a brand-new fund',
    blurb:
      'Two trades fund the new holding and stay within 5 percentage points. Three trades reach the exact target.',
    state: {
      mode: 'single',
      accounts: [
        { code: 'FND 301', description: 'Dividend Growth', balance: '55000.00', status: 'keep' },
        { code: 'FND 302', description: 'Global Bond', balance: '30000.00', status: 'keep' },
        { code: 'FND 303', description: 'Canadian Equity', balance: '15000.00', status: 'keep' },
        { code: 'FND 304', description: 'Emerging Markets', balance: '', status: 'new' },
      ],
      targets: [
        { name: 'FND 301', targetType: 'percentage', targetValue: 50 },
        { name: 'FND 302', targetType: 'percentage', targetValue: 25 },
        { name: 'FND 303', targetType: 'percentage', targetValue: 10 },
        { name: 'FND 304', targetType: 'percentage', targetValue: 15 },
      ],
      constraints: { maxTransfers: 2 },
    },
  },
  {
    id: 'percent-planning',
    title: 'Plan entirely in percentages',
    blurb:
      'One trade comes within 4 percentage points. Two trades reach the 30% / 30% / 20% / 20% target exactly.',
    state: {
      mode: 'single',
      accounts: [
        { code: 'FND 401', description: 'Canadian Equity', balance: '46800.00', status: 'keep' },
        { code: 'FND 402', description: 'US Equity', balance: '40800.00', status: 'keep' },
        { code: 'FND 403', description: 'International Equity', balance: '18000.00', status: 'keep' },
        { code: 'FND 404', description: 'Fixed Income', balance: '14400.00', status: 'keep' },
      ],
      targets: [
        { name: 'FND 401', targetType: 'percentage', targetValue: 30 },
        { name: 'FND 402', targetType: 'percentage', targetValue: 30 },
        { name: 'FND 403', targetType: 'percentage', targetValue: 20 },
        { name: 'FND 404', targetType: 'percentage', targetValue: 20 },
      ],
      constraints: { maxTransfers: 1 },
    },
  },
  {
    id: 'multi-from-order',
    title: 'Consolidate a multi-from order',
    blurb:
      'Two source funds create a smaller two-sided order within 2 percentage points. Three sources reach the exact target.',
    state: {
      mode: 'multi',
      accounts: [
        { code: 'MF 510', description: 'Canadian Equity', balance: '34000.00', status: 'keep' },
        { code: 'MF 511', description: 'US Equity', balance: '29000.00', status: 'keep' },
        { code: 'MF 512', description: 'International Equity', balance: '22000.00', status: 'keep' },
        { code: 'MF 610', description: 'Balanced Fund', balance: '15000.00', status: 'keep' },
      ],
      targets: [
        { name: 'MF 510', targetType: 'percentage', targetValue: 30 },
        { name: 'MF 511', targetType: 'percentage', targetValue: 25 },
        { name: 'MF 512', targetType: 'percentage', targetValue: 20 },
        { name: 'MF 610', targetType: 'percentage', targetValue: 25 },
      ],
      constraints: { maxTransfers: 2 },
    },
  },
];

export function getDemo(id) {
  return DEMOS.find(d => d.id === id) || null;
}
