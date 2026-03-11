export const RATING_LABELS: Record<number, string> = {
  1: 'Terrible',
  2: 'Poor',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent',
};

export const RATING_COLORS: Record<number, string> = {
  1: '#d32f2f',
  2: '#f57c00',
  3: '#fbc02d',
  4: '#7cb342',
  5: '#2e7d32',
};

export const PLANS = {
  STARTER: {
    name: 'Starter',
    price: 79,
    priceId: process.env.STRIPE_PRICE_ID_STARTER || process.env.STRIPE_PRICE_ID || '',
    locations: 1,
    smsPerMonth: 200,
    staffAccounts: 3,
    features: ['1 location', '200 SMS/month', '3 staff accounts', 'Review collection & routing', 'Testimonial wall', 'CSV export', 'Email notifications'],
  },
  GROWTH: {
    name: 'Growth',
    price: 149,
    priceId: process.env.STRIPE_PRICE_ID_GROWTH || '',
    locations: 3,
    smsPerMonth: 1000,
    staffAccounts: 10,
    features: ['Up to 3 locations', '1,000 SMS/month', '10 staff accounts', 'Everything in Starter', 'Auto-sync (every 6 hours)', 'Custom wall themes', 'Webhook integrations', 'Priority email support'],
  },
  AGENCY: {
    name: 'Agency',
    price: 249,
    priceId: process.env.STRIPE_PRICE_ID_AGENCY || '',
    locations: 5,
    extraLocationPrice: 49,
    smsPerMonth: -1, // unlimited
    staffAccounts: -1, // unlimited
    features: ['5 locations + $49/extra', 'Unlimited SMS', 'Unlimited staff', 'Everything in Growth', 'Auto-sync (every hour)', 'White-label mode', 'Dedicated support', 'Setup included'],
  },
  TRIAL_DAYS: 14,
  CURRENCY: 'aud',
} as const;

// Keep backward compat
export const BILLING_PLANS = {
  MONTHLY_PRICE: 79,
  TRIAL_DAYS: 14,
  CURRENCY: 'aud',
} as const;

export const PLATFORM_CONFIG: Record<string, {
  name: string;
  color: string;
  bgColor: string;
  icon: string;
  gradient: string;
}> = {
  internal: { name: 'InsightReviews', color: '#7c3aed', bgColor: '#f3e8ff', icon: '⭐', gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)' },
  google: { name: 'Google', color: '#4285F4', bgColor: '#E8F0FE', icon: '🔍', gradient: 'linear-gradient(135deg, #4285F4, #34A853)' },
  facebook: { name: 'Facebook', color: '#1877F2', bgColor: '#E7F3FF', icon: '📘', gradient: 'linear-gradient(135deg, #1877F2, #42A5F5)' },
  yelp: { name: 'Yelp', color: '#D32323', bgColor: '#FDE8E8', icon: '🔥', gradient: 'linear-gradient(135deg, #D32323, #FF5722)' },
};

export const SMS_MAX_LENGTH = 160;

export const SLUG_REGEX = /^[a-z0-9-]+$/;
