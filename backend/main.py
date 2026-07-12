"""
AI Powered Debt Relief & Financial Recovery Platform - FastAPI backend.

Endpoints cover:
- Loan CRUD (add/view borrower loan accounts)
- Financial health analysis (debt stress, settlement recommendation)
- AI-powered negotiation letter generation (Google Gemini)
- Negotiation history retrieval
- Dashboard summary
"""

from typing import List

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, get_db
from ai_service import analyze_financial_health, generate_negotiation_letter

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Powered Debt Relief & Financial Recovery Platform",
    description="API for loan management, financial health analysis, and AI negotiation support.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "service": "debt-relief-platform-api"}


# ---------------------------------------------------------------------------
# Loan management
# ---------------------------------------------------------------------------

@app.post("/api/loans", response_model=schemas.LoanResponse)
def create_loan(loan: schemas.LoanCreate, db: Session = Depends(get_db)):
    db_loan = models.Loan(**loan.model_dump())
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    return db_loan


@app.get("/api/loans", response_model=List[schemas.LoanResponse])
def list_loans(db: Session = Depends(get_db)):
    return db.query(models.Loan).order_by(models.Loan.created_at.desc()).all()


@app.get("/api/loans/{loan_id}", response_model=schemas.LoanResponse)
def get_loan(loan_id: int, db: Session = Depends(get_db)):
    loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan


@app.delete("/api/loans/{loan_id}")
def delete_loan(loan_id: int, db: Session = Depends(get_db)):
    loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    db.delete(loan)
    db.commit()
    return {"detail": "Loan deleted"}


# ---------------------------------------------------------------------------
# Financial health / settlement analysis
# ---------------------------------------------------------------------------

@app.get("/api/loans/{loan_id}/financial-health", response_model=schemas.FinancialHealthResponse)
def get_financial_health(loan_id: int, db: Session = Depends(get_db)):
    loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return analyze_financial_health(loan)


# ---------------------------------------------------------------------------
# AI negotiation letter generation
# ---------------------------------------------------------------------------

@app.post("/api/negotiate", response_model=schemas.NegotiationResponse)
def create_negotiation(request: schemas.NegotiationRequest, db: Session = Depends(get_db)):
    loan = db.query(models.Loan).filter(models.Loan.id == request.loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    analysis = analyze_financial_health(loan)
    letter = generate_negotiation_letter(
        loan, analysis, strategy_type=request.strategy_type, tone=request.tone
    )

    record = models.NegotiationHistory(
        loan_id=loan.id,
        strategy_type=request.strategy_type,
        generated_content=letter,
        settlement_percentage=analysis["recommended_settlement_percentage"],
        debt_stress_level=analysis["debt_stress_level"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@app.get("/api/loans/{loan_id}/negotiations", response_model=List[schemas.NegotiationResponse])
def get_negotiation_history(loan_id: int, db: Session = Depends(get_db)):
    loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return (
        db.query(models.NegotiationHistory)
        .filter(models.NegotiationHistory.loan_id == loan_id)
        .order_by(models.NegotiationHistory.created_at.desc())
        .all()
    )


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@app.get("/api/dashboard", response_model=schemas.DashboardSummary)
def get_dashboard(db: Session = Depends(get_db)):
    loans = db.query(models.Loan).order_by(models.Loan.created_at.desc()).all()
    total_outstanding = sum(l.outstanding_amount for l in loans)
    total_emi = sum(l.emi_amount for l in loans)

    if loans:
        scores = [analyze_financial_health(l)["debt_stress_score"] for l in loans]
        avg_score = round(sum(scores) / len(scores), 1)
    else:
        avg_score = 0

    return {
        "total_outstanding": total_outstanding,
        "total_emi": total_emi,
        "average_stress_score": avg_score,
        "loan_count": len(loans),
        "loans": loans,
    }
