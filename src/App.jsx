import { useState, useMemo, Component } from 'react';
import { toCents, computeTradePlan, validateTargets, buildOrder } from './engine';
import { APP_VERSION, APP_DATE } from './version';
import { syncTargetsToAccounts } from './target-sync';
import { fundIdentifier, fundIsBlank, buildFundLookup, findDuplicateIdentifiers } from './funds';
import { parseDollarInput } from './money-input';
import CurrentState from './components/CurrentState.jsx';
import TargetFunds from './components/TargetFunds.jsx';
import TradeControls from './components/TradeControls.jsx';
import TradePlan from './components/TradePlan.jsx';
import About from './components/About.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';

// ─── Error Boundary ────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded p-6">
            <h2 className="text-red-800 font-bold text-lg mb-2">Something went wrong</h2>
            <pre className="text-red-600 text-sm whitespace-pre-wrap">{this.state.error.message}</pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── State helpers ─────────────────────────────────────────
let nextId = 1;
function makeAccount(code = '', description = '', balance = '', status = 'keep') {
  return { id: nextId++, code, description, balance, status };
}

const DEFAULT_CONSTRAINTS = { maxTransfers: null };

function blankAccounts() {
  return [makeAccount(), makeAccount()];
}

// ─── Main App ──────────────────────────────────────────────
function AppInner() {
  const [accounts, setAccounts] = useState(blankAccounts);
  const [targets, setTargets] = useState([]);
  const [constraints, setConstraints] = useState(DEFAULT_CONSTRAINTS);
  const [mode, setMode] = useState('single');
  const [aboutOpen, setAboutOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { title, message, confirmLabel, run }

  const updateAccounts = updater => {
    const nextAccounts = updater(accounts);
    setAccounts(nextAccounts);
    setTargets(previousTargets => syncTargetsToAccounts(nextAccounts, previousTargets));
  };

  // Anything typed on the page means destructive actions need confirmation.
  const hasEnteredData = accounts.some(
    a => a.code.trim() || a.description.trim() || String(a.balance).trim()
  );

  const applyState = state => {
    const nextAccounts = state.accounts.map(a =>
      makeAccount(a.code, a.description, a.balance, a.status)
    );
    setAccounts(nextAccounts);
    setTargets(syncTargetsToAccounts(nextAccounts, state.targets || []));
    setConstraints(state.constraints || DEFAULT_CONSTRAINTS);
    setMode(state.mode || 'single');
  };

  const loadDemo = demo => {
    const run = () => {
      applyState(demo.state);
      setAboutOpen(false);
      setPendingAction(null);
    };
    if (hasEnteredData) {
      setPendingAction({
        title: `Load demo: ${demo.title}`,
        message:
          'Loading this demo replaces everything currently entered on the page. This cannot be undone.',
        confirmLabel: 'Replace and load demo',
        run,
      });
    } else {
      run();
    }
  };

  const clearAll = () => {
    const run = () => {
      applyState({ accounts: [{}, {}], targets: [], constraints: DEFAULT_CONSTRAINTS, mode: 'single' });
      setPendingAction(null);
    };
    if (hasEnteredData) {
      setPendingAction({
        title: 'Clear everything?',
        message: 'This erases all funds, balances, and targets so you can start from scratch. This cannot be undone.',
        confirmLabel: 'Clear all',
        run,
      });
    } else {
      run();
    }
  };

  // Derived data
  const accountsForEngine = useMemo(
    () =>
      accounts.map(a => ({
        name: fundIdentifier(a),
        balanceCents: a.status === 'new' ? 0 : toCents(parseDollarInput(a.balance)),
        status: a.status,
      })),
    [accounts]
  );

  const lookup = useMemo(() => buildFundLookup(accounts), [accounts]);

  const totalPoolCents = useMemo(
    () => accountsForEngine.reduce((s, a) => s + a.balanceCents, 0),
    [accountsForEngine]
  );

  const validation = useMemo(
    () => validateTargets(accountsForEngine, targets),
    [accountsForEngine, targets]
  );

  const surplusCount = useMemo(() => {
    if (!validation.valid || !validation.targetMap) return 0;
    return accountsForEngine.filter(a => {
      if (a.status === 'close') return a.balanceCents > 0;
      const target = validation.targetMap.get(a.name) || 0;
      return a.balanceCents > target;
    }).length;
  }, [accountsForEngine, validation]);

  const mandatoryCount = useMemo(
    () => accountsForEngine.filter(a => a.status === 'close' && a.balanceCents > 0).length,
    [accountsForEngine]
  );

  const plan = useMemo(() => {
    if (!validation.valid || !validation.targetMap) return null;
    if (accounts.some(a => fundIsBlank(a))) return null;
    if (findDuplicateIdentifiers(accounts).length > 0) return null;

    return computeTradePlan(accountsForEngine, validation.targetMap, {
      maxTransfers: constraints.maxTransfers,
    });
  }, [accountsForEngine, validation, constraints, accounts]);

  const order = useMemo(() => (plan ? buildOrder(plan) : null), [plan]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8 no-print">
        <div className="flex items-start justify-between">
          <img
            src={`${import.meta.env.BASE_URL}aspire-logo.png`}
            alt="Aspire Investments and Insurance"
            className="h-12 w-auto mb-4"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setAboutOpen(true)}
              className="text-sm border border-aspire text-aspire px-3 py-1.5 rounded hover:bg-aspire-tint"
            >
              About
            </button>
            <button
              onClick={clearAll}
              className="text-sm border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-50"
            >
              Clear All
            </button>
          </div>
        </div>
        <h1 className="text-3xl text-aspire-dark border-b-2 border-aspire-gold inline-block pb-1">
          Trade Planner
        </h1>
        <p className="text-gray-500 mt-2">
          Minimize the number of trades while getting ending balances as close as possible to the
          target balances.
        </p>
      </header>

      <div className="space-y-6 no-print">
        <CurrentState accounts={accounts} setAccounts={updateAccounts} makeAccount={makeAccount} />
        <TargetFunds
          targets={targets}
          setTargets={setTargets}
          totalPoolCents={totalPoolCents}
          validation={validation}
          lookup={lookup}
        />
        <TradeControls
          mode={mode}
          setMode={setMode}
          constraints={constraints}
          setConstraints={setConstraints}
          surplusCount={surplusCount}
          mandatoryCount={mandatoryCount}
        />
      </div>

      <div className="mt-6">
        <TradePlan plan={plan} mode={mode} order={order} lookup={lookup} />
      </div>

      <footer className="mt-8 text-center text-xs text-gray-400 no-print">
        All computation runs in your browser. No data is transmitted anywhere. See About for the
        full data statement.
        <span className="block mt-1">
          Version {APP_VERSION} ({APP_DATE})
        </span>
      </footer>

      <About open={aboutOpen} onClose={() => setAboutOpen(false)} onLoadDemo={loadDemo} />
      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction?.title}
        message={pendingAction?.message}
        confirmLabel={pendingAction?.confirmLabel}
        onConfirm={() => pendingAction?.run()}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
