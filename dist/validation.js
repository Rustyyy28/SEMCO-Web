/** Shared validation and accessible form feedback for the SEMCO prototype. */

const text = (values, key) => typeof values?.[key] === 'string' ? values[key].trim() : '';
const owns = (values, key) => Object.prototype.hasOwnProperty.call(values || {}, key);
const empty = value => value === undefined || value === null || value === '' || (typeof value === 'string' && !value.trim());
const numericPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

const searchStatuses = new Set([
  'pending', 'needs revision', 'verified', 'evaluated', 'approved', 'rejected',
  'active', 'completed', 'closed', 'posted', 'overdue', 'paid', 'cancelled',
]);
const searchProducts = new Set([
  'Regular loan', 'Economic loan', 'Short-term loan', 'SEMCO loan', 'Motorcycle loan',
  'Appliance / Special loan', 'Medical loan', 'Credit card loan', 'Laptop loan', 'Property / Vehicle loan',
].map(value => value.toLowerCase()));

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function dateParts(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return null;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1] ? { year, month, day } : null;
}

function checkBirthDate(values, errors, today) {
  const birthValue = text(values, 'birthDate');
  const birth = dateParts(birthValue);
  const currentValue = today || localToday();
  const current = dateParts(currentValue);
  if (!birth) {
    errors.birthDate = 'Enter a valid birth date.';
    return;
  }
  if (!current) throw new Error('The validation date must use a valid YYYY-MM-DD date.');
  let age = current.year - birth.year;
  if (current.month < birth.month || (current.month === birth.month && current.day < birth.day)) age -= 1;
  if (birthValue > currentValue || age < 18 || age > 100) {
    errors.birthDate = 'Use a birth date for an age of 18 to 100 for this prototype.';
  }
}

function checkBoolean(values, key, errors, label) {
  if (owns(values, key) && typeof values[key] !== 'boolean') errors[key] = `Choose a valid ${label} preference.`;
}

function checkIdentity(values, errors, { existingEmails = [], today } = {}) {
  const name = text(values, 'fullName');
  if (name.length < 2 || name.length > 70) errors.fullName = 'Enter your full name using 2 to 70 characters.';
  const email = text(values, 'email');
  const local = email.split('@')[0];
  const emailPattern = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;
  if (email.length > 120 || !emailPattern.test(email) || local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    errors.email = 'Enter a valid email address with no more than 120 characters.';
  } else if (existingEmails.some(value => String(value).trim().toLowerCase() === email.toLowerCase())) {
    errors.email = 'This email address already belongs to another account.';
  }
  if (!/^(?:09\d{9}|\+639\d{9})$/.test(text(values, 'phone').replace(/[\s-]/g, ''))) {
    errors.phone = 'Enter a Philippine mobile number such as 0912 345 6789 or +63 912 345 6789.';
  }
  checkBirthDate(values, errors, today);
  if (!text(values, 'department')) errors.department = 'Choose your department or office.';
  if (!['Email', 'SMS'].includes(text(values, 'preferredContact'))) errors.preferredContact = 'Choose Email or SMS as your preferred contact method.';
  checkBoolean(values, 'notifications', errors, 'notification');
}

function checkNumber(values, key, errors, { min = 0, max = 10000000, label = key, optional = false } = {}) {
  const value = values?.[key];
  if (optional && empty(value)) return null;
  const validType = typeof value === 'number' || (typeof value === 'string' && numericPattern.test(value.trim()));
  const amount = validType ? Number(value) : NaN;
  if (!Number.isFinite(amount) || amount < min || amount > max) {
    errors[key] = `Enter ${label} from ${min.toLocaleString('en-US')} to ${max.toLocaleString('en-US')}.`;
    return null;
  }
  return amount;
}

