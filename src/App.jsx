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
let nextTargetId = 1;
function makeAccount(code = '', description = '', balance = '', percentage = '') {
  return { id: nextId++, code, description, balance, percentage };
}

function makeTarget(code = '', description = '', targetType = 'percentage', targetValue = '') {
  return {
    id: `new-${nextTargetId++}`,
    source: 'new',
    name: code.trim() || description.trim(),
    code,
    description,
    targetType,
    targetValue,
    status: 'target',
  };
}

const DEFAULT_CONSTRAINTS = { maxTransfers: null };

function blankAccounts() {
  return [makeAccount(), makeAccount()];
}

// ─── Main App ──────────────────────────────────────────────
function AppInner() {
  const [accounts, setAccounts] = useState(blankAccounts);
  const [targets, setTargets] = useState([]);
  const [currentEntryMode, setCurrentEntryMode] = useState('amount');
  const [currentTotal, setCurrentTotal] = useState('');
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
  const hasEnteredData =
    accounts.some(a => a.code.trim() || a.description.trim() || String(a.balance).trim()) ||
    targets.some(target => target.source === 'new');

  const applyState = state => {
    const nextAccounts = state.accounts.map(a =>
      makeAccount(a.code || '', a.description || '', a.balance || '', a.percentage || '')
    );
    const suppliedTargets = (state.targets || []).map(target => {
      if (target.source === 'new') {
        return {
          ...makeTarget(
            target.code || '',
            target.description || '',
            target.targetType,
            target.targetValue
          ),
          status: target.status || 'target',
        };
      }
      const accountIndex = state.accounts.findIndex(
        account => fundIdentifier(account) === target.name
      );
      const account = nextAccounts[accountIndex];
      return {
        ...target,
        id: account ? `current-${account.id}` : target.id,
        source: 'current',
        sourceAccountId: account?.id,
        code: account?.code || target.code || '',
        description: account?.description || target.description || '',
        status: target.status || 'target',
      };
    });
    setAccounts(nextAccounts);
    setTargets(syncTargetsToAccounts(nextAccounts, suppliedTargets));
    setCurrentEntryMode(state.currentEntryMode || 'amount');
    setCurrentTotal(state.currentTotal || '');
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
    () => {
      const targetByAccountId = new Map(
        targets
          .filter(target => target.source === 'current')
          .map(target => [target.sourceAccountId, target])
      );
      const current = accounts.map(account => {
        const target = targetByAccountId.get(account.id);
        const closing =
          target && (target.status === 'close' || Number(target.targetValue) === 0);
        return {
          name: fundIdentifier(account),
          balanceCents: toCents(parseDollarInput(account.balance)),
          status: closing ? 'close' : 'keep',
        };
      });
      const added = targets
        .filter(target => target.source === 'new' && !fundIsBlank(target))
        .map(target => ({
          name: fundIdentifier(target),
          balanceCents: 0,
          status: 'new',
        }));
      return [...current, ...added];
    },
    [accounts, targets]
  );

  const lookup = useMemo(() => buildFundLookup([...accounts, ...targets]), [accounts, targets]);

  const totalPoolCents = useMemo(
    () => accountsForEngine.reduce((s, a) => s + a.balanceCents, 0),
    [accountsForEngine]
  );

  const validation = useMemo(
    () =>
      validateTargets(
        accountsForEngine,
        targets
          .filter(target => !fundIsBlank(target))
          .map(target => ({
            ...target,
            name: fundIdentifier(target),
            targetValue: target.status === 'close' ? 0 : Number(target.targetValue) || 0,
          }))
      ),
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
    if (targets.some(target => fundIsBlank(target))) return null;
    if (findDuplicateIdentifiers(accounts).length > 0) return null;
    if (findDuplicateIdentifiers(targets).length > 0) return null;
    if (
      currentEntryMode === 'percentage' &&
      Math.abs(
        accounts.reduce((sum, account) => sum + (Number(account.percentage) || 0), 0) - 100
      ) > 0.001
    ) {
      return null;
    }

    return computeTradePlan(accountsForEngine, validation.targetMap, {
      maxTransfers: constraints.maxTransfers,
    });
  }, [accountsForEngine, validation, constraints, accounts, targets, currentEntryMode]);

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
        <CurrentState
          accounts={accounts}
          setAccounts={updateAccounts}
          makeAccount={makeAccount}
          entryMode={currentEntryMode}
          setEntryMode={setCurrentEntryMode}
          enteredTotal={currentTotal}
          setEnteredTotal={setCurrentTotal}
        />
        <TargetFunds
          targets={targets}
          setTargets={setTargets}
          totalPoolCents={totalPoolCents}
          validation={validation}
          makeTarget={makeTarget}
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
