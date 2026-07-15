"""
Core intelligence layer of the platform.

Contains:
1. Deterministic financial analysis (debt stress scoring, settlement
   recommendations) - this always runs, regardless of AI availability.
2. Google Gemini integration for generating negotiation letters / emails.
   Falls back to a solid templated letter if no API key is configured,
   so the app is fully demoable without external dependencies.
"""

import os
from typing import Optional

import google.generativeai as genai

from models import Loan

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


# ---------------------------------------------------------------------------
# Financial analysis (rule-based, deterministic, explainable)
# ---------------------------------------------------------------------------

def analyze_financial_health(loan: Loan) -> dict:
    """
    Computes debt stress score, EMI-to-income ratio, monthly surplus and a
    recommended settlement percentage based on the borrower's profile.
    """
    monthly_surplus = loan.monthly_income - loan.monthly_expenses - loan.emi_amount
    emi_ratio = (loan.emi_amount / loan.monthly_income) * 100 if loan.monthly_income else 0

    # --- Debt stress score (0-100, higher = more stressed) ---
    score = 0
    score += min(emi_ratio, 60) * 0.8              # EMI burden weight
    score += min(loan.overdue_months * 6, 30)        # overdue penalty
    score += 15 if monthly_surplus < 0 else 0        # negative surplus penalty
    score = round(min(score, 100))

    if score >= 70:
        stress_level = "Severe"
    elif score >= 45:
        stress_level = "High"
    elif score >= 25:
        stress_level = "Moderate"
    else:
        stress_level = "Low"

    # --- Settlement recommendation ---
    # More overdue months + higher stress -> lender more likely to accept a
    # deeper discount. Baseline discount scales with stress score.
    base_discount = 20 + (score * 0.35) + min(loan.overdue_months * 1.5, 15)
    settlement_percentage = round(min(max(base_discount, 15), 65), 1)
    settlement_amount = round(loan.outstanding_amount * (1 - settlement_percentage / 100), 2)

    insight_summary = _build_insight_summary(
        stress_level, emi_ratio, monthly_surplus, loan.overdue_months
    )

    return {
        "loan_id": loan.id,
        "monthly_surplus": round(monthly_surplus, 2),
        "emi_to_income_ratio": round(emi_ratio, 1),
        "debt_stress_level": stress_level,
        "debt_stress_score": score,
        "recommended_settlement_percentage": settlement_percentage,
        "recommended_settlement_amount": settlement_amount,
        "insight_summary": insight_summary,
    }


def _build_insight_summary(stress_level, emi_ratio, surplus, overdue_months) -> str:
    parts = []
    if stress_level in ("Severe", "High"):
        parts.append(
            f"EMI consumes {emi_ratio:.0f}% of monthly income, well above the "
            "healthy 40% threshold."
        )
    else:
        parts.append(f"EMI consumes {emi_ratio:.0f}% of monthly income.")

    if surplus < 0:
        parts.append(
            f"Monthly expenses exceed income by ₹{abs(surplus):,.0f}, indicating "
            "an unsustainable repayment position."
        )
    else:
        parts.append(f"Monthly surplus after EMI is ₹{surplus:,.0f}.")

    if overdue_months > 0:
        parts.append(f"Account is {overdue_months} month(s) overdue, strengthening a settlement case.")

    return " ".join(parts)


# ---------------------------------------------------------------------------
# Gemini-powered negotiation letter generation
# ---------------------------------------------------------------------------

def generate_negotiation_letter(
    loan: Loan, analysis: dict, strategy_type: str = "Settlement Letter", tone: str = "professional"
) -> str:
    """
    Generates a lender-specific negotiation email/letter using Gemini.
    Falls back to a templated letter if GEMINI_API_KEY is not configured
    or the API call fails, so the feature always returns something usable.
    """
    prompt = _build_prompt(loan, analysis, strategy_type, tone)

    if GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel(GEMINI_MODEL)
            response = model.generate_content(prompt)
            text = getattr(response, "text", None)
            if text and text.strip():
                return text.strip()
        except Exception as exc:  # noqa: BLE001
            # Fall through to template on any API error (quota, network, etc.)
            return _fallback_letter(loan, analysis, strategy_type) + (
                f"\n\n[Note: AI service unavailable, showing template letter. Reason: {exc}]"
            )

    return _fallback_letter(loan, analysis, strategy_type)


def _build_prompt(loan: Loan, analysis: dict, strategy_type: str, tone: str) -> str:
    return f"""
You are an expert debt-settlement negotiator writing on behalf of a borrower.

Write a {tone}, respectful {strategy_type.lower()} addressed to the lender
"{loan.lender_name}" regarding a {loan.loan_type} account.

Borrower financial facts to use accurately (do not invent numbers):
- Outstanding amount: ₹{loan.outstanding_amount:,.0f}
- Current EMI: ₹{loan.emi_amount:,.0f}
- Overdue duration: {loan.overdue_months} month(s)
- Monthly income: ₹{loan.monthly_income:,.0f}
- Monthly surplus after EMI: ₹{analysis['monthly_surplus']:,.0f}
- Debt stress level: {analysis['debt_stress_level']}
- Proposed settlement: ₹{analysis['recommended_settlement_amount']:,.0f}
  ({analysis['recommended_settlement_percentage']}% waiver off outstanding amount)

Requirements:
- Explain the borrower's genuine financial hardship briefly and honestly.
- Propose the settlement amount clearly as a one-time or short-term structured offer.
- Keep it under 300 words.
- End with a polite request for written confirmation and a proposed response timeframe.
- Do not fabricate account numbers or legal threats.
""".strip()


def _fallback_letter(loan: Loan, analysis: dict, strategy_type: str) -> str:
    return f"""Subject: Request for {strategy_type} - {loan.loan_type} Account

Dear {loan.lender_name} Team,

I am writing regarding my {loan.loan_type.lower()} account, currently showing an
outstanding balance of ₹{loan.outstanding_amount:,.0f} with {loan.overdue_months}
month(s) overdue.

Due to a genuine and ongoing financial hardship, my current monthly surplus after
EMI obligations stands at ₹{analysis['monthly_surplus']:,.0f}, making it
increasingly difficult to sustain the existing repayment schedule.

Based on an honest assessment of my repayment capacity, I would like to propose a
one-time settlement of ₹{analysis['recommended_settlement_amount']:,.0f}, which
reflects a {analysis['recommended_settlement_percentage']}% reduction from the
outstanding balance. I believe this offer is fair given my present financial
circumstances and represents the maximum amount I am able to arrange.

I remain committed to resolving this matter amicably and would appreciate written
confirmation of acceptance within 10 business days. I am happy to discuss
alternative structured arrangements if a lump-sum settlement is not feasible.

Thank you for your consideration.

Sincerely,
{loan.borrower_name}

---
Note: This is a template-based letter (AI service not configured). Add a
GEMINI_API_KEY environment variable to enable AI-personalized letters.
"""
