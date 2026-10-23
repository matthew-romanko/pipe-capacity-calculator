# Pipe Capacity Calculator — public development preview

A static, browser-based drainage pipe capacity calculator. This is an **unbranded development prototype**, not an official institutional publication or a verified engineering design reference. It uses a previously developed spreadsheet workflow and does not contain the original workbook.

## Important before making the repository public

- **Confirm permission to publish and adapt the source spreadsheet's formulas, lookup tables, and other workbook-derived content.** Removing a person's name or institutional branding does not remove copyright obligations or grant a license. If attribution is required, retain it or keep the repository private until the release terms are resolved.
- Do not add the original Excel file or any private project information to the public repository.
- The prototype has passed initial comparison tests, but further design-case validation is required before field use.

## Host on GitHub Pages

1. Create a repository, e.g. `pipe-capacity-calculator`, on GitHub. A public repository supports GitHub Pages with GitHub Free.
2. Upload the **contents of this extracted folder** to the repository root, keeping the `docs/` folder intact. Do not upload the ZIP itself.
3. Go to **Settings → Pages → Build and deployment**. Choose **Deploy from a branch**, `main`, and `/docs`, then save.
4. Visit the Pages URL shown by GitHub after publishing. Typically: `https://YOUR-USERNAME.github.io/pipe-capacity-calculator/`.
5. Verify material and size dropdowns, inputs, and recalculated tables on desktop and mobile.

Official GitHub instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Development

Source files are `index.html`, `css/styles.css`, `src/`, `data/`, and `tests/`. The hosted site is under `docs/`.

```bash
npm test         # Tests reference calculations and verifies built files
npm run build    # Rebuild dist/app.js and sync public files into docs/
python3 -m http.server 8000  # Optional local preview; open /docs/
```

Node.js 20 or newer is recommended. The webpage can also run as a local file because it uses a bundled classic JavaScript script.

The calculator runs in the browser; it does not use a backend, database, or accounts. Entered project information is not transmitted to the host by the app.

## Accessibility foundation (development branch)

The application aims for WCAG 2.1 Level AA and future university review, but **has not been certified as accessible**. See [`ACCESSIBILITY.md`](ACCESSIBILITY.md) for the development checklist and release gate.

The first accessibility pass adds a keyboard-visible skip link, unit-aware input labels, field-level validation messages linked with `aria-describedby`, `aria-invalid`, a polite result summary announced when a change is committed, table captions and row headers, and more visible focus styles. It does not change any hydraulic formulas or lookup data.

**Checks:** Run `npm test` for calculation and HTML structure regressions. If Python Playwright and Chromium are available, `python scripts/browser-check.py` runs a browser smoke check for interactive controls, keyboard behavior, and 320-pixel layout. Automated tests are not equivalent to a WCAG audit.

**Before an official release:** manually test keyboard-only use; NVDA + Chrome/Firefox; VoiceOver + Safari; 200% text zoom; 400% browser zoom; and an accessibility checker such as axe-core. Record and fix any findings and follow institutional accessibility review procedures.

## Scope

Preserves a single-section pipe capacity worksheet: project fields; pipe material, size, and slope; Manning hydraulic values; drainage coefficients; and the pipe comparison table. A unit selector switches between US customary and metric representations of the same section, replacing the old duplicated metric sections. This prototype does not perform rainfall-event estimation or calculate a whole-field network.

## Future release

Reintroduce any approved institutional branding and required original author/rights-holder attribution **only after confirming publication and licensing requirements**. Do not imply official endorsement while this is a personal development prototype.

## Mobile interface preview (dev / v0.2)

The responsive stylesheet gives phone users larger controls, a short jump-navigation menu, compact project fields, a prominent pipe-capacity summary, and scrollable pipe-size comparison tables. The full Excel-compatible calculation flow is unchanged.

The root `index.html` is the local browser entry point. GitHub Pages uses `docs/index.html`; run `npm run build` after editing HTML/CSS to synchronize the public copy. Check `npm test` before committing to `dev`. GitHub Pages on `main` stays unchanged until reviewed changes are merged.

Manual checks: try a phone-sized window (320–430px), use the page without a mouse, tab into each comparison table and press an arrow key to pan, and verify pipe material/size/slope changes update results. No university marks or individual researcher names are included in this development preview.

## Measurement unit toggle (v0.3 development branch)

The calculator now has a keyboard-operable Imperial (US) / Metric (SI) selector. The same two result tables are used for both unit systems. Pipe diameter labels, area, velocity, discharge, and hydraulic dimensions change to the selected units; **slope stays in percent and the Manning calculations are unchanged**.

- Switching units **does not change the actual selected pipe or contributing area**. The entered area is stored without intermediate display rounding and converted in place when switching systems. For an entered 22.9 acres, metric mode shows approximately 9.267503 hectares; switching back restores 22.9 acres.
- The metric drainage table retains the Excel workbook's **12 rows**: six coefficients converted from inches/day and six defined in centimeters/day. The US table retains its original six rows. All worksheet formula constants remain unchanged, including its approximate acres/hectare factors.
- The original metric area input (20 hectares) was independent of the 22.9-acre US input. With the unified area field, the same physical area is carried across modes, so default metric required-Q values will differ from Excel's separate 20-hectare default.
- Root files are the editable source; run `npm run build` to update `dist/` and the GitHub Pages `docs/` site. Run `npm test` and, where Playwright and Chromium are installed, `python scripts/browser-check.py` before committing.

The update keeps neutral development branding. Validation against more Excel scenarios and formal accessibility review are still pending.
