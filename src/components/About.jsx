import { DEMOS } from '../demos';
import { APP_VERSION, APP_DATE } from '../version';

// ─── About panel ───────────────────────────────────────────
// Explains the tool's purpose, hosts the live demos (which pre-fill the
// whole page with example data), and carries the data retention statement.
export default function About({ open, onClose, onLoadDemo }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-start justify-center z-40 overflow-y-auto py-8 no-print"
      role="dialog"
      aria-modal="true"
      aria-label="About the Trade Planner"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
          aria-label="Close About"
        >
          &times;
        </button>

        <h2 className="text-2xl text-aspire-dark border-b-2 border-aspire-gold inline-block pb-1 mb-4">
          About the Trade Planner
        </h2>

        <div className="space-y-5 text-sm text-gray-700">
          <section>
            <h3 className="font-semibold text-base mb-1">What this tool is for</h3>
            <p>
              The Trade Planner turns a current fund allocation and a target allocation into the
              smallest practical set of trades: as little processing as possible while getting the
              ending balances as close as possible to the target balances. You enter the funds you
              hold, the mix you want, and any limit on the number of trades; the tool computes the
              plan, exact to the cent, with a two-decimal percentage beside every dollar amount.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-1">How it works</h3>
            <p>
              Every fund's distance from its target splits the funds into sources (money must
              leave) and destinations (money must arrive). Each source fund has to send money out
              at least once, so the number of source funds is the true minimum number of trades,
              and the tool always achieves it. All arithmetic uses whole cents, money out always
              equals money in, and the same inputs always produce the same plan. There is no AI
              and no black box; the plan can be checked by hand.
            </p>
            <p className="mt-2">
              Two trade structures are supported: <strong>Single-From trades</strong> (each trade
              moves money out of one fund, matching segregated fund switches) and a{' '}
              <strong>Multi-From order</strong> (one consolidated order pulling from several funds
              at once, matching mutual fund internal transfer conversions). The output can be
              copied into Word, printed, or downloaded as a partially filled insurer form with
              every other field left blank and fillable.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-1">Live demos</h3>
            <p className="mb-2">
              Each demo fills the whole page with example data so you can watch a complete use
              case. All codes and balances are made-up examples.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3 text-amber-700">
              Loading a demo replaces everything currently entered in the tool. You will be asked
              to confirm if you have data on the page.
            </div>
            <ul className="space-y-2">
              {DEMOS.map(demo => (
                <li key={demo.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{demo.title}</div>
                      <div className="text-gray-500 mt-1">{demo.blurb}</div>
                    </div>
                    <button
                      onClick={() => onLoadDemo(demo)}
                      className="shrink-0 bg-aspire text-white px-3 py-1.5 rounded text-sm hover:bg-aspire-dark"
                    >
                      Load demo
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-1">Your data</h3>
            <p>
              Everything runs inside your browser. Nothing you type is sent anywhere: no server
              receives the numbers, no database stores them, and nothing is saved to the computer.
              Closing the tab erases everything; each use starts blank. Use fund codes and generic
              labels, never client names. What you do with the copied, printed, or downloaded
              output follows Aspire's normal document-handling practices.
            </p>
          </section>

          <section className="text-xs text-gray-400 border-t pt-3">
            Version {APP_VERSION} ({APP_DATE}). Support: Daniel Mantai.
          </section>
        </div>
      </div>
    </div>
  );
}
