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
  thankyou_positive_title: string;
  thankyou_positive_message: string;
  thankyou_negative_title: string;
  thankyou_negative_message: string;
  thankyou_coupon_code: string | null;
  thankyou_coupon_text: string;
  thankyou_social_links: Record<string, string>;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  billing_plan: 'trial' | 'active' | 'cancelled' | 'past_due';
  trial_ends_at: string | null;
  webhook_url: string | null;
  webhook_enabled: boolean;
  notify_on_negative: boolean;
  digest_enabled: boolean;
  digest_frequency: 'daily' | 'weekly' | 'monthly';
  review_form_heading: string;
  review_form_subheading: string;
  auto_followup_enabled: boolean;
  auto_followup_delay_hours: number;
  auto_followup_message: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'staff';
  role_id: string | null;
  status: 'pending' | 'active';
  email: string | null;
  display_name: string | null;
  created_at: string;
}

export interface Role {
  id: string;
  organization_id: string;
  name: string;
  permissions: string[];
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
  photo_url: string | null;
  source: 'qr' | 'sms' | 'direct';
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

export interface FollowupQueue {
  id: string;
  organization_id: string;
  review_id: string;
  scheduled_at: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  channel: 'email' | 'sms';
  to_contact: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  organization_id: string;
  user_id: string;
  subject: string;
  message: string;
  category: 'general' | 'bug' | 'feature' | 'billing' | 'account';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
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
  npsScore: number | null;
  promoterCount: number;
  passiveCount: number;
  detractorCount: number;
}

// Platform integrations (Google, Facebook, Yelp)
export interface OrganizationIntegration {
  id: string;
  organization_id: string;
  platform: 'google' | 'facebook' | 'yelp';
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  platform_account_id: string | null;
  platform_account_name: string | null;
  platform_url: string | null;
  connected_at: string;
  last_synced_at: string | null;
  sync_enabled: boolean;
  show_on_review_form: boolean;
  created_at: string;
}

export interface ExternalReview {
  id: string;
  organization_id: string;
  integration_id: string;
  platform: string;
  platform_review_id: string | null;
  rating: number | null;
  comment: string | null;
  reviewer_name: string | null;
  reviewer_avatar_url: string | null;
  review_date: string | null;
  reply_text: string | null;
  replied_at: string | null;
  raw_data: Record<string, unknown>;
  created_at: string;
}

// Platform display config
export const PLATFORM_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  google: { label: 'Google', color: '#4285F4', icon: 'Star' },
  yelp: { label: 'Yelp', color: '#D32323', icon: 'MessageCircle' },
  facebook: { label: 'Facebook', color: '#1877F2', icon: 'ThumbsUp' },
  tripadvisor: { label: 'TripAdvisor', color: '#00AF87', icon: 'MapPin' },
  other: { label: 'Other', color: '#757575', icon: 'ExternalLink' },
};
