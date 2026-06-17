-- Stores product feedback submitted by signed-in users.
-- The backend writes with the service role; RLS is enabled so the table is not
-- readable or writable through the public anon key.

create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  user_id text not null,
  email text,
  message text not null,
  rating smallint check (rating between 1 and 5),
  page text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_user_id_idx on public.feedback (user_id);
create index if not exists feedback_created_at_idx on public.feedback (created_at desc);

alter table public.feedback enable row level security;
