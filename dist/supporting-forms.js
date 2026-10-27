import { icon, money, badge, pageHeading, escapeHTML } from './ui.js';
import { bindValidatedForm, validateProfile, validateSearch } from './validation.js';

const e = value => escapeHTML(String(value ?? ''));
const profileFeedback = new Map();
const departments = ['Legislative Services', 'Administrative Services', 'Office of the Secretary', 'Finance Services', 'Human Resources'];
const searchDefaults = Object.freeze({ keyword: '', recordType: 'applications', status: '', product: '', fromDate: '', toDate: '', minAmount: '', maxAmount: '', sort: 'newest', matchMode: 'contains', includeClosed: true });
const statuses = { applications: ['Pending', 'Verified', 'Evaluated', 'Approved', 'Rejected', 'Needs revision'], loans: ['Active', 'Completed'], payments: ['Posted'] };
const recordNames = { applications: 'applications', loans: 'loans', payments: 'payments' };

const currentDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const initialLetters = name => String(name).trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase();
const profileKey = (profile, ctx) => `${ctx.state.role}:${profile.id || ctx.state.currentMemberId || 'demo'}`;
const help = (id, text) => `<p id="${id}-help" class="form-hint mb-0">${text}</p>`;
const field = (name, label, input, hint) => `<div class="field" data-field="${name}"><label class="form-label" for="${name}">${label}</label>${input}${help(name, hint)}</div>`;
const input = (name, type, value, attrs = '') => `<input id="${name}" name="${name}" type="${type}" class="form-control" value="${e(value)}" aria-describedby="${name}-help" ${attrs}>`;
const option = (value, label, selected) => `<option value="${e(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${e(label)}</option>`;
const select = (name, options, attrs = '') => `<select id="${name}" name="${name}" class="form-select" aria-describedby="${name}-help" ${attrs}>${options}</select>`;
const summary = () => '<div class="form-error-summary mb-4" data-error-summary hidden tabindex="-1" role="alert"></div>';

function birthDateBounds(today) {
  const latest = new Date(`${today}T12:00:00Z`);
  latest.setUTCFullYear(latest.getUTCFullYear() - 18);
  const earliest = new Date(`${today}T12:00:00Z`);
  earliest.setUTCFullYear(earliest.getUTCFullYear() - 101);
  earliest.setUTCDate(earliest.getUTCDate() + 1);
  return { min: earliest.toISOString().slice(0, 10), max: latest.toISOString().slice(0, 10) };
}

function profileValues(profile) {
  return {
    memberId: profile.id || profile.memberId || 'DEMO-ACCOUNT', fullName: profile.name || profile.fullName || '',
    email: profile.email || profile.contactEmail || '', phone: String(profile.phone || '+639175550186').replace(/[^+\d]/g, ''),
    birthDate: profile.birthDate || '1994-06-15', department: profile.department || departments[0],
    address: profile.address || 'Senate Complex, Pasay City', preferredContact: profile.preferredContact || 'Email',
    notifications: profile.notifications ?? true,
  };
}

