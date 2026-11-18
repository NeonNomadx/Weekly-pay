'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {estimateFederal,estimateDelaware}=require('./withholding.js');

// Two independent payroll observations at different incomes must both match.
assert.equal(estimateFederal(695.13),0);
assert.equal(estimateDelaware(695.13),25.56);
assert.equal(estimateFederal(1289.06),49.84);
assert.equal(estimateDelaware(1289.06),59.29);
assert.equal(estimateFederal(0),0);assert.equal(estimateDelaware(0),0);
assert.equal(estimateFederal(10),0);assert.equal(estimateDelaware(10),0);
assert(estimateFederal(2000)>estimateFederal(1289.06));
assert(estimateDelaware(2000)>estimateDelaware(1289.06));

// Published standard-table boundaries, translated to weekly taxable wages.
for(const [filingStatus,zeroAnnual,tenPercentTop] of [
  ['single',16100,28500],['marriedFilingJointly',32200,57000],['headOfHousehold',24150,41850]
]){
  assert.equal(estimateFederal(zeroAnnual/52,{filingStatus,annualCredits:0}),0);
  assert.equal(estimateFederal(tenPercentTop/52,{filingStatus,annualCredits:0}),Math.round((tenPercentTop-zeroAnnual)*.1/52*100)/100);
  assert(estimateFederal(2000,{filingStatus,annualCredits:0,multipleJobs:true})>estimateFederal(2000,{filingStatus,annualCredits:0}));
}
assert.equal(estimateFederal(1289.06,{filingStatus:'marriedFilingSeparately',annualCredits:0}),estimateFederal(1289.06,{filingStatus:'single',annualCredits:0}));
assert.equal(estimateFederal(1289.06,{additionalWeekly:20}),69.84);
assert.equal(estimateFederal(1289.06,{annualCredits:0}),92.15);
assert.equal(estimateFederal(1289.06,{annualCredits:100000}),0);
assert.equal(estimateDelaware(1289.06,{annualCredit:100000}),0);
assert.equal(estimateDelaware((3250+2000)/52,{annualCredit:0}),0);
assert.equal(estimateDelaware((3250+5000)/52,{annualCredit:0}),1.27);
// Official employer-guide married-joint example: $26,000 annual wages,
// $6,500 deduction, $717 annual tax, $330 exemption credit => $7.44 weekly.
assert.equal(estimateDelaware(500,{annualCredit:330,standardDeduction:6500}),7.44);
assert(estimateDelaware(1289.06,{standardDeduction:6500})<estimateDelaware(1289.06));

for(const value of [-1,NaN,Infinity,'1289.06',null]){
  assert.throws(()=>estimateFederal(value));assert.throws(()=>estimateDelaware(value));
}
assert.throws(()=>estimateFederal(Number.MAX_VALUE));
assert.throws(()=>estimateFederal(1000,{filingStatus:'unknown'}));
assert.throws(()=>estimateFederal(1000,{filingStatus:'toString'}));
assert.throws(()=>estimateFederal(1000,{annualCredits:-1}));
assert.throws(()=>estimateFederal(1000,{annualCredits:NaN}));
assert.throws(()=>estimateFederal(1000,{multipleJobs:1}));
assert.throws(()=>estimateFederal(1000,{additionalWeekly:-1}));
assert.throws(()=>estimateDelaware(1000,{annualCredit:NaN}));
for(const standardDeduction of [-1,NaN,Infinity,'6500'])assert.throws(()=>estimateDelaware(1000,{standardDeduction}));

// The same dependency-free file exposes its browser API without CommonJS.
const browser={};vm.createContext(browser);vm.runInContext(fs.readFileSync(require.resolve('./withholding.js'),'utf8'),browser);
assert.equal(browser.PayWithholding.estimateFederal(1289.06),49.84);
assert.equal(browser.PayWithholding.estimateDelaware(1289.06),59.29);
console.log('2026 weekly federal/Delaware checks passed: both paystubs, progressive amounts, filing statuses, W-4 options, boundaries, browser export and validation.');
