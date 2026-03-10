import { Box, Container } from '@mui/material';
import { createServerClient } from '@supabase/ssr';
import { notFound } from 'next/navigation';
import { ReviewFormContent } from '@/components/review-form/review-form-content';
import { mergeWallConfig } from '@/lib/types/wall-config';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ rid?: string }>;
}

export default async function ReviewPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { rid: reviewRequestId } = await searchParams;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url, positive_threshold, wall_config')
    .eq('slug', slug)
    .single();

  if (!org) notFound();

  const { data: platforms } = await supabase
    .from('review_platforms')
    .select('id, platform, platform_name, url, display_order')
    .eq('organization_id', org.id)
    .eq('enabled', true)
    .order('display_order');

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
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <ReviewFormContent
          org={{
            id: org.id,
            name: org.name,
            slug: org.slug,
            logoUrl: org.logo_url,
            positiveThreshold: org.positive_threshold,
          }}
          platforms={platforms ?? []}
          reviewRequestId={reviewRequestId}
          config={config}
        />
      </Container>
    </Box>
  );
}
