# Eunoia Journal

Eunoia is a reflective journaling app that helps users write consistently, revisit past entries, and notice emotional patterns over time through gentle AI-supported insights.

## Live App

- Website: [https://www.myeunoia.online](https://www.myeunoia.online)
- API: [https://api.myeunoia.online/health](https://api.myeunoia.online/health)

## What It Does

- Write and save daily journal entries
- Review recent entries in a clean timeline
- View mood and stress trends on the dashboard
- Sign up and sign in with email-based authentication
- Receive email verification through a branded email flow

## Tech Stack

- Frontend: React + TypeScript
- Backend: FastAPI + Python
- Database: Supabase PostgreSQL
- Authentication: Supabase Auth
- Charts: Recharts
- Email delivery: Brevo SMTP through Supabase custom SMTP

## Local Development

### Prerequisites

- Node.js
- Python 3.10+
- A Supabase project

### Environment Setup

Create:

- `/.env` for backend-related values
- `/frontend/.env` for frontend values

Typical frontend variables:

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_API_BASE_URL=http://localhost:8000
```

Typical backend variables:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_PASSWORD=your_db_password
SUPABASE_DB_HOST=your_db_host
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
FRONTEND_ORIGIN=http://localhost:3000
```

Optional:

- `HF_TOKEN`
- `EUNOIA_USE_AGNO`
- `EUNOIA_ENABLE_MODELS`

### Run Locally

Backend:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m backend.main
```

Frontend:

```bash
cd frontend
npm install
npm start
```

Local app URLs:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:8000/health](http://localhost:8000/health)

## Production Notes

- Frontend is deployed on Vercel
- Backend is deployed on AWS EC2 behind Nginx
- HTTPS is enabled for both frontend and backend
- Custom SMTP is configured for branded verification emails

## Disclaimer

Eunoia is a prototype wellness application. It is designed for reflection and pattern awareness, not diagnosis or treatment. Please do not rely on it as a substitute for professional mental health care.
