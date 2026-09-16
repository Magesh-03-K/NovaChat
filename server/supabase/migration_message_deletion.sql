-- Migration script for WhatsApp-style Message Deletion System in NovaChat
-- Run this in your Supabase SQL Editor (Project -> SQL Editor -> New query).

-- 1. Add global soft-delete columns to `public.messages`
alter table public.messages add column if not exists deleted_for_everyone boolean default false;
alter table public.messages add column if not exists deleted_at timestamptz;
alter table public.messages add column if not exists deleted_by uuid references public.users(id) on delete set null;

-- 2. Create `public.message_deletions` table for per-user "Delete for me" functionality
create table if not exists public.message_deletions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  deleted_at timestamptz default now(),
  constraint unique_message_user_deletion unique(message_id, user_id)
);

-- Enable RLS on message_deletions
alter table public.message_deletions enable row level security;

-- 3. RLS Policies for `public.message_deletions`
drop policy if exists "users can view their own message deletions" on public.message_deletions;
create policy "users can view their own message deletions"
  on public.message_deletions for select
  using (user_id = auth.uid());

drop policy if exists "users can delete messages for themselves" on public.message_deletions;
create policy "users can delete messages for themselves"
  on public.message_deletions for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.messages m
      where m.id = message_id
      and public.is_chat_member(m.chat_id)
    )
  );

-- 4. Update RLS Policy on `public.messages` for Delete for Everyone (only original sender can soft-delete globally)
drop policy if exists "senders can delete messages for everyone" on public.messages;
create policy "senders can delete messages for everyone"
  on public.messages for update
  using (
    sender_id = auth.uid()
  )
  with check (
    sender_id = auth.uid()
  );

-- 5. Enable Realtime broadcast for message_deletions
alter publication supabase_realtime add table public.message_deletions;

-- 6. Indexes for performance
create index if not exists idx_message_deletions_user_id on public.message_deletions(user_id);
create index if not exists idx_message_deletions_message_id on public.message_deletions(message_id);
create index if not exists idx_messages_deleted_for_everyone on public.messages(deleted_for_everyone);
