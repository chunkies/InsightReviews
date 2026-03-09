import { SupabaseClient } from '@supabase/supabase-js';

export async function logActivity(
  supabase: SupabaseClient,
  params: {
    organizationId: string;
    action: string;
    entityType: string;
    entityId?: string;
    details?: Record<string, unknown>;
  }
) {
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('activity_log').insert({
    organization_id: params.organizationId,
    user_id: user?.id ?? null,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    details: params.details ?? {},
  });
}
