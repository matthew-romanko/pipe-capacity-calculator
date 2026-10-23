/** Browser interface reproducing the Excel Calculator worksheet's input/output flow. */
import {calculateWorksheet, materials, pipeSizesInches} from './calculations.js';

const $ = id => document.getElementById(id);
const number = (value, digits = 3) => Number.isFinite(value)
  ? new Intl.NumberFormat('en-US', {minimumFractionDigits:digits, maximumFractionDigits:digits}).format(value)
  : '—';
const rawNumber = value => String(value).replace(/\.?0+$/, '');
const labelInches = ['3/8 in (0.375 in)','1/2 in (0.5 in)','3/4 in (0.75 in)','1 in','1.5 in','2.0 in'];
const set = (id, value) => {$(id).textContent = value;};

function setupInputs() {
  for (const material of materials) {
    const option = document.createElement('option');
    option.value = material;
    option.textContent = material;
    $('pipe-material').append(option);
  }
  for (const inches of pipeSizesInches) {
    const option = document.createElement('option');
    option.value = String(inches);
    option.textContent = String(inches);
    $('pipe-size').append(option);
  }
  $('pipe-material').value = 'Single wall CPT';
  $('pipe-size').value = '10';
  // Reproduce Excel's =TODAY() with the student's local calendar date.
  set('worksheet-date', new Intl.DateTimeFormat('en-US', {year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));
  for (const id of ['pipe-material','pipe-size','slope','area-acres','area-hectares']) {
    // Update visually as the student types; announce the new results once the
    // value is committed (change/blur) to avoid excessive screen-reader chatter.
    $(id).addEventListener('input', () => update(false));
    $(id).addEventListener('change', () => update(true));
  }
}

const buildRow = (cells, numericColumns=[], rowHeaderColumns=[]) => {
  const tr = document.createElement('tr');
  cells.forEach((val,index) => {
    const isRowHeader = rowHeaderColumns.includes(index) && val !== '' && val !== null && val !== undefined;
    const td = document.createElement(isRowHeader ? 'th' : 'td');
    if (isRowHeader) td.scope = 'row';
    td.textContent = String(val ?? '');
    if (numericColumns.includes(index)) td.className='numeric';
    tr.append(td);
  });
  return tr;
};
function fillTable(id, rows, numericColumns=[], rowHeaderColumns=[0]) {
  const fragment = document.createDocumentFragment();
  for (const cells of rows) fragment.append(buildRow(cells,numericColumns,rowHeaderColumns));
  $(id).replaceChildren(fragment);
}
function clearResults() {
  for (const id of ['velocity','assessment','capacity','capacity-large','pipe-description','manning-n','cross-area','perimeter','radius']) set(id, '—');
  for (const id of ['drainage-us-rows','pipe-comparison-rows','metric-rows','metric-comparison-rows']) $(id).replaceChildren();
}
// Every invalid input has its own visible message and programmatic description.
// Errors are reviewed together so students can fix any field without losing focus.
const numericInputs = [
  {id:'slope', label:'Slope'},
  {id:'area-acres', label:'Drainage area (acres)'},
  {id:'area-hectares', label:'Drainage area (hectares)'}
];
function readNumericInputs() {
  const values = {};
  const issues = [];
  for (const {id,label} of numericInputs) {
    const input = $(id);
    const error = $(`${id}-error`);
    const val = Number(input.value);
    let message = '';
    if (input.validity.badInput) {
      message = `${label}: enter a valid number.`;
    } else if (input.value.trim() === '') {
      message = `${label} is required.`;
    } else if (!Number.isFinite(val) || val < 0) {
      message = `${label} must be zero or greater.`;
    }
    if (message) {
      input.setAttribute('aria-invalid','true');
      input.setAttribute('aria-describedby',error.id);
      error.textContent=message;
      error.hidden=false;
      issues.push(message);
    } else {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
      error.textContent='';
      error.hidden=true;
      values[id]=val;
    }
  }
  return {values,issues};
}
function announce(message, shouldAnnounce) {
  if (shouldAnnounce) $('calculation-status').textContent = message;
}
function update(shouldAnnounce=false) {
  const error=$('validation-error');
  const {values,issues}=readNumericInputs();
  if (issues.length) {
    clearResults();
    error.textContent = `Please correct the highlighted field${issues.length===1?'':'s'}. ${issues.join(' ')}`;
    error.hidden=false;
    announce(issues.join(' '),shouldAnnounce);
    return;
  }
  try {
    const material = $('pipe-material').value;
    const diameterInches = Number($('pipe-size').value);
    const slopePercent = values.slope;
    const areaAcres = values['area-acres'];
    const areaHectares = values['area-hectares'];
    const result = calculateWorksheet({material,diameterInches,slopePercent,areaAcres,areaHectares});
    error.hidden=true;
    error.textContent='';
    set('velocity',number(result.velocityFtPerSec,4));
    set('capacity',number(result.capacityCfs,4));
    set('capacity-large',number(result.capacityCfs,4));
    set('assessment',result.velocityAssessment);
    $('assessment').className='assessment '+(result.velocityAssessment === 'Safe velocity'?'good':'warning');
    set('pipe-description',result.selectedPipeAndSize);
    set('manning-n',number(result.manningN,3));
    set('cross-area',number(result.areaSqFt,4));
    set('perimeter',number(result.wettedPerimeterFt,4));
    set('radius',number(result.hydraulicRadiusFt,4));
    fillTable('drainage-us-rows',result.drainage.map((row,i)=>[
      labelInches[i],number(row.acresDrained,2),number(row.requiredCfs,4)
    ]),[1,2]);
    const caption=`Pipe Sizes and capacity at ${slopePercent}% slope for ${material}`;
    set('capacity-comparison-caption',caption);
    set('metric-comparison-caption',caption);
    // Excel A23:D29 repeats the 14-inch size in both halves of its comparison table.
    const left=result.comparison.slice(0,7), right=result.comparison.slice(6);
    set('us-comparison-table-caption',`Pipe size comparison for ${material} at ${slopePercent} percent slope. Each pair of columns contains size in inches and capacity in cubic feet per second.`);
    fillTable('pipe-comparison-rows',left.map((item,index)=>[
      item.diameterInches,number(item.capacityCfs,4),
      right[index]?.diameterInches??'',right[index] ? number(right[index].capacityCfs,4):''
    ]),[1,3],[0,2]);
    const metricRows = [
      ...result.metric.fromInches.map(row => [
        `${rawNumber(row.coefficientCmPerDay)} cm`,number(row.hectaresDrained,2),number(row.requiredLitersPerSecond,3)
      ]),
      ...result.metric.fromCentimeters.map(row => [
        `${rawNumber(row.coefficientCmPerDay)} cm`,number(row.hectaresDrained,2),number(row.requiredLitersPerSecond,3)
      ])
    ];
    fillTable('metric-rows',metricRows,[1,2]);
    set('metric-comparison-table-caption',`Pipe size comparison for ${material} at ${slopePercent} percent slope. Each pair of columns contains size in centimeters and capacity in liters per second.`);
    fillTable('metric-comparison-rows',left.map((item,index)=>[
      number(item.diameterCm,2),number(item.capacityLitersPerSecond,3),
      right[index] ? number(right[index].diameterCm,2):'',
      right[index] ? number(right[index].capacityLitersPerSecond,3):''
    ]),[1,3],[0,2]);
    announce(`Pipe capacity ${number(result.capacityCfs,4)} cubic feet per second. Velocity ${number(result.velocityFtPerSec,4)} feet per second. ${result.velocityAssessment}. Drainage and pipe-size tables updated.`,shouldAnnounce);
  } catch (err) {
    clearResults();
    error.textContent = err instanceof Error ? err.message : 'Unable to calculate. Please review the inputs.';
    error.hidden=false;
    announce(error.textContent,shouldAnnounce);
  }
}

setupInputs();
update();
