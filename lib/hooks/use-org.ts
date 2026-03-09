'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Organization, OrganizationMember } from '@/lib/types/database';

interface OrgContext {
  org: Organization | null;
  membership: OrganizationMember | null;
  loading: boolean;
}

export function useOrg(): OrgContext {
  const [org, setOrg] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<OrganizationMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrg() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: member } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!member) {
        setLoading(false);
        return;
      }

      setMembership(member);

      const { data: organization } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', member.organization_id)
        .single();

      setOrg(organization);
      setLoading(false);
    }

    loadOrg();
  }, []);

  return { org, membership, loading };
}
