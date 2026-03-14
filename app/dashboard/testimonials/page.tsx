import { Box } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { TestimonialManager } from '@/components/testimonials/testimonial-manager';
import { WallCustomizer } from '@/components/testimonials/wall-customizer';
import { ReviewExperienceForm } from '@/components/testimonials/review-experience-form';
import { mergeWallConfig } from '@/lib/types/wall-config';
import { TestimonialPageTabs } from '@/components/testimonials/testimonial-page-tabs';
import type { Platform } from '@/components/testimonials/testimonial-page-tabs';
import type { Organization, OrganizationIntegration, ReviewPlatform } from '@/lib/types/database';
import type { ThankYouConfig } from '@/components/review-form/review-form-content';
import type { WallConfig } from '@/lib/types/wall-config';

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

  const [reviewsRes, integrationsRes, platformsRes] = await Promise.all([
    supabase
      .from('reviews')
      .select('*')
      .eq('organization_id', member.organization_id)
      .eq('is_public', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('organization_integrations')
      .select('*')
      .eq('organization_id', member.organization_id),
    supabase
      .from('review_platforms')
      .select('*')
      .eq('organization_id', member.organization_id)
      .order('display_order'),
  ]);

  const reviews = reviewsRes.data ?? [];
  const integrations = (integrationsRes.data ?? []) as unknown as OrganizationIntegration[];
  const manualPlatforms = (platformsRes.data ?? []) as unknown as ReviewPlatform[];

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').trim();
  const wallUrl = `${siteUrl}/wall/${org.slug}`;
  const reviewUrl = `${siteUrl}/r/${org.slug}`;
  const wallConfig = mergeWallConfig(org.wall_config);

  const wallReviews = reviews.map(r => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    customer_name: r.customer_name,
    created_at: r.created_at,
  }));

  // Build initial thank-you config
  const initialThankYouConfig: ThankYouConfig = {
    positiveTitle: org.thankyou_positive_title ?? 'Thank You!',
    positiveMessage: org.thankyou_positive_message ?? 'We really appreciate your feedback. Would you mind sharing your experience on one of these platforms?',
    negativeTitle: org.thankyou_negative_title ?? 'Thank You for Your Feedback',
    negativeMessage: org.thankyou_negative_message ?? 'We appreciate you letting us know. Your feedback helps us improve. We\'ll follow up with you soon.',
    couponCode: org.thankyou_coupon_code ?? null,
    couponText: org.thankyou_coupon_text ?? 'Here\'s a little thank you from us:',
    socialLinks: (org.thankyou_social_links as Record<string, string>) ?? {},
  };

  // Build initial combined platform list
  const manualPlatformTypes = new Set(manualPlatforms.map(p => p.platform));
  const initialPlatforms: Platform[] = [
    ...manualPlatforms.map(p => ({
      id: p.id,
      platform: p.platform,
      platform_name: p.platform_name,
      url: p.url,
      display_order: p.display_order,
      enabled: p.enabled,
      source: 'manual' as const,
    })),
    ...integrations
      .filter(i => i.platform_url && !manualPlatformTypes.has(i.platform))
      .map((i, idx) => ({
        id: i.id,
        platform: i.platform,
        platform_name: i.platform_account_name,
        url: i.platform_url!,
        display_order: 100 + idx,
        enabled: i.show_on_review_form,
        source: 'integration' as const,
      })),
  ];

  return (
    <Box>
      <PageHeader
        title="Testimonials"
        subtitle="Manage your testimonial wall, design, and review experience"
      />
      <TestimonialPageTabs
        initialConfig={wallConfig}
        initialThankYouConfig={initialThankYouConfig}
        orgName={org.name}
        logoUrl={org.logo_url}
        initialPlatforms={initialPlatforms}
        reviews={wallReviews}
        managerContent={
          <TestimonialManager
            reviews={reviews}
            wallUrl={wallUrl}
            reviewUrl={reviewUrl}
            slug={org.slug}
            siteUrl={siteUrl}
          />
        }
        customizerContent={(onConfigChange: (config: WallConfig) => void) => (
          <WallCustomizer
            orgId={org.id}
            initialConfig={wallConfig}
            wallUrl={wallUrl}
            reviewUrl={reviewUrl}
            onConfigChange={onConfigChange}
          />
        )}
        reviewExperienceContent={(onThankYouConfigChange: (config: ThankYouConfig) => void, onPlatformsChange: (platforms: Platform[]) => void) => (
          <ReviewExperienceForm
            org={org as unknown as Organization}
            isOwner={member.role === 'owner'}
            integrations={integrations}
            manualPlatforms={manualPlatforms}
            onThankYouConfigChange={onThankYouConfigChange}
            onPlatformsChange={onPlatformsChange}
          />
        )}
      />
    </Box>
  );
}