export function renderProfileForm(profile, ctx) {
  const values = profileValues(profile);
  const choices = [...new Set([...departments, values.department])];
  const bounds = birthDateBounds(currentDate());
  const feedback = profileFeedback.get(profileKey(profile, ctx));
  return pageHeading('SUPPORTING FORM · ACCOUNT', 'Keep your profile up to date.', 'Edit your fictional contact details and preferences, then review and save your changes.', '<span class="control-count">11 form controls</span>') +
    `<div class="supporting-layout content-grid"><section class="panel"><div class="panel-head"><div><h2 class="section-title">Profile update form</h2><p class="muted text-small mb-0 mt-1">Fields marked * are required.</p></div>${icon('user')}</div>
    <form id="profile-update-form" class="panel-body" novalidate>
      ${summary()}<div id="profile-save-feedback" class="form-success mb-4" role="status" tabindex="-1" ${feedback ? '' : 'hidden'}>${feedback ? `${icon('check-circle')}<div><strong>Profile changes saved.</strong><p class="mb-0 mt-1">${e(feedback)}</p></div>` : ''}</div>
      <h3 class="form-section-title">Your account details</h3><div class="row g-4">
        <div class="col-md-6">${field('memberId', 'Member / Employee ID', input('memberId', 'text', values.memberId, 'readonly'), 'This fictional identifier stays linked to your records and cannot be edited.')}</div>
        <div class="col-md-6">${field('fullName', 'Full name *', input('fullName', 'text', values.fullName, 'required minlength="2" maxlength="70" autocomplete="name"'), 'Enter 2–70 characters. Use a fictional name for this demo.')}</div>
        <div class="col-md-6">${field('email', 'Email address *', input('email', 'email', values.email, 'required maxlength="120" autocomplete="email"'), 'Use a valid, unique demo email address. No email will be sent.')}</div>
        <div class="col-md-6">${field('phone', 'Mobile number *', input('phone', 'tel', values.phone, 'required minlength="11" maxlength="13" pattern="(\\+639|09)[0-9]{9}" inputmode="tel" autocomplete="tel"'), 'Use +639175550186 or 09175550186, with no spaces.')}</div>
        <div class="col-md-6">${field('birthDate', 'Date of birth *', input('birthDate', 'date', values.birthDate, `required min="${bounds.min}" max="${bounds.max}" autocomplete="bday"`), 'Use a fictional birth date representing an adult aged 18–100.')}</div>
        <div class="col-md-6">${field('department', 'Department / Office *', select('department', choices.map(d => option(d, d, values.department)).join(''), 'required'), 'Choose the office associated with this demo account.')}</div>
        <div class="col-12">${field('address', 'Contact address *', `<textarea id="address" name="address" class="form-control" rows="3" required minlength="10" maxlength="200" autocomplete="street-address" aria-describedby="address-help">${e(values.address)}</textarea>`, 'Enter 10–200 characters. Use a fictional address.')}</div>
      </div>
      <hr class="my-4"><h3 class="form-section-title">Contact preferences</h3>
      <fieldset class="field mb-4" data-field="preferredContact" aria-describedby="preferredContact-help"><legend class="form-label">Preferred contact method *</legend><div class="radio-options d-flex gap-4 flex-wrap">${['Email', 'SMS'].map((method, index) => `<div class="form-check"><input class="form-check-input" type="radio" id="preferredContact-${index}" name="preferredContact" value="${method}" required aria-describedby="preferredContact-help" ${values.preferredContact === method ? 'checked' : ''}><label class="form-check-label" for="preferredContact-${index}">${method}</label></div>`).join('')}</div>${help('preferredContact', 'Choose one preference. This prototype does not send messages.')}</fieldset>
      <div class="field mb-4" data-field="notifications"><div class="form-check form-switch"><input class="form-check-input" id="notifications" name="notifications" type="checkbox" role="switch" value="true" aria-describedby="notifications-help" ${values.notifications ? 'checked' : ''}><label class="form-check-label" for="notifications">Receive cooperative updates</label></div>${help('notifications', 'Saves your notification preference locally; no actual notifications are sent.')}</div>
      <div class="field border rounded-3 p-3" data-field="confirmAccurate"><div class="form-check"><input class="form-check-input" id="confirmAccurate" name="confirmAccurate" type="checkbox" value="true" required aria-describedby="confirmAccurate-help"><label class="form-check-label" for="confirmAccurate">I confirm that these fictional details are complete and accurate. *</label></div>${help('confirmAccurate', 'Confirm before saving. Check this again whenever you submit changes.')}</div>
      <div class="d-flex gap-2 flex-wrap mt-4"><button type="submit" class="btn btn-primary">${icon('check')}Save profile changes</button><button type="reset" class="btn btn-outline-secondary">Discard profile changes</button></div>
    </form></section><aside><section class="panel"><div class="panel-body"><div class="d-flex align-items-center gap-3 mb-4"><span class="avatar">${e(profile.initials || initialLetters(values.fullName))}</span><div><strong>${e(values.fullName)}</strong><span class="muted text-small d-block">${e(values.memberId)}</span></div></div>${badge(profile.status || 'Demo account')}<h2 class="h6 mt-4">One profile, connected records.</h2><p class="muted text-small">Saving a name change keeps the same member ID and updates the display name on associated applications and payment records.</p><div class="info-banner mt-4">${icon('shield')}<span>Fictional data only. Your changes are saved in this browser for the prototype walkthrough.</span></div><p class="muted text-small mt-4 mb-0">Identification uploads and identity-document changes are outside this form.</p></div></section></aside></div>`;
}

