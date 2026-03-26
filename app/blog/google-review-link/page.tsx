import { Box, Container, Typography, Button, Divider, Alert } from '@mui/material';
import { ArrowRight, Star, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How to Get Your Google Review Link (2026) — Direct Link Generator Guide',
  description: 'Step-by-step guide to find your Google review link for your business. Share your direct Google review URL via SMS, email, QR code, or your website to get more 5-star reviews.',
  keywords: ['Google review link', 'Google review URL', 'Google review link generator', 'direct Google review link', 'how to get Google review link', 'share Google review link', 'Google Business Profile review link'],
  alternates: {
    canonical: 'https://insightreviews.com.au/blog/google-review-link',
  },
  openGraph: {
    title: 'How to Get Your Google Review Link — Step-by-Step Guide',
    description: 'Find your direct Google review link in under 2 minutes. Share it via SMS, email, QR codes, or your website to get more reviews.',
    type: 'article',
    publishedTime: '2026-03-21T00:00:00Z',
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
          How to Get Your Google Review Link (2026 Guide)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          By Tristan &middot; March 2026 &middot; 6 min read
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Box sx={{ '& p': { mb: 2.5, lineHeight: 1.8, color: '#334155', fontSize: '1.05rem' }, '& h2': { mt: 5, mb: 2, fontWeight: 800, fontSize: '1.5rem' }, '& h3': { mt: 4, mb: 1.5, fontWeight: 700, fontSize: '1.2rem' }, '& ul, & ol': { pl: 3, mb: 2.5 }, '& li': { mb: 1, lineHeight: 1.7, color: '#334155' } }}>
          <Typography component="p">
            Your Google review link is the direct URL that takes customers straight to the &quot;Write a Review&quot; popup for your business on Google. Instead of asking customers to search for your business, find it on Google Maps, and figure out where the review button is — you just send them one link and they&apos;re there.
          </Typography>

          <Typography component="p">
            This guide covers three ways to find your link, plus how to use it effectively to get more reviews.
          </Typography>

          <Typography variant="h2" component="h2">Method 1: Google Business Profile Dashboard (Easiest)</Typography>

          <Typography component="p">
            Google actually gives you a shareable review link right in your dashboard. Here&apos;s how to find it:
          </Typography>

          <Box component="ol">
            <li><Typography component="span">Go to <strong>business.google.com</strong> and sign in with the Google account that manages your business.</Typography></li>
            <li><Typography component="span">Click on your business listing.</Typography></li>
            <li><Typography component="span">In the left menu, click <strong>&quot;Home&quot;</strong>.</Typography></li>
            <li><Typography component="span">Look for the <strong>&quot;Get more reviews&quot;</strong> card — it has a short link you can copy.</Typography></li>
            <li><Typography component="span">Click <strong>&quot;Share review form&quot;</strong> to copy the link.</Typography></li>
          </Box>

          <Typography component="p">
            The link will look something like: <code>https://g.page/r/CxxxxxxxxEBE/review</code>
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            If you don&apos;t see the &quot;Get more reviews&quot; card, scroll down or check the &quot;Ask for reviews&quot; section in your dashboard. Google occasionally moves this around.
          </Alert>

          <Typography variant="h2" component="h2">Method 2: Google Maps Search (No Dashboard Access Needed)</Typography>

          <Typography component="p">
            If you don&apos;t have access to the Google Business Profile dashboard, you can build your review link from a Google Maps search:
          </Typography>

          <Box component="ol">
            <li><Typography component="span">Search for your business on <strong>Google Maps</strong>.</Typography></li>
            <li><Typography component="span">Click on your business listing in the results.</Typography></li>
            <li><Typography component="span">Look at the URL in your browser&apos;s address bar — you&apos;ll see something like: <code>google.com/maps/place/Your+Business+Name/@...</code></Typography></li>
            <li><Typography component="span">Find the <strong>Place ID</strong> in the URL. It&apos;s the long code that starts with <code>0x</code> or look for a <code>CID</code> parameter.</Typography></li>
            <li><Typography component="span">Your review link is: <code>https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID</code></Typography></li>
          </Box>

          <Typography variant="h2" component="h2">Method 3: Google Place ID Finder</Typography>

          <Typography component="p">
            Google has an official Place ID Finder tool that makes this straightforward:
          </Typography>

          <Box component="ol">
            <li><Typography component="span">Go to Google&apos;s <strong>Place ID Finder</strong> (search &quot;Google Place ID Finder&quot; — it&apos;s in the Google Maps Platform docs).</Typography></li>
            <li><Typography component="span">Type your business name and location in the search box.</Typography></li>
            <li><Typography component="span">Click your business when it appears. The <strong>Place ID</strong> will show below the map.</Typography></li>
            <li><Typography component="span">Copy the Place ID and paste it into this URL format:</Typography></li>
          </Box>

          <Box sx={{ backgroundColor: '#f8fafc', border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, mb: 3, fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all' }}>
            https://search.google.com/local/writereview?placeid=<strong>ChIJxxxxxxxxxxxxxxxxx</strong>
          </Box>

          <Typography component="p">
            Replace the bold part with your actual Place ID. When someone clicks this link, it opens the Google review popup directly — no searching needed.
          </Typography>

          <Typography variant="h2" component="h2">How to Share Your Google Review Link</Typography>

          <Typography component="p">
            Once you have your link, here are the most effective ways to use it:
          </Typography>

          <Typography variant="h3" component="h3">1. SMS After a Visit</Typography>

          <Typography component="p">
            SMS has a 95% open rate compared to 20% for email. Send a text within an hour of the customer&apos;s visit:
          </Typography>

          <Box sx={{ backgroundColor: '#f8fafc', border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5, mb: 3, fontStyle: 'italic' }}>
            &quot;Thanks for visiting [Business Name] today! If you had a great experience, we&apos;d really appreciate a quick Google review: [link]. It means a lot to us!&quot;
          </Box>

          <Typography variant="h3" component="h3">2. QR Code at the Counter</Typography>

          <Typography component="p">
            Turn your review link into a QR code and print it. Place it at the counter, on tables, on receipts, or next to the EFTPOS machine. Customers scan with their phone camera — no app needed.
          </Typography>

          <Typography component="p">
            Free QR code generators are everywhere. Just paste your Google review link and download the QR code image.
          </Typography>

          <Typography variant="h3" component="h3">3. Email Signature</Typography>

          <Typography component="p">
            Add a line to your email signature: &quot;Enjoyed our service? <strong>Leave us a Google review</strong>&quot; — with a hyperlink to your review URL. Every email you send becomes a passive review request.
          </Typography>

          <Typography variant="h3" component="h3">4. On Your Website</Typography>

          <Typography component="p">
            Add a &quot;Leave a Review&quot; button on your website that links to your Google review URL. Put it on your homepage, contact page, or a dedicated reviews page.
          </Typography>

          <Typography variant="h3" component="h3">5. Printed Materials</Typography>

          <Typography component="p">
            Business cards, flyers, receipts, in-store signage — anywhere you interact with customers. Include the QR code and a short line: &quot;Love what we do? Tell Google!&quot;
          </Typography>

          <Typography variant="h2" component="h2">The Problem With Just Sharing Your Google Link</Typography>

          <Typography component="p">
            Here&apos;s the thing: sharing your Google review link works for happy customers. But what about unhappy ones? If you send <strong>everyone</strong> to Google, the occasional 1-star review goes straight to your public profile with no warning.
          </Typography>

          <Typography component="p">
            One bad review can undo the work of 10-20 good ones. It takes roughly 20 five-star reviews to offset a single 1-star review in your average rating.
          </Typography>

          <Typography component="p">
            That&apos;s where <strong>smart review routing</strong> comes in. Instead of sending everyone to Google, you first ask for a star rating:
          </Typography>

          <Box component="ul">
            <li><Typography component="span"><strong>4-5 stars:</strong> Customer gets directed to your Google review page to post publicly.</Typography></li>
            <li><Typography component="span"><strong>1-3 stars:</strong> Feedback stays private. You get an alert so you can follow up before anything goes public.</Typography></li>
          </Box>

          <Typography component="p">
            This isn&apos;t review gating — every customer <em>can</em> still leave a Google review if they want to. You&apos;re just making it easier for happy customers and giving unhappy customers a better channel to be heard.
          </Typography>

          <Typography variant="h2" component="h2">Quick Summary</Typography>

          <Box component="ul">
            <li><Typography component="span"><strong>Fastest way to get your link:</strong> Google Business Profile dashboard → &quot;Get more reviews&quot; → copy link.</Typography></li>
            <li><Typography component="span"><strong>Best way to share it:</strong> SMS after a visit (95% open rate) or QR code at the counter.</Typography></li>
            <li><Typography component="span"><strong>Biggest risk:</strong> Sending unhappy customers directly to Google where they&apos;ll leave a public 1-star review.</Typography></li>
            <li><Typography component="span"><strong>Smart approach:</strong> Use a review collection tool with smart routing — positive reviews go public, negative ones stay private.</Typography></li>
          </Box>

          {/* CTA */}
          <Box
            sx={{
              mt: 6,
              p: { xs: 3, md: 4 },
              borderRadius: 3,
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              border: '1px solid #bfdbfe',
              textAlign: 'center',
            }}
          >
            <Typography variant="h5" fontWeight={800} sx={{ mb: 1.5 }}>
              Want Smart Review Routing for Your Business?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 480, mx: 'auto' }}>
              InsightReviews handles the whole flow — QR code, SMS requests, star rating, and smart routing to Google. Happy customers go to Google, unhappy ones stay private. $49/mo, 14-day free trial.
            </Typography>
            <Button
              href="/auth/login?mode=signup"
              variant="contained"
              size="large"
              endIcon={<ArrowRight size={18} />}
              sx={{
                py: 1.5,
                px: 4,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                '&:hover': { boxShadow: '0 6px 20px rgba(37,99,235,0.4)' },
              }}
            >
              Start Free 14-Day Trial
            </Button>
          </Box>
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', py: 3, mt: 4 }}>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              &copy; {new Date().getFullYear()} InsightReviews. Melbourne, Australia.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="body2" color="text.secondary" component="a" href="/blog/get-more-google-reviews" sx={{ textDecoration: 'none', '&:hover': { color: '#2563eb' } }}>
                Get More Google Reviews
              </Typography>
              <Typography variant="body2" color="text.secondary" component="a" href="/blog/negative-google-reviews" sx={{ textDecoration: 'none', '&:hover': { color: '#2563eb' } }}>
                Dealing With Negative Reviews
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
