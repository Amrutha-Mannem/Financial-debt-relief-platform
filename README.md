# AI Powered Debt Relief & Financial Recovery Platform

An AI-powered web app to manage loans, analyze debt stress, and generate
AI-drafted negotiation/settlement letters using Google Gemini.

**Stack:** React.js (Vite) · FastAPI · SQLAlchemy · SQLite · Google Gemini API

---

## Project Structure

```
debt-relief-platform/
├── backend/
│   ├── main.py            # FastAPI app & routes
│   ├── models.py          # SQLAlchemy ORM models (Loan, NegotiationHistory)
│   ├── schemas.py         # Pydantic request/response schemas
│   ├── database.py        # SQLite + SQLAlchemy session setup
│   ├── ai_service.py      # Debt stress analysis + Gemini letter generation
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/    # Dashboard, LoanForm, LoanDetail, RecoveryGauge
    │   ├── api/client.js  # Fetch wrapper for backend API
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css      # Design system (tokens, layout, components)
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## 1. Backend Setup (FastAPI)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Optional but recommended: enable real AI-generated letters
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
# then edit .env and paste your Gemini API key from https://aistudio.google.com/app/apikey

uvicorn main:app --reload --port 8000
```

The API will run at `http://localhost:8000`. Interactive docs are auto-generated
at `http://localhost:8000/docs`.

> Without a `GEMINI_API_KEY`, negotiation letter generation still works — it
> falls back to a well-formed template letter, so the app is fully demoable
> out of the box.

## 2. Frontend Setup (React + Vite)

Open a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

The app will run at `http://localhost:5173` and proxies `/api` requests to
the FastAPI backend on port 8000.

## 3. Using the App

1. **Add a loan** — enter outstanding amount, EMI, overdue months, income and
   expenses.
2. **View financial health** — the loan detail page shows a debt stress
   score, EMI-to-income ratio, monthly surplus, and a recommended settlement
   percentage.
3. **Generate a negotiation letter** — pick a strategy type and tone, and the
   platform drafts a lender-specific settlement letter using Gemini (or the
   fallback template).
4. **Review history** — every generated letter is saved per loan account for
   future reference.

## Core Logic Notes

- **Debt stress score** is a transparent, rule-based 0–100 score combining
  EMI-to-income ratio, overdue duration, and monthly surplus — see
  `analyze_financial_health()` in `backend/ai_service.py`.
- **Settlement recommendation** scales the discount percentage with stress
  score and overdue duration, capped between 15%–65%.
- **Negotiation letters** are generated via the Gemini API using a prompt
  built from the borrower's real financial data (never fabricated), with a
  deterministic fallback so the feature never breaks a demo.

## Environment Variables (backend/.env)

| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API key | *(empty — uses fallback)* |
| `GEMINI_MODEL` | Gemini model name | `gemini-1.5-flash` |

## Next Steps / Ideas to Extend

- Add authentication (JWT) for multi-user support.
- Export negotiation letters as PDF (see `pdf` generation libraries).
- Add charts for stress score trends over time.
- Deploy backend (Render/Railway) and frontend (Vercel/Netlify).
Demo link :https://drive.google.com/file/d/121qyqLAamxsH2x-gY9pvh4Luvj1Ccxfu/view?usp=sharing
Web Page Screenshort:<img width="1600" height="905" alt="image" src="https://github.com/user-attachments/assets/b43460d1-3a29-4418-aff1-c1f55538be79" />

<img width="1143" height="822" alt="image" src="https://github.com/user-attachments/assets/6d184631-49f9-465f-8deb-494704767904" /><img width="1116" height="956" alt="image" src="https://github.com/user-attachments/assets/3d4bc5db-d92f-4dc9-a833-5436c376f074" /><img width="1101" height="863" alt="image" src="https://github.com/user-attachments/assets/e7d7c574-9a2d-4f2b-ba39-390c7aeb87e8" />