function associatedUsers(profile, ctx) {
  const role = ctx.state.role;
  return (ctx.state.users || []).filter(user => (profile.id && user.memberId === profile.id) || (profile.userId && user.id === profile.userId) ||
    (String(user.role).toLowerCase() === role && (user.email === profile.email || user.name === profile.name)));
}

export function bindProfileForm(profile, ctx) {
  const form = document.querySelector('#profile-update-form');
  if (!form) return;
  const linkedUsers = associatedUsers(profile, ctx);
  const existingEmails = [...(ctx.state.members || []).filter(member => member.id !== profile.id).map(member => member.email), ...(ctx.state.users || []).filter(user => !linkedUsers.includes(user)).map(user => user.email)].filter(Boolean);
  return bindValidatedForm(form, {
    validate: values => validateProfile(values, { existingEmails, today: currentDate() }),
    onValid: values => {
      const today = currentDate();
      const birth = new Date(`${values.birthDate}T12:00:00Z`);
      const now = new Date(`${today}T12:00:00Z`);
      let age = now.getUTCFullYear() - birth.getUTCFullYear();
      if (now.getUTCMonth() < birth.getUTCMonth() || (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())) age--;
      const changes = { name: values.fullName.trim(), fullName: values.fullName.trim(), initials: initialLetters(values.fullName), email: values.email.trim().toLowerCase(), phone: values.phone.trim(), birthDate: values.birthDate, age, department: values.department, address: values.address.trim(), preferredContact: values.preferredContact, notifications: Boolean(values.notifications) };
      Object.assign(profile, changes);
      if (ctx.currentProfile && typeof ctx.currentProfile === 'object') Object.assign(ctx.currentProfile, changes);
      const member = (ctx.state.members || []).find(item => item.id === profile.id);
      if (member) Object.assign(member, changes);
      (ctx.state.applications || []).filter(item => item.memberId === profile.id).forEach(item => { item.memberName = changes.name; item.initials = changes.initials; });
      (ctx.state.transactions || []).filter(item => item.memberId === profile.id).forEach(item => { item.memberName = changes.name; });
      linkedUsers.forEach(user => {
        user.name = changes.name;
        if (!/^(member|staff|admin)@semco\.demo$/i.test(user.email)) user.email = changes.email;
      });
      const savedSummary = `${changes.name} · ${changes.email} · Preferred contact: ${changes.preferredContact} · Cooperative updates ${changes.notifications ? 'on' : 'off'}.`;
      profileFeedback.set(profileKey(profile, ctx), savedSummary);
      ctx.addAudit('Profile updated', `${profile.id || 'Demo account'} · Name, contact details, and preferences saved locally.`);
      ctx.save(); ctx.render();
      document.querySelector('#profile-save-feedback')?.focus();
      ctx.toast('Profile changes saved in this browser.');
    },
    onReset: () => {
      profileFeedback.delete(profileKey(profile, ctx));
      const feedback = document.querySelector('#profile-save-feedback');
      if (feedback) { feedback.hidden = true; feedback.innerHTML = ''; }
    },
  });
}

function savedSearch(ctx) {
  const saved = ctx.state.searchFilters?.[ctx.state.role] || {};
  const values = { ...searchDefaults, ...saved };
  if (!Object.hasOwn(statuses, values.recordType)) values.recordType = 'applications';
  if (!statuses[values.recordType].includes(values.status)) values.status = '';
  if (!['newest', 'oldest', 'amount-high', 'amount-low'].includes(values.sort)) values.sort = 'newest';
  if (!['contains', 'exact'].includes(values.matchMode)) values.matchMode = 'contains';
  return values;
}

