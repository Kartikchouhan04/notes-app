-- Archive support and edit tracking for notes.
--
-- Safe to re-run: every statement is guarded.

-- Soft delete ------------------------------------------------------------
-- Archiving is a reversible hide, not a delete. The DELETE endpoint still
-- removes rows permanently; this column is what "Archive" writes instead.

alter table public.notes
  add column if not exists archived boolean not null default false;

-- Edit tracking ----------------------------------------------------------
-- created_at already exists; this records the last edit so the UI can sort
-- by "recently edited" and mark a note as edited.

alter table public.notes
  add column if not exists updated_at timestamptz not null default now();

-- public.touch_updated_at() is created by 0001_profiles.sql. Define it here
-- too so this migration can be applied on its own.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_touch_updated_at on public.notes;
create trigger notes_touch_updated_at
  before update on public.notes
  for each row execute function public.touch_updated_at();

-- Backfill: existing rows get their creation time as the last-edit time
-- rather than "now", so nothing looks freshly edited after this runs.
update public.notes
   set updated_at = created_at
 where updated_at is distinct from created_at
   and created_at is not null;

-- Indexes ----------------------------------------------------------------
-- The list query always filters by owner and hides archived rows, then
-- orders by recency. This covers that path.

create index if not exists notes_user_archived_created_idx
  on public.notes (user_id, archived, created_at desc);

create index if not exists notes_topic_archived_idx
  on public.notes (topic_id, archived);
