import type { WallConfig } from './wall-config';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  positive_threshold: number;
  sms_template: string;
  wall_config: Partial<WallConfig>;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  billing_plan: 'trial' | 'active' | 'cancelled' | 'past_due';
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'staff';
  created_at: string;
}

export interface ReviewPlatform {
  id: string;
  organization_id: string;
  platform: 'google' | 'yelp' | 'facebook' | 'tripadvisor' | 'other';
  platform_name: string | null;
  url: string;
  enabled: boolean;
  display_order: number;
  created_at: string;
}

export interface ReviewRequest {
  id: string;
  organization_id: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_name: string | null;
  contact_method: 'sms' | 'email';
  sent_by: string | null;
  status: 'sent' | 'completed' | 'expired' | 'failed';
  sent_at: string;
  created_at: string;
}

export interface Review {
  id: string;
  organization_id: string;
  review_request_id: string | null;
  rating: number;
  comment: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  is_positive: boolean;
  is_public: boolean;
  redirected_to: string[];
  responded: boolean;
  response_notes: string | null;
  created_at: string;
}

export interface SmsLogEntry {
  id: string;
  organization_id: string;
  review_request_id: string | null;
  to_phone: string;
  message_body: string;
  twilio_sid: string | null;
  channel: 'sms' | 'email';
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  organization_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

// Dashboard stats
export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  positivePercentage: number;
  totalRequests: number;
  responseRate: number;
  thisWeekReviews: number;
  lastWeekReviews: number;
}

// Platform display config
export const PLATFORM_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  google: { label: 'Google', color: '#4285F4', icon: 'Star' },
  yelp: { label: 'Yelp', color: '#D32323', icon: 'MessageCircle' },
  facebook: { label: 'Facebook', color: '#1877F2', icon: 'ThumbsUp' },
  tripadvisor: { label: 'TripAdvisor', color: '#00AF87', icon: 'MapPin' },
  other: { label: 'Other', color: '#757575', icon: 'ExternalLink' },
};
