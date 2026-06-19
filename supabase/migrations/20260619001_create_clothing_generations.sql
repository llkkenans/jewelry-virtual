create table if not exists public.clothing_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('tops', 'bottoms', 'one-pieces')),
  gender text not null check (gender in ('woman', 'man')),
  skin_tone text not null check (skin_tone in ('light', 'medium', 'dark')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  output_image_url text,
  credits_used integer not null default 1,
  is_saved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_clothing_generations_user_id
  on public.clothing_generations(user_id);

create index if not exists idx_clothing_generations_user_saved
  on public.clothing_generations(user_id, is_saved)
  where is_saved = true;

alter table public.clothing_generations enable row level security;

create policy "kendi kiyafet uretimleri"
  on public.clothing_generations for all
  using (auth.uid() = user_id);

drop trigger if exists on_clothing_generation_insert on public.clothing_generations;

create trigger on_clothing_generation_insert
  after insert on public.clothing_generations
  for each row execute function deduct_credit();
