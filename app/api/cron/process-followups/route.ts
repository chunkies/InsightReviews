import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { sendFollowupEmail } from '@/lib/email/client';
import { sendSms } from '@/lib/twilio/client';

export async function POST(request: NextRequest) {
  try {
    // Verify authorization — use a shared secret or Vercel cron header
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Fetch pending follow-ups that are due
    const { data: pendingFollowups, error: fetchError } = await supabase
      .from('followup_queue')
      .select(`
        id,
        organization_id,
        review_id,
        channel,
        to_contact,
        scheduled_at
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(50);

    if (fetchError) {
      console.error('Error fetching pending followups:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch followups' }, { status: 500 });
    }

    if (!pendingFollowups || pendingFollowups.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    // Get unique org IDs to batch-fetch org data
    const orgIds = [...new Set(pendingFollowups.map((f) => f.organization_id))];
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, auto_followup_message')
      .in('id', orgIds);

    const orgMap = new Map(
      (orgs ?? []).map((o) => [o.id, o])
    );

    // Get review IDs to batch-fetch customer names
    const reviewIds = pendingFollowups.map((f) => f.review_id);
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, customer_name')
      .in('id', reviewIds);

    const reviewMap = new Map(
      (reviews ?? []).map((r) => [r.id, r])
    );

    let processed = 0;
    let failed = 0;

    for (const followup of pendingFollowups) {
      const org = orgMap.get(followup.organization_id);
      if (!org) {
        await supabase
          .from('followup_queue')
          .update({ status: 'failed', sent_at: new Date().toISOString() })
          .eq('id', followup.id);
        failed++;
        continue;
      }

      const review = reviewMap.get(followup.review_id);
      const customerName = review?.customer_name || 'valued customer';

      // Build message from template
      const message = (org.auto_followup_message || '')
        .replace(/\{customer_name\}/g, customerName)
        .replace(/\{business_name\}/g, org.name);

      let success = false;

      if (followup.channel === 'sms') {
        const sid = await sendSms(followup.to_contact, message);
        success = sid !== null;
      } else {
        // Email channel
        success = await sendFollowupEmail({
          to: followup.to_contact,
          businessName: org.name,
          message,
          customerName,
        });
      }

      await supabase
        .from('followup_queue')
        .update({
          status: success ? 'sent' : 'failed',
          sent_at: new Date().toISOString(),
        })
        .eq('id', followup.id);

      // Log activity
      await supabase.from('activity_log').insert({
        organization_id: followup.organization_id,
        user_id: null,
        action: success ? 'auto_followup_sent' : 'auto_followup_failed',
        entity_type: 'followup',
        entity_id: followup.id,
        details: {
          channel: followup.channel,
          review_id: followup.review_id,
          to_contact: followup.to_contact,
        },
      });

      if (success) {
        processed++;
      } else {
        failed++;
      }
    }

    return NextResponse.json({ processed, failed });
  } catch (error) {
    console.error('Process followups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
