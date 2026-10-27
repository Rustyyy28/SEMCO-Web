import assert from 'node:assert/strict';
import { readFormValues, validateRegistration, validateProfile, validateSearch, validateLoan } from '../dist/validation.js';
import { createDemoCredential, verifyDemoCredential } from '../dist/registration.js';

const today = '2026-10-27';
const registration = {
  fullName: 'Maria Santos', email: 'maria.santos@semco.demo', phone: '0912 345 6789',
  birthDate: '1992-06-12', department: 'City Accounting Office', employmentType: 'Permanent',
  employeeId: 'EMP-1024', income: '42000', password: 'SemcoDemo2026', confirmPassword: 'SemcoDemo2026',
  preferredContact: 'Email', terms: true, notifications: false,
};
const profile = {
  fullName: registration.fullName, email: registration.email, phone: '+63 912 345 6789',
  birthDate: registration.birthDate, department: registration.department,
  address: '24 Sampaguita Street, City of Santa Rosa', preferredContact: 'SMS', notifications: true, confirmAccurate: true,
};
const search = {
  keyword: '', recordType: 'applications', status: '', product: '', fromDate: '', toDate: '',
  minAmount: '', maxAmount: '', sort: 'newest', matchMode: 'contains', includeClosed: false,
};
const loan = {
  amount: '50000', income: '42000', liabilities: '4500', savings: '35000', repayment: '95',
  comakerIncome: '35000', comakerLiabilities: '3000', term: '12', purpose: 'Medical expenses', comakerName: 'Jose Mendoza',
};

const checks = [];
function test(name, run) { checks.push([name, run]); }

test('valid registration accepts trimmed names and Philippine phone formats', () => {
  assert.deepEqual(validateRegistration(registration, { today }), {});
  for (const phone of ['09123456789', '+639123456789', '0912-345-6789', '+63 912 345 6789']) {
    assert.deepEqual(validateRegistration({ ...registration, fullName: '  María Santos  ', phone }, { today }), {});
  }
});

test('duplicate registration email is case insensitive', () => {
  const errors = validateRegistration({ ...registration, email: '  MARIA.SANTOS@SEMCO.DEMO ' }, { today, existingEmails: ['maria.santos@semco.demo'] });
  assert.match(errors.email, /already belongs/);
  assert.equal(Object.keys(errors).length, 1);
});

test('invalid registration fields and unsupported choices are rejected', () => {
  const errors = validateRegistration({ ...registration, fullName: '  ', email: 'maria@.demo', phone: '12345678',
    department: '', employmentType: 'Intern', employeeId: 'EMP 12', income: 0, preferredContact: 'Phone', terms: false, notifications: 'yes' }, { today });
  for (const key of ['fullName', 'email', 'phone', 'department', 'employmentType', 'employeeId', 'income', 'preferredContact', 'terms', 'notifications']) assert.ok(errors[key], key);
});

test('registration passwords need the length, letter, digit, and matching confirmation', () => {
  for (const password of ['short1', 'abcdefgh', '12345678', 'a1'.repeat(33)]) {
    assert.ok(validateRegistration({ ...registration, password, confirmPassword: password }, { today }).password, password);
  }
  assert.ok(validateRegistration({ ...registration, confirmPassword: 'SomethingElse1' }, { today }).confirmPassword);
});

test('birth date checks exact adult birthday and invalid calendar dates', () => {
  assert.equal(validateRegistration({ ...registration, birthDate: '2008-10-27' }, { today }).birthDate, undefined);
  assert.ok(validateRegistration({ ...registration, birthDate: '2008-10-28' }, { today }).birthDate);
  assert.equal(validateRegistration({ ...registration, birthDate: '1926-10-27' }, { today }).birthDate, undefined);
  for (const birthDate of ['1925-10-27', '2030-01-01', '2001-02-29', '1992-02-30', '1992-13-01', '1992-1-01', '']) {
    assert.ok(validateRegistration({ ...registration, birthDate }, { today }).birthDate, birthDate);
  }
  assert.equal(validateRegistration({ ...registration, birthDate: '2000-02-29' }, { today }).birthDate, undefined);
});

test('profile validates address, duplicate email and explicit accuracy confirmation', () => {
  assert.deepEqual(validateProfile(profile, { today }), {});
  const errors = validateProfile({ ...profile, address: 'Short', confirmAccurate: false }, { today, existingEmails: ['MARIA.SANTOS@SEMCO.DEMO'] });
  assert.ok(errors.address);
  assert.ok(errors.confirmAccurate);
  assert.ok(errors.email);
});

