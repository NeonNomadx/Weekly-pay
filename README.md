# Weekly Pay

Static personal weekly-pay estimator, served directly by GitHub Pages.

Run locally with `python3 -m http.server 8050`. No keys, dependencies or build step are required. Run calculation checks with `node pay-model.test.cjs`.

## Estimation model

- Enter time in separate whole-hours and minutes fields (8 hours 41 minutes = 8 + 41/60 hours). Paid hours are then rounded to hundredths before calculating earnings, matching the supplied payroll example: 8.68 × $26.75 = $232.19; 65% is $150.93 after rounding eligibility up to the next cent. This is a calibration to the example; payroll timing or other adjustments may differ.
- Enter the regular hourly rate ($24.75) and shift differential ($2) separately, totaling $26.75. Each earnings component is rounded to cents before summing. Overtime starts after 40 worked hours at 1.5x.
- Weekly pre-tax benefits default to $37.38, traditional 401(k) to 3% of gross, and the after-tax legal plan to $3.48. Settings are editable.
- Taxes use itemized effective rates calibrated to the recent paycheck, not official withholding tables. Estimated state taxable pay also subtracts traditional 401(k). Social Security/Medicare estimates do not subtract traditional 401(k).
- The starting federal withholding input is $0 because none was shown on the reference check. This can change with earnings and payroll settings; edit the expected weekly amount when known. Zero withholding does not mean zero annual tax.
- Use optional actual gross to reconcile paystubs with leave/premiums or payroll line rounding. Hours are ignored in that mode.
- Anytime Pay is money received early. Subtract actual transfers for the same pay period once from weekly take-home to estimate the remaining deposit. Available balance and eligibility percentage are not additional deductions.
- One editable Anytime Pay eligibility percentage uses calculated gross earnings by default. An optional Amazon eligible-earnings override lives in settings for payroll precision differences. Separate results show total eligible early pay, transfers already received, and remaining transfer availability. Eligibility never changes weekly net pay; Amazon may apply additional limits or use unrounded values.
- Paychecks, tax brackets, taxable benefits, year-to-date thresholds, deduction arrears and payroll rounding can differ from these projections.

No uploaded screenshots, names, addresses, account details or payroll identifiers are stored here. Form entries stay in memory and reset when reloaded. The design and money animation remain intact.

## Anytime Pay function

`calculateAnytimePay(regular_hours, regular_rate, shift_diff_rate, eligible_percent)` accepts decimal paid hours and an eligibility fraction such as `0.65`. It rounds regular earnings and shift earnings separately, sums them, then applies `ceil(raw_eligible_earnings * 100) / 100`. Floating-point noise at exact pennies is normalized. The UI percentage remains a single 0–100 input. Example: `calculateAnytimePay(8.68, 24.75, 2, 0.65)` returns `150.93`. A completed transfer of `150.92` is a separate fact and leaves an estimated eligible balance of `0.01`; Amazon’s actual transfer limits still apply.
