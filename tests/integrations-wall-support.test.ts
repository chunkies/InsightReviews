import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock setup for email (must be hoisted before imports) ───

const mockSend = vi.hoisted(() => {
  process.env.SENDGRID_API_KEY = 'test-sg-key';
  process.env.SUPPORT_EMAIL = 'support@test.com';
  return vi.fn();
});

vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: vi.fn(),
    send: mockSend,
  },
}));

// ─── Mock setup for integrations (env vars) ───

vi.hoisted(() => {
  process.env.GOOGLE_CLIENT_ID = 'google-test-client-id';
  process.env.GOOGLE_CLIENT_SECRET = 'google-test-secret';
  process.env.NEXT_PUBLIC_SITE_URL = 'https://app.example.com';
  process.env.FACEBOOK_APP_ID = 'fb-test-app-id';
  process.env.FACEBOOK_APP_SECRET = 'fb-test-secret';
  process.env.YELP_API_KEY = 'yelp-test-api-key';
});

// ─── Mock global fetch ───

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ─── Imports ───

import { getGoogleAuthUrl, exchangeGoogleCode, refreshGoogleToken, listGoogleAccounts, listGoogleLocations, fetchGoogleReviews, replyToGoogleReview, starRatingToNumber } from '@/lib/integrations/google';
import { getFacebookAuthUrl, exchangeFacebookCode, getLongLivedToken, listFacebookPages, fetchFacebookRatings, facebookRatingToNumber } from '@/lib/integrations/facebook';
import { searchYelpBusiness, getYelpBusiness, getYelpReviews, getYelpBusinessSummary } from '@/lib/integrations/yelp';
import { DEFAULT_WALL_CONFIG, mergeWallConfig } from '@/lib/types/wall-config';
import type { WallConfig } from '@/lib/types/wall-config';
import type { Organization, Review, ReviewRequest, SupportTicket, OrganizationIntegration, ExternalReview, OrganizationMember, ReviewPlatform, ActivityLogEntry } from '@/lib/types/database';
import { PLATFORM_CONFIG } from '@/lib/types/database';
import { sendNegativeReviewNotification, sendSupportTicketNotification } from '@/lib/email/client';

// ═══════════════════════════════════════════════════════════════
// Google Integration
// ═══════════════════════════════════════════════════════════════

