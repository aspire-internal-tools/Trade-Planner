// Loadable demo scenarios for the About section.
//
// Each demo pre-fills the whole tool with example data so a new user can
// compare a reduced-trade plan with the exact-target plan. Each scenario
// intentionally has at least two valid trade counts.
//
// Fund codes and descriptions are real Canada Life segregated funds (and match
// what the code autofill produces). Balances, targets, and scenarios are
// illustrative only, never real client data.

export const DEMOS = [
  {
    id: 'standard-rebalance',
    title: 'Standard rebalance',
    blurb:
      'One trade gets every fund within 3 percentage points of target. Two trades reach the exact mix.',
    state: {
      mode: 'single',
      accounts: [
        { code: 'A050A', description: 'CAN Canadian Equity', balance: '44000.00', status: 'keep' },
        { code: 'A065A', description: 'CAN Global Equity', balance: '33000.00', status: 'keep' },
        { code: 'A023A', description: 'CAN Canadian Core Bond', balance: '14000.00', status: 'keep' },
        { code: 'A001A', description: 'CAN Money Market', balance: '9000.00', status: 'keep' },
      ],
      targets: [
        { name: 'A050A', targetType: 'percentage', targetValue: 40 },
        { name: 'A065A', targetType: 'percentage', targetValue: 30 },
        { name: 'A023A', targetType: 'percentage', targetValue: 15 },
        { name: 'A001A', targetType: 'percentage', targetValue: 15 },
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
        { code: 'A001A', description: 'CAN Money Market', balance: '20000.00' },
        { code: 'A034A', description: 'CAN Global Balanced', balance: '40000.00', status: 'keep' },
        { code: 'A023A', description: 'CAN Canadian Core Bond', balance: '25000.00', status: 'keep' },
        { code: 'A065A', description: 'CAN Global Equity', balance: '15000.00', status: 'keep' },
      ],
      targets: [
        { name: 'A001A', targetType: 'percentage', targetValue: 0, status: 'close' },
        { name: 'A034A', targetType: 'percentage', targetValue: 45 },
        { name: 'A023A', targetType: 'percentage', targetValue: 20 },
        { name: 'A065A', targetType: 'percentage', targetValue: 35 },
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
        { code: 'A058A', description: 'CAN Canadian Dividend', balance: '55000.00', status: 'keep' },
        { code: 'A139A', description: 'CAN Sustainable Global Bond', balance: '30000.00', status: 'keep' },
        { code: 'A050A', description: 'CAN Canadian Equity', balance: '15000.00', status: 'keep' },
      ],
      targets: [
        { name: 'A058A', targetType: 'percentage', targetValue: 50 },
        { name: 'A139A', targetType: 'percentage', targetValue: 25 },
        { name: 'A050A', targetType: 'percentage', targetValue: 10 },
        {
          source: 'new',
          code: 'A111A',
          description: 'CAN Emerging Markets Equity',
          name: 'A111A',
          targetType: 'percentage',
          targetValue: 15,
        },
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
        { code: 'A050A', description: 'CAN Canadian Equity', balance: '46800.00', status: 'keep' },
        { code: 'A074A', description: 'CAN U.S. Growth', balance: '40800.00', status: 'keep' },
        { code: 'A072A', description: 'CAN International Equity', balance: '18000.00', status: 'keep' },
        { code: 'A023A', description: 'CAN Canadian Core Bond', balance: '14400.00', status: 'keep' },
      ],
      targets: [
        { name: 'A050A', targetType: 'percentage', targetValue: 30 },
        { name: 'A074A', targetType: 'percentage', targetValue: 30 },
        { name: 'A072A', targetType: 'percentage', targetValue: 20 },
        { name: 'A023A', targetType: 'percentage', targetValue: 20 },
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
        { code: 'A050A', description: 'CAN Canadian Equity', balance: '34000.00', status: 'keep' },
        { code: 'A074A', description: 'CAN U.S. Growth', balance: '29000.00', status: 'keep' },
        { code: 'A072A', description: 'CAN International Equity', balance: '22000.00', status: 'keep' },
        { code: 'A034A', description: 'CAN Global Balanced', balance: '15000.00', status: 'keep' },
      ],
      targets: [
        { name: 'A050A', targetType: 'percentage', targetValue: 30 },
        { name: 'A074A', targetType: 'percentage', targetValue: 25 },
        { name: 'A072A', targetType: 'percentage', targetValue: 20 },
        { name: 'A034A', targetType: 'percentage', targetValue: 25 },
      ],
      constraints: { maxTransfers: 2 },
    },
  },
];

export function getDemo(id) {
  return DEMOS.find(d => d.id === id) || null;
}
