import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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

  if (!org) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, customer_name, created_at')
    .eq('organization_id', org.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50);

  // CORS headers for embeddable widget
  const response = NextResponse.json({
    business: { name: org.name, logoUrl: org.logo_url },
    reviews: reviews ?? [],
  });

  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET');

  return response;
}
