import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Structural checks only — manual screen-reader/keyboard review still required.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../css/styles.css',import.meta.url),'utf8');

test('page landmark and keyboard-accessible skip link exist',()=>{
  assert.match(html,/<a class="skip-link" href="#calculator-main">Skip to calculator<\/a>/);
  assert.match(html,/<main\b[^>]*id="calculator-main"[^>]*tabindex="-1"/);
  assert.match(css,/\.skip-link:focus\{transform:translateY\(0\)/);
});

test('units switch uses labeled native radios with visible keyboard focus',()=>{
  assert.match(html,/<fieldset class="unit-toggle">[\s\S]*?<legend>Measurement units<\/legend>/);
  assert.match(html,/type="radio" name="units" value="us" checked/);
  assert.match(html,/type="radio" name="units" value="metric"/);
  assert.match(css,/\.unit-choice input:focus-visible\+span/);
  assert.match(source,/input\.addEventListener\('change'/);
});

test('editable numbers have unit-aware accessible labels and inline validation',()=>{
  for (const id of ['slope','drainage-area']) {
    assert.match(html,new RegExp(`id="${id}"`));
    assert.match(html,new RegExp(`id="${id}-error" class="field-error" hidden`));
  }
  for (const label of ['(percent)','(acres)','(inches)']) assert.ok(html.includes(label),`Missing ${label}`);
  assert.match(html,/id="drainage-area-label-unit"/);
  assert.match(html,/id="pipe-size-label-unit"/);
  assert.match(source,/setAttribute\('aria-invalid','true'\)/);
  assert.match(source,/setAttribute\('aria-describedby',error.id\)/);
  assert.match(source,/removeAttribute\('aria-invalid'\)/);
});

test('one drainage table and one pipe comparison table have accessible headers',()=>{
  assert.equal((html.match(/id="drainage-rows"/g)||[]).length,1);
  assert.equal((html.match(/id="pipe-comparison-rows"/g)||[]).length,1);
  assert.match(html,/<caption id="drainage-table-caption" class="sr-only">/);
  assert.match(html,/<caption id="comparison-table-caption" class="sr-only">/);
  assert.match(source,/if \(isRowHeader\) cell.scope='row'/);
  assert.doesNotMatch(html,/id="metric-rows"|id="metric-comparison-rows"/);
});

test('live status and unit-specific announcement are available',()=>{
  assert.match(html,/id="calculation-status"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(source,/announce\(`\$\{system\}\. Pipe capacity/);
  assert.match(source,/applyUnitLabels\(\)/);
});

test('short section menu remains fully navigable',()=>{
  assert.match(html,/<nav class="section-jump" aria-label="Jump to calculator sections">/);
  for (const id of ['pipe-section','us-section','sizes-section']) {
    assert.match(html,new RegExp(`href="#${id}"`));
    assert.match(html,new RegExp(`id="${id}" aria-labelledby=`));
  }
  assert.doesNotMatch(html,/href="#si-section"/);
});

test('comparison table is keyboard scrollable and responsive',()=>{
  assert.match(html,/class="table-scroll comparison-scroll" role="region" aria-label="Pipe size capacities, horizontally scrollable" aria-describedby="comparison-scroll-tip" tabindex="0"/);
  assert.match(css,/\.comparison-scroll \.comparison-table\{min-width:450px\}/);
  assert.match(css,/@media \(max-width:720px\)/);
});
