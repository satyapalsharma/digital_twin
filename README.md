# Simulation Sentinels

This repository contains a two-part digital twin application:

- `backend/` — FastAPI service for surveys, personas, audiences, products, simulations, and LLM orchestration.
- `frontend/` — Next.js app that provides the user interface for the simulation platform.

## Repository structure

- `backend/app/` — Python FastAPI application code.
- `backend/requirements.txt` — Python dependencies for the backend.
- `frontend/` — Next.js frontend application.
- `.env.example` — Example environment variables for local development.

## Backend setup

1. Create a Python virtual environment in `backend/`:

   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Copy `.env.example` to `.env` and provide a valid `OPENROUTER_API_KEY`.

3. Run the backend:

   ```bash
   cd backend
   .venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. Verify backend health:

   - `http://localhost:8000/health`

## Frontend setup

1. Install frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Run the frontend development server:

   ```bash
   cd frontend
   npm run dev
   ```

3. Open the app in your browser:

   - `http://localhost:3000`

## Production build

- Backend: use the `uvicorn` command above.
- Frontend:

  ```bash
  cd frontend
  npm run build
  npm run start
  ```

## Notes

- `backend/app/config.py` loads `.env` values and defaults.
- `frontend/package.json` defines the standard `dev`, `build`, `start`, and `lint` scripts.
- `frontend/src/components/insights/charts.tsx` had a TypeScript tooltip formatter issue that was fixed during this session.
