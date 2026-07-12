"""
SQLAlchemy ORM models for loans and AI-generated negotiation history.
"""

from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from database import Base


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    borrower_name = Column(String, nullable=False)
    lender_name = Column(String, nullable=False)
    loan_type = Column(String, default="Personal Loan")
    outstanding_amount = Column(Float, nullable=False)
    emi_amount = Column(Float, nullable=False)
    overdue_months = Column(Integer, default=0)
    monthly_income = Column(Float, nullable=False)
    monthly_expenses = Column(Float, default=0)
    interest_rate = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    negotiations = relationship(
        "NegotiationHistory", back_populates="loan", cascade="all, delete-orphan"
    )


class NegotiationHistory(Base):
    __tablename__ = "negotiation_history"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False)
    strategy_type = Column(String, default="Settlement Letter")
    generated_content = Column(Text, nullable=False)
    settlement_percentage = Column(Float, nullable=True)
    debt_stress_level = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    loan = relationship("Loan", back_populates="negotiations")
