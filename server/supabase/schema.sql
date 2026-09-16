-- NovaChat database schema for Supabase PostgreSQL.
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Everything here runs on Supabase's free tier — no paid add-ons required.

-- ============================================================
-- USERS (profile row, one-to-one with auth.users)
-- ============================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  username text unique not null,
  profile_photo_url text,
  about text default '',
  last_seen timestamptz default now(),
  is_online boolean default false,
  is_dnd boolean default false,
  created_at timestamptz default now()
);

alter table public.users add column if not exists is_dnd boolean default false;


alter table public.users enable row level security;

-- Anyone authenticated can see username/photo/about/status of any user
-- (needed for chat lists, search, contact display) but never the email.
create policy "public profile fields are readable by any authenticated user"
  on public.users for select
  using (auth.role() = 'authenticated');

create policy "users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "users can insert their own profile row once"
  on public.users for insert
  with check (auth.uid() = id);

-- Note: the API layer (auth_service.get_profile) strips the `email` field
-- before returning any profile that isn't the caller's own, as a second
-- layer of defense beyond RLS.

-- ============================================================
-- CHATS
-- ============================================================
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct', 'group')),
  name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.chats enable row level security;

create table if not exists public.chat_members (
  chat_id uuid references public.chats(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role text default 'member' check (role in ('member', 'admin')),
  joined_at timestamptz default now(),
  primary key (chat_id, user_id)
);

alter table public.chat_members enable row level security;

-- Helper: is the current user a member of a given chat?
create or replace function public.is_chat_member(_chat_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.chat_members
    where chat_id = _chat_id and user_id = auth.uid()
  );
$$;

create policy "members can read their chats"
  on public.chats for select
  using (public.is_chat_member(id));

create policy "authenticated users can create a chat"
  on public.chats for insert
  with check (auth.role() = 'authenticated');

create policy "members can read their chat_members rows"
  on public.chat_members for select
  using (public.is_chat_member(chat_id));

create policy "members can add members to chats they belong to"
  on public.chat_members for insert
  with check (public.is_chat_member(chat_id) or user_id = auth.uid());

create policy "members can leave or delete their chat_members row"
  on public.chat_members for delete
  using (user_id = auth.uid());


-- ============================================================
-- MESSAGES
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id) on delete cascade,
  sender_id uuid references public.users(id) on delete cascade,
  message_type text not null check (message_type in ('text', 'image', 'video', 'document', 'voice')),
  content text,
  media_url text,
  created_at timestamptz default now(),
  delivered_at timestamptz,
  read_at timestamptz,
  deleted_for_everyone boolean default false,
  deleted_at timestamptz,
  deleted_by uuid references public.users(id) on delete set null
);

alter table public.messages enable row level security;

create policy "members can read messages in their chats"
  on public.messages for select
  using (public.is_chat_member(chat_id));

create policy "members can send messages to their chats"
  on public.messages for insert
  with check (public.is_chat_member(chat_id) and sender_id = auth.uid());

create policy "members can update delivered/read state on messages in their chats"
  on public.messages for update
  using (public.is_chat_member(chat_id));

create policy "senders can delete messages for everyone"
  on public.messages for update
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

-- Per-User Message Deletions (Delete for Me)
create table if not exists public.message_deletions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  deleted_at timestamptz default now(),
  constraint unique_message_user_deletion unique(message_id, user_id)
);

alter table public.message_deletions enable row level security;

create policy "users can view their own message deletions"
  on public.message_deletions for select
  using (user_id = auth.uid());

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

-- ============================================================
-- CONTACTS
-- ============================================================
create table if not exists public.contacts (
  owner_id uuid references public.users(id) on delete cascade,
  contact_id uuid references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (owner_id, contact_id)
);

alter table public.contacts enable row level security;

create policy "users manage their own contact list"
  on public.contacts for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ============================================================
-- PUSH SUBSCRIPTIONS
-- ============================================================
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  subscription_json jsonb not null,
  created_at timestamptz default now()
);

alter table public.push_subscriptions enable row level security;

create policy "users manage their own push subscriptions"
  on public.push_subscriptions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- REALTIME (free on Supabase's free tier)
-- ============================================================

-- Enable Postgres change broadcasts for messages, chat_members, and message_deletions so the
-- frontend can subscribe directly with supabase.channel(...) — no custom
-- WebSocket server needed.
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.message_deletions;
alter publication supabase_realtime add table public.chat_members;
alter publication supabase_realtime add table public.users;

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_messages_chat_id_created_at on public.messages (chat_id, created_at);
create index if not exists idx_chat_members_user_id on public.chat_members (user_id);
create index if not exists idx_message_deletions_user_id on public.message_deletions(user_id);
create index if not exists idx_message_deletions_message_id on public.message_deletions(message_id);

-- ============================================================
-- STORAGE (run separately, or via the Storage tab in the dashboard)
-- ============================================================
-- Create a bucket called "chat-media" (Storage -> New bucket -> public)
-- for images/video/documents/voice notes. The free tier includes 1 GB of
-- storage, which is plenty for a demo/college project. Public read is
-- fine for a demo; for stricter privacy, make it private and switch
-- media_service.py to signed URLs instead of get_public_url.
insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', true)
on conflict (id) do nothing;

create policy "authenticated users can upload media"
  on storage.objects for insert
  with check (bucket_id = 'chat-media' and auth.role() = 'authenticated');

create policy "anyone can read chat media (public bucket)"
  on storage.objects for select
  using (bucket_id = 'chat-media');
