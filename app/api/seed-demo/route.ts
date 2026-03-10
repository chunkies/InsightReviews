import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Seeds demo data for the authenticated user's organization.
 * Only accessible to admin emails.
 * POST /api/seed-demo
 */
export async function POST() {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return []; }, setAll() {} } }
    );

    // Find the admin user's org
    // Look up user by email
    const adminEmail = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)[0];
    if (!adminEmail) {
      return NextResponse.json({ error: 'No admin email configured' }, { status: 400 });
    }

    // Find user by email
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const adminUser = users?.find(u => u.email?.toLowerCase() === adminEmail);
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // Get their org
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', adminUser.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Admin has no organization' }, { status: 404 });
    }

    const orgId = member.organization_id;

    // Set org to active billing
    await supabase
      .from('organizations')
      .update({
        billing_plan: 'active',
        trial_ends_at: null,
        notify_on_negative: true,
        digest_enabled: true,
        auto_followup_enabled: true,
        auto_followup_delay_hours: 2,
        auto_followup_message: "Hi {customer_name}, we noticed your recent visit wasn't perfect. We'd love to make it right — is there anything we can do?",
      })
      .eq('id', orgId);

    // Clear existing demo reviews (keep real ones if any exist by checking for seed marker)
    // We'll use customer_name patterns to identify seed data

    // Generate 80+ realistic reviews spanning the last 60 days
    const reviewData = generateReviews(orgId);
    const requestData = generateRequests(orgId);
    const activityData = generateActivity(orgId);

    // Insert reviews
    const { error: reviewError } = await supabase
      .from('reviews')
      .insert(reviewData);

    if (reviewError) {
      console.error('Review seed error:', reviewError);
      return NextResponse.json({ error: 'Failed to seed reviews', details: reviewError.message }, { status: 500 });
    }

    // Insert review requests
    const { error: requestError } = await supabase
      .from('review_requests')
      .insert(requestData);

    if (requestError) {
      console.error('Request seed error:', requestError);
    }

    // Insert activity log
    const { error: activityError } = await supabase
      .from('activity_log')
      .insert(activityData);

    if (activityError) {
      console.error('Activity seed error:', activityError);
    }

    // Add review platforms if none exist
    const { data: existingPlatforms } = await supabase
      .from('review_platforms')
      .select('id')
      .eq('organization_id', orgId);

    if (!existingPlatforms || existingPlatforms.length === 0) {
      await supabase.from('review_platforms').insert([
        { organization_id: orgId, platform: 'google', url: 'https://g.page/r/your-business/review', display_order: 0 },
        { organization_id: orgId, platform: 'facebook', url: 'https://facebook.com/your-business/reviews', display_order: 1 },
        { organization_id: orgId, platform: 'yelp', url: 'https://yelp.com/writeareview/biz/your-business', display_order: 2 },
      ]);
    }

    // Add some external reviews for demo
    // First check if integration exists, if not create a dummy one
    const { data: existingIntegrations } = await supabase
      .from('organization_integrations')
      .select('id, platform')
      .eq('organization_id', orgId);

    // Create demo integrations if none exist
    if (!existingIntegrations || existingIntegrations.length === 0) {
      const { data: newIntegrations } = await supabase
        .from('organization_integrations')
        .insert([
          {
            organization_id: orgId,
            platform: 'google',
            platform_account_name: 'Google Business Profile',
            platform_url: 'https://business.google.com',
            last_synced_at: new Date().toISOString(),
            sync_enabled: true,
          },
          {
            organization_id: orgId,
            platform: 'yelp',
            platform_account_name: 'Yelp Business',
            platform_url: 'https://yelp.com',
            last_synced_at: new Date().toISOString(),
            sync_enabled: true,
          },
        ])
        .select('id, platform');

      if (newIntegrations) {
        const externalReviews = generateExternalReviews(orgId, newIntegrations);
        await supabase.from('external_reviews').insert(externalReviews);
      }
    }

    return NextResponse.json({
      success: true,
      seeded: {
        reviews: reviewData.length,
        requests: requestData.length,
        activities: activityData.length,
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000 + Math.random() * 12 * 60 * 60 * 1000).toISOString();
}

function generateReviews(orgId: string) {
  const positiveComments = [
    { name: 'Emma W.', comment: 'Absolutely love this place! The team is so professional and friendly. Will be coming back for sure.', rating: 5 },
    { name: 'James K.', comment: 'Incredible experience from start to finish. Can\'t recommend highly enough!', rating: 5 },
    { name: 'Sarah L.', comment: 'Best in the area, hands down. The attention to detail is amazing.', rating: 5 },
    { name: 'Michael R.', comment: 'Great service and wonderful atmosphere. Exceeded my expectations.', rating: 5 },
    { name: 'Lisa M.', comment: 'So impressed with the quality. Definitely my new go-to spot!', rating: 5 },
    { name: 'Chris B.', comment: 'Outstanding! Every single visit has been fantastic.', rating: 5 },
    { name: 'Rachel F.', comment: 'They genuinely care about their customers. You can feel it in everything they do.', rating: 5 },
    { name: 'Alex T.', comment: 'Just moved to the area and this is already my favorite. The team made me feel so welcome.', rating: 5 },
    { name: 'Nina G.', comment: 'Friendly staff, great quality, fair prices. What more could you ask for?', rating: 4 },
    { name: 'Dave P.', comment: 'Solid experience every time. Consistently good quality.', rating: 4 },
    { name: 'Jessica H.', comment: 'Really enjoyed my visit. The staff went above and beyond.', rating: 5 },
    { name: 'Tom R.', comment: 'Great location and even better service. Highly recommend!', rating: 5 },
    { name: 'Amanda B.', comment: 'Such a pleasant experience. I\'ve already told all my friends about it.', rating: 5 },
    { name: 'Ryan C.', comment: 'Pleasantly surprised by the quality. Will definitely return.', rating: 4 },
    { name: 'Megan S.', comment: 'Love the atmosphere and the people. Makes every visit special.', rating: 5 },
    { name: 'Daniel K.', comment: 'Top-notch service. They really know what they\'re doing.', rating: 5 },
    { name: 'Sophie W.', comment: 'Can\'t say enough good things. An absolute gem!', rating: 5 },
    { name: 'Marcus J.', comment: 'Went in not knowing what to expect and was blown away. 10/10.', rating: 5 },
    { name: 'Emily D.', comment: 'The best experience I\'ve had in a long time. So professional!', rating: 5 },
    { name: 'Tyler M.', comment: 'Always consistent, always great. That\'s what keeps me coming back.', rating: 4 },
    { name: 'Hannah P.', comment: 'Wonderful team. They make you feel like family.', rating: 5 },
    { name: 'Josh L.', comment: 'Super impressed. The quality speaks for itself.', rating: 5 },
    { name: 'Olivia R.', comment: 'Hands down the best in town. Don\'t go anywhere else!', rating: 5 },
    { name: 'Ben W.', comment: 'Perfect experience. Wouldn\'t change a thing.', rating: 5 },
    { name: 'Chloe A.', comment: 'My expectations were high and they still exceeded them. Bravo!', rating: 5 },
    { name: 'Matt H.', comment: 'Good overall. Nice atmosphere and decent service.', rating: 4 },
    { name: 'Lauren T.', comment: 'Really happy with my experience. Great value for money.', rating: 4 },
    { name: 'Kevin O.', comment: 'Solid work. Would recommend to friends and family.', rating: 4 },
    { name: 'Natalie F.', comment: 'Everything was perfect! Already booked my next visit.', rating: 5 },
    { name: 'Brandon S.', comment: 'The quality here is unmatched. Keep up the amazing work!', rating: 5 },
    { name: 'Grace M.', comment: 'So glad I found this place. It\'s become a regular for me now.', rating: 5 },
    { name: 'Andrew C.', comment: 'Five stars isn\'t enough. Absolutely phenomenal service.', rating: 5 },
    { name: 'Victoria L.', comment: 'Love it! The whole experience was smooth and enjoyable.', rating: 5 },
    { name: 'Sam N.', comment: 'They really go the extra mile. You can tell they\'re passionate about what they do.', rating: 5 },
    { name: 'Paige R.', comment: 'Just had my third visit and it keeps getting better. Love this place!', rating: 5 },
    { name: 'Derek B.', comment: 'Good quality and reasonable prices. Nice clean environment too.', rating: 4 },
    { name: 'Zoe K.', comment: 'Made my day! The staff are so warm and welcoming.', rating: 5 },
    { name: 'Lucas W.', comment: 'First time here and I\'m already a fan. Incredible experience.', rating: 5 },
    { name: 'Aria J.', comment: 'The attention to detail here is next level. Very impressed!', rating: 5 },
    { name: 'Ethan G.', comment: 'Consistent quality every time I visit. Never disappoints.', rating: 4 },
    { name: 'Isabella D.', comment: 'Truly exceptional. I left with a huge smile on my face!', rating: 5 },
    { name: 'Noah P.', comment: 'Great spot! Friendly team and fantastic results.', rating: 5 },
    { name: 'Lily H.', comment: 'Worth every penny. The experience was absolutely wonderful.', rating: 5 },
    { name: 'Jack S.', comment: 'Highly recommend to anyone looking for quality service.', rating: 5 },
    { name: 'Ella M.', comment: 'SO good! I can\'t wait to come back. Thank you for an amazing experience!', rating: 5 },
    { name: 'Owen T.', comment: 'Really happy with the results. Will be a regular customer for sure.', rating: 4 },
    { name: 'Ruby C.', comment: 'Blown away by the professionalism. Everyone here clearly loves what they do.', rating: 5 },
    { name: 'Mason F.', comment: 'Exceeded all my expectations. Simply the best!', rating: 5 },
  ];

  const negativeComments = [
    { name: 'Tom H.', comment: 'Wait time was way too long. Over 25 minutes for a simple service.', rating: 2 },
    { name: 'Karen S.', comment: 'Disappointing experience today. The quality was below what I\'d expect.', rating: 1 },
    { name: 'Pat O.', comment: 'Just okay. Nothing special and the staff seemed disinterested.', rating: 3 },
    { name: 'Mike B.', comment: 'Had to wait forever and then the result wasn\'t even what I asked for.', rating: 2 },
    { name: 'Sandra D.', comment: 'Not great. I\'ve had much better experiences elsewhere.', rating: 2 },
    { name: 'Gary F.', comment: 'Overpriced for what you get. Won\'t be returning.', rating: 2 },
    { name: 'Diana N.', comment: 'The place was dirty and the staff were rude. Very disappointing.', rating: 1 },
    { name: 'Steve W.', comment: 'Average at best. Nothing to write home about.', rating: 3 },
    { name: 'Janet R.', comment: 'Had a bad experience with one staff member. Otherwise okay.', rating: 3 },
    { name: 'Larry G.', comment: 'They cancelled my appointment last minute. Very frustrating.', rating: 1 },
    { name: 'Carol L.', comment: 'Not what I was hoping for. The quality has gone downhill.', rating: 2 },
    { name: 'Mark T.', comment: 'Mediocre. Expected more based on the reviews I read online.', rating: 3 },
  ];

  const reviews = [];
  const platforms = ['google', 'yelp', 'facebook'];

  // Spread reviews over 60 days, weighted towards recent
  for (let i = 0; i < positiveComments.length; i++) {
    const r = positiveComments[i];
    const day = Math.floor(Math.pow(Math.random(), 1.5) * 60); // Weighted toward recent
    const redirected = r.rating >= 4 ? [platforms[Math.floor(Math.random() * platforms.length)]] : [];
    reviews.push({
      organization_id: orgId,
      rating: r.rating,
      comment: r.comment,
      customer_name: r.name,
      customer_email: Math.random() > 0.5 ? `${r.name.split(' ')[0].toLowerCase()}@example.com` : null,
      is_positive: true,
      is_public: Math.random() > 0.15, // 85% made public
      redirected_to: redirected,
      responded: Math.random() > 0.7,
      response_notes: Math.random() > 0.8 ? 'Thanked the customer for their kind words!' : null,
      created_at: daysAgo(day),
    });
  }

  for (let i = 0; i < negativeComments.length; i++) {
    const r = negativeComments[i];
    const day = Math.floor(Math.pow(Math.random(), 1.5) * 60);
    reviews.push({
      organization_id: orgId,
      rating: r.rating,
      comment: r.comment,
      customer_name: r.name,
      customer_email: Math.random() > 0.3 ? `${r.name.split(' ')[0].toLowerCase()}@example.com` : null,
      customer_phone: Math.random() > 0.5 ? `+1555${String(Math.floor(Math.random() * 9000000) + 1000000)}` : null,
      is_positive: false,
      is_public: false,
      redirected_to: [],
      responded: Math.random() > 0.4,
      response_notes: Math.random() > 0.5 ? 'Reached out to customer. Offered a complimentary visit to make things right.' : null,
      created_at: daysAgo(day),
    });
  }

  return reviews;
}

function generateRequests(orgId: string) {
  const names = [
    'Emma W.', 'James K.', 'Sarah L.', 'Michael R.', 'Lisa M.', 'Chris B.',
    'Rachel F.', 'Alex T.', 'Nina G.', 'Dave P.', 'Jessica H.', 'Tom R.',
    'Amanda B.', 'Ryan C.', 'Megan S.', 'Daniel K.', 'Sophie W.', 'Marcus J.',
    'Emily D.', 'Tyler M.', 'Hannah P.', 'Josh L.', 'Olivia R.', 'Ben W.',
    'Chloe A.', 'Matt H.', 'Lauren T.', 'Kevin O.', 'Natalie F.', 'Brandon S.',
    'Grace M.', 'Andrew C.', 'Victoria L.', 'Sam N.', 'Paige R.', 'Derek B.',
    'Zoe K.', 'Lucas W.', 'Aria J.', 'Ethan G.', 'Isabella D.', 'Noah P.',
    'Tom H.', 'Karen S.', 'Pat O.', 'Mike B.', 'Sandra D.', 'Gary F.',
  ];

  const requests = [];
  for (let i = 0; i < names.length; i++) {
    const day = Math.floor(Math.pow(Math.random(), 1.5) * 60);
    const status = Math.random() > 0.15 ? 'completed' : (Math.random() > 0.5 ? 'sent' : 'expired');
    const useEmail = Math.random() > 0.4;
    requests.push({
      organization_id: orgId,
      customer_phone: useEmail ? null : `+1555${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
      customer_email: useEmail ? `${names[i].split(' ')[0].toLowerCase()}${Math.floor(Math.random() * 100)}@example.com` : null,
      customer_name: names[i],
      contact_method: useEmail ? 'email' : 'sms',
      status,
      sent_at: daysAgo(day),
      created_at: daysAgo(day),
    });
  }

  return requests;
}

function generateActivity(orgId: string) {
  const activities = [];
  for (let day = 0; day < 60; day += 1 + Math.floor(Math.random() * 2)) {
    activities.push({
      organization_id: orgId,
      action: 'review_request_sent',
      entity_type: 'review_request',
      details: { customerName: `Customer ${day}` },
      created_at: daysAgo(day),
    });

    if (Math.random() > 0.3) {
      const rating = Math.random() > 0.2 ? (Math.random() > 0.3 ? 5 : 4) : Math.floor(Math.random() * 3) + 1;
      activities.push({
        organization_id: orgId,
        action: rating >= 4 ? 'positive_review_received' : 'negative_review_received',
        entity_type: 'review',
        details: { rating, hasComment: true },
        created_at: daysAgo(day),
      });
    }
  }

  return activities;
}

function generateExternalReviews(
  orgId: string,
  integrations: { id: string; platform: string }[]
) {
  const googleIntegration = integrations.find(i => i.platform === 'google');
  const yelpIntegration = integrations.find(i => i.platform === 'yelp');

  const reviews = [];

  // Google reviews
  if (googleIntegration) {
    const googleReviews = [
      { name: 'John D.', rating: 5, comment: 'Fantastic service! Highly recommend to everyone.', days: 2 },
      { name: 'Amy L.', rating: 5, comment: 'Best experience I\'ve had. The team is wonderful.', days: 5 },
      { name: 'Robert M.', rating: 4, comment: 'Great place, good service. A little wait but worth it.', days: 8 },
      { name: 'Michelle K.', rating: 5, comment: 'They went above and beyond for me. Amazing!', days: 12 },
      { name: 'David S.', rating: 3, comment: 'Decent but nothing extraordinary. Could improve the wait times.', days: 15 },
      { name: 'Jennifer W.', rating: 5, comment: 'Absolutely love this place! Five stars all the way.', days: 18 },
      { name: 'Christopher H.', rating: 4, comment: 'Solid service and friendly staff. Would come back.', days: 22 },
      { name: 'Ashley P.', rating: 5, comment: 'Perfect! Everything was exactly what I needed.', days: 25 },
      { name: 'Brian T.', rating: 5, comment: 'Can\'t say enough good things. This place is a gem.', days: 30 },
      { name: 'Laura G.', rating: 4, comment: 'Really good experience overall. Minor issues but nothing major.', days: 35 },
      { name: 'Kevin R.', rating: 5, comment: 'Exceeded my expectations in every way. Will be back!', days: 38 },
      { name: 'Stephanie B.', rating: 2, comment: 'Was disappointed this time. Usually great but today was off.', days: 40 },
      { name: 'Anthony J.', rating: 5, comment: 'The best in the area. Period. Don\'t bother looking elsewhere.', days: 42 },
      { name: 'Nicole F.', rating: 5, comment: 'Wonderful from start to finish. Thank you!', days: 45 },
      { name: 'Matthew C.', rating: 4, comment: 'Good quality, fair price. Happy customer here.', days: 48 },
    ];

    for (const r of googleReviews) {
      reviews.push({
        organization_id: orgId,
        integration_id: googleIntegration.id,
        platform: 'google',
        platform_review_id: `google_${r.name.replace(/[^a-z]/gi, '')}_${r.days}`,
        rating: r.rating,
        comment: r.comment,
        reviewer_name: r.name,
        review_date: daysAgo(r.days),
        reply_text: r.rating >= 4 && Math.random() > 0.5 ? 'Thank you so much for your kind words! We look forward to seeing you again.' : null,
        replied_at: r.rating >= 4 && Math.random() > 0.5 ? daysAgo(r.days - 1) : null,
        raw_data: {},
      });
    }
  }

  // Yelp reviews
  if (yelpIntegration) {
    const yelpReviews = [
      { name: 'Patricia A.', rating: 5, comment: 'This place has become my absolute favorite. The quality is consistently outstanding!', days: 3 },
      { name: 'George W.', rating: 4, comment: 'Great experience. Clean, professional, and reasonably priced.', days: 10 },
      { name: 'Susan M.', rating: 5, comment: 'If I could give 6 stars I would! Absolutely phenomenal.', days: 17 },
      { name: 'Thomas B.', rating: 3, comment: 'It was fine. Not bad, not amazing. Just average.', days: 24 },
      { name: 'Linda K.', rating: 5, comment: 'The team here truly cares about every single customer. Love it!', days: 30 },
      { name: 'Richard H.', rating: 5, comment: 'Outstanding quality and service. Will definitely be recommending.', days: 36 },
      { name: 'Barbara C.', rating: 4, comment: 'Very happy with my experience. The staff are lovely.', days: 42 },
      { name: 'William T.', rating: 5, comment: 'Best kept secret in town! Everyone needs to try this place.', days: 50 },
    ];

    for (const r of yelpReviews) {
      reviews.push({
        organization_id: orgId,
        integration_id: yelpIntegration.id,
        platform: 'yelp',
        platform_review_id: `yelp_${r.name.replace(/[^a-z]/gi, '')}_${r.days}`,
        rating: r.rating,
        comment: r.comment,
        reviewer_name: r.name,
        review_date: daysAgo(r.days),
        reply_text: null,
        replied_at: null,
        raw_data: {},
      });
    }
  }

  return reviews;
}
