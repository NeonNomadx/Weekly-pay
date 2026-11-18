# Weekly Pay

Static personal pay estimator for GitHub Pages. Run `python3 -m http.server 8050` for local use. No keys, payroll connection, or financial-entry storage.

## Checks

- `node withholding.test.cjs`
- `node pay-model.test.cjs`

## Worked time, PTO, and earnings

Enter actually worked whole hours/minutes separately from decimal PTO hours. The 40-hour overtime threshold uses worked time only. Payroll earnings units can count base and shift components twice and are not worked hours.

Rates start at regular base $24.75, regular shift $2.00, overtime base **$37.125**, overtime shift $3.00, and PTO shift $2.00. Retain three-decimal rate precision; round each earnings amount to cents. PTO receives regular base pay and the entered PTO shift differential. The old multiplier remains only a model fallback when explicit overtime rates are omitted.

The reference statement is reproduced from 46 hours 5 minutes worked (46.08 payroll hours) plus 2 PTO hours: regular base990.00, overtime base225.72, regular/PTO shift84.00, overtime shift18.24, PTO base49.50; gross $1,367.46. No arbitrary adjustment is subtracted from gross.

## Deductions and withholding

Pre-tax benefits start at $37.38/week (dental3.46 + medical30.23 + vision3.69). Traditional401(k) starts at 3% of each week's gross. Additional after-tax deductions start at **zero**; Anytime Pay is entered separately and deducted only once from total net pay.

Federal estimates use the [2026 IRS Publication15-T automated percentage method](https://www.irs.gov/publications/p15t), 52 weekly periods and 2020-or-later W-4 assumptions. Head of household comes from the reference statement. The **$2,200 annual credit adjustment is inferred to match the supplied checks**; it is not a verified W-4 election or dependent count. Confirm/update it using W-4 Step 3. The Step 2 checkbox is editable; other W-4 income/deduction adjustments are not modeled. A blank federal override uses the formula; an explicit zero intentionally overrides federal withholding to zero.

Delaware uses the [official employer annualized computation](https://revenue.delaware.gov/employers-guide-withholding-regulations-employers-duties/), $3,250 individual deduction ($6,500 married jointly) and an editable annual withholding credit starting at $110. Federal/DE taxable earnings deduct pre-tax benefits and traditional 401(k). Social Security, Medicare, city tax and paid-leave contributions use effective rates from the latest reference check, against gross less pre-tax benefits. They remain calibrated estimates; unmodeled taxable benefits, year-to-date limits and payroll timing can affect future checks.

Reference outcomes: taxable income695.13 => federal0.00, DE25.56; taxable income1289.06 => federal49.84, DE59.29. At reference gross $1,367.46, total taxes232.90 (17.03%), benefits $37.38 and retirement $41.02 leave1056.16 before transfers. Transfers824.18 leave the payday deposit **231.98**.

## Paystub reconciliation and early pay

Optional actual gross, total taxes, and401(k) amounts replace the corresponding estimates for checking an issued statement. When actual taxes are entered, the UI shows that reported total instead of presenting an invented itemized breakdown. Historical statements can be reconciled using their own actual taxes and deductions; current calibration is not forced onto past checks.

Main result is money left for payday after completed transfers. Total take-home including money already received is secondary. Anytime Pay availability is separate: gross/eligible earnings × the current eligibility percentage, rounded upward to cents, minus completed transfers. PTO eligibility and Amazon timing/limits can differ, so an eligible-earnings override is retained. Eligibility never changes gross pay or tax calculations.

`calculateAnytime Pay(regular_hours,regular_rate,shift_diff_rate,eligible_percent)` retains the original regular-pay helper contract (fraction such as0.65); the UI uses the full earnings model including overtime/PTO. No paystub images, names, addresses, payroll/account identifiers are stored in this repository.
