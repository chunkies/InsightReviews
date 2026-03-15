import { Box, Container, Typography, Button, Divider } from '@mui/material';
import { ArrowRight, Star, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How to Deal With Negative Google Reviews (Without Losing Customers)',
  description: 'A practical guide for Australian local businesses on how to respond to negative Google reviews, turn bad feedback into loyal customers, and prevent public complaints with smart review routing.',
  keywords: ['negative Google reviews', 'respond to bad reviews', 'deal with negative reviews Australia', 'handle bad Google reviews', 'fake Google reviews', 'review management local business', 'negative review response template'],
  alternates: {
    canonical: 'https://insightreviews.com.au/blog/negative-google-reviews',
  },
  openGraph: {
    title: 'How to Deal With Negative Google Reviews (Without Losing Customers)',
    description: 'Practical strategies for local businesses to respond to bad reviews, recover unhappy customers, and protect your Google rating.',
    type: 'article',
    publishedTime: '2026-03-15T00:00:00Z',
    authors: ['Tristan'],
  },
};

export default function BlogPost() {
  return (
    <Box sx={{ backgroundColor: 'white', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: '7px', background: 'linear-gradient(135deg, #1565c0, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Star size={16} color="#fff" fill="#fff" />
              </Box>
              <Typography variant="body1" fontWeight={800} color="primary" component="a" href="/" sx={{ textDecoration: 'none' }}>
                InsightReviews
              </Typography>
            </Box>
            <Button href="/auth/login?mode=signup" variant="contained" size="small" sx={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              Start Free Trial
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Article */}
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Button href="/" startIcon={<ArrowLeft size={16} />} sx={{ mb: 3, color: 'text.secondary' }}>
          Back to InsightReviews
        </Button>

        <Typography variant="overline" sx={{ color: '#2563eb', fontWeight: 700, letterSpacing: 2 }}>
          Guide
        </Typography>
        <Typography variant="h3" fontWeight={900} sx={{ mb: 2, fontSize: { xs: '1.8rem', md: '2.4rem' }, lineHeight: 1.2 }}>
          How to Deal With Negative Google Reviews (Without Losing Customers)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          By Tristan &middot; March 2026 &middot; 8 min read
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Box sx={{ '& p': { mb: 2.5, lineHeight: 1.8, color: '#334155', fontSize: '1.05rem' }, '& h2': { mt: 5, mb: 2, fontWeight: 800, fontSize: '1.5rem' }, '& h3': { mt: 4, mb: 1.5, fontWeight: 700, fontSize: '1.2rem' }, '& ul': { pl: 3, mb: 2.5 }, '& li': { mb: 1, lineHeight: 1.7, color: '#334155' } }}>
          <Typography component="p">
            You open Google, search your business name, and there it is: a 1-star review. Your stomach drops. Maybe it&apos;s unfair. Maybe the customer had a point. Either way, it&apos;s sitting there for every potential customer to see.
          </Typography>

          <Typography component="p">
            If you&apos;ve been running a local business long enough &mdash; whether it&apos;s a cafe, a dental clinic, a hair salon, or an auto shop &mdash; you know this feeling. And the instinct is usually one of two things: fire back with a defensive reply, or pretend it doesn&apos;t exist. Both are mistakes.
          </Typography>

          <Typography component="p">
            The reality is that negative reviews aren&apos;t the end of the world. Handled well, they can actually build trust, recover customers, and sometimes even improve your rating. Here&apos;s how to deal with them properly.
          </Typography>

          <Typography variant="h2" component="h2">Why Negative Reviews Happen (It&apos;s Not Always Your Fault)</Typography>

          <Typography component="p">
            Before you take a bad review personally, it helps to understand why they happen. Some of the most common reasons:
          </Typography>

          <Box component="ul">
            <Typography component="li"><strong>Unmet expectations.</strong> The customer expected one thing and got another. Maybe your wait times were longer than usual, or the end result wasn&apos;t what they pictured. This is the most common cause by far.</Typography>
            <Typography component="li"><strong>A genuinely bad experience.</strong> Your staff had an off day. The product wasn&apos;t up to standard. It happens to every business &mdash; not a single one has a perfect record.</Typography>
            <Typography component="li"><strong>Miscommunication.</strong> The customer didn&apos;t understand what was included, how pricing worked, or what the process involved. This is a systems problem, not a people problem.</Typography>
            <Typography component="li"><strong>External factors.</strong> Parking was impossible that day. They were already in a bad mood. The weather was rubbish. You cop the blame for things outside your control more often than you&apos;d think.</Typography>
            <Typography component="li"><strong>Fake or malicious reviews.</strong> A competitor, a disgruntled ex-employee, or someone who never actually visited your business. These do happen, and there are ways to deal with them.</Typography>
          </Box>

          <Typography component="p">
            Understanding the cause helps you craft the right response. A genuine complaint needs empathy. A fake review needs reporting. They&apos;re very different situations.
          </Typography>

          <Typography variant="h2" component="h2">How to Respond to Negative Reviews (The Right Way)</Typography>

          <Typography component="p">
            Your response to a bad review isn&apos;t really for the person who wrote it. It&apos;s for the hundreds of potential customers who&apos;ll read it before deciding whether to visit you. Research from BrightLocal found that <strong>89% of consumers read business responses to reviews</strong>. Your reply is a public audition for their trust.
          </Typography>

          <Typography variant="h3" component="h3">Step 1: Take a breath</Typography>

          <Typography component="p">
            Don&apos;t reply when you&apos;re angry or hurt. Give yourself at least an hour. The review isn&apos;t going anywhere, and a knee-jerk defensive response will do more damage than the review itself.
          </Typography>

          <Typography variant="h3" component="h3">Step 2: Acknowledge the experience</Typography>

          <Typography component="p">
            Start by thanking them for the feedback and acknowledging that their experience wasn&apos;t good enough. You don&apos;t have to agree with everything they said &mdash; just show that you&apos;ve heard them. Something like: &quot;Thanks for letting us know, [name]. I&apos;m sorry your visit didn&apos;t meet expectations.&quot;
          </Typography>

          <Typography variant="h3" component="h3">Step 3: Take it offline</Typography>

          <Typography component="p">
            Don&apos;t get into a back-and-forth on Google. Offer to continue the conversation privately: &quot;I&apos;d love the chance to make this right. Could you give us a call on [number] or send an email to [address]?&quot; This shows you care without airing dirty laundry in public.
          </Typography>

          <Typography variant="h3" component="h3">Step 4: Be specific, not generic</Typography>

          <Typography component="p">
            Nothing screams &quot;I don&apos;t actually care&quot; louder than a copy-paste response. Reference the specific issue they raised. If they complained about wait times, mention what you&apos;re doing about it. If they had a problem with a staff member, say you&apos;ve followed up with the team.
          </Typography>

          <Typography variant="h3" component="h3">Step 5: Keep it short</Typography>

          <Typography component="p">
            Three to five sentences is plenty. Long, rambling responses look defensive. Short, genuine responses look professional.
          </Typography>

          <Typography variant="h2" component="h2">What NOT to Do When Responding</Typography>

          <Typography component="p">
            I reckon we&apos;ve all seen business owners make these mistakes on Google:
          </Typography>

          <Box component="ul">
            <Typography component="li"><strong>Don&apos;t argue.</strong> Even if you&apos;re right, arguing with a customer in public makes you look petty. Future customers will side with the reviewer.</Typography>
            <Typography component="li"><strong>Don&apos;t blame the customer.</strong> &quot;You should have told us at the time&quot; might be true, but it reads terribly. Take the high road.</Typography>
            <Typography component="li"><strong>Don&apos;t reveal personal details.</strong> Mentioning the customer&apos;s appointment details, purchase history, or any private information is a breach of trust and potentially a privacy violation.</Typography>
            <Typography component="li"><strong>Don&apos;t ignore it.</strong> No response at all signals that you don&apos;t care. Even a brief acknowledgment is better than silence.</Typography>
            <Typography component="li"><strong>Don&apos;t offer freebies publicly.</strong> Saying &quot;Come back for a free meal&quot; in a public reply encourages people to leave fake bad reviews for free stuff. Handle compensation privately.</Typography>
          </Box>

          <Typography variant="h2" component="h2">Turning a Negative Into a Positive</Typography>

          <Typography component="p">
            Here&apos;s something most business owners don&apos;t realise: a customer who has a bad experience that gets resolved well often becomes <strong>more loyal</strong> than a customer who never had a problem at all. It&apos;s called the service recovery paradox, and it&apos;s backed by decades of research.
          </Typography>

          <Typography component="p">
            When someone leaves a bad review and you reach out personally &mdash; a phone call, not just an email &mdash; you&apos;d be surprised how often the conversation goes well. Most people aren&apos;t trying to destroy your business. They felt let down and wanted to be heard.
          </Typography>

          <Typography component="p">
            A genuine phone call where you listen, apologise, and offer to fix it will resolve most situations. And about 30-40% of the time, the customer will either update their review to a higher rating or take it down entirely. You won&apos;t win them all, but you&apos;ll win more than you expect.
          </Typography>

          <Typography component="p">
            The key is speed. Reach out within 24 hours. The longer you wait, the more the customer cements their negative view of your business.
          </Typography>

          <Typography variant="h2" component="h2">When to Report or Flag a Review</Typography>

          <Typography component="p">
            Not every bad review is legitimate. Google does have policies, and reviews that violate them can be removed. You can flag a review for removal if it:
          </Typography>

          <Box component="ul">
            <Typography component="li"><strong>Is from someone who was never a customer.</strong> Competitor sabotage and revenge reviews from people you&apos;ve never served are against Google&apos;s policies.</Typography>
            <Typography component="li"><strong>Contains hate speech, threats, or personal attacks.</strong> Google removes content that&apos;s abusive or discriminatory.</Typography>
            <Typography component="li"><strong>Is clearly spam or fake.</strong> Generic text, reviewer has no other reviews, or reviews multiple businesses in the same area on the same day.</Typography>
            <Typography component="li"><strong>Describes an experience at the wrong business.</strong> More common than you&apos;d think &mdash; people accidentally review the wrong location.</Typography>
          </Box>

          <Typography component="p">
            To flag a review, go to your Google Business Profile, find the review, click the three dots, and select &quot;Report review.&quot; Be honest: Google won&apos;t remove a review just because it&apos;s negative. It has to actually violate their policies.
          </Typography>

          <Typography component="p">
            If Google doesn&apos;t remove it on the first attempt, you can escalate through Google Business support or, in Australia, through the ACCC if the review constitutes misleading conduct. But this is a last resort &mdash; for most businesses, the better strategy is to bury bad reviews under a steady stream of genuine positive ones.
          </Typography>

          <Typography variant="h2" component="h2">The Best Defence: Catching Negative Feedback Before It Goes Public</Typography>

          <Typography component="p">
            Here&apos;s the thing about most negative Google reviews: the customer didn&apos;t plan to leave one when they walked through your door. Something went wrong, they left feeling unhappy, and at some point later that day &mdash; sitting at home, stewing on it &mdash; they opened Google and let rip.
          </Typography>

          <Typography component="p">
            What if you&apos;d caught that feedback first?
          </Typography>

          <Typography component="p">
            The smartest approach is to ask every customer for feedback immediately after their visit &mdash; but route them differently based on their response. A customer who rates you 4 or 5 stars gets directed to Google to share their experience publicly. A customer who rates you 1, 2, or 3 stars gets their feedback captured privately, giving you the chance to reach out and fix things before they ever think about posting on Google.
          </Typography>

          <Typography component="p">
            This isn&apos;t about hiding negative feedback. It&apos;s about giving unhappy customers a better channel. Most of them would rather talk to you directly than post a public complaint &mdash; they just need to be given that option at the right moment.
          </Typography>

          <Typography component="p">
            Businesses that use this kind of smart routing typically see their Google rating climb within weeks, because they&apos;re increasing the flow of genuine positive reviews while catching problems privately.
          </Typography>

          <Typography variant="h2" component="h2">Building a Review Culture That Protects Your Rating</Typography>

          <Typography component="p">
            Beyond handling individual bad reviews, there are some habits that protect your rating long-term:
          </Typography>

          <Box component="ul">
            <Typography component="li"><strong>Volume matters.</strong> One bad review out of 200 barely dents your rating. One bad review out of 10 is devastating. Collecting reviews consistently is the single best insurance policy against the occasional bad one.</Typography>
            <Typography component="li"><strong>Ask everyone, not just happy customers.</strong> If you only ask people you think will leave 5 stars, you&apos;re not getting real feedback, and you&apos;re missing the chance to intercept problems.</Typography>
            <Typography component="li"><strong>Close the loop.</strong> When you follow up on negative feedback and fix the issue, let the customer know. &quot;We&apos;ve changed X because of your feedback&quot; is one of the most powerful things you can say.</Typography>
            <Typography component="li"><strong>Monitor regularly.</strong> Check your Google reviews at least weekly. The faster you respond to a negative review, the less damage it does.</Typography>
            <Typography component="li"><strong>Train your team.</strong> Make sure every staff member knows that review collection is part of the job, and that they should escalate customer complaints immediately rather than hoping they go away.</Typography>
          </Box>

          <Typography variant="h2" component="h2">The Bottom Line</Typography>

          <Typography component="p">
            Negative reviews are part of running a business. Every single business gets them &mdash; and a profile with nothing but 5-star reviews actually looks suspicious to consumers. A few honest negative reviews with thoughtful responses can build more trust than a perfect score.
          </Typography>

          <Typography component="p">
            The businesses that win aren&apos;t the ones that never get bad reviews. They&apos;re the ones that respond well, follow up fast, and have a system for catching problems before they go public. Get those three things right, and your Google rating will take care of itself.
          </Typography>

          <Divider sx={{ my: 5 }} />

          <Box sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              Stop negative reviews before they hit Google
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
              InsightReviews sends your customers a quick feedback request via SMS or QR code. Happy customers get routed to Google. Unhappy customers get captured privately so you can follow up and fix it. $79/mo with a 14-day free trial.
            </Typography>
            <Button
              href="/auth/login?mode=signup"
              variant="contained"
              endIcon={<ArrowRight size={16} />}
              sx={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
            >
              Start Free 14-Day Trial
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
