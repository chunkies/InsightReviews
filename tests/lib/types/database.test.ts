import { describe, it, expect } from 'vitest';
import { PLATFORM_CONFIG } from '@/lib/types/database';

describe('PLATFORM_CONFIG', () => {
  it('has all supported platforms', () => {
    expect(Object.keys(PLATFORM_CONFIG)).toEqual(
      expect.arrayContaining(['google', 'yelp', 'facebook', 'tripadvisor', 'other']),
    );
  });

  it('each platform has label, color, and icon', () => {
    for (const [key, config] of Object.entries(PLATFORM_CONFIG)) {
      expect(config.label).toBeTruthy();
      expect(config.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(config.icon).toBeTruthy();
      expect(typeof key).toBe('string');
    }
  });

  it('Google has correct branding', () => {
    expect(PLATFORM_CONFIG.google.label).toBe('Google');
    expect(PLATFORM_CONFIG.google.color).toBe('#4285F4');
  });
});
