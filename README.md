# SEMCO loan management prototype

A frontend-first research prototype for the **Senate Employees Multipurpose Cooperative**, using HTML5, CSS3, JavaScript, locally bundled **Bootstrap 5.3.8**, and a small Python server. No npm installation, database, or Python packages are required.

## Run locally

From this folder:

```sh
python3 server.py --port 8000
```

Open http://127.0.0.1:8000 in a browser. The member dashboard opens immediately. Use **Preview as** in the top bar to explore **Member**, **Staff**, and **Admin**. On a phone, the menu button opens the sidebar.

The hosted version serves the frontend and matching JavaScript evaluation. The local version calls the Python evaluation API. Both engines implement the same model and have a parity test.

## Suggested presentation flow

1. **Member:** select New application, choose any of the ten loan facilities, fill in fictional details, review the estimate, and submit. Open My applications to track or edit a pending application.
2. **Staff:** open that application, complete the verification checklist, run credit evaluation, inspect its score, belief distribution and influential IF–THEN rules, then save the recommendation.
3. **Staff:** reopen the evaluated application and select Route to final review. Choose a simulated Chairman/Vice Chairman decision and enter a reason. The engine never decides automatically.
4. **Member:** return to My applications to see the updated status. Approved applications add a demo loan account.
5. **Staff:** Payments & ledger lets you post a sample salary deduction or over-the-counter payment. It updates the sample balance and appears in the member ledger.
6. **Admin:** inspect Users & access, the ten loan facilities, sample interest/fee configuration, report previews, and date-filtered audit events.
7. **Help & accessibility:** explore FAQ, quick-start guide, larger text and higher contrast. Reset demo data restores the original fictional records.

The sign-out button opens simulated login and registration. Login credentials are `member@semco.demo`, `staff@semco.demo`, or `admin@semco.demo`, with password `semco123`. The demo OTP is `123456` (three attempts, with a simulated resend). Registration provisions a demo member only. The expanded registration form validates contact/employment details and matching passwords before the simulated OTP. Registered demo credentials can be used for later local sign-ins.

## Form-controls assignment

See [FORM_CONTROLS.md](FORM_CONTROLS.md) for the two major forms and two supporting forms, control counts, validation rules, accessibility features, presentation steps, and test evidence. Each designated form has at least ten non-button controls.

## Simple SCEA and Belief Rule Base

`engine.py` and `dist/engine.js` use twelve small IF–THEN rules and four criteria:

| Criterion | Weight | Favourable / middle / adverse references |
| --- | --- | --- |
| Applicant affordability | 40% | Debt-to-income: 20% / 40% / 60% |
| Savings coverage | 25% | Savings / principal: 70% / 40% / 10% |
| Repayment history | 20% | On-time payments: 100% / 75% / 50% |
| Co-maker affordability | 15% | Debt-to-income: 20% / 40% / 60% |

Debt-to-income includes the estimated payment on the proposed loan. Linear matching degrees activate the rules. Each active rule contributes belief to **Recommended**, **Needs review**, and **Not recommended**. A normalized weighted blend combines those beliefs. Score = `100 × recommended belief + 50 × review belief`, rounded to an integer. Scores ≥70 are Recommended; 40–69 Need review; below 40 are Not recommended.

This intentionally simplified BRB uses weighted blending, **not the full evidential-reasoning algorithm** described as a future research implementation. All thresholds, weights, rates, fees and product terms are illustrative. They are not verified SEMCO policy.

Calculations include fixed/flat annual interest and diminishing-balance annuity payments. A sample service fee is deducted from proceeds. The payment ledger demonstrates balance reduction by the posted amount; it does not allocate interest or fees as a production accounting system would. Historical chart data and upcoming schedule dates are presentation fixtures.

## Scope and research assumptions

The supplied research contained flowchart captions and prose descriptions, but no diagram images. The prototype follows the described roles and workflow: application → verification → advisory evaluation → Chairman/Vice Chairman decision.

Production authentication, RBAC enforcement, OTP email delivery, uploads, PDF generation/printing, database persistence, live disbursement, and immutable audit infrastructure are intentionally outside scope. Registration, profile editing, and record search/filtering now have working validated forms and browser-local persistence. Demo state is stored in this browser’s local storage; it is not shared between browsers or devices. User-role controls illustrate the intended administrative interface and do not change real permissions or login credentials. Use fictional data only.

The research’s fourth facility is named only “SEMCO”; the UI calls it “SEMCO loan” without inventing an expanded name.

## Structure

```text
dist/               HTML, CSS, JS and bundled framework assets
  app.js            Shell, role preview, demo state, login, profile and help
  member.js         Member dashboard, applications, loans and calculator
  operators.js      Staff and administrator interfaces
  engine.js         Browser calculation and BRB model
  registration.js   Validated member registration and demo credentials
  supporting-forms.js Validated profile editing and record search
  validation.js     Shared accessible validation and feedback
engine.py           Matching Python calculation and BRB model
server.py           Local static server and JSON evaluation API
tests/test_engine.py Calculation, API validation and engine parity tests
```

## Verify

```sh
python3 -m unittest discover -s tests -v
node tests/test_forms.mjs
```

Eight tests cover fixed/diminishing/zero-interest calculations, favorable/middle/adverse evaluation scenarios, invalid input, HTTP health/evaluation/error responses, and Python/JavaScript parity. The form suite adds 13 checks for validation, cross-field rules, input handling, and salted demo credential verification. Node.js is used for these checks and the parity test; it is not needed to run the prototype.

API: `GET /api/health`, `POST /api/evaluate` with a JSON object containing `amount`, `term`, `annualRate`, `serviceRate`, `method`, `income`, `liabilities`, `savings`, `repayment`, `comakerIncome`, and `comakerLiabilities`.

Bootstrap is distributed under the MIT license. See [Bootstrap documentation](https://getbootstrap.com/docs/5.3/getting-started/introduction/).
