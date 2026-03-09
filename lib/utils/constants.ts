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

export const BILLING_PLANS = {
  MONTHLY_PRICE: 29,
  TRIAL_DAYS: 14,
  CURRENCY: 'usd',
} as const;

export const SMS_MAX_LENGTH = 160;

export const SLUG_REGEX = /^[a-z0-9-]+$/;
