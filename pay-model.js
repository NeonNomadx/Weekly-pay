'use strict';
(function(root){
 const cents=x=>Math.round((x+Number.EPSILON)*100)/100;
 // Observed effective rates, not statutory withholding tables. No identifying payroll data.
 const ficaReference=717.78, incomeReference=695.13;
 const observed={socialSecurity:44.54,medicare:10.42,state:25.56,city:8.98,family:0.29,medical:1.44,parental:1.15};
 const defaults={benefits:37.38,retirementPercent:3,legal:3.48,federal:0};
 const taxNames={socialSecurity:'Social Security',medicare:'Medicare',state:'DE state income tax',city:'Wilmington income tax',family:'DE paid family leave',medical:'DE paid medical leave',parental:'DE paid parental leave',federal:'Federal income tax'};
 function calculatePay(input){
  const {hours,rate,withdrawn,multiplier,benefits,retirementPercent,legal,federal,grossOverride=null}=input;
  if(![hours,rate,withdrawn,multiplier,benefits,retirementPercent,legal,federal].every(Number.isFinite)||hours<0||hours>168||rate<=0||rate>1000||withdrawn<0||multiplier<1||multiplier>3||benefits<0||retirementPercent<0||retirementPercent>100||legal<0||federal<0||(grossOverride!==null&&(!Number.isFinite(grossOverride)||grossOverride<0)))throw Error('Check your entries: use 0–168 hours, positive hourly pay, 0–100% retirement, and nonnegative dollar amounts.');
  const regular=cents(Math.min(hours,40)*rate),overtime=cents(Math.max(0,hours-40)*rate*multiplier);
  const gross=grossOverride===null?cents(regular+overtime):cents(grossOverride);
  const appliedBenefits=gross>0?cents(benefits):0,retirement=cents(gross*retirementPercent/100),appliedLegal=gross>0?cents(legal):0;
  const ficaWages=cents(Math.max(0,gross-appliedBenefits)),incomeWages=cents(Math.max(0,ficaWages-retirement));
  const taxes={};
  for(const key of Object.keys(observed))taxes[key]=cents((key==='state'?incomeWages:ficaWages)*observed[key]/(key==='state'?incomeReference:ficaReference));
  taxes.federal=gross>0?cents(federal):0;
  const totalTaxes=cents(Object.values(taxes).reduce((sum,x)=>sum+x,0));
  const rawNet=cents(gross-appliedBenefits-retirement-appliedLegal-totalTaxes),net=Math.max(0,rawNet);
  return {regular,overtime,gross,taxes,totalTaxes,benefits:appliedBenefits,retirement,legal:appliedLegal,ficaWages,incomeWages,net,deposit:cents(Math.max(0,net-withdrawn)),shortfall:cents(Math.max(0,withdrawn-net)),unfunded:Math.max(0,-rawNet),actualGross:grossOverride!==null};
 }
 function estimateAvailability(eligibleEarnings,percent,withdrawn){
  if(![eligibleEarnings,percent,withdrawn].every(Number.isFinite)||eligibleEarnings<0||percent<0||percent>100||withdrawn<0)throw Error('Use nonnegative eligible earnings and transfers, and eligibility from 0 to 100%.');
  const eligibleAmount=cents(eligibleEarnings*percent/100);
  return {eligibleAmount,available:cents(Math.max(0,eligibleAmount-withdrawn))};
 }
 function hoursFromParts(hours,minutes){
  if(!Number.isInteger(hours)||!Number.isInteger(minutes)||hours<0||minutes<0||minutes>59||hours+minutes/60>168)throw Error('Enter whole hours and 0–59 minutes, up to 168 total hours.');
  return hours+minutes/60;
 }
 const api={calculatePay,estimateAvailability,hoursFromParts,defaults,taxNames};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PayModel=api;
})(globalThis);
