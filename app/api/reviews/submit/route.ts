import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { slug, rating, comment, customerName } = await request.json();

    if (!slug || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Service role client — this is a public endpoint
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

    // Look up org by slug
    const { data: org } = await supabase
      .from('organizations')
      .select('id, positive_threshold')
      .eq('slug', slug)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const isPositive = rating >= org.positive_threshold;

    // Insert review
    const { error: insertError } = await supabase
      .from('reviews')
      .insert({
        organization_id: org.id,
        rating,
        comment: comment || null,
        customer_name: customerName || null,
        is_positive: isPositive,
        is_public: isPositive, // Auto-publish positive reviews
        redirected_to: [],
      });

    if (insertError) {
      console.error('Review insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save review' }, { status: 500 });
    }

    // Log activity
    await supabase.from('activity_log').insert({
      organization_id: org.id,
      user_id: null,
      action: isPositive ? 'positive_review_received' : 'negative_review_received',
      entity_type: 'review',
      details: { rating, hasComment: !!comment },
    });

    return NextResponse.json({ success: true, isPositive });
  } catch (error) {
    console.error('Review submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