export function validateRegistration(values, options = {}) {
  const errors = {};
  checkIdentity(values, errors, options);
  if (!['Permanent', 'Contractual', 'Coterminous'].includes(text(values, 'employmentType'))) errors.employmentType = 'Choose a valid employment type.';
  if (!/^(?=.*[A-Za-z0-9])[A-Za-z0-9-]{3,24}$/.test(text(values, 'employeeId'))) errors.employeeId = 'Use 3 to 24 letters, numbers, or hyphens for your employee ID.';
  const income = checkNumber(values, 'income', errors, { label: 'a monthly income' });
  if (income === null || income === 0) errors.income = 'Enter a monthly income above ₱0 and no more than ₱10,000,000.';
  const password = typeof values?.password === 'string' ? values.password : '';
  if (password.length < 8 || password.length > 64 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = 'Use 8 to 64 characters including at least one letter and one number.';
  if (typeof values?.confirmPassword !== 'string' || !values.confirmPassword || values.confirmPassword !== password) errors.confirmPassword = 'Re-enter the same password to confirm it.';
  if (values?.terms !== true) errors.terms = 'Confirm that these details are fictional and for this prototype.';
  return errors;
}

export function validateProfile(values, options = {}) {
  const errors = {};
  checkIdentity(values, errors, options);
  const address = text(values, 'address');
  if (address.length < 10 || address.length > 200) errors.address = 'Enter an address using 10 to 200 characters.';
  if (values?.confirmAccurate !== true) errors.confirmAccurate = 'Confirm that you have reviewed these profile details.';
  return errors;
}

export function validateSearch(values) {
  const errors = {};
  const keyword = text(values, 'keyword');
  if (keyword && (keyword.length < 2 || keyword.length > 80)) errors.keyword = 'Use 2 to 80 characters for your search keyword.';
  if (!['applications', 'loans', 'payments'].includes(text(values, 'recordType'))) errors.recordType = 'Choose applications, loans, or payments.';
  const status = text(values, 'status').toLowerCase();
  if (status && !searchStatuses.has(status)) errors.status = 'Choose a status from the list.';
  const product = text(values, 'product').toLowerCase();
  if (product && !searchProducts.has(product)) errors.product = 'Choose a loan facility from the list.';
  for (const [key, label] of [['fromDate', 'start'], ['toDate', 'end']]) {
    if (text(values, key) && !dateParts(text(values, key))) errors[key] = `Enter a valid ${label} date.`;
  }
  if (!errors.fromDate && !errors.toDate && text(values, 'fromDate') && text(values, 'toDate') && text(values, 'fromDate') > text(values, 'toDate')) errors.toDate = 'Use an end date on or after the start date.';
  const minAmount = checkNumber(values, 'minAmount', errors, { optional: true, label: 'a minimum amount' });
  const maxAmount = checkNumber(values, 'maxAmount', errors, { optional: true, label: 'a maximum amount' });
  if (minAmount !== null && maxAmount !== null && minAmount > maxAmount) errors.maxAmount = 'Use a maximum amount greater than or equal to the minimum amount.';
  if (!['newest', 'oldest', 'amount-high', 'amount-low'].includes(text(values, 'sort'))) errors.sort = 'Choose a sort order from the list.';
  if (!['contains', 'exact'].includes(text(values, 'matchMode'))) errors.matchMode = 'Choose contains or exact match.';
  checkBoolean(values, 'includeClosed', errors, 'closed-record');
  return errors;
}

export function validateLoan(values) {
  const errors = {};
  checkNumber(values, 'amount', errors, { min: 1000, max: 2000000, label: 'a loan amount' });
  checkNumber(values, 'income', errors, { min: 1, label: 'a monthly income' });
  checkNumber(values, 'liabilities', errors, { label: 'existing monthly payments' });
  checkNumber(values, 'savings', errors, { label: 'share capital or savings' });
  checkNumber(values, 'repayment', errors, { max: 100, label: 'an on-time repayment percentage' });
  checkNumber(values, 'comakerIncome', errors, { min: 1, label: 'a co-maker monthly income' });
  checkNumber(values, 'comakerLiabilities', errors, { label: 'co-maker monthly payments' });
  const term = typeof values?.term === 'number' || (typeof values?.term === 'string' && numericPattern.test(values.term.trim())) ? Number(values.term) : NaN;
  if (![6, 12, 18, 24, 36, 48, 60].includes(term)) errors.term = 'Choose a repayment term from the list.';
  const purpose = text(values, 'purpose');
  if (purpose.length < 5 || purpose.length > 180) errors.purpose = 'Describe your loan purpose using 5 to 180 characters.';
  const comakerName = text(values, 'comakerName');
  if (comakerName.length < 2 || comakerName.length > 70) errors.comakerName = 'Enter the co-maker’s full name using 2 to 70 characters.';
  return errors;
}

function controlsOf(form) {
  return Array.from(form.elements || []).filter(control => /^(INPUT|SELECT|TEXTAREA)$/.test(control.tagName) && control.name && !control.disabled && !['button', 'submit', 'reset', 'image', 'file'].includes(control.type));
}

export function readFormValues(form) {
  const values = {};
  const controls = controlsOf(form);
  for (const control of controls) {
    const { name, type } = control;
    if (type === 'radio') {
      if (!owns(values, name)) values[name] = '';
      if (control.checked) values[name] = control.value;
    } else if (type === 'checkbox') {
      const group = controls.filter(item => item.name === name && item.type === 'checkbox');
      values[name] = group.length === 1 ? control.checked : group.filter(item => item.checked).map(item => item.value);
    } else values[name] = String(control.value ?? '');
  }
  return values;
}

let formSequence = 0;
const boundForms = new WeakMap();

export function bindValidatedForm(form, { validate = () => ({}), onValid, onReset } = {}) {
  if (!form?.addEventListener) throw new TypeError('A form element is required.');
  boundForms.get(form)?.destroy();
  form.noValidate = true;
  const prefix = form.id || `validated-form-${++formSequence}`;
  const changedControls = new Map();
  let attempted = false;
  let pending = false;
  let lastErrors = {};
  let summary = form.querySelector('[data-error-summary]');
  if (!summary) {
    summary = form.ownerDocument.createElement('div');
    summary.className = 'form-error-summary';
    summary.dataset.errorSummary = '';
    summary.hidden = true;
    summary.tabIndex = -1;
    summary.setAttribute('role', 'alert');
    form.prepend(summary);
  }

  const fieldControls = name => controlsOf(form).filter(control => control.name === name);
  const wrapperFor = name => Array.from(form.querySelectorAll('[data-field]')).find(node => node.dataset.field === name);
  const labelFor = (name, control) => {
    const wrapper = wrapperFor(name);
    const legend = wrapper?.querySelector('legend') || (control?.type === 'radio' ? control.closest('fieldset')?.querySelector('legend') : null);
    const label = legend || control?.labels?.[0] || wrapper?.querySelector('label');
    return label?.textContent?.replace(/\s+/g, ' ').replace(/\s*\*\s*$/, '').trim() || name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').replace(/^./, character => character.toUpperCase());
  };

  function clearErrors() {
    for (const [control, original] of changedControls) {
      control.classList.remove('is-invalid');
      if (original.invalid === null) control.removeAttribute('aria-invalid');
      else control.setAttribute('aria-invalid', original.invalid);
      const descriptions = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== original.errorId);
      if (descriptions.length) control.setAttribute('aria-describedby', descriptions.join(' '));
      else control.removeAttribute('aria-describedby');
    }
    changedControls.clear();
    form.querySelectorAll('[data-validation-error]').forEach(node => node.remove());
    summary.replaceChildren();
    summary.hidden = true;
    lastErrors = {};
  }

  function focusControl(control) {
    if (!control) return;
    control.focus({ preventScroll: true });
    control.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }

  function showErrors(errors, focus = false) {
    clearErrors();
    lastErrors = Object.fromEntries(Object.entries(errors || {}).filter(([, message]) => typeof message === 'string' && message));
    const entries = Object.entries(lastErrors);
    if (!entries.length) return;
    const document = form.ownerDocument;
    const title = document.createElement('p');
    title.className = 'fw-semibold mb-2';
    title.textContent = 'Please check the following before continuing:';
    const list = document.createElement('ul');
    let firstInvalid;
    for (const [name, message] of entries) {
      const targets = fieldControls(name);
      const first = targets[0];
      const item = document.createElement('li');
      if (first) {
        if (!first.id) first.id = `${prefix}-field-${controlsOf(form).indexOf(first)}`;
        const errorId = `${first.id}-validation-error`;
        const error = document.createElement('p');
        error.id = errorId;
        error.className = 'field-error';
        error.dataset.validationError = name;
        error.textContent = message;
        const wrapper = wrapperFor(name) || (first.type === 'radio' ? first.closest('fieldset') : null);
        if (wrapper) wrapper.append(error);
        else first.insertAdjacentElement('afterend', error);
        for (const control of targets) {
          changedControls.set(control, { invalid: control.getAttribute('aria-invalid'), errorId });
          control.classList.add('is-invalid');
          control.setAttribute('aria-invalid', 'true');
          const descriptions = new Set((control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
          descriptions.add(errorId);
          control.setAttribute('aria-describedby', [...descriptions].join(' '));
        }
        const link = document.createElement('a');
        link.href = `#${first.id}`;
        link.dataset.errorFor = name;
        link.textContent = `${labelFor(name, first)}: ${message}`;
        item.append(link);
        firstInvalid ||= first;
      } else item.textContent = message;
      list.append(item);
    }
    summary.append(title, list);
    summary.hidden = false;
    if (focus) {
      if (firstInvalid) focusControl(firstInvalid);
      else summary.focus();
    }
  }

  function nativeErrors() {
    const errors = {};
    for (const control of controlsOf(form)) {
      if (!control.willValidate || control.validity?.valid || errors[control.name]) continue;
      const validity = control.validity;
      const label = labelFor(control.name, control).toLowerCase();
      if (validity.valueMissing) errors[control.name] = control.type === 'checkbox' ? `Please confirm ${label}.` : control.type === 'radio' || control.tagName === 'SELECT' ? `Choose ${label}.` : `Enter ${label}.`;
      else if (validity.typeMismatch) errors[control.name] = `Enter a valid ${control.type === 'email' ? 'email address' : label}.`;
      else if (validity.rangeUnderflow) errors[control.name] = `Enter ${label} of at least ${control.min}.`;
      else if (validity.rangeOverflow) errors[control.name] = `Enter ${label} no greater than ${control.max}.`;
      else if (validity.tooShort) errors[control.name] = `Use at least ${control.minLength} characters for ${label}.`;
      else if (validity.tooLong) errors[control.name] = `Use no more than ${control.maxLength} characters for ${label}.`;
      else if (validity.patternMismatch) errors[control.name] = control.title || `Use the requested format for ${label}.`;
      else if (validity.stepMismatch) errors[control.name] = `Use the requested increment for ${label}.`;
      else errors[control.name] = `Enter a valid value for ${label}.`;
    }
    return errors;
  }

  function runValidation(focus = false) {
    const values = readFormValues(form);
    const errors = { ...nativeErrors(), ...(validate(values) || {}) };
    showErrors(errors, focus);
    return { values, errors: { ...lastErrors } };
  }

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    attempted = true;
    let result;
    try { result = runValidation(true); }
    catch (error) { showErrors({ _form: error?.message || 'Unable to check this form. Please try again.' }, true); return; }
    if (Object.keys(result.errors).length) return;
    pending = true;
    const previousBusy = form.getAttribute('aria-busy');
    const buttons = Array.from(form.querySelectorAll('button:not([type]),button[type="submit"],input[type="submit"]')).map(button => [button, button.disabled]);
    form.setAttribute('aria-busy', 'true');
    buttons.forEach(([button]) => { button.disabled = true; });
    try { await onValid?.(result.values, event); }
    catch (error) { showErrors({ _form: error?.message || 'Unable to save this form. Please try again.' }, true); }
    finally {
      pending = false;
      buttons.forEach(([button, disabled]) => { button.disabled = disabled; });
      if (previousBusy === null) form.removeAttribute('aria-busy');
      else form.setAttribute('aria-busy', previousBusy);
    }
  }

  function update() {
    if (!attempted || pending) return;
    try { runValidation(false); }
    catch (error) { showErrors({ _form: error?.message || 'Unable to check this form. Please try again.' }); }
  }

  function reset(event) {
    attempted = false;
    clearErrors();
    setTimeout(() => {
      if (event.defaultPrevented) return;
      clearErrors();
      Promise.resolve().then(() => onReset?.()).catch(error => showErrors({ _form: error?.message || 'Unable to reset this form.' }));
    }, 0);
  }

  function summaryClick(event) {
    const link = event.target.closest?.('[data-error-for]');
    if (!link || !summary.contains(link)) return;
    event.preventDefault();
    focusControl(fieldControls(link.dataset.errorFor)[0]);
  }

  form.addEventListener('submit', submit);
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('reset', reset);
  summary.addEventListener('click', summaryClick);
  const controller = {
    validate: () => runValidation(false).errors,
    clear: clearErrors,
    destroy() {
      clearErrors();
      form.removeEventListener('submit', submit);
      form.removeEventListener('input', update);
      form.removeEventListener('change', update);
      form.removeEventListener('reset', reset);
      summary.removeEventListener('click', summaryClick);
      boundForms.delete(form);
    },
  };
  boundForms.set(form, controller);
  return controller;
}
