'use strict';
(function(root){
 const cents=x=>Math.round((x+Number.EPSILON)*100)/100;
 // Observed effective rates, not statutory withholding tables. No identifying payroll data.
 const ficaReference=717.78, incomeReference=695.13;
 const observed={socialSecurity:44.54,medicare:10.42,state:25.56,city:8.98,family:0.29,medical:1.44,parental:1.15};
 function eligibleCeiling(value){
  const scaled=value*100,nearest=Math.round(scaled);
  // Remove only binary floating-point noise at an exact penny before applying the ceiling.
  const stable=Math.abs(scaled-nearest)<=Number.EPSILON*Math.max(1,Math.abs(scaled))*4?nearest:scaled;
  return Math.ceil(stable)/100;
 }
 function calculateAnytimePay(regular_hours,regular_rate,shift_diff_rate,eligible_percent){
  if(![regular_hours,regular_rate,shift_diff_rate,eligible_percent].every(Number.isFinite)||regular_hours<0||regular_rate<0||shift_diff_rate<0||eligible_percent<0||eligible_percent>1)throw Error('Use nonnegative hours and rates, and an eligibility fraction from 0 to 1.');
  const gross_regular_pay=cents(regular_hours*regular_rate);
  const gross_shift_pay=cents(regular_hours*shift_diff_rate);
  const total_pretax_earnings=cents(gross_regular_pay+gross_shift_pay);
  const raw_eligible_earnings=total_pretax_earnings*eligible_percent;
  return eligibleCeiling(raw_eligible_earnings);
 }
 const defaults={benefits:37.38,retirementPercent:3,legal:3.48,federal:0};
 const taxNames={socialSecurity:'Social Security',medicare:'Medicare',state:'DE state income tax',city:'Wilmington income tax',family:'DE paid family leave',medical:'DE paid medical leave',parental:'DE paid parental leave',federal:'Federal income tax'};
 function calculatePay(input){
  const {hours,rate,withdrawn,multiplier,benefits,retirementPercent,legal,federal,grossOverride=null,shiftDiffRate=0}=input;
  if(![hours,rate,withdrawn,multiplier,benefits,retirementPercent,legal,federal].every(Number.isFinite)||hours<0||hours>168||rate<=0||rate>1000||withdrawn<0||multiplier<1||multiplier>3||benefits<0||retirementPercent<0||retirementPercent>100||legal<0||federal<0||!Number.isFinite(shiftDiffRate)||shiftDiffRate<0||shiftDiffRate>rate||(grossOverride!==null&&(!Number.isFinite(grossOverride)||grossOverride<0)))throw Error('Check your entries: use 0–168 hours, positive hourly pay, 0–100% retirement, and nonnegative dollar amounts.');
  // Match the supplied payroll example: convert time to hundredths of a paid hour before earnings.
  const paidHours=cents(hours);
  const regularHours=Math.min(paidHours,40),overtimeHours=Math.max(0,paidHours-40),baseRate=rate-shiftDiffRate;
  const regular=cents(cents(regularHours*baseRate)+cents(regularHours*shiftDiffRate));
  const overtime=cents(cents(overtimeHours*baseRate*multiplier)+cents(overtimeHours*shiftDiffRate*multiplier));
  const gross=grossOverride===null?cents(regular+overtime):cents(grossOverride);
  const appliedBenefits=gross>0?cents(benefits):0,retirement=cents(gross*retirementPercent/100),appliedLegal=gross>0?cents(legal):0;
  const ficaWages=cents(Math.max(0,gross-appliedBenefits)),incomeWages=cents(Math.max(0,ficaWages-retirement));
  const taxes={};
  for(const key of Object.keys(observed))taxes[key]=cents((key==='state'?incomeWages:ficaWages)*observed[key]/(key==='state'?incomeReference:ficaReference));
  taxes.federal=gross>0?cents(federal):0;
  const totalTaxes=cents(Object.values(taxes).reduce((sum,x)=>sum+x,0));
  const rawNet=cents(gross-appliedBenefits-retirement-appliedLegal-totalTaxes),net=Math.max(0,rawNet);
  return {paidHours,regular,overtime,gross,taxes,totalTaxes,benefits:appliedBenefits,retirement,legal:appliedLegal,ficaWages,incomeWages,net,deposit:cents(Math.max(0,net-withdrawn)),shortfall:cents(Math.max(0,withdrawn-net)),unfunded:Math.max(0,-rawNet),actualGross:grossOverride!==null};
 }
 function estimateAvailability(eligibleEarnings,percent,withdrawn){
  if(![eligibleEarnings,percent,withdrawn].every(Number.isFinite)||eligibleEarnings<0||percent<0||percent>100||withdrawn<0)throw Error('Use nonnegative eligible earnings and transfers, and eligibility from 0 to 100%.');
  const eligibleAmount=eligibleCeiling(eligibleEarnings*percent/100);
  return {eligibleAmount,available:cents(Math.max(0,eligibleAmount-withdrawn))};
 }
 function hoursFromParts(hours,minutes){
  if(!Number.isInteger(hours)||!Number.isInteger(minutes)||hours<0||minutes<0||minutes>59||hours+minutes/60>168)throw Error('Enter whole hours and 0–59 minutes, up to 168 total hours.');
  return hours+minutes/60;
 }
 const api={calculatePay,calculateAnytimePay,estimateAvailability,hoursFromParts,defaults,taxNames};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PayModel=api;
})(globalThis);