function statusOptions(type, selected = '') {
  return option('', 'All statuses', selected) + statuses[type].map(status => option(status, status, selected)).join('');
}

function allowedRecords(ctx, type) {
  const source = type === 'payments' ? ctx.state.transactions : ctx.state[type];
  return (source || []).filter(record => ctx.state.role !== 'member' || record.memberId === ctx.state.currentMemberId).map(record => {
    const member = (ctx.state.members || []).find(item => item.id === record.memberId);
    const loan = type === 'payments' ? (ctx.state.loans || []).find(item => item.id === record.loanId) : null;
    const application = type === 'payments' ? (ctx.state.applications || []).find(item => item.id === record.loanId) : null;
    return { id: record.id, memberId: record.memberId, memberName: record.memberName || member?.name || 'Demo member',
      product: record.product || loan?.product || application?.product || 'Unspecified facility', amount: Number(record.amount || 0),
      date: String(record.date || record.nextDate || '').slice(0, 10), status: record.status || (type === 'payments' ? 'Posted' : 'Pending'),
      detail: type === 'payments' ? `${record.loanId || ''} · ${record.method || 'Recorded payment'}` : type === 'loans' ? `${record.term || '—'} months · Balance ${money(record.balance)}` : `${record.term || '—'} months · ${record.memberId || ''}` };
  });
}

function matchingRecords(ctx, filters) {
  const keyword = filters.keyword.trim().toLowerCase();
  const closed = filters.recordType === 'applications' ? ['Approved', 'Rejected'] : filters.recordType === 'loans' ? ['Completed'] : [];
  const result = allowedRecords(ctx, filters.recordType).filter(record => {
    if (!filters.includeClosed && closed.includes(record.status)) return false;
    if (filters.status && record.status.toLowerCase() !== filters.status.toLowerCase()) return false;
    if (filters.product && record.product.toLowerCase() !== filters.product.toLowerCase()) return false;
    if (filters.fromDate && (!record.date || record.date < filters.fromDate)) return false;
    if (filters.toDate && (!record.date || record.date > filters.toDate)) return false;
    if (filters.minAmount !== '' && record.amount < Number(filters.minAmount)) return false;
    if (filters.maxAmount !== '' && record.amount > Number(filters.maxAmount)) return false;
    if (keyword) {
      const values = [record.id, record.memberName, record.memberId, record.product].map(value => String(value || '').toLowerCase());
      if (!values.some(value => filters.matchMode === 'exact' ? value === keyword : value.includes(keyword))) return false;
    }
    return true;
  });
  const compareDate = (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id);
  result.sort(filters.sort === 'oldest' ? (a, b) => -compareDate(a, b) : filters.sort === 'amount-high' ? (a, b) => b.amount - a.amount || compareDate(a, b) : filters.sort === 'amount-low' ? (a, b) => a.amount - b.amount || compareDate(a, b) : compareDate);
  return result;
}

