import type { MetadataRoute } from 'next';
import { createServerClient } from '@supabase/ssr';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://insightreviews.com.au';

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/login?mode=signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog/get-more-google-reviews`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/negative-google-reviews`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/google-review-link`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/subscribe`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Dynamic routes — fetch public org slugs for wall pages
  try {
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

    const { data: orgs } = await supabase
      .from('organizations')
      .select('slug, updated_at')
      .not('slug', 'is', null)
      .in('billing_plan', ['active', 'trial']);

    const wallRoutes: MetadataRoute.Sitemap = (orgs ?? []).map((org) => ({
      url: `${baseUrl}/wall/${org.slug}`,
      lastModified: org.updated_at ? new Date(org.updated_at) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...wallRoutes];
  } catch {
    // If DB query fails, return static routes only
    return staticRoutes;
  }
}
