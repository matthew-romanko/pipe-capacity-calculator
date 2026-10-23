import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Structural regression checks are useful but NOT an accessibility audit.
const html = readFileSync(new URL('../index.html', import.meta.url),'utf8');
const source = readFileSync(new URL('../src/app.js', import.meta.url),'utf8');
const css = readFileSync(new URL('../css/styles.css', import.meta.url),'utf8');

test('main landmark and first-keypress skip link exist',()=>{
  assert.match(html,/<a class="skip-link" href="#calculator-main">Skip to calculator<\/a>/);
  assert.match(html,/<main\b[^>]*id="calculator-main"[^>]*tabindex="-1"/);
  assert.match(css,/\.skip-link:focus\{transform:translateY\(0\)/);
});

test('editable numeric inputs are labeled by unit and have field-error destinations',()=>{
  for (const id of ['slope','area-acres','area-hectares']) {
    assert.match(html, new RegExp(`id="${id}"`));
    assert.match(html, new RegExp(`id="${id}-error" class="field-error" hidden`));
  }
  for (const label of ['(percent)','(acres)','(hectares)','(inches)']) {
    assert.ok(html.includes(label),`Missing label unit ${label}`);
  }
  assert.match(source, /setAttribute\('aria-invalid','true'\)/);
  assert.match(source, /setAttribute\('aria-describedby',error.id\)/);
  assert.match(source, /removeAttribute\('aria-invalid'\)/);
});

test('results have a concise live status, and tables have captions and row headers',()=>{
  assert.match(html, /id="calculation-status"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(html, /<caption class="sr-only">US customary drainage coefficients/);
  assert.match(html, /<caption class="sr-only">Metric drainage coefficients/);
  assert.match(html, /<caption id="us-comparison-table-caption"/);
  assert.match(html, /<caption id="metric-comparison-table-caption"/);
  assert.match(source, /if \(isRowHeader\) td.scope = 'row'/);
  assert.match(source, /announce\(`Pipe capacity/);
});

test('long calculator has an accessible section jump menu',()=>{
  assert.match(html, /<nav class="section-jump" aria-label="Jump to calculator sections">/);
  for (const id of ['pipe-section','us-section','sizes-section','si-section']) {
    assert.match(html, new RegExp(`href="#${id}"`));
    assert.match(html, new RegExp(`id="${id}" aria-labelledby=`));
  }
});

test('comparison tables expose keyboard-scrollable labeled regions and visual hints',()=>{
  for (const type of ['us','metric']) {
    assert.match(html, new RegExp(`class="table-scroll comparison-scroll" role="region" aria-label="[^"]+" aria-describedby="${type}-scroll-tip" tabindex="0"`));
  }
  assert.match(css, /\.comparison-scroll:focus-visible|\.table-scroll:focus-visible/);
  assert.match(css, /\.comparison-scroll \.comparison-table\{min-width:450px\}/);
  assert.match(css, /@media \(max-width:720px\)/);
});
