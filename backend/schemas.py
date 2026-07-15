"""
Pydantic schemas used for request validation and API responses.
"""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class LoanBase(BaseModel):
    borrower_name: str
    lender_name: str
    loan_type: str = "Personal Loan"
    outstanding_amount: float = Field(gt=0)
    emi_amount: float = Field(gt=0)
    overdue_months: int = Field(ge=0, default=0)
    monthly_income: float = Field(gt=0)
    monthly_expenses: float = Field(ge=0, default=0)
    interest_rate: float = Field(ge=0, default=0)


class LoanCreate(LoanBase):
    pass


class LoanResponse(LoanBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class FinancialHealthResponse(BaseModel):
    loan_id: int
    monthly_surplus: float
    emi_to_income_ratio: float
    debt_stress_level: str
    debt_stress_score: int
    recommended_settlement_percentage: float
    recommended_settlement_amount: float
    insight_summary: str


class NegotiationRequest(BaseModel):
    loan_id: int
    strategy_type: str = "Settlement Letter"
    tone: Optional[str] = "professional"


class NegotiationResponse(BaseModel):
    id: int
    loan_id: int
    strategy_type: str
    generated_content: str
    settlement_percentage: Optional[float]
    debt_stress_level: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    total_outstanding: float
    total_emi: float
    average_stress_score: float
    loan_count: int
    loans: List[LoanResponse]
