import { createServerClient } from '@supabase/ssr';
import { notFound } from 'next/navigation';
import { TestimonialWall } from '@/components/testimonials/testimonial-wall';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TestimonialWallPage({ params }: PageProps) {
  const { slug } = await params;

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
    .select('id, name, logo_url')
    .eq('slug', slug)
    .single();

  if (!org) notFound();

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, customer_name, created_at')
    .eq('organization_id', org.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  return (
    <TestimonialWall
      org={{ name: org.name, logo_url: org.logo_url }}
      reviews={reviews ?? []}
    />
  );
}
