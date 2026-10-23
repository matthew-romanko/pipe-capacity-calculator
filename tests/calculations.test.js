import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateWorksheet,manningN,pipeHydraulics,pipeComparison,materials,pipeSizesInches} from '../src/calculations.js';
function close(actual,expected,description) {assert.ok(Math.abs(actual-expected)<=1e-10*Math.max(1,Math.abs(expected)),`${description}: ${actual} != ${expected}`);}
const s=calculateWorksheet();
test('Excel default: hydraulic properties B8 B10 B12 F6:F8',()=>{
 close(s.areaSqFt,0.545415391248228,'F6');
 close(s.wettedPerimeterFt,2.6179938779914944,'F7');
 close(s.hydraulicRadiusFt,0.20833333333333334,'F8');
 close(s.manningN,0.017,'B12');
 close(s.velocityFtPerSec,0.9713712969716618,'B8');
 close(s.capacityCfs,0.52980085598509763,'B10');
 assert.equal(s.velocityAssessment,'Safe velocity');
});
test('Excel default: US drainage B15:B20 D15:D20',()=>{
 const expectedAcres=[33.627029536905368,25.22027215267903,16.813514768452684,12.610136076339515,8.406757384226342,6.3050680381697575];
 const expectedFlow=[0.36079427083333326,0.4810590277777777,0.72158854166666653,0.9621180555555554,1.4431770833333331,1.9242361111111108];
 s.drainage.forEach((r,i)=>{close(r.acresDrained,expectedAcres[i],`B${15+i}`);close(r.requiredCfs,expectedFlow[i],`D${15+i}`);});
});
test('Excel default: SI drainage B36:B47 D36:D47',()=>{
 const haIn=[13.611426649222979,10.208569986917235,6.8057133246114896,5.1042849934586174,3.4028566623057448,2.5521424967293087];
 const qIn=[22.048130942136982,29.397507922849307,44.096261884273964,58.795015845698614,88.192523768547929,117.59003169139723];
 const haCm=[12.964883883384887,8.6432559222565946,6.4824419416924437,4.3216279611282973,3.2412209708462218,2.5929767766769776];
 const qCm=[23.147644033739613,34.721466050609422,46.295288067479227,69.442932101218844,92.590576134958454,115.73822016869805];
 s.metric.fromInches.forEach((r,i)=>{close(r.hectaresDrained,haIn[i],`B${36+i}`);close(r.requiredLitersPerSecond,qIn[i],`D${36+i}`);});
 s.metric.fromCentimeters.forEach((r,i)=>{close(r.hectaresDrained,haCm[i],`B${42+i}`);close(r.requiredLitersPerSecond,qCm[i],`D${42+i}`);});
});
test('Excel default: pipe comparison A23:D29',()=>{
 const sizes=[4,5,6,8,10,12,14,15,16,18,24,30,36];
 const flows=[0.052155121504301148,0.09456352718362578,0.15377072157710622,0.31046660528046344,0.52980085598509763,0.81365268397802504,1.2273370192715889,1.4752504735904173,1.7523022784825011,2.1590279352780093,4.6497352553404756,8.4305309532984438,13.708972862756166];
 s.comparison.forEach((r,i)=>{assert.equal(r.diameterInches,sizes[i]);close(r.capacityCfs,flows[i],`${sizes[i]}-inch flow`);});
});
test('material lookup and size-dependent CPT roughness',()=>{
 assert.deepEqual(pipeSizesInches,[2,3,4,5,6,8,10,12,14,15,16,18,24,30,36]);
 for (const material of materials) for (const diameterInches of pipeSizesInches) assert.ok(manningN(material,diameterInches)>0);
 assert.equal(manningN('Single wall CPT',6),0.015);
 assert.equal(manningN('Single wall CPT',8),0.016);
 assert.equal(manningN('Single wall CPT',10),0.017);
 assert.equal(manningN('Single wall CPT',16),0.018);
 assert.equal(manningN('Single wall CPT',18),0.020);
 assert.equal(manningN('PVC',10),0.010);
});
test('velocity warning boundaries and zero slope',()=>{
 assert.match(pipeHydraulics({slopePercent:0}).velocityAssessment,/too slow/);
 assert.match(pipeHydraulics({slopePercent:10}).velocityAssessment,/too high/);
 assert.throws(()=>pipeHydraulics({slopePercent:-1}),RangeError);
 assert.throws(()=>pipeHydraulics({diameterInches:7}),RangeError);
});
test('pipe comparison matches selected pipe at matching size',()=>{
 for(const material of materials){
  const a=pipeHydraulics({material,diameterInches:10,slopePercent:0.25});
  const b=pipeComparison(material,0.25).find(x=>x.diameterInches===10);
  close(a.capacityCfs,b.capacityCfs,material);
 }
});
