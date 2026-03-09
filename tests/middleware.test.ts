import { describe, it, expect } from 'vitest';

// Mirror the middleware logic for unit testing
const publicPrefixes = ['/auth/', '/r/', '/wall/'];

function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return publicPrefixes.some(prefix => pathname.startsWith(prefix));
}

describe('isPublicRoute', () => {
  it('allows landing page', () => {
    expect(isPublicRoute('/')).toBe(true);
  });

  it('allows auth routes', () => {
    expect(isPublicRoute('/auth/login')).toBe(true);
    expect(isPublicRoute('/auth/confirm')).toBe(true);
    expect(isPublicRoute('/auth/error')).toBe(true);
  });

  it('allows public review form routes', () => {
    expect(isPublicRoute('/r/joes-cafe')).toBe(true);
    expect(isPublicRoute('/r/any-slug')).toBe(true);
  });

  it('allows testimonial wall routes', () => {
    expect(isPublicRoute('/wall/joes-cafe')).toBe(true);
    expect(isPublicRoute('/wall/glow-beauty')).toBe(true);
  });

  it('blocks dashboard routes', () => {
    expect(isPublicRoute('/dashboard')).toBe(false);
    expect(isPublicRoute('/dashboard/reviews')).toBe(false);
    expect(isPublicRoute('/dashboard/settings')).toBe(false);
    expect(isPublicRoute('/dashboard/collect')).toBe(false);
    expect(isPublicRoute('/dashboard/billing')).toBe(false);
    expect(isPublicRoute('/dashboard/staff')).toBe(false);
  });

  it('blocks onboarding', () => {
    expect(isPublicRoute('/onboarding')).toBe(false);
  });
});