function resultsMarkup(ctx, filters) {
  const records = matchingRecords(ctx, filters);
  const amountLabel = filters.recordType === 'payments' ? 'Payment amount' : filters.recordType === 'loans' ? 'Loan principal' : 'Requested amount';
  const dateLabel = filters.recordType === 'loans' ? 'Record / Next payment date' : filters.recordType === 'payments' ? 'Payment date' : 'Submitted date';
  return `<div class="panel-head"><div><h2 class="section-title">Search results</h2><p id="record-search-count" class="muted text-small mt-1 mb-0" role="status" aria-live="polite" aria-atomic="true">${records.length} ${records.length===1?recordNames[filters.recordType].slice(0,-1):recordNames[filters.recordType]} ${records.length===1?'matches':'match'} your submitted filters.</p></div><span class="pill blue">${e(recordNames[filters.recordType])}</span></div><div class="px-4 pb-3 muted text-small">${ctx.state.role === 'member' ? 'Showing only records linked to your member ID.' : 'Showing fictional records across the cooperative.'} ${filters.includeClosed ? 'Closed records included.' : 'Closed records excluded.'}</div>${records.length ? `<div class="table-responsive"><table class="data-table"><thead><tr><th scope="col">Record / Member</th><th scope="col">Loan facility</th><th scope="col">${dateLabel}</th><th scope="col">${amountLabel}</th><th scope="col">Status</th></tr></thead><tbody>${records.map(record => `<tr><td><strong>${e(record.id)}</strong><span class="d-block muted text-small">${e(record.memberName)} · ${e(record.memberId)}</span></td><td>${e(record.product)}<span class="d-block muted text-small">${e(record.detail)}</span></td><td>${record.date ? e(new Date(`${record.date}T12:00:00Z`).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Manila' })) : 'No date recorded'}</td><td class="fw-semibold">${money(record.amount)}</td><td>${badge(record.status)}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty-state">${icon('search')}<h3>No matching records</h3><p class="muted mb-0">Try a different record type, widen the date or amount range, or clear the search filters.</p></div>`}`;
}

export function renderRecordSearch(ctx) {
  const filters = savedSearch(ctx);
  const products = (ctx.products || []).map(product => typeof product === 'string' ? product : product.name || product.label || '').filter(Boolean);
  return pageHeading('SUPPORTING FORM · SEARCH & RETRIEVAL', 'Find the record you need.', 'Combine filters to explore applications, loans, and payments in this fictional workspace.', '<span class="control-count">12 form controls</span>') +
    `<section class="panel mb-4"><div class="panel-head"><div><h2 class="section-title">Record search form</h2><p class="muted text-small mb-0 mt-1">Choose a record type, then apply any optional filters. Fields marked * are required.</p></div>${icon('filter')}</div>
    <form id="record-search-form" class="panel-body" novalidate>${summary()}<h3 class="form-section-title">Find records</h3><div class="row g-4">
      <div class="col-md-6">${field('keyword', 'Keyword', input('keyword', 'search', filters.keyword, 'minlength="2" maxlength="80" placeholder="Member name, ID, or loan facility"'), 'Optional: enter 2–80 characters. Matches record ID, member name, member ID, or facility.')}</div>
      <div class="col-md-6">${field('recordType', 'Record type *', select('recordType', [['applications', 'Loan applications'], ['loans', 'Loan accounts'], ['payments', 'Payment records']].map(([value, label]) => option(value, label, filters.recordType)).join(''), 'required'), 'Search one type of cooperative record at a time.')}</div>
      <div class="col-md-6">${field('status', 'Record status', select('status', statusOptions(filters.recordType, filters.status)), 'Optional: choose a status available for the selected record type.')}</div>
      <div class="col-md-6">${field('product', 'Loan facility', select('product', option('', 'All loan facilities', filters.product) + products.map(product => option(product, product, filters.product)).join('')), 'Optional: narrow results to one of the ten sample loan facilities.')}</div>
    </div><hr class="my-4"><h3 class="form-section-title">Date and amount range</h3><div class="row g-4">
      <div class="col-md-6 col-xl-3">${field('fromDate', 'From date', input('fromDate', 'date', filters.fromDate), 'Optional: include records on or after this date.')}</div>
      <div class="col-md-6 col-xl-3">${field('toDate', 'To date', input('toDate', 'date', filters.toDate), 'Optional: include records on or before this date.')}</div>
      <div class="col-md-6 col-xl-3">${field('minAmount', 'Minimum amount (₱)', input('minAmount', 'number', filters.minAmount, 'min="0" max="10000000" step="0.01" inputmode="decimal" placeholder="No minimum"'), 'Optional: ₱0 to ₱10,000,000, inclusive.')}</div>
      <div class="col-md-6 col-xl-3">${field('maxAmount', 'Maximum amount (₱)', input('maxAmount', 'number', filters.maxAmount, 'min="0" max="10000000" step="0.01" inputmode="decimal" placeholder="No maximum"'), 'Optional: must be at least the minimum amount.')}</div>
    </div><p class="form-hint mt-3 mb-0">Loan accounts use their record date or, for seeded demo loans, their next payment date. Amounts refer to requested principal, loan principal, or payment amount.</p>
    <hr class="my-4"><h3 class="form-section-title">Refine the results</h3><div class="row g-4 align-items-start">
      <div class="col-md-4">${field('sort', 'Sort results *', select('sort', [['newest', 'Newest date first'], ['oldest', 'Oldest date first'], ['amount-high', 'Highest amount first'], ['amount-low', 'Lowest amount first']].map(([value, label]) => option(value, label, filters.sort)).join(''), 'required'), 'Choose the order for matching records.')}</div>
      <div class="col-md-4"><fieldset class="field" data-field="matchMode" aria-describedby="matchMode-help"><legend class="form-label">Keyword matching *</legend><div class="radio-options d-flex gap-3 flex-wrap">${[['contains', 'Contains'], ['exact', 'Exact match']].map(([value, label]) => `<div class="form-check"><input class="form-check-input" type="radio" id="matchMode-${value}" name="matchMode" value="${value}" required aria-describedby="matchMode-help" ${filters.matchMode === value ? 'checked' : ''}><label class="form-check-label" for="matchMode-${value}">${label}</label></div>`).join('')}</div>${help('matchMode', 'Exact match compares a complete searchable field, ignoring case.')}</fieldset></div>
      <div class="col-md-4"><div class="field" data-field="includeClosed"><div class="form-check form-switch"><input class="form-check-input" type="checkbox" role="switch" id="includeClosed" name="includeClosed" value="true" aria-describedby="includeClosed-help" ${filters.includeClosed ? 'checked' : ''}><label class="form-check-label" for="includeClosed">Include closed records</label></div>${help('includeClosed', 'Includes approved or rejected applications and completed loans. Posted payments remain visible.')}</div></div>
    </div><div class="d-flex gap-2 flex-wrap mt-4"><button class="btn btn-primary" type="submit">${icon('search')}Search records</button><button class="btn btn-outline-secondary" type="reset">Clear search filters</button></div><p class="form-hint mt-3 mb-0">Your last submitted filters are saved per role in this browser. Results change when you submit the form.</p></form></section>
    <section class="panel" id="record-search-results" aria-label="Record search results">${resultsMarkup(ctx, filters)}</section>`;
}

function updateStatusOptions(form) {
  const type = form.elements.namedItem('recordType').value;
  const status = form.elements.namedItem('status');
  const selected = statuses[type].includes(status.value) ? status.value : '';
  status.innerHTML = statusOptions(type, selected);
}

function showSearchResults(ctx, filters) {
  const result = document.querySelector('#record-search-results');
  if (result) result.innerHTML = resultsMarkup(ctx, filters);
}

function clearSearchControls(form) {
  for (const [name, value] of Object.entries(searchDefaults)) {
    if (name === 'matchMode') {
      form.querySelectorAll('[name="matchMode"]').forEach(control => { control.checked = control.defaultChecked = control.value === value; });
      continue;
    }
    const control = form.elements.namedItem(name);
    if (!control) continue;
    if (control.type === 'checkbox') control.checked = control.defaultChecked = value;
    else if (control.tagName === 'SELECT') {
      [...control.options].forEach(item => { item.defaultSelected = item.value === value; });
      control.value = value;
    } else control.value = control.defaultValue = value;
  }
  updateStatusOptions(form);
}

export function bindRecordSearch(ctx) {
  const form = document.querySelector('#record-search-form');
  if (!form) return;
  form.elements.namedItem('recordType').addEventListener('change', () => updateStatusOptions(form));
  return bindValidatedForm(form, {
    validate: values => validateSearch(values),
    onValid: values => {
      const filters = { ...searchDefaults, ...values, keyword: values.keyword.trim(), includeClosed: Boolean(values.includeClosed) };
      ctx.state.searchFilters ||= {};
      ctx.state.searchFilters[ctx.state.role] = filters;
      ctx.save(); showSearchResults(ctx, filters);
    },
    onReset: () => {
      clearSearchControls(form);
      if (ctx.state.searchFilters) delete ctx.state.searchFilters[ctx.state.role];
      ctx.save(); showSearchResults(ctx, { ...searchDefaults });
    },
  });
}
