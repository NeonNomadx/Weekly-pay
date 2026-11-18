'use strict';
(function(root){
 const withholding=typeof module!=='undefined'&&module.exports?require('./withholding.js'):root.PayWithholding;
 const cents=x=>Math.round((x+Number.EPSILON)*100)/100;
 // Minor withholding components calibrated to the latest check, not universal statutory rates.
 const ficaReference=1330.08;
 const observed={socialSecurity:82.51,medicare:19.29,city:16.64,family:0.53,medical:2.67,parental:2.13};
 function eligibleCeiling(value){const scaled=value*100,nearest=Math.round(scaled);const stable=Math.abs(scaled-nearest)<=Number.EPSILON*Math.max(1,Math.abs(scaled))*4?nearest:scaled;return Math.ceil(stable)/100;}
 function calculateAnytimePay(regular_hours,regular_rate,shift_diff_rate,eligible_percent){
  if(![regular_hours,regular_rate,shift_diff_rate,eligible_percent].every(Number.isFinite)||regular_hours<0||regular_rate<0||shift_diff_rate<0||eligible_percent<0||eligible_percent>1)throw Error('Use nonnegative hours and rates, and an eligibility fraction from 0 to 1.');
  return eligibleCeiling(cents(cents(regular_hours*regular_rate)+cents(regular_hours*shift_diff_rate))*eligible_percent);
 }
 const defaults={benefits:37.38,retirementPercent:3,legal:0,federal:null,filingStatus:'headOfHousehold',annualCredits:2200,stateAnnualCredit:110,multipleJobs:false};
 const taxNames={socialSecurity:'Social Security',medicare:'Medicare',state:'DE state income tax',city:'Wilmington income tax',family:'DE paid family leave',medical:'DE paid medical leave',parental:'DE paid parental leave',federal:'Federal income tax'};
 const amountOk=x=>Number.isFinite(x)&&x>=0;
 function calculatePay(input){
  const {hours,rate,withdrawn=0,multiplier=1.5,benefits=37.38,retirementPercent=3,legal=0,federal=null,grossOverride=null,shiftDiffRate=0,overtimeBaseRate=null,overtimeShiftDiffRate=null,ptoHours=0,ptoShiftDiffRate=shiftDiffRate,taxesOverride=null,retirementOverride=null,filingStatus='headOfHousehold',annualCredits=2200,stateAnnualCredit=110,multipleJobs=false}=input;
  if(![hours,rate,withdrawn,multiplier,benefits,retirementPercent,legal,ptoHours,ptoShiftDiffRate,annualCredits,stateAnnualCredit].every(Number.isFinite)||hours<0||ptoHours<0||hours+ptoHours>168||rate<=0||rate>1000||withdrawn<0||multiplier<1||multiplier>3||benefits<0||retirementPercent<0||retirementPercent>100||legal<0||ptoShiftDiffRate<0||ptoShiftDiffRate>3000||annualCredits<0||stateAnnualCredit<0||!Number.isFinite(shiftDiffRate)||shiftDiffRate<0||shiftDiffRate>rate)throw Error('Check hours, pay rates, deductions, and tax settings. Worked hours plus PTO must be between 0 and 168.');
  for(const value of [federal,grossOverride,taxesOverride,retirementOverride])if(value!==null&&!amountOk(value))throw Error('Paystub overrides must be blank or nonnegative dollar amounts.');
  if((overtimeBaseRate!==null&&(!Number.isFinite(overtimeBaseRate)||overtimeBaseRate<=0||overtimeBaseRate>3000))||(overtimeShiftDiffRate!==null&&(!amountOk(overtimeShiftDiffRate)||overtimeShiftDiffRate>3000)))throw Error('Use a positive overtime base rate and a nonnegative overtime shift differential.');
  const paidHours=cents(hours),paidPtoHours=cents(ptoHours),regularHours=Math.min(paidHours,40),overtimeHours=cents(Math.max(0,paidHours-40)),baseRate=rate-shiftDiffRate;
  const regularBasePay=cents(regularHours*baseRate),regularShiftPay=cents(regularHours*shiftDiffRate),ptoBasePay=cents(paidPtoHours*baseRate),ptoShiftPay=cents(paidPtoHours*ptoShiftDiffRate);
  const appliedOvertimeBaseRate=overtimeBaseRate===null?baseRate*multiplier:overtimeBaseRate,appliedOvertimeShiftRate=overtimeShiftDiffRate===null?shiftDiffRate*multiplier:overtimeShiftDiffRate;
  const overtimeBasePay=cents(overtimeHours*appliedOvertimeBaseRate),overtimeShiftPay=cents(overtimeHours*appliedOvertimeShiftRate);
  const regular=cents(regularBasePay+regularShiftPay),pto=cents(ptoBasePay+ptoShiftPay),overtime=cents(overtimeBasePay+overtimeShiftPay),shiftPay=cents(regularShiftPay+ptoShiftPay),estimatedGross=cents(regular+pto+overtime);
  const gross=grossOverride===null?estimatedGross:cents(grossOverride),appliedBenefits=gross>0?cents(benefits):0,retirement=retirementOverride!==null?cents(retirementOverride):gross>0?cents(gross*retirementPercent/100):0,appliedLegal=gross>0?cents(legal):0;
  const ficaWages=cents(Math.max(0,gross-appliedBenefits)),incomeWages=cents(Math.max(0,ficaWages-retirement));
  const taxes={};for(const key of Object.keys(observed))taxes[key]=cents(ficaWages*observed[key]/ficaReference);
  taxes.state=withholding.estimateDelaware(incomeWages,{annualCredit:stateAnnualCredit,standardDeduction:filingStatus==='marriedFilingJointly'?6500:3250});
  taxes.federal=gross>0?(federal===null?withholding.estimateFederal(incomeWages,{filingStatus,annualCredits,multipleJobs}):cents(federal)):0;
  const estimatedTaxes=cents(Object.values(taxes).reduce((sum,x)=>sum+x,0)),totalTaxes=taxesOverride===null?estimatedTaxes:cents(taxesOverride);
  const rawNet=cents(gross-appliedBenefits-retirement-appliedLegal-totalTaxes),net=Math.max(0,rawNet);
  return {paidHours,ptoHours:paidPtoHours,regularHours,overtimeHours,regular,pto,overtime,regularBasePay,regularShiftPay,ptoBasePay,ptoShiftPay,shiftPay,overtimeBasePay,overtimeShiftPay,overtimeBaseRate:appliedOvertimeBaseRate,overtimeShiftDiffRate:appliedOvertimeShiftRate,estimatedGross,gross,taxes,estimatedTaxes,totalTaxes,benefits:appliedBenefits,retirement,legal:appliedLegal,ficaWages,incomeWages,net,deposit:cents(Math.max(0,net-withdrawn)),shortfall:cents(Math.max(0,withdrawn-net)),unfunded:Math.max(0,-rawNet),actualGross:grossOverride!==null,actualTaxes:taxesOverride!==null,actualRetirement:retirementOverride!==null};
 }
 function estimateAvailability(eligibleEarnings,percent,withdrawn){if(![eligibleEarnings,percent,withdrawn].every(Number.isFinite)||eligibleEarnings<0||percent<0||percent>100||withdrawn<0)throw Error('Use nonnegative eligible earnings and transfers, and eligibility from 0 to 100%.');const eligibleAmount=eligibleCeiling(eligibleEarnings*percent/100);return {eligibleAmount,available:cents(Math.max(0,eligibleAmount-withdrawn))};}
 function hoursFromParts(hours,minutes){if(!Number.isInteger(hours)||!Number.isInteger(minutes)||hours<0||minutes<0||minutes>59||hours+minutes/60>168)throw Error('Enter whole worked hours and 0–59 minutes, up to 168 total hours.');return hours+minutes/60;}
 const api={calculatePay,calculateAnytimePay,estimateAvailability,hoursFromParts,defaults,taxNames};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PayModel=api;
})(globalThis);
