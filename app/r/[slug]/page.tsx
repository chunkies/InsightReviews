import { Box, Container } from '@mui/material';
import { createServerClient } from '@supabase/ssr';
import { notFound } from 'next/navigation';
import { ReviewFormContent } from '@/components/review-form/review-form-content';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ReviewPage({ params }: PageProps) {
  const { slug } = await params;

  // Use service role to fetch public org data (no auth needed)
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
    .select('id, name, slug, logo_url, positive_threshold')
    .eq('slug', slug)
    .single();

  if (!org) notFound();

  const { data: platforms } = await supabase
    .from('review_platforms')
    .select('id, platform, platform_name, url, display_order')
    .eq('organization_id', org.id)
    .eq('enabled', true)
    .order('display_order');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
        />
      </Container>
    </Box>
  );
}
