# Form Controls Assignment — SEMCO

This submission implements two major forms and two supporting forms inside the SEMCO final-project prototype. It retains HTML5, CSS3, JavaScript, Bootstrap 5.3.8, the Python calculation API, and the simple SCEA/BRB advisory workflow.

## Requirement mapping

Counts below exclude submit/reset buttons and hidden fields. Radio choices are individual HTML controls.

| Classification | Form | Data-entry controls | Where to find it | Result handled by the system |
| --- | --- | ---: | --- | --- |
| Major 1 | Member registration | 14, plus a password-visibility checkbox | Sign out → Create a member account | After simulated OTP, adds a member and user record. The saved member appears in the portal and staff directory. The registered demo email/password can sign in again. |
| Major 2 | Loan application details | 10 | Member → New application → Choose a loan → Your details | Estimates repayments, validates all details, displays a review, then submits an application with an initial advisory check. It appears in member tracking and the staff queue. |
| Supporting 1 | Profile update | 10 editable controls, plus a read-only identifier | My profile, available to all roles | Saves contact details/preferences and updates the sidebar and linked application/payment display names. Shows a saved summary. |
| Supporting 2 | Record search/filter | 12 | Record search, available to all roles | Applies combined filters and sorting to actual demo records; displays a result count, matching rows, or an empty state. Saves the last filters per role. |

The existing sign-in, OTP, calculator, staff verification and administrative forms are additional prototype screens; the four forms above are the designated assignment deliverables.

## Major form 1 — Member registration

Controls: full name, email, mobile, birth date, department, employment type, employee reference, monthly income, password, password confirmation, two contact-method radio choices, notification switch, fictional-data confirmation. A separate checkbox reveals/hides both passwords. Descriptive actions are **Create member account** and **Clear registration form**.

Validation includes required fields; 2–70-character names; valid unique email addresses across member/user records; Philippine mobile format; valid dates for a sample age range of 18–100; supported employment choices; a 3–24-character reference; positive income up to ₱10 million; and matching 8–64-character passwords containing a letter and number.

Invalid submissions do not create records. A validated registration proceeds to the demo OTP `123456`; only successful verification commits the member/user record. Passwords are stored as salted PBKDF2-derived demo hashes, never as plaintext. This browser-local sign-in is a prototype and does not provide production authentication.

## Major form 2 — Loan application

The ten required fields are amount, term, purpose, income, existing monthly payments, savings, on-time repayment percentage, co-maker name, co-maker income, and co-maker monthly payments. The first wizard step selects the loan facility; the final step confirms the review.

Sample validation includes a ₱1,000–₱2 million principal in ₱100 increments; a supported 6/12/18/24/36/48/60-month term; 5–180-character purpose; nonnegative financial amounts; positive income; a whole repayment percentage from 0–100; and a 2–70-character co-maker name. All ten values are shown in the final review.

**Restore draft values** resets the current details form and estimate to its rendered draft values. Invalid edits cannot advance to review or overwrite the saved draft through Back navigation. Valid submission runs the existing advisory check and saves the application; it never automatically approves a loan.

## Supporting form 1 — Profile update

Controls: name, email, mobile, birth date, department, contact-address textarea, two contact-method radio choices, notification switch, and confirmation checkbox. The member/employee identifier is read-only. Actions: **Save profile changes** and **Discard profile changes**.

The form checks identity/contact formats, duplicate emails, valid adult dates, a 10–200-character address, and explicit confirmation. A successful save displays a summary and persists the data. The member ID stays unchanged, so name updates retain the record links. Discard restores the latest saved values without writing changes.

## Supporting form 2 — Search/filter

Controls: keyword, record type, status, facility, from/to dates, minimum/maximum amounts, sort order, two keyword-match radio choices, and a closed-record toggle. Actions: **Search records** and **Clear search filters**.

Optional keywords require 2–80 characters. Dates must be real calendar dates with the end on/after the start. Amounts must be nonnegative and within ₱10 million, with maximum ≥ minimum. Dropdowns use supported options. Invalid filters leave the previous results intact. Valid filters apply together. Member results are scoped to the current member before filtering; staff/admin can explore the fictional workspace. Clear resets the filters and result list.

## Usability and accessibility

- Every input has an explicit label or a wrapping label. Related radio choices use a fieldset and legend.
- Required fields are marked, and helper text explains formats/ranges. Inputs reference their helper text with `aria-describedby`.
- Invalid submissions show both a summary with focusable error links and field-level messages. Invalid controls receive `aria-invalid` and a reference to the relevant error text.
- Focus moves to the first invalid field on submit. Correcting values updates feedback without moving focus on each keystroke.
- DOM order provides natural keyboard navigation. There are no positive `tabindex` values. Read-only fields remain discoverable; the closed mobile sidebar is inert so its hidden controls are skipped.
- Saved-profile feedback and search counts use live status regions. Submit/reset buttons have specific labels. Async submission blocks duplicate submits.
- Responsive layouts use Bootstrap and the established SEMCO styles. Higher contrast and larger text remain available in Help & accessibility.

## Validation and test evidence

Run from the project folder:

```sh
node tests/test_forms.mjs
python3 -m unittest discover -s tests -v
```

The 13 form checks cover valid/invalid registration, case-insensitive duplicate email, password length/format/matching, exact birthday boundaries and invalid dates, profile confirmation/address validation, search range/order validation, loan ranges/terms, form-value parsing, and salted demo password verification. The eight existing Python tests cover calculation scenarios, API errors, and Python/JavaScript parity.

Browser walkthrough completed on October 27, 2026:

| Check | Observed result |
| --- | --- |
| Submit an empty registration | Required-field summary and inline errors; first field focused. |
| Submit mismatched passwords | Confirmation error; form stays open; no member created. |
| Submit valid fictional registration and OTP | New member/user appears; member portal opens with the new name. |
| Sign in again with registered demo credentials | Simulated OTP completes and returns to the same member. |
| Submit invalid profile name/email without confirmation | Three specific errors; existing saved name unchanged. |
| Save valid profile details and reload | Updated name/email/contact preference persists; linked display names update. |
| Search with minimum > maximum | Amount-range error; previous results unchanged. |
| Combine status, facility, dates and amounts | Results reduce from two member applications to one matching record. |
| Clear search filters | Fields reset and both original member records return. |
| Submit invalid loan amount/income/short purpose | Three field errors; review is prevented; first invalid field focused. |
| Restore loan draft values | Original amounts restored and errors cleared. |
| Submit valid loan details and final confirmation | All values appear in review; application is stored as Pending with the current Manila date. |

## Files and collaboration

The [profile-form screenshot](docs/evidence/profile-form.jpg) shows a successful validated submission and the complete set of profile controls. It uses a fictional account created during browser testing.

- `dist/registration.js`: registration controls and demo credential handling.
- `dist/member.js`: loan details and the application workflow.
- `dist/supporting-forms.js`: profile and record search/filter forms.
- `dist/validation.js`: shared validation, error summaries, focus, ARIA and reset handling.
- `dist/app.js`, `dist/styles.css`: integration, navigation and responsive form styles.
- `tests/test_forms.mjs`: repeatable Node assertions; `tests/test_engine.py`: existing Python/API checks.

Work was divided into registration/integration, reusable validation/tests, supporting forms, and loan-form review, then combined and checked in the same version-controlled project. Assign these areas to the actual group members for your own contribution log; the prototype does not claim specific human authorship.

All assignment values and credit rules are illustrative. Demo data is stored in local storage, satisfying the requirement to reflect results in the UI without adding a database. PDF generation, document uploads, real messages, production role enforcement and disbursement remain outside scope.
