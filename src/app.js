/** Browser interface for the original single-section worksheet, with display-only unit switching. */
import {calculateWorksheet, materials, pipeSizesInches} from './calculations.js';

// Match the conversion factors already used in the workbook-backed calculation engine.
const ACRES_PER_HECTARE = 2.471;
const VIEW_FEET_PER_METER = 3.2808399;
const VIEW_LITERS_PER_CFS = 28.3168466;
const INCHES_TO_CM = 2.54;
const $ = id => document.getElementById(id);
const number = (value, digits = 3) => Number.isFinite(value)
  ? new Intl.NumberFormat('en-US', {minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value)
  : '—';
const conciseNumber = (value, digits = 6) => String(Number(value.toFixed(digits)));
const labelInches = ['3/8 in (0.375 in)','1/2 in (0.5 in)','3/4 in (0.75 in)','1 in','1.5 in','2.0 in'];
const set = (id,value) => { $(id).textContent=value; };

// Canonical inputs never change merely because the student flips a unit switch.
// The displayed area is rounded for readability, but the original value is
// retained at full precision until the student edits that input.
let unitSystem = 'us';
let canonicalAreaAcres = 22.9;
let areaEdited = false;
const isMetric = () => unitSystem === 'metric';
const areaForDisplay = () => isMetric() ? canonicalAreaAcres / ACRES_PER_HECTARE : canonicalAreaAcres;
const diameterForDisplay = inches => isMetric() ? inches * INCHES_TO_CM : inches;

function setupInputs() {
  for (const material of materials) {
    const option=document.createElement('option');
    option.value=material;
    option.textContent=material;
    $('pipe-material').append(option);
  }
  for (const inches of pipeSizesInches) {
    const option=document.createElement('option');
    option.value=String(inches);
    $('pipe-size').append(option);
  }
  $('pipe-material').value='Single wall CPT';
  $('pipe-size').value='10';
  set('worksheet-date',new Intl.DateTimeFormat('en-US',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));

  for (const id of ['pipe-material','pipe-size','slope']) {
    $(id).addEventListener('input',()=>update(false));
    $(id).addEventListener('change',()=>update(true));
  }
  $('drainage-area').addEventListener('input',()=>{ areaEdited=true; update(false); });
  $('drainage-area').addEventListener('change',()=>{ areaEdited=true; update(true); });
  for (const input of document.querySelectorAll('input[name="units"]')) {
    input.addEventListener('change',()=>{
      if (!input.checked) return;
      unitSystem=input.value;
      areaEdited=false;
      $('drainage-area').value=conciseNumber(areaForDisplay(),6);
      applyUnitLabels();
      update(true);
    });
  }
  applyUnitLabels();
}

function applyUnitLabels() {
  const metric=isMetric();
  const systemName=metric?'METRIC (SI)':'IMPERIAL (US)';
  set('drainage-unit-tag',systemName);
  set('comparison-unit-tag',systemName);
  set('pipe-size-label-unit',metric?'(centimeters)':'(inches)');
  set('pipe-size-unit',metric?'cm':'inches');
  for (const option of $('pipe-size').options) {
    option.textContent=conciseNumber(diameterForDisplay(Number(option.value)),3);
  }
  set('drainage-area-label-unit',metric?'(hectares)':'(acres)');
  set('drainage-area-unit',metric?'ha':'acres');
  set('required-q-label',metric?'Required Q (L/s)':'Required Q (cfs)');
  set('velocity-unit',metric?'m/s':'ft/s');
  set('capacity-unit',metric?'L/s':'cfs');
  set('capacity-large-unit',metric?'L/s':'cfs');
  set('cross-area-unit',metric?'m²':'sq ft');
  set('perimeter-unit',metric?'m':'ft');
  set('radius-unit',metric?'m':'ft');
  set('drainage-col-coeff',metric?'Drainage coefficient (cm/day)':'Drainage coefficient (in/day)');
  set('drainage-col-area',metric?'Hectares drained':'Acres drained');
  set('drainage-col-flow',metric?'Required Q (L/s)':'Required Q (cfs)');
  set('drainage-table-help',metric
    ? 'Area drained uses the selected pipe capacity; required Q uses your entered hectares. The original worksheet includes both inch-based coefficients converted to cm/day and a second set specified directly in cm/day.'
    : 'Area drained uses the selected pipe capacity; required Q uses your entered acres.');
  set('drainage-table-caption',metric
    ? 'Metric drainage coefficients in centimeters per day, hectares drained, and required discharge in liters per second. Includes converted inch-based and centimeter-based drainage coefficients from the reference worksheet.'
    : 'US customary drainage coefficients in inches per day, acres drained, and required discharge in cubic feet per second.');
  for (const id of ['size-left','size-right']) set(id,metric?'Size (cm)':'Size (in)');
  for (const id of ['flow-left','flow-right']) set(id,metric?'Q (L/s)':'Q (cfs)');
}

const buildRow = (cells,numericColumns=[],rowHeaderColumns=[]) => {
  const tr=document.createElement('tr');
  cells.forEach((val,index)=>{
    const isRowHeader=rowHeaderColumns.includes(index) && val!=='' && val!==null && val!==undefined;
    const cell=document.createElement(isRowHeader?'th':'td');
    if (isRowHeader) cell.scope='row';
    cell.textContent=String(val ?? '');
    if (numericColumns.includes(index)) cell.className='numeric';
    tr.append(cell);
  });
  return tr;
};
function fillTable(id,rows,numericColumns=[],rowHeaderColumns=[0]) {
  const fragment=document.createDocumentFragment();
  for (const cells of rows) fragment.append(buildRow(cells,numericColumns,rowHeaderColumns));
  $(id).replaceChildren(fragment);
}
function clearResults() {
  for (const id of ['velocity','assessment','capacity','capacity-large','pipe-description','manning-n','cross-area','perimeter','radius']) set(id,'—');
  for (const id of ['drainage-rows','pipe-comparison-rows']) $(id).replaceChildren();
}

function readNumericInputs() {
  const values={};
  const issues=[];
  const numericInputs=[
    {id:'slope',label:'Slope'},
    {id:'drainage-area',label:`Drainage area (${isMetric()?'hectares':'acres'})`}
  ];
  for (const {id,label} of numericInputs) {
    const input=$(id);
    const error=$(`${id}-error`);
    const val=Number(input.value);
    let message='';
    if (input.validity.badInput) message=`${label}: enter a valid number.`;
    else if (input.value.trim()==='') message=`${label} is required.`;
    else if (!Number.isFinite(val)||val<0) message=`${label} must be zero or greater.`;
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
function announce(message,shouldAnnounce) {
  if (shouldAnnounce) $('calculation-status').textContent=message;
}
function update(shouldAnnounce=false) {
  const error=$('validation-error');
  const {values,issues}=readNumericInputs();
  if (issues.length) {
    clearResults();
    error.textContent=`Please correct the highlighted field${issues.length===1?'':'s'}. ${issues.join(' ')}`;
    error.hidden=false;
    announce(issues.join(' '),shouldAnnounce);
    return;
  }
  try {
    if (areaEdited) {
      canonicalAreaAcres=isMetric()?values['drainage-area']*ACRES_PER_HECTARE:values['drainage-area'];
      areaEdited=false;
    }
    const material=$('pipe-material').value;
    const diameterInches=Number($('pipe-size').value);
    const slopePercent=values.slope;
    const areaHectares=canonicalAreaAcres/ACRES_PER_HECTARE;
    const result=calculateWorksheet({material,diameterInches,slopePercent,
      areaAcres:canonicalAreaAcres,areaHectares});
    const metric=isMetric();
    error.hidden=true;
    error.textContent='';
    const velocity=metric?result.velocityFtPerSec/VIEW_FEET_PER_METER:result.velocityFtPerSec;
    const capacity=metric?result.capacityCfs*VIEW_LITERS_PER_CFS:result.capacityCfs;
    set('velocity',number(velocity,4));
    set('capacity',number(capacity,4));
    set('capacity-large',number(capacity,4));
    set('assessment',result.velocityAssessment);
    $('assessment').className='assessment '+(result.velocityAssessment==='Safe velocity'?'good':'warning');
    set('pipe-description',metric
      ? `${material} ${conciseNumber(diameterForDisplay(diameterInches),3)} cm`
      : result.selectedPipeAndSize);
    set('manning-n',number(result.manningN,3));
    set('cross-area',number(metric?result.areaSqFt/VIEW_FEET_PER_METER**2:result.areaSqFt,4));
    set('perimeter',number(metric?result.wettedPerimeterFt/VIEW_FEET_PER_METER:result.wettedPerimeterFt,4));
    set('radius',number(metric?result.hydraulicRadiusFt/VIEW_FEET_PER_METER:result.hydraulicRadiusFt,4));

    if (metric) {
      // Preserve both sets of metric coefficients included in the Excel worksheet.
      const metricRows=[...result.metric.fromInches,...result.metric.fromCentimeters];
      fillTable('drainage-rows',metricRows.map(row=>[
        conciseNumber(row.coefficientCmPerDay,6),
        number(row.hectaresDrained,2),number(row.requiredLitersPerSecond,3)
      ]),[1,2]);
    } else {
      fillTable('drainage-rows',result.drainage.map((row,i)=>[
        labelInches[i],number(row.acresDrained,2),number(row.requiredCfs,4)
      ]),[1,2]);
    }
    const caption=`Pipe sizes and capacity at ${slopePercent}% slope for ${material}`;
    set('capacity-comparison-caption',caption);
    const description=metric
      ? `Pipe size comparison for ${material} at ${slopePercent} percent slope. Each pair of columns contains size in centimeters and capacity in liters per second.`
      : `Pipe size comparison for ${material} at ${slopePercent} percent slope. Each pair of columns contains size in inches and capacity in cubic feet per second.`;
    set('comparison-table-caption',description);
    const left=result.comparison.slice(0,7),right=result.comparison.slice(6);
    const sizeText=pipe=>pipe?(metric?number(pipe.diameterCm,2):String(pipe.diameterInches)):'';
    const flowText=pipe=>pipe?number(metric?pipe.capacityLitersPerSecond:pipe.capacityCfs,metric?3:4):'';
    // The original spreadsheet repeats the 14-inch size in both halves.
    fillTable('pipe-comparison-rows',left.map((pipe,index)=>[
      sizeText(pipe),flowText(pipe),sizeText(right[index]),flowText(right[index])
    ]),[1,3],[0,2]);
    const system=metric?'Metric units':'Imperial units';
    announce(`${system}. Pipe capacity ${number(capacity,4)} ${metric?'liters per second':'cubic feet per second'}. Velocity ${number(velocity,4)} ${metric?'meters per second':'feet per second'}. ${result.velocityAssessment}. Drainage and pipe-size tables updated.`,shouldAnnounce);
  } catch (err) {
    clearResults();
    error.textContent=err instanceof Error?err.message:'Unable to calculate. Please review the inputs.';
    error.hidden=false;
    announce(error.textContent,shouldAnnounce);
  }
}
setupInputs();
update();
