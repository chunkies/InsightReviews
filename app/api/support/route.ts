import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendSupportTicketNotification } from '@/lib/email/client';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 });
  }

  const body = await req.json();
  const { subject, message, category, priority } = body;

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', member.organization_id)
    .single();

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      organization_id: member.organization_id,
      user_id: user.id,
      subject: subject.trim(),
      message: message.trim(),
      category: category || 'general',
      priority: priority || 'normal',
    })
    .select()
    .single();

  if (error) {
    console.error('Support ticket error:', error.message);
    return NextResponse.json({ error: 'Failed to create support ticket' }, { status: 500 });
  }

  // Send email notification (fire and forget — don't block the response)
  sendSupportTicketNotification({
    orgName: org?.name || 'Unknown',
    userEmail: user.email || 'unknown',
    subject: subject.trim(),
    message: message.trim(),
    category: category || 'general',
    priority: priority || 'normal',
    ticketId: ticket.id,
  }).catch((err) => {
    console.error('Failed to send support ticket email:', err);
  });

  return NextResponse.json({ ticket });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 });
  }

  const { data: tickets, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('organization_id', member.organization_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Support tickets fetch error:', error.message);
    return NextResponse.json({ error: 'Failed to load tickets' }, { status: 500 });
  }

  return NextResponse.json({ tickets });
}
