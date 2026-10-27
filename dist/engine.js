/** Educational SCEA + simplified belief-rule engine. No official lending policy. */
export const defaults = Object.freeze({
  amount: 50000, term: 12, annualRate: 6, method: 'fixed', income: 42000,
  liabilities: 4500, savings: 35000, repayment: 95, comakerIncome: 35000,
  comakerLiabilities: 3000, serviceRate: 1,
});

const note = 'Prototype decision support only. Rates, thresholds, rule weights and beliefs are illustrative, not official SEMCO policy. This simplified BRB uses a normalized weighted belief average; staff and administrators make the final decision.';

function number(data, name, { min = 0, max = 1e12, positive = false } = {}) {
  const value = Object.hasOwn(data, name) ? data[name] : defaults[name];
  if (!['number', 'string'].includes(typeof value) || (typeof value === 'string' && !value.trim())) {
    throw new Error(`${name} must be a number.`);
  }
  const result = Number(value);
  if (!Number.isFinite(result)) throw new Error(`${name} must be a finite number.`);
  if (result < min || result > max || (positive && result <= 0)) {
    throw new Error(`${name} must be ${positive ? 'greater than 0' : `at least ${min}`} and at most ${max}.`);
  }
  return result;
}

function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('The request must be a JSON object.');
  const values = {
    amount: number(input, 'amount', { min: 0.01 }),
    term: number(input, 'term', { min: 1, max: 360 }),
    annualRate: number(input, 'annualRate', { max: 100 }),
    income: number(input, 'income', { min: 0.01 }),
    liabilities: number(input, 'liabilities'), savings: number(input, 'savings'),
    repayment: number(input, 'repayment', { max: 100 }),
    comakerIncome: number(input, 'comakerIncome', { min: 0.01 }),
    comakerLiabilities: number(input, 'comakerLiabilities'),
    serviceRate: number(input, 'serviceRate', { max: 100 }),
    method: Object.hasOwn(input, 'method') ? input.method : defaults.method,
  };
  if (!Number.isInteger(values.term)) throw new Error('term must be a whole number of months.');
  if (!['fixed', 'diminishing'].includes(values.method)) throw new Error('method must be fixed or diminishing.');
  return values;
}

const money = value => Math.round(value * 100) / 100;

function calculation(values) {
  const principal = values.amount;
  let interest, monthlyPayment;
  if (values.method === 'fixed') {
    interest = principal * (values.annualRate / 100) * (values.term / 12);
    monthlyPayment = (principal + interest) / values.term;
  } else {
    const rate = values.annualRate / 100 / 12;
    monthlyPayment = rate === 0 ? principal / values.term : principal * rate / -Math.expm1(-values.term * Math.log1p(rate));
    interest = Math.max(0, monthlyPayment * values.term - principal);
  }
  const fee = principal * values.serviceRate / 100;
  return {
    principal: money(principal), interest: money(interest), total: money(principal + interest),
    monthlyPayment: money(monthlyPayment), fee: money(fee), netProceeds: money(principal - fee),
  };
}

export function calculate(input = {}) { return calculation(validate(input)); }

function membership(value, [low, middle, high], highIsBetter) {
  let levels;
  if (value <= low) levels = [1, 0, 0];
  else if (value < middle) {
    const progress = (value - low) / (middle - low);
    levels = [1 - progress, progress, 0];
  } else if (value < high) {
    const progress = (value - middle) / (high - middle);
    levels = [0, 1 - progress, progress];
  } else levels = [0, 0, 1];
  return highIsBetter ? levels.reverse() : levels;
}

export function evaluate(input = {}) {
  const values = validate(input);
  const estimate = calculation(values);
  const monthly = estimate.monthlyPayment;
  const metrics = {
    monthlyPayment: monthly, dti: (values.liabilities + monthly) / values.income,
    coverage: values.savings / values.amount, repayment: values.repayment,
    comakerDti: (values.comakerLiabilities + monthly) / values.comakerIncome,
  };
  const criteria = [
    ['affordability', 'monthly debt-to-income', metrics.dti, [.2, .4, .6], false, .4, ['low', 'moderate', 'high']],
    ['savings', 'savings coverage', metrics.coverage, [.1, .4, .7], true, .25, ['strong', 'moderate', 'low']],
    ['repayment', 'on-time repayment', metrics.repayment, [50, 75, 100], true, .2, ['strong', 'moderate', 'low']],
    ['comaker', 'co-maker debt-to-income', metrics.comakerDti, [.2, .4, .6], false, .15, ['low', 'moderate', 'high']],
  ];
  const outcomes = [
    ['favorable', { recommended: .9, review: .1, notRecommended: 0 }],
    ['middle', { recommended: .2, review: .7, notRecommended: .1 }],
    ['adverse', { recommended: 0, review: .2, notRecommended: .8 }],
  ];
  const rules = [];
  const totals = { recommended: 0, review: 0, notRecommended: 0 };
  for (const [name, label, value, anchors, highIsBetter, weight, levels] of criteria) {
    const memberships = membership(value, anchors, highIsBetter);
    outcomes.forEach(([outcome, beliefs], index) => {
      const activation = weight * memberships[index];
      rules.push({ id: `${name}-${outcome}`, label: `IF ${label} is ${levels[index]} THEN credit evidence is ${outcome}.`, weight, match: memberships[index], activation, beliefs: { ...beliefs } });
      for (const key of Object.keys(totals)) totals[key] += activation * beliefs[key];
    });
  }
  const activationTotal = rules.reduce((sum, rule) => sum + rule.activation, 0);
  const beliefs = Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value / activationTotal]));
  const score = Math.round(beliefs.recommended * 100 + beliefs.review * 50);
  return {
    score, recommendation: score >= 70 ? 'Recommended' : score >= 40 ? 'Needs review' : 'Not recommended',
    beliefs, metrics, rules: rules.sort((a, b) => b.activation - a.activation), calculation: estimate, note,
  };
}

export async function evaluateRemote(input = {}) {
  // A published static preview runs entirely in the browser. Local Python uses
  // the equivalent server engine; failures remain visible to the caller.
  if (!globalThis.location || !['localhost', '127.0.0.1'].includes(globalThis.location.hostname)) return evaluate(input);
  const response = await fetch('/api/evaluate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  });
  let result;
  try { result = await response.json(); }
  catch { throw new Error('The local evaluation server returned an invalid response.'); }
  if (!response.ok) throw new Error(result.error || 'Unable to evaluate this application.');
  return result;
}
