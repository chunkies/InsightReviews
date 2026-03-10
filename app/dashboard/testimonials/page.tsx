import { Box } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { TestimonialManager } from '@/components/testimonials/testimonial-manager';
import { WallCustomizer } from '@/components/testimonials/wall-customizer';
import { ReviewExperienceForm } from '@/components/testimonials/review-experience-form';
import { mergeWallConfig } from '@/lib/types/wall-config';
import { TestimonialPageTabs } from '@/components/testimonials/testimonial-page-tabs';
import type { Organization, OrganizationIntegration } from '@/lib/types/database';

export default async function TestimonialsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!member) redirect('/onboarding');

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', member.organization_id)
    .single();

  if (!org) redirect('/onboarding');

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('organization_id', member.organization_id)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  const { data: integrations } = await supabase
    .from('organization_integrations')
    .select('*')
    .eq('organization_id', member.organization_id);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const wallUrl = `${siteUrl}/wall/${org.slug}`;
  const reviewUrl = `${siteUrl}/r/${org.slug}`;
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
        subtitle="Manage your testimonial wall, design, and review experience"
      />
      <TestimonialPageTabs
        managerContent={
          <TestimonialManager
            reviews={reviews ?? []}
            wallUrl={wallUrl}
            reviewUrl={reviewUrl}
            slug={org.slug}
            siteUrl={siteUrl}
          />
        }
        customizerContent={
          <WallCustomizer
            orgId={org.id}
            orgName={org.name}
            logoUrl={org.logo_url}
            initialConfig={wallConfig}
            wallUrl={wallUrl}
            reviewUrl={reviewUrl}
            reviews={wallReviews}
          />
        }
        reviewExperienceContent={
          <ReviewExperienceForm
            org={org as unknown as Organization}
            isOwner={member.role === 'owner'}
            integrations={(integrations ?? []) as unknown as OrganizationIntegration[]}
          />
        }
      />
    </Box>
  );
}
