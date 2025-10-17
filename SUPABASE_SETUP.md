# Supabase Setup Guide

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
# Get these values from your Supabase project dashboard
REACT_APP_SUPABASE_URL=your_supabase_project_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Backend API Configuration
REACT_APP_API_BASE_URL=http://localhost:8000

# Supabase JWT Secret (for backend authentication)
# Get this from your Supabase project settings > API
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here

# Supabase Database Credentials (for backend database connection)
# Get these from: https://supabase.com/dashboard/project/[your-project]/settings/database
SUPABASE_DB_PASSWORD=your_database_password_here
SUPABASE_DB_HOST=db.your-project-id.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
```

## How to Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project or select an existing one
3. Go to **Settings** > **API**
4. Copy the following values:
   - **Project URL** → `REACT_APP_SUPABASE_URL` and `SUPABASE_URL`
   - **anon public** key → `REACT_APP_SUPABASE_ANON_KEY` and `SUPABASE_ANON_KEY`
   - **JWT Secret** → `SUPABASE_JWT_SECRET`

## Database Setup

The backend will automatically create the required tables when it starts. Make sure your Supabase project has the following tables:

- `journal_entries` (with user_id column for authentication)
- `user_profiles` (for user management)

## Testing the Integration

1. Start the backend: `cd backend && python main.py`
2. Start the frontend: `cd frontend && npm start`
3. Navigate to `http://localhost:3000`
4. You should see the login/signup form
5. Create an account or sign in
6. The Dashboard and Entries tabs should now work properly
