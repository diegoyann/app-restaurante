create or replace function public.resolve_recurring_cost_duplicate_candidate(
  p_tenant_id uuid,
  p_candidate_id uuid,
  p_action text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate public.recurring_cost_duplicate_candidates%rowtype;
  master_id uuid;
  duplicate_id uuid;
begin
  if p_action not in ('CONFIRMED', 'REJECTED') then
    raise exception 'Ação de duplicidade inválida.';
  end if;

  select * into candidate
  from public.recurring_cost_duplicate_candidates
  where id = p_candidate_id and tenant_id = p_tenant_id
  for update;

  if not found then raise exception 'Candidato de duplicidade não encontrado.'; end if;
  if candidate.status <> 'PENDING' then raise exception 'Esta duplicidade já foi revisada.'; end if;

  if p_action = 'REJECTED' then
    update public.recurring_costs
    set requires_duplicate_review = false, active = true
    where tenant_id = p_tenant_id
      and id in (candidate.left_cost_id, candidate.right_cost_id)
      and merged_into_id is null;
  else
    select id into master_id
    from public.recurring_costs
    where tenant_id = p_tenant_id and id in (candidate.left_cost_id, candidate.right_cost_id)
    order by (source_type <> 'IMPORTED_SPREADSHEET') desc, active desc, created_at asc
    limit 1;

    duplicate_id := case when master_id = candidate.left_cost_id then candidate.right_cost_id else candidate.left_cost_id end;

    delete from public.financial_obligations
    where tenant_id = p_tenant_id
      and source_type = 'RECURRING'
      and source_id = duplicate_id::text
      and paid_amount = 0;

    update public.recurring_costs
    set active = false, merged_into_id = master_id, requires_duplicate_review = false
    where tenant_id = p_tenant_id and id = duplicate_id;

    update public.recurring_costs
    set active = true, requires_duplicate_review = false
    where tenant_id = p_tenant_id and id = master_id;
  end if;

  update public.recurring_cost_duplicate_candidates
  set status = p_action
  where id = candidate.id;

  return jsonb_build_object('id', candidate.id, 'status', p_action, 'masterId', master_id, 'duplicateId', duplicate_id);
end;
$$;

revoke all on function public.resolve_recurring_cost_duplicate_candidate(uuid, uuid, text) from public;
grant execute on function public.resolve_recurring_cost_duplicate_candidate(uuid, uuid, text) to service_role;
