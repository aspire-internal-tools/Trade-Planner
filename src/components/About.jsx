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
            <h3 className="font-semibold text-base mb-2">Find a practical trade plan</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Enter the current funds and target allocation.</li>
              <li>Compare fewer trades with the exact-target plan.</li>
              <li>Review every ending balance and imbalance before deciding.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">What to compare</h3>
            <dl className="grid sm:grid-cols-[9rem_1fr] gap-x-3 gap-y-2">
              <dt className="font-medium">Single-From</dt>
              <dd>One source fund per trade.</dd>
              <dt className="font-medium">Multi-From</dt>
              <dd>Several source funds on one two-sided order.</dd>
              <dt className="font-medium">5% review warning</dt>
              <dd>Flags a fund ending more than 5 percentage points from target. It does not hide the option.</dd>
              <dt className="font-medium">Output</dt>
              <dd>Copy, print, or download a partially filled insurer form.</dd>
            </dl>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-1">Live demos</h3>
            <p className="mb-2">
              Each example starts with fewer trades selected. Click the other trade counts to
              compare the ending allocation with the exact-target plan.
            </p>
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
            <ul className="list-disc pl-5 space-y-1">
              <li>Calculations stay in this browser tab and are not saved.</li>
              <li>Use fund codes or generic labels, never client names.</li>
              <li>Handle exported files under Aspire's normal practices.</li>
            </ul>
          </section>

          <section className="text-xs text-gray-400 border-t pt-3">
            Version {APP_VERSION} ({APP_DATE}). Support: Daniel Mantai.
          </section>
        </div>
      </div>
    </div>
  );
}
