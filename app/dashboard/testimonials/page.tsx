import { Box, Tabs, Tab } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { TestimonialManager } from '@/components/testimonials/testimonial-manager';
import { WallCustomizer } from '@/components/testimonials/wall-customizer';
import { mergeWallConfig } from '@/lib/types/wall-config';
import { TestimonialPageTabs } from '@/components/testimonials/testimonial-page-tabs';

export default async function TestimonialsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!member) redirect('/onboarding');

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url, wall_config')
    .eq('id', member.organization_id)
    .single();

  if (!org) redirect('/onboarding');

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('organization_id', member.organization_id)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  const wallUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/wall/${org.slug}`;
  const wallConfig = mergeWallConfig(org.wall_config);

  const wallReviews = (reviews ?? []).map(r => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    customer_name: r.customer_name,
    created_at: r.created_at,
  }));

  return (
    <Box>
      <PageHeader
        title="Testimonials"
        subtitle="Manage and customize your public testimonial wall"
      />
      <TestimonialPageTabs
        managerContent={
          <TestimonialManager
            reviews={reviews ?? []}
            wallUrl={wallUrl}
          />
        }
        customizerContent={
          <WallCustomizer
            orgId={org.id}
            orgName={org.name}
            logoUrl={org.logo_url}
            initialConfig={wallConfig}
            wallUrl={wallUrl}
            reviews={wallReviews}
          />
        }
      />
    </Box>
  );
}
