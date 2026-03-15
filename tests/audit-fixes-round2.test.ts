import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function readSource(relativePath: string): string {
  return readFileSync(resolve(__dirname, '..', relativePath), 'utf-8');
}

describe('Audit Fixes Round 2', () => {
  describe('2.9 + 3.12: Stripe webhook handlers', () => {
    const source = readSource('app/api/stripe/webhook/route.ts');

    it('handles invoice.payment_action_required event', () => {
      expect(source).toContain("case 'invoice.payment_action_required'");
    });

    it('handles customer.subscription.trial_will_end event', () => {
      expect(source).toContain("case 'customer.subscription.trial_will_end'");
    });

    it('logs trial_ending_soon activity', () => {
      expect(source).toContain('trial_ending_soon');
    });
  });

  describe('3.11: Security headers', () => {
    const source = readSource('next.config.ts');

    it('includes Strict-Transport-Security header', () => {
      expect(source).toContain('Strict-Transport-Security');
      expect(source).toContain('max-age=63072000');
    });

    it('includes Permissions-Policy header', () => {
      expect(source).toContain('Permissions-Policy');
      expect(source).toContain('camera=()');
      expect(source).toContain('microphone=()');
    });
  });

  describe('2.10: Dynamic sitemap', () => {
    const source = readSource('app/sitemap.ts');

    it('is an async function (queries DB)', () => {
      expect(source).toContain('async function sitemap');
    });

    it('queries organizations for wall pages', () => {
      expect(source).toContain("from('organizations')");
      expect(source).toContain('/wall/');
    });

    it('includes static blog routes', () => {
      expect(source).toContain('blog/get-more-google-reviews');
      expect(source).toContain('blog/negative-google-reviews');
    });

    it('has error fallback for DB failures', () => {
      expect(source).toContain('catch');
      expect(source).toContain('staticRoutes');
    });
  });

  describe('3.13: Email unsubscribe headers', () => {
    const source = readSource('lib/email/client.ts');

    it('includes List-Unsubscribe header', () => {
      expect(source).toContain('List-Unsubscribe');
    });

    it('includes List-Unsubscribe-Post header', () => {
      expect(source).toContain('List-Unsubscribe-Post');
      expect(source).toContain('One-Click');
    });
  });

  describe('3.14: OG and Twitter cards on review page', () => {
    const source = readSource('app/r/[slug]/page.tsx');

    it('includes openGraph metadata', () => {
      expect(source).toContain('openGraph');
      expect(source).toContain("type: 'website'");
    });

    it('includes twitter card metadata', () => {
      expect(source).toContain('twitter');
      expect(source).toContain("card: 'summary'");
    });

    it('includes canonical URL', () => {
      expect(source).toContain('alternates');
      expect(source).toContain('canonical');
    });
  });

  describe('3.14: OG and Twitter cards on wall page', () => {
    const source = readSource('app/wall/[slug]/page.tsx');

    it('includes openGraph with URL', () => {
      expect(source).toContain('openGraph');
      expect(source).toContain('/wall/');
    });

    it('includes twitter card metadata', () => {
      expect(source).toContain('twitter');
      expect(source).toContain("card: 'summary'");
    });

    it('includes canonical URL', () => {
      expect(source).toContain('alternates');
      expect(source).toContain('canonical');
    });
  });

  describe('2.3: Middleware billing cache', () => {
    const source = readSource('middleware.ts');

    it('reads billing cache from cookie', () => {
      expect(source).toContain('ir_billing_cache');
    });

    it('sets cache cookie with httpOnly and secure', () => {
      expect(source).toContain('httpOnly: true');
      expect(source).toContain('secure: true');
    });

    it('cache has 5 minute TTL', () => {
      expect(source).toContain('maxAge: 300');
      expect(source).toContain('5 * 60 * 1000');
    });

    it('invalidates cache on billing=success', () => {
      expect(source).toContain("maxAge: 0");
    });
  });
});
