/**
 * Meta Conversions API (CAPI) — server-side event tracking.
 * Sends events directly to Meta's servers, bypassing ad blockers and iOS privacy restrictions.
 * This complements the client-side pixel (fbevents.js) for better event matching.
 *
 * Requires: META_PIXEL_ID and META_CAPI_ACCESS_TOKEN env vars.
 * Generate access token: Meta Events Manager → Settings → Generate Access Token
 */

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const API_VERSION = 'v22.0';

interface CAPIEventParams {
  eventName: string;
  eventId?: string; // Must match client-side fbq event_id for deduplication
  email?: string;
  userAgent?: string;
  ipAddress?: string;
  fbc?: string; // Facebook click ID (from _fbc cookie)
  fbp?: string; // Facebook browser ID (from _fbp cookie)
  sourceUrl?: string;
  value?: number;
  currency?: string;
  customData?: Record<string, unknown>;
}

/**
 * Hash a value using SHA-256 for Meta's user data matching.
 * Meta requires PII to be hashed before sending.
 */
async function sha256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.trim().toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Send a server-side event to Meta Conversions API.
 * Fire and forget — never throws, logs errors.
 */
export async function sendMetaCAPIEvent(params: CAPIEventParams): Promise<boolean> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    // Silently skip if not configured — CAPI is optional
    return false;
  }

  try {
    const userData: Record<string, string> = {};

    if (params.email) {
      userData.em = await sha256(params.email);
    }
    if (params.ipAddress) {
      userData.client_ip_address = params.ipAddress;
    }
    if (params.userAgent) {
      userData.client_user_agent = params.userAgent;
    }
    if (params.fbc) {
      userData.fbc = params.fbc;
    }
    if (params.fbp) {
      userData.fbp = params.fbp;
    }

    const eventData: Record<string, unknown> = {
      event_name: params.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: params.eventId || `srv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      action_source: 'website',
      event_source_url: params.sourceUrl,
      user_data: userData,
    };

    if (params.value !== undefined || params.customData) {
      eventData.custom_data = {
        ...(params.customData || {}),
        ...(params.value !== undefined ? { value: params.value, currency: params.currency || 'AUD' } : {}),
      };
    }

    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [eventData],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[META CAPI] Event send failed:', response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[META CAPI] Error:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Track a signup (CompleteRegistration) event server-side.
 */
export async function trackSignupServerSide(params: {
  email: string;
  userAgent?: string;
  ipAddress?: string;
  fbc?: string;
  fbp?: string;
  sourceUrl?: string;
}): Promise<void> {
  await sendMetaCAPIEvent({
    eventName: 'CompleteRegistration',
    ...params,
  });
}

/**
 * Track onboarding complete (Lead) event server-side.
 */
export async function trackOnboardingServerSide(params: {
  email?: string;
  userAgent?: string;
  ipAddress?: string;
  sourceUrl?: string;
}): Promise<void> {
  await sendMetaCAPIEvent({
    eventName: 'Lead',
    ...params,
  });
}

/**
 * Track trial started (StartTrial) event server-side.
 */
export async function trackTrialStartedServerSide(params: {
  email?: string;
  userAgent?: string;
  ipAddress?: string;
  sourceUrl?: string;
}): Promise<void> {
  await sendMetaCAPIEvent({
    eventName: 'StartTrial',
    ...params,
    value: 0,
    currency: 'AUD',
  });
}
