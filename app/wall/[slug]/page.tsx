import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { notFound } from 'next/navigation';
import { TestimonialWall } from '@/components/testimonials/testimonial-wall';
import { mergeWallConfig } from '@/lib/types/wall-config';
import { checkReviewPageAccess } from '@/lib/utils/review-page-access';
import type { Metadata } from 'next';
import { envRequired } from '@/lib/utils/env';

export const revalidate = 300; // Cache for 5 minutes

interface PageProps {
  params: Promise<{ slug: string }>;
}

function getSupabaseClient() {
  return createServerClient(
    envRequired('NEXT_PUBLIC_SUPABASE_URL'),
    envRequired('SUPABASE_SERVICE_ROLE_KEY'),
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );
}

const getOrgBySlug = cache(async (slug: string) => {
  const supabase = getSupabaseClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, logo_url, wall_config, billing_plan, trial_ends_at, subscription_ends_at')
    .eq('slug', slug)
    .single();
  return org;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);

  const name = org?.name || 'Business';
  const description = `See what customers are saying about ${name}. Read real reviews from verified customers.`;
  return {
    title: `${name} — Customer Reviews`,
    description,
    openGraph: {
      title: `${name} — Customer Reviews`,
      description,
      type: 'website',
      url: `https://insightreviews.com.au/wall/${slug}`,
    },
    twitter: {
      card: 'summary',
      title: `${name} — Customer Reviews`,
      description,
    },
    alternates: {
      canonical: `https://insightreviews.com.au/wall/${slug}`,
    },
  };
}

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  customer_name: string | null;
  photo_url: string | null;
  created_at: string;
}

function buildJsonLd(orgName: string, reviews: ReviewRow[]) {
  const validReviews = reviews.filter((r) => r.rating > 0);
  const totalCount = validReviews.length;

  if (totalCount === 0) return null;

  const avgRating =
    validReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount;

  const reviewEntries = validReviews.slice(0, 10).map((r) => ({
    '@type': 'Review' as const,
    reviewRating: {
      '@type': 'Rating' as const,
      ratingValue: r.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      '@type': 'Person' as const,
      name: r.customer_name || 'A customer',
    },
    ...(r.comment ? { reviewBody: r.comment } : {}),
    datePublished: r.created_at.split('T')[0],
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: orgName,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Math.round(avgRating * 10) / 10,
      bestRating: 5,
      worstRating: 1,
      reviewCount: totalCount,
    },
    review: reviewEntries,
  };
}

export default async function TestimonialWallPage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = getSupabaseClient();
  const org = await getOrgBySlug(slug);

  if (!org) notFound();

  // Check if org owner is an admin (bypass billing check)
  const { data: ownerMember } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', org.id)
    .eq('role', 'owner')
    .limit(1)
    .maybeSingle();

  let ownerEmail: string | null = null;
  if (ownerMember?.user_id) {
    const { data: { user: ownerUser } } = await supabase.auth.admin.getUserById(ownerMember.user_id);
    ownerEmail = ownerUser?.email ?? null;
  }

  const access = checkReviewPageAccess({
    billingPlan: org.billing_plan,
    trialEndsAt: org.trial_ends_at,
    subscriptionEndsAt: org.subscription_ends_at,
    ownerEmail,
  });

  if (!access.allowed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div>
          <h2 style={{ marginBottom: 8 }}>Testimonial wall disabled</h2>
          <p style={{ color: '#64748b' }}>This page is currently inactive. Please contact the business for more information.</p>
        </div>
      </div>
    );
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, customer_name, photo_url, created_at')
    .eq('organization_id', org.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  const config = mergeWallConfig(org.wall_config);
  const safeReviews: ReviewRow[] = (reviews ?? []) as ReviewRow[];
  const jsonLd = buildJsonLd(org.name, safeReviews);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <TestimonialWall
        org={{ name: org.name, logo_url: org.logo_url }}
        reviews={safeReviews}
        config={config}
      />
    </>
  );
}
