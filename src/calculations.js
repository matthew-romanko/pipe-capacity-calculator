/** Faithful calculation implementation of Calculator sheet in V6-1 workbook.
 * No browser, server, or external package is required.
 * All formulas intentionally retain the spreadsheet conversion constants.
 */
import lookup from './lookup-data.js';
export const pipeSizesInches = Object.freeze([...lookup.pipeSizesInches]);
export const materials = Object.freeze([...lookup.materials]);
export const drainageCoefficients = Object.freeze([...lookup.drainageCoefficientsInchesPerDay]);
const FEET_PER_METER = 3.2808399;
const LITERS_PER_CFS = 28.3168466;
const SECONDS_PER_DAY = 24*3600;
const SQUARE_FEET_PER_ACRE = 43560;

function nonnegative(value, label, allowZero = true) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (!allowZero && value === 0)) {
    throw new RangeError(`${label} must be a ${allowZero ? 'nonnegative' : 'positive'} finite number`);
  }
  return value;
}

export function manningN(material, diameterInches) {
  if (!materials.includes(material)) throw new RangeError(`Unsupported material: ${material}`);
  if (!pipeSizesInches.includes(diameterInches)) throw new RangeError(`Unsupported pipe size: ${diameterInches}`);
  if (material !== 'Single wall CPT') return lookup.roughness[material];
  if (diameterInches <= 6) return 0.015;
  if (diameterInches === 8) return 0.016;
  if (diameterInches === 10) return 0.017;
  if (diameterInches <= 16) return 0.018;
  return 0.020;
}

/** Workbook B6:B12 and F6:F8, using full-pipe Manning flow. */
export function pipeHydraulics({material='Single wall CPT', diameterInches=10, slopePercent=0.1}={}) {
  nonnegative(slopePercent, 'slopePercent');
  const n = manningN(material,diameterInches);
  const areaSqFt = Math.PI * (diameterInches/2/12)**2;
  const wettedPerimeterFt = Math.PI*(diameterInches/12);
  const hydraulicRadiusFt = areaSqFt/wettedPerimeterFt;
  const velocityFtPerSec = (FEET_PER_METER**(1/3)/n) * hydraulicRadiusFt**(2/3) * (slopePercent/100)**0.5;
  const capacityCfs = areaSqFt*velocityFtPerSec;
  const velocityAssessment = velocityFtPerSec < 0.5 ?
    'Warning: Grade too flat and Velocity too slow - Sedimentation Risk' :
    velocityFtPerSec > 3.5 ?
    'Warning: Velocity too high - Cavitation or Piping Risk' :
    'Safe velocity';
  return {material, diameterInches, slopePercent, areaSqFt, wettedPerimeterFt,
    hydraulicRadiusFt, manningN:n, velocityFtPerSec, capacityCfs, velocityAssessment,
    selectedPipeAndSize:`${material} ${diameterInches} inches`};
}

/** Workbook B15:B20 and D15:D20, drainable acres and required flow. */
export function drainageTable(capacityCfs, areaAcres=22.9) {
  nonnegative(capacityCfs,'capacityCfs'); nonnegative(areaAcres,'areaAcres');
  return drainageCoefficients.map(coefficientInchesPerDay=>({
    coefficientInchesPerDay,
    acresDrained:capacityCfs*SECONDS_PER_DAY/(SQUARE_FEET_PER_ACRE*(coefficientInchesPerDay/12)),
    requiredCfs:(areaAcres*SQUARE_FEET_PER_ACRE*coefficientInchesPerDay/12)/SECONDS_PER_DAY
  }));
}

/** Workbook B36:B47 and D36:D47. The two original Excel metric sections
 * intentionally use 2.4705, 2.471, and 28.3168466, not exact conversions.
 */
export function metricDrainageTable(capacityCfs, areaHectares=20) {
  nonnegative(capacityCfs,'capacityCfs'); nonnegative(areaHectares,'areaHectares');
  const fromInches = drainageCoefficients.map(dcInchesPerDay=>({
    coefficientInchesPerDay:dcInchesPerDay,
    coefficientCmPerDay:dcInchesPerDay*2.54,
    hectaresDrained:(capacityCfs*SECONDS_PER_DAY/(SQUARE_FEET_PER_ACRE*(dcInchesPerDay/12)))/2.4705,
    requiredLitersPerSecond:((areaHectares*2.471*SQUARE_FEET_PER_ACRE*dcInchesPerDay/12)/SECONDS_PER_DAY)*LITERS_PER_CFS
  }));
  const fromCentimeters = lookup.metricDrainageCoefficientsCmPerDay.map(dcCmPerDay=>({
    coefficientCmPerDay:dcCmPerDay,
    hectaresDrained:(capacityCfs*SECONDS_PER_DAY/(SQUARE_FEET_PER_ACRE*(dcCmPerDay/(2.54*12))))/2.4705,
    requiredLitersPerSecond:((areaHectares*2.471*SQUARE_FEET_PER_ACRE*dcCmPerDay/(2.54*12))/SECONDS_PER_DAY)*LITERS_PER_CFS
  }));
  return {fromInches, fromCentimeters};
}

/** Workbook A23:D29 and A51:D57; excludes lookup-only 2" and 3" pipes. */
export function pipeComparison(material='Single wall CPT',slopePercent=0.1) {
  return lookup.comparisonPipeSizesInches.map(diameterInches=>{
    const hydraulic=pipeHydraulics({material,diameterInches,slopePercent});
    return {diameterInches,diameterCm:diameterInches*2.54,
      capacityCfs:hydraulic.capacityCfs,capacityLitersPerSecond:hydraulic.capacityCfs*LITERS_PER_CFS};
  });
}

/** Complete worksheet numeric result, with no new recommendation workflow. */
export function calculateWorksheet({material='Single wall CPT',diameterInches=10,
  slopePercent=0.1,areaAcres=22.9,areaHectares=20}={}) {
  const hydraulic=pipeHydraulics({material,diameterInches,slopePercent});
  return {...hydraulic, areaAcres,areaHectares,
    drainage:drainageTable(hydraulic.capacityCfs,areaAcres),
    metric:metricDrainageTable(hydraulic.capacityCfs,areaHectares),
    comparison:pipeComparison(material,slopePercent)};
}