test('search allows an empty keyword and a complete recognized filter', () => {
  assert.deepEqual(validateSearch(search), {});
  assert.deepEqual(validateSearch({ ...search, keyword: 'APP-2026', status: 'Needs revision', product: 'Regular loan',
    fromDate: '2026-01-01', toDate: '2026-10-27', minAmount: '0', maxAmount: '50000', sort: 'amount-high', matchMode: 'exact', includeClosed: true }), {});
});

test('search checks date order, calendar validity and numeric range order', () => {
  const reverse = validateSearch({ ...search, fromDate: '2026-10-27', toDate: '2026-01-01', minAmount: '50000', maxAmount: '1000' });
  assert.ok(reverse.toDate);
  assert.ok(reverse.maxAmount);
  const errors = validateSearch({ ...search, keyword: 'x', fromDate: '2026-02-30', minAmount: '-1', maxAmount: '10000001',
    recordType: 'people', status: 'Invented', product: 'Invented', sort: 'random', matchMode: 'fuzzy', includeClosed: 'yes' });
  for (const key of ['keyword', 'fromDate', 'minAmount', 'maxAmount', 'recordType', 'status', 'product', 'sort', 'matchMode', 'includeClosed']) assert.ok(errors[key], key);
});

test('loan accepts the valid sample and supported endpoint ranges', () => {
  assert.deepEqual(validateLoan(loan), {});
  assert.deepEqual(validateLoan({ ...loan, amount: 2000000, income: 1, liabilities: 0, savings: 0, repayment: 0,
    comakerIncome: 1, comakerLiabilities: 0, term: 60 }), {});
});

test('loan rejects missing, nonfinite and out-of-range amounts or invalid terms', () => {
  const errors = validateLoan({ ...loan, amount: '999', income: 0, liabilities: -1, savings: 10000001, repayment: 101,
    comakerIncome: '', comakerLiabilities: 'Infinity', term: '9', purpose: 'Hi', comakerName: ' ' });
  for (const key of Object.keys(loan)) assert.ok(errors[key], key);
  for (const amount of [NaN, Infinity, true, '', '0x1000', 'not a number', 2000001]) assert.ok(validateLoan({ ...loan, amount }).amount, String(amount));
});

test('readFormValues keeps strings, checkbox booleans and the selected radio value', () => {
  const field = (name, value, extra = {}) => ({ tagName: 'INPUT', type: 'text', name, value, disabled: false, ...extra });
  const form = { elements: [field('fullName', '  Maria Santos  '), field('income', '42000'),
    field('notifications', 'on', { type: 'checkbox', checked: false }), field('terms', 'on', { type: 'checkbox', checked: true }),
    field('preferredContact', 'Email', { type: 'radio', checked: false }), field('preferredContact', 'SMS', { type: 'radio', checked: true }),
    field('ignored', 'secret', { disabled: true }), field('submitButton', 'Save', { type: 'submit' }),
    field('department', 'Accounting', { tagName: 'SELECT', type: 'select-one' })] };
  assert.deepEqual(readFormValues(form), { fullName: '  Maria Santos  ', income: '42000', notifications: false, terms: true,
    preferredContact: 'SMS', department: 'Accounting' });
});

test('demo credentials keep a salted hash instead of the raw password', async () => {
  const password = 'FictionalDemo2026';
  const credential = await createDemoCredential(password);
  assert.deepEqual(Object.keys(credential).sort(), ['hash', 'salt']);
  assert.match(credential.salt, /^[a-f0-9]{32}$/);
  assert.match(credential.hash, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(credential).includes(password), false);
  assert.equal(await verifyDemoCredential(password, credential), true);
  assert.equal(await verifyDemoCredential('WrongPassword2026', credential), false);
  assert.equal(await verifyDemoCredential(password, null), false);
});

test('each demo credential receives a new random salt and derived hash', async () => {
  const first = await createDemoCredential('FictionalDemo2026');
  const second = await createDemoCredential('FictionalDemo2026');
  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.hash, second.hash);
});

let failures = 0;
for (const [name, run] of checks) {
  try { await run(); console.log(`PASS ${name}`); }
  catch (error) { failures += 1; console.error(`FAIL ${name}\n${error.stack}`); }
}
console.log(`\n${checks.length - failures}/${checks.length} form validation checks passed.`);
process.exitCode = failures ? 1 : 0;
