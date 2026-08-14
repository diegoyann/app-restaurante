-- Erros de aplicação para rastreabilidade operacional. Nunca armazena corpo da requisição.
create table if not exists public.application_error_logs (
  id uuid primary key default gen_random_uuid(),
  request_id text not null,
  tenant_slug text not null default '',
  actor_user_id uuid references auth.users(id) on delete set null,
  method text not null default '',
  route text not null default '',
  status_code integer not null,
  error_name text not null,
  error_message text not null,
  stack_trace text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists application_error_logs_created_at_idx
  on public.application_error_logs (created_at desc);
create index if not exists application_error_logs_request_id_idx
  on public.application_error_logs (request_id);

alter table public.application_error_logs enable row level security;

-- Somente a chave de serviço usada pelo backend grava/lê logs operacionais.
-- Não há políticas para clientes autenticados ou anônimos.
comment on table public.application_error_logs is
  'Logs operacionais sanitizados; não contém corpo de requisição, tokens ou senhas.';
