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

export const PLAN = {
  name: 'InsightReviews',
  price: 79,
  priceId: (process.env.STRIPE_PRICE_ID || '').trim(),
  trialDays: 14,
  currency: 'aud',
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
