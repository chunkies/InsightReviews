import { Box, Container, Typography, Button, Divider } from '@mui/material';
import { ArrowRight, Star, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How to Get More Google Reviews for Your Local Business (2026 Guide)',
  description: 'Practical strategies to get more 5-star Google reviews for cafes, salons, dentists, gyms, and local businesses in Australia. QR codes, SMS requests, smart routing — no fake reviews.',
  keywords: ['get more Google reviews', 'Google review strategies', 'local business reviews Australia', 'QR code reviews', 'review collection tips', 'how to ask for reviews'],
  alternates: {
    canonical: 'https://insightreviews.com.au/blog/get-more-google-reviews',
  },
  openGraph: {
    title: 'How to Get More Google Reviews for Your Local Business',
    description: 'Practical strategies to get more 5-star Google reviews. QR codes, SMS requests, smart routing — no fake reviews, no gating.',
    type: 'article',
    publishedTime: '2026-03-10T00:00:00Z',
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
          How to Get More Google Reviews for Your Local Business (2026 Guide)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          By Tristan &middot; March 2026 &middot; 8 min read
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Box sx={{ '& p': { mb: 2.5, lineHeight: 1.8, color: '#334155', fontSize: '1.05rem' }, '& h2': { mt: 5, mb: 2, fontWeight: 800, fontSize: '1.5rem' }, '& h3': { mt: 4, mb: 1.5, fontWeight: 700, fontSize: '1.2rem' }, '& ul': { pl: 3, mb: 2.5 }, '& li': { mb: 1, lineHeight: 1.7, color: '#334155' } }}>
          <Typography component="p">
            If you run a local business — a cafe, salon, dental clinic, gym, mechanic — your Google rating is one of the most important numbers in your business. A Harvard Business School study found that a <strong>0.5-star increase on review platforms drives 5-9% more revenue</strong>. For a business doing $30,000 a month, that&apos;s $1,500-2,700 per month.
          </Typography>

          <Typography component="p">
            The problem? Most happy customers never think to leave a review. It&apos;s the unhappy ones who are motivated to post. So your Google rating ends up skewed by a vocal minority who had a bad day.
          </Typography>

          <Typography component="p">
            Here&apos;s how to fix that — with practical strategies that work in 2026.
          </Typography>

          <Typography variant="h2" component="h2">1. Put a QR Code at the Counter</Typography>

          <Typography component="p">
            This is the single highest-ROI thing you can do. Print a QR code that links to your Google review page (or a review collection tool). Place it at the counter, on tables, on receipts, next to the EFTPOS machine.
          </Typography>

          <Typography component="p">
            Customers scan with their phone camera — no app download, no login. They&apos;re already standing there after a positive experience. Make it effortless.
          </Typography>

          <Typography component="p">
            <strong>Pro tip:</strong> Don&apos;t just link to Google. Use a review collection page that asks for a star rating first. If they&apos;re happy (4-5 stars), direct them to Google. If they&apos;re not (1-3 stars), capture the feedback privately so you can follow up. This is called <strong>smart routing</strong> and it&apos;s how the best-reviewed businesses manage their online reputation.
          </Typography>

          <Typography variant="h2" component="h2">2. Ask via SMS After the Visit</Typography>

          <Typography component="p">
            SMS has a 95% open rate compared to 20% for email. After a customer visits, send a short text: &quot;Thanks for visiting! We&apos;d love your feedback: [link]&quot;. Keep it personal and brief.
          </Typography>

          <Typography component="p">
            The key is timing — send the SMS within a few hours of the visit, while the experience is fresh. An automated system where your staff enters the phone number and the message goes out immediately is ideal.
          </Typography>

          <Typography variant="h2" component="h2">3. Make It Part of the Workflow</Typography>

          <Typography component="p">
            The businesses that consistently get reviews are the ones where it&apos;s built into the daily routine. It&apos;s not a &quot;sometimes&quot; thing — it&apos;s an &quot;every customer&quot; thing.
          </Typography>

          <Typography component="p">
            Train your staff: after every transaction, either point to the QR code or ask &quot;Would you mind leaving us a quick review? It really helps.&quot; Some businesses gamify it — a leaderboard showing which staff member collected the most reviews this month.
          </Typography>

          <Typography variant="h2" component="h2">4. Respond to Every Review (Yes, Every One)</Typography>

          <Typography component="p">
            Google&apos;s algorithm favours businesses that engage with their reviews. Reply to every positive review with a genuine thank-you. Reply to every negative review with empathy and a concrete offer to make it right.
          </Typography>

          <Typography component="p">
            This does two things: it signals to Google that you&apos;re an active business, and it shows potential customers that you care about the experience.
          </Typography>

          <Typography variant="h2" component="h2">5. Don&apos;t Buy Fake Reviews</Typography>

          <Typography component="p">
            Google is increasingly sophisticated at detecting fake reviews. They&apos;ll remove them and potentially penalise your listing. It&apos;s also illegal under Australian Consumer Law — the ACCC actively prosecutes businesses for fake testimonials.
          </Typography>

          <Typography component="p">
            The honest path is slower but sustainable. Collect reviews consistently from real customers and your rating will improve over time.
          </Typography>

          <Typography variant="h2" component="h2">6. Get Your Google Review Link</Typography>

          <Typography component="p">
            To make it easy for customers, you need your direct Google review link. Here&apos;s how to find it:
          </Typography>

          <Box component="ol" sx={{ pl: 3, mb: 2.5 }}>
            <Typography component="li">Search for your business on Google</Typography>
            <Typography component="li">Click &quot;Write a review&quot; on your Google Business Profile</Typography>
            <Typography component="li">Copy the URL from your browser — that&apos;s your direct review link</Typography>
          </Box>

          <Typography component="p">
            Alternatively, go to your Google Business Profile dashboard and look for the &quot;Get more reviews&quot; section — it will generate a short link you can share.
          </Typography>

          <Typography variant="h2" component="h2">7. Handle Negative Reviews Before They Go Public</Typography>

          <Typography component="p">
            The smartest thing you can do is create a channel for unhappy customers to give you feedback <strong>before</strong> they post on Google. If a customer rates their experience 1-3 stars, don&apos;t send them to Google — capture that feedback privately and reach out to make it right.
          </Typography>

          <Typography component="p">
            Most negative reviews happen because the customer felt unheard. A personal phone call or email after a bad experience can turn a 1-star complaint into a loyal customer — and sometimes even a 5-star review.
          </Typography>

          <Typography variant="h2" component="h2">The Numbers Don&apos;t Lie</Typography>

          <Typography component="p">
            Here&apos;s what the research says:
          </Typography>

          <Box component="ul">
            <Typography component="li"><strong>88%</strong> of consumers trust online reviews as much as personal recommendations</Typography>
            <Typography component="li"><strong>72%</strong> of consumers won&apos;t take action until they&apos;ve read reviews</Typography>
            <Typography component="li"><strong>95%</strong> of SMS messages are opened (vs 20% for email)</Typography>
            <Typography component="li">A <strong>0.5-star increase</strong> = 5-9% more revenue (Harvard Business School)</Typography>
          </Box>

          <Typography component="p">
            If you&apos;re a local business with fewer than 50 Google reviews, or a rating below 4.0 stars, you&apos;re leaving money on the table. The good news is that it&apos;s fixable — and it doesn&apos;t take long. Businesses that consistently collect reviews typically see a noticeable rating shift within 4-6 weeks.
          </Typography>

          <Divider sx={{ my: 5 }} />

          <Box sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              Want to automate all of this?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
              InsightReviews handles QR codes, SMS review requests, smart routing, and negative review interception — all in one tool. Print a QR code, stick it at the counter, and let the reviews roll in. $79/mo with a 14-day free trial.
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