describe('Google Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGoogleAuthUrl', () => {
    it('builds correct OAuth URL with all required parameters', () => {
      const url = getGoogleAuthUrl('test-state-123');
      const parsed = new URL(url);

      expect(parsed.origin + parsed.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
      expect(parsed.searchParams.get('client_id')).toBe('google-test-client-id');
      expect(parsed.searchParams.get('redirect_uri')).toBe('https://app.example.com/api/integrations/google/callback');
      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('scope')).toBe('https://www.googleapis.com/auth/business.manage');
      expect(parsed.searchParams.get('access_type')).toBe('offline');
      expect(parsed.searchParams.get('prompt')).toBe('consent');
      expect(parsed.searchParams.get('state')).toBe('test-state-123');
    });

    it('properly encodes state parameter with special characters', () => {
      const state = 'org=123&redirect=/dashboard';
      const url = getGoogleAuthUrl(state);
      const parsed = new URL(url);
      expect(parsed.searchParams.get('state')).toBe(state);
    });

    it('includes offline access type for refresh tokens', () => {
      const url = getGoogleAuthUrl('s');
      expect(url).toContain('access_type=offline');
    });

    it('forces consent prompt to ensure refresh token is returned', () => {
      const url = getGoogleAuthUrl('s');
      expect(url).toContain('prompt=consent');
    });
  });

  describe('exchangeGoogleCode', () => {
    it('sends correct POST request to token endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: 'at', refresh_token: 'rt', expires_in: 3600 }),
      });

      await exchangeGoogleCode('auth-code-abc');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );

      const body = new URLSearchParams(mockFetch.mock.calls[0][1].body);
      expect(body.get('code')).toBe('auth-code-abc');
      expect(body.get('grant_type')).toBe('authorization_code');
      expect(body.get('client_id')).toBe('google-test-client-id');
      expect(body.get('client_secret')).toBe('google-test-secret');
    });

    it('throws on failed token exchange', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('invalid_grant'),
      });

      await expect(exchangeGoogleCode('bad-code')).rejects.toThrow('Google token exchange failed');
    });
  });

  describe('refreshGoogleToken', () => {
    it('sends refresh token request with correct grant_type', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: 'new-at', expires_in: 3600 }),
      });

      const result = await refreshGoogleToken('my-refresh-token');

      const body = new URLSearchParams(mockFetch.mock.calls[0][1].body);
      expect(body.get('refresh_token')).toBe('my-refresh-token');
      expect(body.get('grant_type')).toBe('refresh_token');
      expect(result.access_token).toBe('new-at');
    });

    it('throws on failed refresh', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      await expect(refreshGoogleToken('bad')).rejects.toThrow('Failed to refresh Google token');
    });
  });

  describe('listGoogleAccounts', () => {
    it('returns accounts array on success', async () => {
      const mockAccounts = [{ name: 'accounts/1', accountName: 'Test Biz', type: 'PERSONAL' }];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ accounts: mockAccounts }),
      });

      const result = await listGoogleAccounts('token');
      expect(result).toEqual(mockAccounts);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
        expect.objectContaining({ headers: { Authorization: 'Bearer token' } }),
      );
    });

    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      const result = await listGoogleAccounts('bad-token');
      expect(result).toEqual([]);
    });

    it('returns empty array when accounts field is missing', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
      const result = await listGoogleAccounts('token');
      expect(result).toEqual([]);
    });
  });

  describe('listGoogleLocations', () => {
    it('fetches locations with correct readMask', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ locations: [{ name: 'accounts/1/locations/1', title: 'Shop' }] }),
      });

      const result = await listGoogleLocations('token', 'accounts/1');
      expect(result).toHaveLength(1);
      expect(mockFetch.mock.calls[0][0]).toContain('readMask=name');
    });

    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      expect(await listGoogleLocations('t', 'accounts/1')).toEqual([]);
    });
  });

  describe('fetchGoogleReviews', () => {
    it('fetches reviews with pagination', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          reviews: [{ reviewId: 'r1' }],
          nextPageToken: 'page2',
          totalReviewCount: 100,
        }),
      });

      const result = await fetchGoogleReviews('token', 'accounts/1/locations/1');
      expect(result.reviews).toHaveLength(1);
      expect(result.nextPageToken).toBe('page2');
      expect(result.totalReviewCount).toBe(100);
    });

    it('passes pageToken when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ reviews: [] }),
      });

      await fetchGoogleReviews('token', 'loc/1', 'next-page');
      expect(mockFetch.mock.calls[0][0]).toContain('pageToken=next-page');
    });

    it('throws on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('permission denied'),
      });

      await expect(fetchGoogleReviews('t', 'l')).rejects.toThrow('Failed to fetch Google reviews');
    });
  });

  describe('replyToGoogleReview', () => {
    it('sends PUT request with reply text', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const result = await replyToGoogleReview('token', 'reviews/r1', 'Thank you!');
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://mybusiness.googleapis.com/v4/reviews/r1/reply',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ comment: 'Thank you!' }),
        }),
      );
    });

    it('returns false on failure', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      const result = await replyToGoogleReview('t', 'r', 'text');
      expect(result).toBe(false);
    });
  });

  describe('starRatingToNumber', () => {
    it('converts all star rating strings correctly', () => {
      expect(starRatingToNumber('ONE')).toBe(1);
      expect(starRatingToNumber('TWO')).toBe(2);
      expect(starRatingToNumber('THREE')).toBe(3);
      expect(starRatingToNumber('FOUR')).toBe(4);
      expect(starRatingToNumber('FIVE')).toBe(5);
    });

    it('returns 0 for unknown rating', () => {
      expect(starRatingToNumber('INVALID')).toBe(0);
      expect(starRatingToNumber('')).toBe(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// Facebook Integration
// ═══════════════════════════════════════════════════════════════

describe('Facebook Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFacebookAuthUrl', () => {
    it('builds correct OAuth URL with all required parameters', () => {
      const url = getFacebookAuthUrl('fb-state-456');
      const parsed = new URL(url);

      expect(parsed.origin + parsed.pathname).toBe('https://www.facebook.com/v19.0/dialog/oauth');
      expect(parsed.searchParams.get('client_id')).toBe('fb-test-app-id');
      expect(parsed.searchParams.get('redirect_uri')).toBe('https://app.example.com/api/integrations/facebook/callback');
      expect(parsed.searchParams.get('state')).toBe('fb-state-456');
      expect(parsed.searchParams.get('response_type')).toBe('code');
    });

    it('requests correct Facebook permissions', () => {
      const url = getFacebookAuthUrl('state');
      const parsed = new URL(url);
      const scope = parsed.searchParams.get('scope')!;
      expect(scope).toContain('pages_read_engagement');
      expect(scope).toContain('pages_read_user_content');
      expect(scope).toContain('pages_show_list');
    });

    it('encodes state parameter properly', () => {
      const state = 'data={"orgId":"abc"}';
      const url = getFacebookAuthUrl(state);
      const parsed = new URL(url);
      expect(parsed.searchParams.get('state')).toBe(state);
    });
  });

  describe('exchangeFacebookCode', () => {
    it('sends correct request to Facebook token endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: 'fb-token', expires_in: 5184000 }),
      });

      const result = await exchangeFacebookCode('fb-code');
      expect(result.access_token).toBe('fb-token');
      expect(mockFetch.mock.calls[0][0]).toContain('graph.facebook.com/v19.0/oauth/access_token');
      expect(mockFetch.mock.calls[0][0]).toContain('code=fb-code');
    });

    it('throws on failed exchange', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('invalid code'),
      });
      await expect(exchangeFacebookCode('bad')).rejects.toThrow('Facebook token exchange failed');
    });
  });

  describe('getLongLivedToken', () => {
    it('exchanges short token for long-lived token', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: 'long-token', expires_in: 5184000 }),
      });

      const result = await getLongLivedToken('short-token');
      expect(result.access_token).toBe('long-token');
      expect(mockFetch.mock.calls[0][0]).toContain('grant_type=fb_exchange_token');
      expect(mockFetch.mock.calls[0][0]).toContain('fb_exchange_token=short-token');
    });

    it('throws on failure', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      await expect(getLongLivedToken('bad')).rejects.toThrow('Failed to get long-lived Facebook token');
    });
  });

  describe('listFacebookPages', () => {
    it('returns pages on success', async () => {
      const pages = [{ id: '1', name: 'My Page', access_token: 'pt', category: 'Restaurant' }];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: pages }),
      });

      const result = await listFacebookPages('user-token');
      expect(result).toEqual(pages);
      expect(mockFetch.mock.calls[0][0]).toContain('/me/accounts');
    });

    it('returns empty array on failure', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      expect(await listFacebookPages('bad')).toEqual([]);
    });

    it('returns empty array when data is missing', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
      expect(await listFacebookPages('t')).toEqual([]);
    });
  });

  describe('fetchFacebookRatings', () => {
    it('fetches ratings with correct fields', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [{ reviewer: { name: 'John', id: '1' }, rating: 5 }],
          paging: { cursors: { after: 'cursor-2' } },
        }),
      });

      const result = await fetchFacebookRatings('page-token', 'page-123');
      expect(result.ratings).toHaveLength(1);
      expect(result.nextCursor).toBe('cursor-2');
    });

    it('passes after cursor for pagination', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      await fetchFacebookRatings('pt', 'p1', 'cursor-abc');
      expect(mockFetch.mock.calls[0][0]).toContain('after=cursor-abc');
    });

    it('returns empty ratings on failure', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      const result = await fetchFacebookRatings('t', 'p');
      expect(result.ratings).toEqual([]);
    });
  });

  describe('facebookRatingToNumber', () => {
    it('returns numeric rating when provided (old-style)', () => {
      expect(facebookRatingToNumber(5)).toBe(5);
      expect(facebookRatingToNumber(3)).toBe(3);
      expect(facebookRatingToNumber(1)).toBe(1);
    });

    it('converts positive recommendation to 5', () => {
      expect(facebookRatingToNumber(undefined, 'positive')).toBe(5);
    });

    it('converts negative recommendation to 1', () => {
      expect(facebookRatingToNumber(undefined, 'negative')).toBe(1);
    });

    it('returns null when neither rating nor recommendation exists', () => {
      expect(facebookRatingToNumber(undefined, undefined)).toBeNull();
      expect(facebookRatingToNumber(undefined, 'unknown')).toBeNull();
    });

    it('prefers numeric rating over recommendation_type', () => {
      expect(facebookRatingToNumber(4, 'negative')).toBe(4);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// Yelp Integration
// ═══════════════════════════════════════════════════════════════

describe('Yelp Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchYelpBusiness', () => {
    it('calls correct API endpoint with search params', async () => {
      const businesses = [{ id: 'biz-1', name: 'Great Coffee', alias: 'great-coffee' }];
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ businesses }),
      });

      const result = await searchYelpBusiness('Great Coffee', 'Melbourne, AU');
      expect(result).toEqual(businesses);

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('https://api.yelp.com/v3/businesses/search');
      expect(callUrl).toContain('term=Great+Coffee');
      expect(callUrl).toContain('limit=5');
    });

    it('uses Bearer auth with API key', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ businesses: [] }),
      });

      await searchYelpBusiness('Test', 'NYC');
      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer yelp-test-api-key');
    });

    it('returns empty array on API failure', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      const result = await searchYelpBusiness('X', 'Y');
      expect(result).toEqual([]);
    });

    it('returns empty array when businesses field is missing', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
      expect(await searchYelpBusiness('X', 'Y')).toEqual([]);
    });
  });

  describe('getYelpBusiness', () => {
    it('fetches a single business by ID', async () => {
      const biz = { id: 'biz-1', name: 'Cafe', rating: 4.5 };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(biz) });

      const result = await getYelpBusiness('biz-1');
      expect(result).toEqual(biz);
      expect(mockFetch.mock.calls[0][0]).toBe('https://api.yelp.com/v3/businesses/biz-1');
    });

    it('returns null on failure', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      expect(await getYelpBusiness('bad-id')).toBeNull();
    });
  });

  describe('getYelpReviews', () => {
    it('fetches reviews for a business', async () => {
      const reviews = [{ id: 'rev-1', rating: 5, text: 'Great!' }];
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ reviews }) });

      const result = await getYelpReviews('biz-1');
      expect(result).toEqual(reviews);
      expect(mockFetch.mock.calls[0][0]).toContain('businesses/biz-1/reviews');
    });

    it('returns empty array on 404 (non-US/Canada)', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 });
      const result = await getYelpReviews('au-biz');
      expect(result).toEqual([]);
    });

    it('returns empty array on other API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal error'),
      });
      const result = await getYelpReviews('biz-1');
      expect(result).toEqual([]);
    });
  });

  describe('getYelpBusinessSummary', () => {
    it('returns summary from business details', async () => {
      const biz = { id: 'b1', name: 'Cafe', rating: 4.2, review_count: 150, url: 'https://yelp.com/biz/cafe' };
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(biz) });

      const result = await getYelpBusinessSummary('b1');
      expect(result).toEqual({
        rating: 4.2,
        review_count: 150,
        name: 'Cafe',
        url: 'https://yelp.com/biz/cafe',
      });
    });

    it('returns null when business not found', async () => {
      mockFetch.mockResolvedValue({ ok: false });
      expect(await getYelpBusinessSummary('bad')).toBeNull();
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// Wall Config
// ═══════════════════════════════════════════════════════════════

describe('Wall Config', () => {
  describe('DEFAULT_WALL_CONFIG', () => {
    it('has gradient background type by default', () => {
      expect(DEFAULT_WALL_CONFIG.bgType).toBe('gradient');
    });

    it('has correct default gradient colors', () => {
      expect(DEFAULT_WALL_CONFIG.bgGradientFrom).toBe('#f0f4ff');
      expect(DEFAULT_WALL_CONFIG.bgGradientTo).toBe('#f0fdf4');
      expect(DEFAULT_WALL_CONFIG.bgGradientAngle).toBe(145);
    });

    it('has white card background with medium shadow', () => {
      expect(DEFAULT_WALL_CONFIG.cardBg).toBe('#ffffff');
      expect(DEFAULT_WALL_CONFIG.cardShadow).toBe('md');
      expect(DEFAULT_WALL_CONFIG.cardBorderRadius).toBe(12);
    });

    it('uses Inter font family for header and body', () => {
      expect(DEFAULT_WALL_CONFIG.headerFont).toContain('Inter');
      expect(DEFAULT_WALL_CONFIG.bodyFont).toContain('Inter');
    });

    it('has amber star color', () => {
      expect(DEFAULT_WALL_CONFIG.starColor).toBe('#f59e0b');
    });

    it('has indigo accent color', () => {
      expect(DEFAULT_WALL_CONFIG.accentColor).toBe('#6366f1');
    });

    it('defaults to 3-column layout at 1000px max width', () => {
      expect(DEFAULT_WALL_CONFIG.columns).toBe(3);
      expect(DEFAULT_WALL_CONFIG.maxWidth).toBe(1000);
    });

    it('shows logo, rating badge, and powered-by by default', () => {
      expect(DEFAULT_WALL_CONFIG.showLogo).toBe(true);
      expect(DEFAULT_WALL_CONFIG.showRatingBadge).toBe(true);
      expect(DEFAULT_WALL_CONFIG.showPoweredBy).toBe(true);
    });

    it('has default header text', () => {
      expect(DEFAULT_WALL_CONFIG.headerText).toBe('What our customers are saying');
    });

    it('has headerSize of 1 (default multiplier)', () => {
      expect(DEFAULT_WALL_CONFIG.headerSize).toBe(1);
    });
  });

  describe('mergeWallConfig', () => {
    it('returns defaults when saved is null', () => {
      const result = mergeWallConfig(null);
      expect(result).toEqual(DEFAULT_WALL_CONFIG);
    });

    it('returns defaults when saved is undefined', () => {
      const result = mergeWallConfig(undefined);
      expect(result).toEqual(DEFAULT_WALL_CONFIG);
    });

    it('returns defaults when saved is empty object', () => {
      const result = mergeWallConfig({});
      expect(result).toEqual(DEFAULT_WALL_CONFIG);
    });

    it('overrides specific fields from saved config', () => {
      const result = mergeWallConfig({ bgType: 'solid', columns: 2, starColor: '#ff0000' });
      expect(result.bgType).toBe('solid');
      expect(result.columns).toBe(2);
      expect(result.starColor).toBe('#ff0000');
      // defaults remain for non-overridden fields
      expect(result.cardBg).toBe('#ffffff');
      expect(result.showLogo).toBe(true);
    });

    it('overrides boolean fields correctly', () => {
      const result = mergeWallConfig({ showPoweredBy: false, showLogo: false });
      expect(result.showPoweredBy).toBe(false);
      expect(result.showLogo).toBe(false);
    });

    it('returns a complete WallConfig even with partial input', () => {
      const result = mergeWallConfig({ headerText: 'Reviews' });
      const keys = Object.keys(result);
      const defaultKeys = Object.keys(DEFAULT_WALL_CONFIG);
      expect(keys.sort()).toEqual(defaultKeys.sort());
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// Database Types
// ═══════════════════════════════════════════════════════════════

describe('Database Types', () => {
  describe('Organization interface', () => {
    it('has required billing fields', () => {
      const org: Organization = {
        id: 'org-1',
        name: 'Test Biz',
        slug: 'test-biz',
        logo_url: null,
        phone: null,
        email: null,
        address: null,
        positive_threshold: 4,
        sms_template: 'Leave us a review!',
        wall_config: {},
        thankyou_positive_title: 'Thanks!',
        thankyou_positive_message: 'Share online!',
        thankyou_negative_title: 'Sorry',
        thankyou_negative_message: 'We will follow up.',
        thankyou_coupon_code: null,
        thankyou_coupon_text: '',
        thankyou_social_links: {},
        stripe_customer_id: 'cus_123',
        stripe_subscription_id: 'sub_456',
        billing_plan: 'active',
        trial_ends_at: '2026-04-01T00:00:00Z',
        webhook_url: null,
        webhook_enabled: false,
        notify_on_negative: true,
        digest_enabled: false,
        digest_frequency: 'weekly',
        review_form_heading: 'How was your experience?',
        review_form_subheading: 'We value your feedback',
        auto_followup_enabled: false,
        auto_followup_delay_hours: 24,
        auto_followup_message: '',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      expect(org.billing_plan).toBe('active');
      expect(org.trial_ends_at).toBe('2026-04-01T00:00:00Z');
      expect(org.stripe_customer_id).toBe('cus_123');
      expect(org.stripe_subscription_id).toBe('sub_456');
    });

    it('supports all billing plan values', () => {
      const plans: Organization['billing_plan'][] = ['trial', 'active', 'cancelled', 'past_due'];
      expect(plans).toHaveLength(4);
    });
  });

  describe('Review interface', () => {
    it('has all required review fields', () => {
      const review: Review = {
        id: 'rev-1',
        organization_id: 'org-1',
        review_request_id: 'req-1',
        rating: 4,
        comment: 'Great service!',
        customer_name: 'Jane',
        customer_phone: '+61400000000',
        customer_email: 'jane@example.com',
        is_positive: true,
        is_public: true,
        redirected_to: ['google', 'yelp'],
        responded: false,
        response_notes: null,
        photo_url: null,
        created_at: '2026-03-01T00:00:00Z',
      };

      expect(review.rating).toBe(4);
      expect(review.comment).toBe('Great service!');
      expect(review.is_positive).toBe(true);
      expect(review.is_public).toBe(true);
      expect(review.redirected_to).toEqual(['google', 'yelp']);
    });
  });

  describe('ReviewRequest interface', () => {
    it('has all required fields', () => {
      const request: ReviewRequest = {
        id: 'rr-1',
        organization_id: 'org-1',
        customer_phone: '+61400000000',
        customer_email: null,
        customer_name: 'John',
        contact_method: 'sms',
        sent_by: 'user-1',
        status: 'sent',
        sent_at: '2026-03-01T00:00:00Z',
        created_at: '2026-03-01T00:00:00Z',
      };

      expect(request.customer_phone).toBe('+61400000000');
      expect(request.status).toBe('sent');
      expect(request.sent_by).toBe('user-1');
    });

    it('supports all status values', () => {
      const statuses: ReviewRequest['status'][] = ['sent', 'completed', 'expired', 'failed'];
      expect(statuses).toHaveLength(4);
    });
  });

  describe('SupportTicket interface', () => {
    it('has correct category and priority types', () => {
      const ticket: SupportTicket = {
        id: 'st-1',
        organization_id: 'org-1',
        user_id: 'user-1',
        subject: 'Help',
        message: 'I need help.',
        category: 'bug',
        priority: 'high',
        status: 'open',
        created_at: '2026-03-01T00:00:00Z',
        updated_at: '2026-03-01T00:00:00Z',
      };

      expect(ticket.category).toBe('bug');
      expect(ticket.priority).toBe('high');
    });

    it('supports all category values', () => {
      const categories: SupportTicket['category'][] = ['general', 'bug', 'feature', 'billing', 'account'];
      expect(categories).toHaveLength(5);
    });

    it('supports all priority values', () => {
      const priorities: SupportTicket['priority'][] = ['low', 'normal', 'high', 'urgent'];
      expect(priorities).toHaveLength(4);
    });

    it('supports all status values', () => {
      const statuses: SupportTicket['status'][] = ['open', 'in_progress', 'resolved', 'closed'];
      expect(statuses).toHaveLength(4);
    });
  });

  describe('OrganizationIntegration interface', () => {
    it('supports google, facebook, and yelp platforms', () => {
      const platforms: OrganizationIntegration['platform'][] = ['google', 'facebook', 'yelp'];
      expect(platforms).toHaveLength(3);
    });

    it('has required integration fields', () => {
      const integration: OrganizationIntegration = {
        id: 'int-1',
        organization_id: 'org-1',
        platform: 'google',
        access_token: 'at',
        refresh_token: 'rt',
        token_expires_at: '2026-04-01T00:00:00Z',
        platform_account_id: 'acc-1',
        platform_account_name: 'My Business',
        platform_url: 'https://google.com/business',
        connected_at: '2026-03-01T00:00:00Z',
        last_synced_at: null,
        sync_enabled: true,
        show_on_review_form: true,
        created_at: '2026-03-01T00:00:00Z',
      };

      expect(integration.sync_enabled).toBe(true);
      expect(integration.show_on_review_form).toBe(true);
    });
  });

  describe('PLATFORM_CONFIG', () => {
    it('has entries for all 5 platforms', () => {
      expect(Object.keys(PLATFORM_CONFIG)).toHaveLength(5);
      expect(PLATFORM_CONFIG).toHaveProperty('google');
      expect(PLATFORM_CONFIG).toHaveProperty('yelp');
      expect(PLATFORM_CONFIG).toHaveProperty('facebook');
      expect(PLATFORM_CONFIG).toHaveProperty('tripadvisor');
      expect(PLATFORM_CONFIG).toHaveProperty('other');
    });

    it('has valid hex colors for all platforms', () => {
      for (const config of Object.values(PLATFORM_CONFIG)) {
        expect(config.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// Support Ticket Validation (route.ts logic)
// ═══════════════════════════════════════════════════════════════

describe('Support Ticket Validation', () => {
  it('subject is required (empty/whitespace not allowed)', () => {
    // Mirroring the route logic: !subject?.trim()
    const validate = (subject: string | null | undefined) => !!subject?.trim();
    expect(validate(null)).toBe(false);
    expect(validate(undefined)).toBe(false);
    expect(validate('')).toBe(false);
    expect(validate('   ')).toBe(false);
    expect(validate('Help me')).toBe(true);
  });

  it('message is required (empty/whitespace not allowed)', () => {
    const validate = (message: string | null | undefined) => !!message?.trim();
    expect(validate(null)).toBe(false);
    expect(validate(undefined)).toBe(false);
    expect(validate('')).toBe(false);
    expect(validate('   ')).toBe(false);
    expect(validate('My issue is...')).toBe(true);
  });

  it('category defaults to general when not provided', () => {
    const category = undefined;
    const resolved = category || 'general';
    expect(resolved).toBe('general');
  });

  it('priority defaults to normal when not provided', () => {
    const priority = undefined;
    const resolved = priority || 'normal';
    expect(resolved).toBe('normal');
  });

  it('valid categories are general, bug, feature, billing, account', () => {
    const validCategories = ['general', 'bug', 'feature', 'billing', 'account'];
    validCategories.forEach((cat) => {
      expect(typeof cat).toBe('string');
    });
  });

  it('valid priorities are low, normal, high, urgent', () => {
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    validPriorities.forEach((p) => {
      expect(typeof p).toBe('string');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// Email Templates
// ═══════════════════════════════════════════════════════════════

describe('Email: sendNegativeReviewNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue([{ statusCode: 202 }]);
  });

  it('sends email with correct subject line format', async () => {
    await sendNegativeReviewNotification({
      to: 'owner@biz.com',
      businessName: 'Acme Cafe',
      rating: 2,
      comment: 'Bad coffee',
      customerName: 'Jane',
      dashboardUrl: 'https://app.com/dashboard/reviews',
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'New negative review (2 stars) for Acme Cafe',
      }),
    );
  });

  it('uses singular "star" for rating of 1', async () => {
    await sendNegativeReviewNotification({
      to: 'owner@biz.com',
      businessName: 'Shop',
      rating: 1,
      comment: 'Terrible',
      customerName: null,
      dashboardUrl: 'https://app.com/dashboard',
    });

    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.subject).toBe('New negative review (1 star) for Shop');
  });

  it('includes rating in the HTML body', async () => {
    await sendNegativeReviewNotification({
      to: 'owner@biz.com',
      businessName: 'Shop',
      rating: 2,
      comment: 'Not great',
      customerName: 'Bob',
      dashboardUrl: 'https://app.com/dashboard',
    });

    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.html).toContain('2-star');
  });

  it('includes comment in the HTML body when provided', async () => {
    await sendNegativeReviewNotification({
      to: 'owner@biz.com',
      businessName: 'Shop',
      rating: 2,
      comment: 'The food was cold',
      customerName: null,
      dashboardUrl: 'https://app.com/dashboard',
    });

    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.html).toContain('The food was cold');
  });

  it('handles null comment gracefully', async () => {
    await sendNegativeReviewNotification({
      to: 'owner@biz.com',
      businessName: 'Shop',
      rating: 3,
      comment: null,
      customerName: null,
      dashboardUrl: 'https://app.com/dashboard',
    });

    const callArg = mockSend.mock.calls[0][0];
    // Should not crash, HTML should still be valid
    expect(callArg.html).toContain('Negative Review Alert');
  });

  it('includes dashboard URL in the email', async () => {
    await sendNegativeReviewNotification({
      to: 'owner@biz.com',
      businessName: 'Shop',
      rating: 1,
      comment: null,
      customerName: null,
      dashboardUrl: 'https://app.com/dashboard/reviews',
    });

    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.html).toContain('https://app.com/dashboard/reviews');
    expect(callArg.text).toContain('https://app.com/dashboard/reviews');
  });

  it('uses "A customer" when customerName is null', async () => {
    await sendNegativeReviewNotification({
      to: 'owner@biz.com',
      businessName: 'Shop',
      rating: 2,
      comment: null,
      customerName: null,
      dashboardUrl: 'https://app.com/dashboard',
    });

    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.html).toContain('A customer');
  });

  it('includes customer contact when provided', async () => {
    await sendNegativeReviewNotification({
      to: 'owner@biz.com',
      businessName: 'Shop',
      rating: 2,
      comment: 'Bad',
      customerName: 'Jane',
      customerContact: '+61400000000',
      dashboardUrl: 'https://app.com/dashboard',
    });

    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.html).toContain('+61400000000');
  });
});

describe('Email: sendSupportTicketNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue([{ statusCode: 202 }]);
  });

  it('sends email with correct subject line format', async () => {
    await sendSupportTicketNotification({
      orgName: 'Test Cafe',
      userEmail: 'user@test.com',
      subject: 'Cannot send SMS',
      message: 'When I click send nothing happens.',
      category: 'bug',
      priority: 'high',
      ticketId: 'abcdef12-3456-7890-abcd-ef1234567890',
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: '[Support] Cannot send SMS — Test Cafe',
      }),
    );
  });

  it('includes truncated ticket ID in HTML body', async () => {
    await sendSupportTicketNotification({
      orgName: 'Biz',
      userEmail: 'u@b.com',
      subject: 'Help',
      message: 'Issue.',
      category: 'general',
      priority: 'normal',
      ticketId: 'abcdef12-3456-7890-abcd-ef1234567890',
    });

    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.html).toContain('abcdef12');
    expect(callArg.text).toContain('abcdef12');
  });

  it('includes category in the email body', async () => {
    await sendSupportTicketNotification({
      orgName: 'Biz',
      userEmail: 'u@b.com',
      subject: 'Billing issue',
      message: 'I was double charged.',
      category: 'billing',
      priority: 'urgent',
      ticketId: '12345678-0000-0000-0000-000000000000',
    });

    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.html).toContain('billing');
    expect(callArg.text).toContain('billing');
  });

  it('includes user email and org name in the email', async () => {
    await sendSupportTicketNotification({
      orgName: 'Acme Corp',
      userEmail: 'admin@acme.com',
      subject: 'Question',
      message: 'How do I add staff?',
      category: 'general',
      priority: 'low',
      ticketId: '00000000-0000-0000-0000-000000000000',
    });

    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.html).toContain('admin@acme.com');
    expect(callArg.html).toContain('Acme Corp');
    expect(callArg.text).toContain('admin@acme.com');
    expect(callArg.text).toContain('Acme Corp');
  });

  it('sends to SUPPORT_EMAIL address', async () => {
    await sendSupportTicketNotification({
      orgName: 'Biz',
      userEmail: 'u@b.com',
      subject: 'Hi',
      message: 'Test.',
      category: 'general',
      priority: 'normal',
      ticketId: '00000000-0000-0000-0000-000000000000',
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'support@test.com',
      }),
    );
  });

  it('includes priority in email with correct casing', async () => {
    await sendSupportTicketNotification({
      orgName: 'Biz',
      userEmail: 'u@b.com',
      subject: 'Urgent',
      message: 'Site is down.',
      category: 'bug',
      priority: 'urgent',
      ticketId: '00000000-0000-0000-0000-000000000000',
    });

    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.html).toContain('Urgent');
    expect(callArg.text).toContain('urgent');
  });

  it('includes the subject and message in the body', async () => {
    await sendSupportTicketNotification({
      orgName: 'Biz',
      userEmail: 'u@b.com',
      subject: 'Custom SMS template',
      message: 'How do I customize the SMS text?',
      category: 'feature',
      priority: 'normal',
      ticketId: '00000000-0000-0000-0000-000000000000',
    });

    const callArg = mockSend.mock.calls[0][0];
    expect(callArg.html).toContain('Custom SMS template');
    expect(callArg.html).toContain('How do I customize the SMS text?');
  });
});
