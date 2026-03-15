import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { fireWebhook } from '@/lib/utils/webhook';
import { sendNegativeReviewNotification } from '@/lib/email/client';
import { isAdminEmail } from '@/lib/utils/admin';

// Simple in-memory rate limiting: IP -> { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

const MAX_COMMENT_LENGTH = 10000;
const MAX_NAME_LENGTH = 200;

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 });
    }

    const { slug, rating, comment, customerName, customerContact, reviewRequestId, photoUrl } = await request.json();

    if (!slug || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    if (comment && typeof comment === 'string' && comment.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json({ error: `Comment must be under ${MAX_COMMENT_LENGTH} characters` }, { status: 400 });
    }

    if (customerName && typeof customerName === 'string' && customerName.length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: `Name must be under ${MAX_NAME_LENGTH} characters` }, { status: 400 });
    }

    // Service role client — this is a public endpoint
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
      process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
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
      .select('id, name, slug, email, positive_threshold, webhook_url, webhook_enabled, notify_on_negative, auto_followup_enabled, auto_followup_delay_hours, auto_followup_message, billing_plan, trial_ends_at, subscription_ends_at')
      .eq('slug', slug)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Check if org owner is an admin (bypass billing check)
    const { data: ownerMember } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', org.id)
      .eq('role', 'owner')
      .limit(1)
      .maybeSingle();

    let isAdminOrg = false;
    if (ownerMember?.user_id) {
      const { data: { user: ownerUser } } = await supabase.auth.admin.getUserById(ownerMember.user_id);
      isAdminOrg = isAdminEmail(ownerUser?.email);
    }

    // Block submissions if billing is expired (admin orgs bypass)
    const plan = org.billing_plan ?? 'none';
    const isExpiredTrial = plan === 'trial' && org.trial_ends_at && new Date(org.trial_ends_at) < new Date();
    const isExpiredCancelling = plan === 'cancelling' && org.subscription_ends_at && new Date(org.subscription_ends_at) < new Date();
    const isInactive = ['cancelled', 'past_due', 'none'].includes(plan);

    if (!isAdminOrg && (isExpiredTrial || isExpiredCancelling || isInactive)) {
      return NextResponse.json({ error: 'This review page is currently unavailable' }, { status: 403 });
    }

    const isPositive = rating >= org.positive_threshold;

    // Parse contact info from QR walk-ins (email or phone)
    let contactEmail: string | null = null;
    let contactPhone: string | null = null;
    if (customerContact && typeof customerContact === 'string') {
      const trimmed = customerContact.trim();
      if (trimmed.includes('@')) {
        contactEmail = trimmed;
      } else {
        contactPhone = trimmed;
      }
    }

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
        customer_phone: contactPhone,
        customer_email: contactEmail,
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
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').trim();
      sendNegativeReviewNotification({
        to: org.email,
        businessName: org.name,
        rating,
        comment: comment || null,
        customerName: customerName || null,
        customerContact: contactEmail || contactPhone || null,
        dashboardUrl: `${siteUrl}/dashboard/reviews`,
      });
    }

    // Queue auto follow-up for negative reviews
    if (!isPositive && org.auto_followup_enabled) {
      // Determine contact info: try review request first, then fall back to QR walk-in contact
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

      // Fall back to contact info from QR walk-in form
      if (!toContact && contactEmail) {
        toContact = contactEmail;
        channel = 'email';
      } else if (!toContact && contactPhone) {
        toContact = contactPhone;
        channel = 'sms';
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
