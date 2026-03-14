import { Box, Container } from '@mui/material';
import { createServerClient } from '@supabase/ssr';
import { notFound } from 'next/navigation';
import { ReviewFormContent } from '@/components/review-form/review-form-content';
import { mergeWallConfig } from '@/lib/types/wall-config';
import type { Metadata } from 'next';

export const revalidate = 300; // Cache for 5 minutes

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ rid?: string }>;
}

function getSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getSupabaseClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('slug', slug)
    .single();

  const name = org?.name || 'Business';
  return {
    title: `Leave a Review for ${name}`,
    description: `Share your experience at ${name}. Your feedback helps us improve.`,
    robots: { index: false, follow: false },
  };
}

export default async function ReviewPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { rid: reviewRequestId } = await searchParams;

  const supabase = getSupabaseClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url, positive_threshold, wall_config, review_form_heading, review_form_subheading, thankyou_positive_title, thankyou_positive_message, thankyou_negative_title, thankyou_negative_message, thankyou_coupon_code, thankyou_coupon_text, thankyou_social_links')
    .eq('slug', slug)
    .single();

  if (!org) notFound();

  // Fetch both manual platforms AND connected integrations
  const [platformsRes, integrationsRes] = await Promise.all([
    supabase
      .from('review_platforms')
      .select('id, platform, platform_name, url, display_order')
      .eq('organization_id', org.id)
      .eq('enabled', true)
      .order('display_order'),
    supabase
      .from('organization_integrations')
      .select('id, platform, platform_account_name, platform_url')
      .eq('organization_id', org.id)
      .eq('show_on_review_form', true),
  ]);

  const manualPlatforms = platformsRes.data ?? [];
  const integrations = integrationsRes.data ?? [];

  // Merge: integrations auto-add their platform if not already in manual list
  const manualPlatformTypes = new Set(manualPlatforms.map(p => p.platform));
  const integrationPlatforms = integrations
    .filter(i => i.platform_url && !manualPlatformTypes.has(i.platform))
    .map((i, idx) => ({
      id: i.id,
      platform: i.platform,
      platform_name: i.platform_account_name,
      url: i.platform_url!,
      display_order: 100 + idx,
    }));

  const platforms = [...manualPlatforms, ...integrationPlatforms];

  const config = mergeWallConfig(org.wall_config);

  // Use the wall config for the review form background
  const bgStyle = config.bgType === 'gradient'
    ? `linear-gradient(${config.bgGradientAngle}deg, ${config.bgGradientFrom} 0%, ${config.bgGradientTo} 100%)`
    : config.bgColor;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: bgStyle,
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'center',
        px: { xs: 1.5, sm: 2 },
        py: { xs: 3, sm: 2 },
      }}
    >
      <Container maxWidth="sm" disableGutters sx={{ px: { xs: 0.5, sm: 2 } }}>
        <ReviewFormContent
          org={{
            id: org.id,
            name: org.name,
            slug: org.slug,
            logoUrl: org.logo_url,
            positiveThreshold: org.positive_threshold,
            reviewFormHeading: org.review_form_heading,
            reviewFormSubheading: org.review_form_subheading,
          }}
          thankYouConfig={{
            positiveTitle: org.thankyou_positive_title ?? 'Thank You!',
            positiveMessage: org.thankyou_positive_message ?? 'We really appreciate your feedback. Would you mind sharing your experience on one of these platforms?',
            negativeTitle: org.thankyou_negative_title ?? 'Thank You for Your Feedback',
            negativeMessage: org.thankyou_negative_message ?? 'We appreciate you letting us know. Your feedback helps us improve. We\'ll follow up with you soon.',
            couponCode: org.thankyou_coupon_code ?? null,
            couponText: org.thankyou_coupon_text ?? 'Here\'s a little thank you from us:',
            socialLinks: (org.thankyou_social_links as Record<string, string>) ?? {},
          }}
          platforms={platforms ?? []}
          reviewRequestId={reviewRequestId}
          config={config}
        />
      </Container>
    </Box>
  );
}
