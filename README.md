# Trade Planner

Plan fund trades while minimizing the number of trade events and getting ending balances as close as possible to the target balances. Built for Aspire Investments and Insurance.

Formerly called the Transfer Planner (v1.0.0 and v1.1.0). Terminology follows the insurer forms: trades move money between funds, and the tool reports starting, target, and ending balances for each fund, with a two-decimal percentage beside every dollar amount.

As of v2.0.0 the tool supports two trade structures (single-from trades and one consolidated multi-from order), captures fund code and fund description as separate fields (either identifies a fund), and can download either insurer form as a partially filled PDF with all other fields left blank and fillable. An About panel carries the purpose, the data statement, and five loadable demos.

## Source layout

- `src/engine.js` - calculation engine (integer cents, money conservation, minimum trades, order aggregation). No UI imports.
- `src/funds.js` - fund identity rules (code or description identifies a fund; duplicate detection).
- `src/paste.js`, `src/clipboard.js`, `src/target-sync.js`, `src/money-input.js` - input/output helpers, all UI-free and unit-tested.
- `src/demos.js` - the About panel's demo scenarios (validated by tests).
- `src/pdf/form-defs.js` - the two insurer forms as pinned dependencies: SHA-256, field counts, and explicit field-name arrays from the verified feasibility research. A new insurer revision must be re-inspected and re-approved here.
- `src/pdf/fill-form.js` - fills only the From/To fund rows, refuses unapproved assets, never flattens. pdf-lib loads lazily.
- `src/components/` - the React components for the four steps, About, Form Output, and dialogs. `src/App.jsx` orchestrates state.
- `public/forms/` - the approved blank PDFs, served on demand.

## Open the Current Version Locally

The required packages are already installed on Daniel's computer.

1. Open PowerShell or a terminal in the Knowledge Core folder.
2. Run:

   ```powershell
   npm --prefix "Aspire/Projects/Trade Planner/app" run dev
   ```

3. The terminal will show a local address, usually `http://localhost:5173/`. Hold `Ctrl` and click the address, or copy it into a browser.
4. Leave the terminal open while using the Trade Planner. Press `Ctrl+C` in the terminal when finished.

If the required packages are ever missing, run this once before starting the app:

```powershell
npm --prefix "Aspire/Projects/Trade Planner/app" install
```

### Why `index.html` Does Not Open by Itself

`index.html` is now the starting shell for a React application. It tells the browser to load `src/main.jsx`, which then loads the rest of the interface, styles, and calculation code. The source includes JSX, imported npm packages, and Tailwind CSS. A browser cannot prepare those source files directly from a double-clicked `file://` page.

Vite performs that preparation and supplies the files through the local address. This local development server is build tooling. The Trade Planner still has no backend, and its calculations still run entirely in the browser.

The switch made the growing app easier to maintain and test. The interface can be split into React components, npm can manage dependencies, Tailwind can compile the styling, and Vite can produce a small deployment-ready bundle. The trade calculation engine also has automated tests that can be run after changes.

## Development

- From the app folder, run `npm install` and then `npm run dev` to start the development server.
- `npm test` to run the test suite.
- `npm run build` to produce the production bundle in `dist/`.
- Azure Static Web Apps serves the production build from `/` by default.
- For a future subpath deployment, set `VITE_BASE_PATH` to the required path before building.

All computation runs client side in the browser. No data is transmitted anywhere.

See `../CHANGELOG.md` for version history.

## Temporary GitHub Pages Pilot

The public pilot is deployed from the `main` branch by
`.github/workflows/deploy-pages.yml`. The workflow runs the automated tests,
builds with the `/Trade-Planner/` base path, and publishes the `dist` folder to
GitHub Pages.

This temporary public deployment is appropriate only while the application
remains browser-only and contains no client data, credentials, secrets, or
saved trade instructions. Azure with named staff access remains the intended
deployment after Aspire's Microsoft administration and subscription path is
available.
