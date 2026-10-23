# Accessibility standards and development checklist

**Project:** Pipe Capacity Calculator (neutral development preview)  
**Working branch:** `dev`  
**Minimum target:** WCAG 2.1 Level AA; confirm any additional institutional accessibility standards with the relevant accessibility team before official release.  
**Working principle:** No change is considered complete until its accessibility impact has been evaluated.

## Definition of done for interface changes

- [ ] All features function using only a keyboard (Tab, Shift+Tab, Enter, Space, arrow keys where appropriate); focus remains visible and in a logical order.
- [ ] All inputs have programmatically associated, descriptive labels including measurement units; instructions do not rely on placeholder text alone.
- [ ] Validation identifies the affected input, explains how to fix it, and is communicated to assistive technology (e.g., `aria-invalid`, `aria-describedby` and an appropriate error summary).
- [ ] Recalculation preserves keyboard focus and does not trigger unexpected scrolling. Updated results can be discovered or announced appropriately without a stream of announcements for every keystroke.
- [ ] Tables use `<caption>` (or equivalent accessible name), correct header relationships and clearly stated units. Wide data tables remain navigable on small screens.
- [ ] Color is never the sole way to convey a warning or status. Text contrast is at least 4.5:1 for normal text, and applicable non-text contrast is at least 3:1.
- [ ] Content is usable at 200% text zoom and 400% browser zoom / approximately 320 CSS pixels, with no loss of content or functionality (allowing WCAG's two-dimensional exceptions for genuine data tables).
- [ ] Buttons and inputs have comfortable touch targets (aim for at least 44 × 44 CSS px where practical, beyond WCAG 2.1 AA minimum).
- [ ] Page has a meaningful document title, language, main landmark, heading hierarchy, and a keyboard-visible skip link where appropriate.
- [ ] Changes pass automated checks and manual keyboard/screen-reader checks; findings and any remaining issues are documented.

## First-pass issues to evaluate in the current prototype

1. The page has a `<main>` landmark but no visible-on-focus **skip-to-main** link.
2. The calculated `<output>` values change dynamically; determine an accessible summary/status announcement strategy without excessive screen-reader announcements.
3. Inputs have visible labels, but check that measurement **units** and accessible descriptions are unambiguous; in particular distinguish acreage and hectares.
4. The numerical input error text uses an alert region; also associate errors with their specific control and set invalid state consistently.
5. The pipe-size comparison uses two side-by-side sets of columns; test screen-reader table navigation and use appropriate captions/header semantics.
6. Test contrast, focus indicators, reflow/zoom and touch usability in the neutral theme. No claim of compliance is made until checked.

## Practical testing on every substantial UI change

1. **Automated**: Run a local accessibility checker such as axe-core (e.g., via browser extension or Playwright) and keep results with development notes. Automated scans cannot certify accessibility.
2. **Keyboard**: Reload page, press Tab repeatedly through controls, operate selections, enter invalid values, and confirm focus location and visible focus styles.
3. **Screen reader**: On Windows, test NVDA with Chrome or Firefox; on an iPhone, test VoiceOver with Safari. Confirm labels, current values, units, tables, errors, and results.
4. **Responsive**: Check mobile portrait, 200% text resize and 400% browser zoom; avoid loss of content and controls.
5. **Regression**: Run `npm test` to confirm accessibility changes have not changed the hydraulic calculations.

## Release gate for an official institutional application

- Follow the applicable institutional digital accessibility policies in effect at release time.
- Work with the responsible accessibility coordinator or accessibility services office to determine the product's risk classification and required evaluation (which may include a full manual review by an approved evaluator).
- Resolve documented accessibility barriers before announcing university approval or compliance.
- Check any separate university websites/branding/governance requirements before official university publication.

## Reference links (review periodically)

- W3C WCAG 2.1: https://www.w3.org/TR/WCAG21/
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/

Last prepared: October 23, 2026. This is a development checklist, not a formal accessibility audit or compliance certification.

## Foundation implementation status — initial dev update

- Added: skip link, more explicit numeric field labels, inline errors linked through `aria-describedby` and `aria-invalid`, restrained live result summary, table captions/row headers, visible keyboard focus, and adjustments to small-text contrast.
- Verified automatically: 10 Node tests (`npm test`) and an interactive browser smoke test.
- Not yet done: comprehensive axe scan; NVDA and VoiceOver manual passes; complete 200% text/400% zoom testing across browsers; institutional manual evaluation and release authorization.
- Calculation behavior and reference lookups intentionally unchanged.

## Responsive interface update (v0.2 development branch)

- Four labeled section-jump links help keyboard, touch, and screen-reader users navigate the long single-section worksheet.
- Main pipe material, diameter, slope, and area controls use at least 48px tall fields at phone widths and 16px input text to avoid unwanted automatic zoom on iOS.
- Drainage coefficient tables retain native HTML table structure and explicitly wrap long column labels at narrow widths.
- Pipe comparison tables retain headers and captions and use separate, labeled, keyboard-focusable scroll regions, with a visible horizontal-scroll hint on small screens.
- Semantic table data, all numeric inputs, calculated outputs, and the original worksheet workflow are preserved.
- Browser layout checks covered 320, 375, 390, 430, 768, and 1280 CSS pixel widths; no page-wide horizontal overflow was observed.

**Still required before OSU release:** manual screen-reader testing on Windows and mobile, keyboard-only walkthrough at 200% and 400% zoom, accessibility review of table navigation, and a complete WCAG audit. Automated and scripted browser checks are not a certification.

## Unified unit selector (v0.3 development branch)

- The unit selector uses a native `fieldset`, `legend` and grouped radio inputs, including visible keyboard focus. Changing units should be possible with arrow keys while focus remains on the selector.
- Pipe size and drainage-area accessible labels change to match the displayed units. Result values, the live calculation summary, table captions and column headers also use the selected units.
- One pair of semantic data tables replaces the parallel US/metric tables. Keyboard-accessible horizontal scrolling remains on the size-comparison table.
- The original full-precision drainage area is maintained across unit changes until explicitly edited; only the on-screen input is rounded. Metric-view coefficients include both original worksheet groups (converted inches/day and centimeters/day).
- Checked in an automated Chromium browser at 320–1280 CSS pixels without page-wide overflow; switching back/forth, keyboard radio selection, form errors and live output updates also passed scripted checks. These checks do not establish WCAG compliance.

**Manual checks still required:** NVDA + browser and VoiceOver + Safari, magnification/zoom, announcements during rapid selection changes, and detailed review of the unified metric drainage table's 12 coefficients.
