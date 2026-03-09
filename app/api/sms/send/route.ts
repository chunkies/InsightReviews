import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { sendSms, buildReviewLink, buildSmsBody } from '@/lib/twilio/client';
import { sendReviewEmail } from '@/lib/email/client';
import { logActivity } from '@/lib/utils/activity-logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      organizationId,
      customerPhone,
      customerEmail,
      customerName,
      contactMethod,
    } = await request.json();

    if (!organizationId || (!customerPhone && !customerEmail)) {
      return NextResponse.json({ error: 'Missing required fields — provide phone or email' }, { status: 400 });
    }

    const method: 'sms' | 'email' = contactMethod === 'email' ? 'email' : 'sms';

    // Verify user belongs to org
    const { data: member } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get org details
    const { data: org } = await supabase
      .from('organizations')
      .select('name, slug, sms_template')
      .eq('id', organizationId)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
    const link = buildReviewLink(siteUrl, org.slug);
    const messageBody = buildSmsBody(org.sms_template, org.name, link);

    // Create review request record
    const { data: reviewRequest, error: reqError } = await supabase
      .from('review_requests')
      .insert({
        organization_id: organizationId,
        customer_phone: customerPhone || null,
        customer_email: customerEmail || null,
        customer_name: customerName || null,
        contact_method: method,
        sent_by: user.id,
        status: 'sent',
      })
      .select('id')
      .single();

    if (reqError) {
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }

    let sendSuccess = false;

    if (method === 'sms') {
      // Send SMS via Twilio
      const twilioSid = await sendSms(customerPhone, messageBody);
      sendSuccess = !!twilioSid;

      // Log to sms_log
      await supabase.from('sms_log').insert({
        organization_id: organizationId,
        review_request_id: reviewRequest.id,
        to_phone: customerPhone,
        message_body: messageBody,
        twilio_sid: twilioSid,
        channel: 'sms',
        status: twilioSid ? 'sent' : 'failed',
      });
    } else {
      // Send email
      sendSuccess = await sendReviewEmail({
        to: customerEmail,
        businessName: org.name,
        reviewLink: link,
        customerName: customerName || undefined,
      });

      // Log to sms_log (used as contact_log)
      await supabase.from('sms_log').insert({
        organization_id: organizationId,
        review_request_id: reviewRequest.id,
        to_phone: customerEmail, // store email in to_phone field for now
        message_body: messageBody,
        channel: 'email',
        status: sendSuccess ? 'sent' : 'failed',
      });
    }

    // Update request status if send failed
    if (!sendSuccess) {
      await supabase
        .from('review_requests')
        .update({ status: 'failed' })
        .eq('id', reviewRequest.id);

      return NextResponse.json(
        { error: `${method === 'sms' ? 'SMS' : 'Email'} delivery failed` },
        { status: 502 },
      );
    }

    // Log activity
    await logActivity(supabase, {
      organizationId,
      action: 'review_request_sent',
      entityType: 'review_request',
      entityId: reviewRequest.id,
      details: {
        contactMethod: method,
        customerPhone: customerPhone || undefined,
        customerEmail: customerEmail || undefined,
        customerName,
      },
    });

    return NextResponse.json({ success: true, requestId: reviewRequest.id });
  } catch (error) {
    console.error('Send review request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
