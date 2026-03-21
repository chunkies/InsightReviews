/**
 * Client-side analytics event tracking for GA4 and Meta Pixel.
 * Safe to call even if analytics scripts haven't loaded — checks for existence first.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

type ConversionEvent =
  | 'signup'
  | 'onboarding_complete'
  | 'trial_started'
  | 'purchase';

interface EventParams {
  value?: number;
  currency?: string;
  [key: string]: unknown;
}

/**
 * Fire a conversion event to all configured analytics platforms.
 */
export function trackConversion(event: ConversionEvent, params: EventParams = {}) {
  trackGA4(event, params);
  trackMetaPixel(event, params);
}

function trackGA4(event: ConversionEvent, params: EventParams) {
  if (typeof window === 'undefined' || !window.gtag) return;

  const ga4EventMap: Record<ConversionEvent, string> = {
    signup: 'sign_up',
    onboarding_complete: 'onboarding_complete',
    trial_started: 'start_trial',
    purchase: 'purchase',
  };

  window.gtag('event', ga4EventMap[event], {
    ...params,
    event_category: 'conversion',
  });
}

function trackMetaPixel(event: ConversionEvent, params: EventParams) {
  if (typeof window === 'undefined' || !window.fbq) return;

  const metaEventMap: Record<ConversionEvent, string> = {
    signup: 'CompleteRegistration',
    onboarding_complete: 'Lead',
    trial_started: 'StartTrial',
    purchase: 'Purchase',
  };

  window.fbq('track', metaEventMap[event], {
    ...params,
  });
}

/**
 * Track a custom event (non-conversion).
 */
export function trackEvent(eventName: string, params: EventParams = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, params);
  }
}
