"""Transparent, educational credit evaluation for the SEMCO prototype.

These illustrative thresholds are not a cooperative's lending policy. The BRB
is a normalized weighted belief average, not full evidential reasoning.
"""

import math


DEFAULTS = {
    "amount": 50000,
    "term": 12,
    "annualRate": 6,
    "method": "fixed",
    "income": 42000,
    "liabilities": 4500,
    "savings": 35000,
    "repayment": 95,
    "comakerIncome": 35000,
    "comakerLiabilities": 3000,
    "serviceRate": 1,
}

NOTE = (
    "Prototype decision support only. Rates, thresholds, rule weights and beliefs "
    "are illustrative, not official SEMCO policy. This simplified BRB uses a "
    "normalized weighted belief average; staff and administrators make the final decision."
)


def _number(data, name, minimum=0, maximum=1_000_000_000_000, positive=False):
    value = data.get(name, DEFAULTS[name])
    if isinstance(value, bool) or not isinstance(value, (str, int, float)):
        raise ValueError(f"{name} must be a number.")
    if isinstance(value, str) and not value.strip():
        raise ValueError(f"{name} must be a number.")
    try:
        number = float(value)
    except (ValueError, OverflowError):
        raise ValueError(f"{name} must be a number.") from None
    if not math.isfinite(number):
        raise ValueError(f"{name} must be a finite number.")
    if number < minimum or number > maximum or (positive and number <= 0):
        comparison = "greater than 0" if positive else f"at least {minimum}"
        raise ValueError(f"{name} must be {comparison} and at most {maximum}.")
    return number


def _validated(inputs):
    if not isinstance(inputs, dict):
        raise ValueError("The request must be a JSON object.")
    values = {
        "amount": _number(inputs, "amount", minimum=0.01),
        "term": _number(inputs, "term", minimum=1, maximum=360),
        "annualRate": _number(inputs, "annualRate", maximum=100),
        "income": _number(inputs, "income", minimum=0.01),
        "liabilities": _number(inputs, "liabilities"),
        "savings": _number(inputs, "savings"),
        "repayment": _number(inputs, "repayment", maximum=100),
        "comakerIncome": _number(inputs, "comakerIncome", minimum=0.01),
        "comakerLiabilities": _number(inputs, "comakerLiabilities"),
        "serviceRate": _number(inputs, "serviceRate", maximum=100),
    }
    if not values["term"].is_integer():
        raise ValueError("term must be a whole number of months.")
    values["term"] = int(values["term"])
    values["method"] = inputs.get("method", DEFAULTS["method"])
    if values["method"] not in ("fixed", "diminishing"):
        raise ValueError("method must be fixed or diminishing.")
    return values


def _money(value):
    # All calculated money amounts are nonnegative; align with JS Math.round.
    return math.floor(value * 100 + 0.5) / 100


def _calculation(values):
    principal = values["amount"]
    months = values["term"]
    if values["method"] == "fixed":
        interest = principal * (values["annualRate"] / 100) * (months / 12)
        monthly_payment = (principal + interest) / months
    else:
        rate = values["annualRate"] / 100 / 12
        monthly_payment = (
            principal / months
            if rate == 0
            else principal * rate / (-math.expm1(-months * math.log1p(rate)))
        )
        interest = max(0, monthly_payment * months - principal)
    fee = principal * values["serviceRate"] / 100
    return {
        "principal": _money(principal),
        "interest": _money(interest),
        "total": _money(principal + interest),
        "monthlyPayment": _money(monthly_payment),
        "fee": _money(fee),
        "netProceeds": _money(principal - fee),
    }


def calculate(inputs=None):
    """Estimate flat-interest or standard monthly annuity loan amounts."""
    return _calculation(_validated({} if inputs is None else inputs))


def _membership(value, anchors, high_is_better):
    low, middle, high = anchors
    if value <= low:
        levels = [1.0, 0.0, 0.0]
    elif value < middle:
        progress = (value - low) / (middle - low)
        levels = [1 - progress, progress, 0.0]
    elif value < high:
        progress = (value - middle) / (high - middle)
        levels = [0.0, 1 - progress, progress]
    else:
        levels = [0.0, 0.0, 1.0]
    return list(reversed(levels)) if high_is_better else levels


def evaluate(inputs=None):
    """Apply a simple credit score and twelve understandable belief rules."""
    values = _validated({} if inputs is None else inputs)
    calculation = _calculation(values)
    monthly = calculation["monthlyPayment"]
    metrics = {
        "monthlyPayment": monthly,
        "dti": (values["liabilities"] + monthly) / values["income"],
        "coverage": values["savings"] / values["amount"],
        "repayment": values["repayment"],
        "comakerDti": (values["comakerLiabilities"] + monthly) / values["comakerIncome"],
    }
    criteria = [
        ("affordability", "monthly debt-to-income", metrics["dti"], (0.2, 0.4, 0.6), False, 0.4, ("low", "moderate", "high")),
        ("savings", "savings coverage", metrics["coverage"], (0.1, 0.4, 0.7), True, 0.25, ("strong", "moderate", "low")),
        ("repayment", "on-time repayment", metrics["repayment"], (50, 75, 100), True, 0.2, ("strong", "moderate", "low")),
        ("comaker", "co-maker debt-to-income", metrics["comakerDti"], (0.2, 0.4, 0.6), False, 0.15, ("low", "moderate", "high")),
    ]
    outcomes = [
        ("favorable", {"recommended": 0.9, "review": 0.1, "notRecommended": 0.0}),
        ("middle", {"recommended": 0.2, "review": 0.7, "notRecommended": 0.1}),
        ("adverse", {"recommended": 0.0, "review": 0.2, "notRecommended": 0.8}),
    ]
    rules = []
    totals = {"recommended": 0.0, "review": 0.0, "notRecommended": 0.0}
    for name, label, value, anchors, high_is_better, weight, levels in criteria:
        memberships = _membership(value, anchors, high_is_better)
        for index, (outcome, belief) in enumerate(outcomes):
            activation = weight * memberships[index]
            rules.append({
                "id": f"{name}-{outcome}",
                "label": f"IF {label} is {levels[index]} THEN credit evidence is {outcome}.",
                "weight": weight,
                "match": memberships[index],
                "activation": activation,
                "beliefs": dict(belief),
            })
            for key in totals:
                totals[key] += activation * belief[key]
    activation_total = sum(rule["activation"] for rule in rules)
    beliefs = {key: value / activation_total for key, value in totals.items()}
    score = math.floor(beliefs["recommended"] * 100 + beliefs["review"] * 50 + 0.5)
    recommendation = "Recommended" if score >= 70 else "Needs review" if score >= 40 else "Not recommended"
    return {
        "score": score,
        "recommendation": recommendation,
        "beliefs": beliefs,
        "metrics": metrics,
        "rules": sorted(rules, key=lambda rule: -rule["activation"]),
        "calculation": calculation,
        "note": NOTE,
    }
