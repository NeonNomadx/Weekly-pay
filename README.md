# Weekly Pay

Static personal weekly-pay estimator, served directly by GitHub Pages.

Run locally with `python3 -m http.server 8050`. No keys, dependencies or build step are required. Run calculation checks with `node pay-model.test.cjs`.

## Estimation model

- Hourly pay includes the shift differential; default $26.75. Overtime starts after 40 worked hours at 1.5x.
- Weekly pre-tax benefits default to $37.38, traditional 401(k) to 3% of gross, and the after-tax legal plan to $3.48. Settings are editable.
- Taxes use itemized effective rates calibrated to the recent paycheck, not official withholding tables. Estimated state taxable pay also subtracts traditional 401(k). Social Security/Medicare estimates do not subtract traditional 401(k).
- The starting federal withholding input is $0 because none was shown on the reference check. This can change with earnings and payroll settings; edit the expected weekly amount when known. Zero withholding does not mean zero annual tax.
- Use optional actual gross to reconcile paystubs with leave/premiums or payroll line rounding. Hours are ignored in that mode.
- Anytime Pay is money received early. Subtract actual transfers for the same pay period once from weekly take-home to estimate the remaining deposit. Available balance and eligibility percentage are not additional deductions.
- An optional availability calculator accepts current eligible earnings and current eligibility percentage. No percentage is fixed or inferred. Availability does not change weekly net pay; Amazon may apply additional limits or use unrounded values.
- Paychecks, tax brackets, taxable benefits, year-to-date thresholds, deduction arrears and payroll rounding can differ from these projections.

No uploaded screenshots, names, addresses, account details or payroll identifiers are stored here. Form entries stay in memory and reset when reloaded. The design and money animation remain intact.
