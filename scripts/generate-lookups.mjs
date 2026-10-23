/** Generate the browser-loadable lookup module from the unchanged Excel lookup data.
 * Node: node scripts/generate-lookups.mjs [--check]
 */
import {readFile, writeFile} from 'node:fs/promises';
const source = new URL('../data/workbook-lookups.json', import.meta.url);
const dest = new URL('../src/lookup-data.js', import.meta.url);
const data = JSON.parse(await readFile(source, 'utf8'));
const expected = `// Generated from data/workbook-lookups.json — do not edit by hand.\nexport default ${JSON.stringify(data, null, 2)};\n`;
if (process.argv.includes('--check')) {
  const existing = await readFile(dest,'utf8');
  if (existing !== expected) { console.error('Lookup JS is out of sync with JSON. Run npm run generate:lookups.'); process.exitCode=1; }
} else {
  await writeFile(dest,expected);
  console.log('Updated src/lookup-data.js from original workbook reference data.');
}
