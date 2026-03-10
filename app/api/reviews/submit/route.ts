import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { fireWebhook } from '@/lib/utils/webhook';
import { sendNegativeReviewNotification } from '@/lib/email/client';

export async function POST(request: NextRequest) {
  try {
    const { slug, rating, comment, customerName, reviewRequestId, photoUrl } = await request.json();

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
      .select('id, name, slug, email, positive_threshold, webhook_url, webhook_enabled, notify_on_negative, auto_followup_enabled, auto_followup_delay_hours, auto_followup_message')
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
        photo_url: photoUrl || null,
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

    // Fire webhook if configured
    if (org.webhook_url && org.webhook_enabled) {
      // Fire and forget — don't block the response
      fireWebhook(org.webhook_url, {
        event: 'review.created',
        review: {
          id: review.id,
          rating,
          comment: comment || null,
          customer_name: customerName || null,
          is_positive: isPositive,
          created_at: new Date().toISOString(),
        },
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
        },
      });
    }

    // Send negative review notification email
    if (!isPositive && org.notify_on_negative && org.email) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      sendNegativeReviewNotification({
        to: org.email,
        businessName: org.name,
        rating,
        comment: comment || null,
        customerName: customerName || null,
        dashboardUrl: `${siteUrl}/dashboard/reviews`,
      });
    }

    // Queue auto follow-up for negative reviews
    if (!isPositive && org.auto_followup_enabled) {
      // Determine contact info: try review request first, then fall back to any available contact
      let toContact: string | null = null;
      let channel: 'email' | 'sms' = 'email';

      if (validatedRequestId) {
        const { data: reqData } = await supabase
          .from('review_requests')
          .select('customer_phone, customer_email, contact_method')
          .eq('id', validatedRequestId)
          .single();

        if (reqData) {
          if (reqData.customer_email) {
            toContact = reqData.customer_email;
            channel = 'email';
          } else if (reqData.customer_phone) {
            toContact = reqData.customer_phone;
            channel = 'sms';
          }
        }
      }

      if (toContact) {
        const delayMs = (org.auto_followup_delay_hours ?? 2) * 60 * 60 * 1000;
        const scheduledAt = new Date(Date.now() + delayMs).toISOString();

        await supabase.from('followup_queue').insert({
          organization_id: org.id,
          review_id: review.id,
          scheduled_at: scheduledAt,
          status: 'pending',
          channel,
          to_contact: toContact,
        });
      }
    }

    return NextResponse.json({ success: true, isPositive, reviewId: review.id });
  } catch (error) {
    console.error('Review submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
