-- Deduplicate existing journal entries and prevent future same-day content duplicates.
-- Keeps the earliest created_at row for each user/date/content group.

create extension if not exists pgcrypto;

alter table public.journal_entries
  add column if not exists content_hash text,
  add column if not exists entry_date_key text;

create or replace function public.set_journal_entry_dedupe_fields()
returns trigger
language plpgsql
as $$
begin
  new.content_hash := encode(
    digest(regexp_replace(lower(btrim(coalesce(new.content, ''))), '\s+', ' ', 'g'), 'sha256'),
    'hex'
  );
  new.entry_date_key := to_char(coalesce(new."date", now()) at time zone 'UTC', 'YYYY-MM-DD');
  return new;
end;
$$;

update public.journal_entries
set
  content_hash = encode(
    digest(regexp_replace(lower(btrim(coalesce(content, ''))), '\s+', ' ', 'g'), 'sha256'),
    'hex'
  ),
  entry_date_key = to_char(coalesce("date", now()) at time zone 'UTC', 'YYYY-MM-DD')
where content_hash is null
  or entry_date_key is null;

with ranked_entries as (
  select
    id,
    row_number() over (
      partition by user_id, entry_date_key, content_hash
      order by created_at asc nulls last, id asc
    ) as duplicate_rank
  from public.journal_entries
)
delete from public.journal_entries
using ranked_entries
where public.journal_entries.id = ranked_entries.id
  and ranked_entries.duplicate_rank > 1;

drop trigger if exists journal_entries_dedupe_fields_trigger on public.journal_entries;

create trigger journal_entries_dedupe_fields_trigger
before insert or update of content, "date"
on public.journal_entries
for each row
execute function public.set_journal_entry_dedupe_fields();

create unique index if not exists journal_entries_user_day_content_hash_uidx
on public.journal_entries (user_id, entry_date_key, content_hash)
where content_hash is not null
  and entry_date_key is not null;
