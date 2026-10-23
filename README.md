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

Preserves a single-section pipe capacity worksheet: project fields; pipe material, size, and slope; Manning hydraulic values; US customary drainage coefficients; pipe comparison table; and metric outputs. This prototype does not perform rainfall-event estimation or calculate a whole-field network.

## Future release

Reintroduce any approved institutional branding and required original author/rights-holder attribution **only after confirming publication and licensing requirements**. Do not imply official endorsement while this is a personal development prototype.
