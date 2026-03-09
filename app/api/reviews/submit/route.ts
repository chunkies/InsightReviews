import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { slug, rating, comment, customerName, reviewRequestId } = await request.json();

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

    // Validate review_request_id if provided
    let validatedRequestId: string | null = null;
    if (reviewRequestId) {
      const { data: reviewRequest } = await supabase
        .from('review_requests')
        .select('id, organization_id')
        .eq('id', reviewRequestId)
        .single();

      // Only link if the request exists and belongs to the same org
      if (reviewRequest && reviewRequest.organization_id === org.id) {
        validatedRequestId = reviewRequest.id;
      }
    }

    // Insert review
    const { data: review, error: insertError } = await supabase
      .from('reviews')
      .insert({
        organization_id: org.id,
        review_request_id: validatedRequestId,
        rating,
        comment: comment || null,
        customer_name: customerName || null,
        is_positive: isPositive,
        is_public: isPositive, // Auto-publish positive reviews
        redirected_to: [],
      })
      .select('id')
      .single();

    if (insertError || !review) {
      console.error('Review insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save review' }, { status: 500 });
    }

    // Update the review request status to completed
    if (validatedRequestId) {
      await supabase
        .from('review_requests')
        .update({ status: 'completed' })
        .eq('id', validatedRequestId);
    }

    // Log activity
    await supabase.from('activity_log').insert({
      organization_id: org.id,
      user_id: null,
      action: isPositive ? 'positive_review_received' : 'negative_review_received',
      entity_type: 'review',
      details: { rating, hasComment: !!comment },
    });

    return NextResponse.json({ success: true, isPositive, reviewId: review.id });
  } catch (error) {
    console.error('Review submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
