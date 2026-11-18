'use strict';
(function(root){
  // Weekly, 2026, W-4 (2020 or later). Official sources:
  // https://www.irs.gov/publications/p15t (Worksheet 1A and annual percentage tables)
  // https://revenue.delaware.gov/employers-guide-withholding-regulations-employers-duties/
  // The default $2,200 annual federal credit is a calibration matching the two
  // supplied checks; it is not a statement about dependents or the actual W-4.
  const periods=52;
  const cents=value=>Math.round((value+Number.EPSILON)*100)/100;
  const federalSchedules={
    single:{
      adjustment:8600,
      standard:[[0,0,0],[7500,0,.10],[19900,1240,.12],[57900,5800,.22],[113200,17966,.24],[209275,41024,.32],[263725,58448,.35],[648100,192979.25,.37]],
      multiple:[[0,0,0],[8050,0,.10],[14250,620,.12],[33250,2900,.22],[60900,8983,.24],[108938,20512,.32],[136163,29224,.35],[328350,96489.63,.37]]
    },
    marriedFilingJointly:{
      adjustment:12900,
      standard:[[0,0,0],[19300,0,.10],[44100,2480,.12],[120100,11600,.22],[230700,35932,.24],[422850,82048,.32],[531750,116896,.35],[788000,206583.50,.37]],
      multiple:[[0,0,0],[16100,0,.10],[28500,1240,.12],[66500,5800,.22],[121800,17966,.24],[217875,41024,.32],[272325,58448,.35],[400450,103291.75,.37]]
    },
    headOfHousehold:{
      adjustment:8600,
      standard:[[0,0,0],[15550,0,.10],[33250,1770,.12],[83000,7740,.22],[121250,16155,.24],[217300,39207,.32],[271750,56631,.35],[656150,191171,.37]],
      multiple:[[0,0,0],[12075,0,.10],[20925,885,.12],[45800,3870,.22],[64925,8077.50,.24],[112950,19603.50,.32],[140175,28315.50,.35],[332375,95585.50,.37]]
    }
  };
  const delawareSchedule=[[0,0,0],[2000,0,.022],[5000,66,.039],[10000,261,.048],[20000,741,.052],[25000,1001,.0555],[60000,2943.50,.066]];
  function nonnegative(value,label){
    if(typeof value!=='number'||!Number.isFinite(value)||value<0)throw new RangeError(label+' must be a nonnegative finite number.');
  }
  function annualize(incomeWages){
    nonnegative(incomeWages,'Weekly taxable wages');
    const annual=incomeWages*periods;
    if(!Number.isFinite(annual))throw new RangeError('Weekly taxable wages are too large.');
    return annual;
  }
  function annualTax(amount,table){
    let row=table[0];
    for(const next of table){if(amount<next[0])break;row=next;}
    return row[1]+(amount-row[0])*row[2];
  }
  function estimateFederal(incomeWages,{filingStatus='headOfHousehold',annualCredits=2200,multipleJobs=false,additionalWeekly=0}={}){
    const annual=annualize(incomeWages);
    nonnegative(annualCredits,'Annual federal credits');nonnegative(additionalWeekly,'Additional weekly federal withholding');
    if(typeof multipleJobs!=='boolean')throw new TypeError('The multiple-jobs checkbox must be true or false.');
    const status=filingStatus==='marriedFilingSeparately'?'single':filingStatus;
    if(!Object.prototype.hasOwnProperty.call(federalSchedules,status))throw new RangeError('Choose single, married filing jointly, married filing separately, or head of household.');
    const schedule=federalSchedules[status];
    const adjusted=Math.max(0,annual-(multipleJobs?0:schedule.adjustment));
    const tentative=annualTax(adjusted,multipleJobs?schedule.multiple:schedule.standard)/periods;
    const result=Math.max(0,tentative-annualCredits/periods)+additionalWeekly;
    if(!Number.isFinite(result))throw new RangeError('Federal withholding is too large.');
    return cents(result);
  }
  function estimateDelaware(incomeWages,{annualCredit=110,standardDeduction=3250}={}){
    const annual=annualize(incomeWages);nonnegative(annualCredit,'Annual Delaware exemption credit');
    nonnegative(standardDeduction,'Annual Delaware standard deduction');
    // The user's observed head-of-household checks match $3,250. Delaware's
    // married-joint deduction is $6,500; callers can supply that explicitly.
    const taxable=Math.max(0,annual-standardDeduction);
    return cents(Math.max(0,annualTax(taxable,delawareSchedule)-annualCredit)/periods);
  }
  const api={estimateFederal,estimateDelaware};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PayWithholding=api;
})(typeof globalThis!=='undefined'?globalThis:this);
