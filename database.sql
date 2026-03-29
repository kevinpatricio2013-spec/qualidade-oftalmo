-- =========================================================
-- EXTENSÃO NECESSÁRIA
-- =========================================================
create extension if not exists pgcrypto;

-- =========================================================
-- TABELA DE PERFIS
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text unique not null,
  role text not null check (role in ('qualidade', 'lider', 'colaborador')),
  setor text,
  created_at timestamp with time zone default now()
);

-- =========================================================
-- TABELA DE OCORRÊNCIAS
-- =========================================================
create table if not exists public.ocorrencias (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  tipo_ocorrencia text not null,
  setor_origem text not null,
  setor_destino text not null,
  gravidade text not null,
  status text not null default 'Aberto',
  acao_imediata text,
  causa_raiz text,
  plano_acao text,
  prazo date,
  criado_por uuid references public.profiles(id) on delete set null,
  validado_qualidade boolean default false,
  validado_por uuid references public.profiles(id) on delete set null,
  validado_em timestamp with time zone,
  fechado_em timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =========================================================
-- TABELA DE RESPONSÁVEIS MÚLTIPLOS
-- =========================================================
create table if not exists public.ocorrencia_responsaveis (
  id uuid primary key default gen_random_uuid(),
  ocorrencia_id uuid not null references public.ocorrencias(id) on delete cascade,
  responsavel_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- =========================================================
-- FUNÇÃO PARA updated_at
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_ocorrencias_updated_at on public.ocorrencias;

create trigger trg_ocorrencias_updated_at
before update on public.ocorrencias
for each row
execute function public.set_updated_at();

-- =========================================================
-- HABILITAR RLS
-- =========================================================
alter table public.profiles enable row level security;
alter table public.ocorrencias enable row level security;
alter table public.ocorrencia_responsaveis enable row level security;

-- =========================================================
-- LIMPAR POLICIES ANTIGAS QUE POSSAM ATRAPALHAR
-- =========================================================

-- profiles
drop policy if exists "profiles_select_own_or_all_quality" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own_or_quality" on public.profiles;

-- ocorrencias
drop policy if exists "ocorrencias_select" on public.ocorrencias;
drop policy if exists "ocorrencias_insert" on public.ocorrencias;
drop policy if exists "ocorrencias_update" on public.ocorrencias;
drop policy if exists "ocorrencias_delete" on public.ocorrencias;

-- policy antiga que travou seu script
drop policy if exists "Permitir leitura para anon e authenticated" on public.ocorrencias;
drop policy if exists "Permitir inserção para anon e authenticated" on public.ocorrencias;
drop policy if exists "Permitir atualização para anon e authenticated" on public.ocorrencias;
drop policy if exists "Permitir exclusão para anon e authenticated" on public.ocorrencias;

-- ocorrencia_responsaveis
drop policy if exists "rel_select" on public.ocorrencia_responsaveis;
drop policy if exists "rel_insert" on public.ocorrencia_responsaveis;
drop policy if exists "rel_delete" on public.ocorrencia_responsaveis;

-- =========================================================
-- POLICIES - PROFILES
-- =========================================================

create policy "profiles_select_own_or_all_quality"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'qualidade'
  )
);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
);

create policy "profiles_update_own_or_quality"
on public.profiles
for update
to authenticated
using (
  auth.uid() = id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'qualidade'
  )
)
with check (
  auth.uid() = id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'qualidade'
  )
);

-- =========================================================
-- POLICIES - OCORRÊNCIAS
-- Qualidade vê tudo
-- Líder vê somente o setor dele
-- Colaborador vê as que criou
-- =========================================================

create policy "ocorrencias_select"
on public.ocorrencias
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'qualidade'
        or (p.role = 'lider' and p.setor = ocorrencias.setor_destino)
        or (p.role = 'colaborador' and ocorrencias.criado_por = auth.uid())
      )
  )
);

create policy "ocorrencias_insert"
on public.ocorrencias
for insert
to authenticated
with check (
  auth.uid() = criado_por
);

create policy "ocorrencias_update"
on public.ocorrencias
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'qualidade'
        or (p.role = 'lider' and p.setor = ocorrencias.setor_destino)
        or ocorrencias.criado_por = auth.uid()
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'qualidade'
        or (p.role = 'lider' and p.setor = ocorrencias.setor_destino)
        or ocorrencias.criado_por = auth.uid()
      )
  )
);

create policy "ocorrencias_delete"
on public.ocorrencias
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'qualidade'
        or ocorrencias.criado_por = auth.uid()
      )
  )
);

-- =========================================================
-- POLICIES - OCORRÊNCIA RESPONSÁVEIS
-- =========================================================

create policy "rel_select"
on public.ocorrencia_responsaveis
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'qualidade'
  )
  or exists (
    select 1
    from public.ocorrencias o
    join public.profiles p on p.id = auth.uid()
    where o.id = ocorrencia_responsaveis.ocorrencia_id
      and (
        (p.role = 'lider' and p.setor = o.setor_destino)
        or o.criado_por = auth.uid()
      )
  )
);

create policy "rel_insert"
on public.ocorrencia_responsaveis
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'qualidade'
  )
  or exists (
    select 1
    from public.ocorrencias o
    join public.profiles p on p.id = auth.uid()
    where o.id = ocorrencia_responsaveis.ocorrencia_id
      and (
        (p.role = 'lider' and p.setor = o.setor_destino)
        or o.criado_por = auth.uid()
      )
  )
);

create policy "rel_delete"
on public.ocorrencia_responsaveis
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'qualidade'
  )
  or exists (
    select 1
    from public.ocorrencias o
    join public.profiles p on p.id = auth.uid()
    where o.id = ocorrencia_responsaveis.ocorrencia_id
      and (
        (p.role = 'lider' and p.setor = o.setor_destino)
        or o.criado_por = auth.uid()
      )
  )
);