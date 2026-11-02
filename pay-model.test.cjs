const assert=require('node:assert/strict');const {calculatePay,defaults}=require('./pay-model.js');
const base={hours:40,rate:26.75,withdrawn:0,multiplier:1.5,...defaults};
const sample=calculatePay({...base,grossOverride:755.16,withdrawn:566.38});
assert.equal(sample.totalTaxes,92.38);assert.equal(sample.retirement,22.65);assert.equal(sample.incomeWages,695.13);assert.equal(sample.net,599.27);assert.equal(sample.deposit,32.89);
const noTransfers=calculatePay({...base,grossOverride:755.16});assert.equal(noTransfers.net,sample.net);assert.equal(noTransfers.deposit,599.27);
const noRetirement=calculatePay({...base,grossOverride:755.16,retirementPercent:0});assert.equal(noRetirement.taxes.socialSecurity,sample.taxes.socialSecurity);assert.equal(noRetirement.taxes.medicare,sample.taxes.medicare);assert(noRetirement.taxes.state>sample.taxes.state);
const overtime=calculatePay({...base,hours:45});assert.equal(overtime.overtime,200.63);assert.equal(overtime.gross,1270.63);
const zero=calculatePay({...base,hours:0});assert.equal(zero.net,0);assert.equal(zero.benefits,0);assert.equal(zero.retirement,0);assert.equal(zero.totalTaxes,0);
const federal=calculatePay({...base,federal:20});assert.equal(federal.net,Math.round((calculatePay(base).net-20)*100)/100);
const excess=calculatePay({...base,withdrawn:10000});assert.equal(excess.deposit,0);assert(excess.shortfall>0);
const tiny=calculatePay({...base,grossOverride:1});assert.equal(tiny.net,0);assert(tiny.unfunded>0);
assert.throws(()=>calculatePay({...base,retirementPercent:101}));assert.throws(()=>calculatePay({...base,hours:-1}));assert.throws(()=>calculatePay({...base,grossOverride:NaN}));
console.log('Pay model checks passed: calibration, tax bases, transfers, overtime, zero/low pay, federal override, and validation.');

const current=calculatePay({...base,withdrawn:150.92});assert.equal(current.net,calculatePay(base).net);assert.equal(Math.round((current.net-current.deposit)*100),15092);console.log('Current-period transfer is subtracted once, to the cent.');

const {estimateAvailability}=require('./pay-model.js');
assert.equal(estimateAvailability(232.19,65,150.92).available,0);
assert.equal(estimateAvailability(232.19,75,150.92).available,23.22);
assert.equal(estimateAvailability(232.19,50,150.92).available,0);
assert.equal(estimateAvailability(232.19,0,0).available,0);
assert.throws(()=>estimateAvailability(232.19,101,0));
console.log('Variable eligibility checks passed; no fixed eligibility rate and no impact on weekly net pay.');

const {hoursFromParts}=require('./pay-model.js');
assert.equal(hoursFromParts(8,41),8+41/60);
assert.throws(()=>hoursFromParts(8.41,0));assert.throws(()=>hoursFromParts(8,60));assert.throws(()=>hoursFromParts(168,1));
assert.equal(calculatePay({...base,hours:hoursFromParts(8,41)}).gross,232.28);
assert.equal(estimateAvailability(232.19,65,150.92).eligibleAmount,150.92);
assert.equal(estimateAvailability(232.19,65,150.92).available,0);
assert.equal(estimateAvailability(232.28,65,150.92).eligibleAmount,150.98);
console.log('Hours/minutes and exact employer-earnings reconciliation checks passed.');
