/**
 * Environment Variable Safety Tests
 *
 * These tests scan the actual source code to enforce rules that prevent
 * the exact production bugs we've hit:
 *
 * 1. NEXT_PUBLIC_ vars in client code MUST use direct `process.env.NEXT_PUBLIC_X`
 *    access — NOT envRequired() or env() — because Next.js does compile-time
 *    string replacement and can't see dynamic lookups.
 *
 * 2. Server-side secret keys (SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY,
 *    STRIPE_WEBHOOK_SECRET) MUST use envRequired() to strip trailing \n that
 *    Vercel's `echo | vercel env add` silently appends.
 *
 * 3. No real API keys or secrets should ever appear in source code.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join, extname } from 'path';

const ROOT = resolve(__dirname, '..');

function readFile(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf-8');
}

function walkDir(dir: string, extensions: string[]): { path: string; content: string }[] {
  const results: { path: string; content: string }[] = [];
  const IGNORE = ['node_modules', '.next', '.git', '.vercel'];

  function walk(currentDir: string) {
    for (const entry of readdirSync(currentDir)) {
      if (IGNORE.includes(entry)) continue;
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (extensions.includes(extname(fullPath))) {
        const relativePath = fullPath.slice(ROOT.length + 1);
        // Skip test files for source-scanning tests
        if (relativePath.startsWith('tests/') || relativePath.startsWith('e2e/')) continue;
        results.push({ path: relativePath, content: readFileSync(fullPath, 'utf-8') });
      }
    }
  }
  walk(dir);
  return results;
}

function readAllSourceFiles(): { path: string; content: string }[] {
  return walkDir(ROOT, ['.ts', '.tsx', '.js']);
}

// =============================================================================
// Rule 1: Client-side code must NOT use envRequired/env for NEXT_PUBLIC_ vars
// =============================================================================

describe('Client-side NEXT_PUBLIC_ env var access', () => {
  it('browser Supabase client uses direct process.env access, not envRequired()', () => {
    const source = readFile('lib/supabase/client.ts');
    // Must have direct access
    expect(source).toContain('process.env.NEXT_PUBLIC_SUPABASE_URL');
    expect(source).toContain('process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
    // Must NOT use envRequired or env() wrapper
    expect(source).not.toMatch(/envRequired\s*\(\s*['"]NEXT_PUBLIC_/);
    expect(source).not.toMatch(/\benv\s*\(\s*['"]NEXT_PUBLIC_/);
  });

  it('analytics scripts use direct process.env access for NEXT_PUBLIC_ vars', () => {
    const source = readFile('components/analytics/analytics-scripts.tsx');
    expect(source).toContain('process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID');
    expect(source).toContain('process.env.NEXT_PUBLIC_META_PIXEL_ID');
    expect(source).not.toMatch(/envRequired\s*\(\s*['"]NEXT_PUBLIC_/);
  });

  it('no client component uses envRequired() for NEXT_PUBLIC_ vars', () => {
    // Scan ALL client components for the anti-pattern
    const clientFiles = readAllSourceFiles().filter(f => f.path.startsWith('components/') || f.path.startsWith('app/'));
    const violations: string[] = [];

    for (const file of clientFiles) {
      // Only check files that are client components
      if (!file.content.includes("'use client'")) continue;

      // Check for envRequired('NEXT_PUBLIC_...')
      const match = file.content.match(/envRequired\s*\(\s*['"]NEXT_PUBLIC_[^'"]+['"]\s*\)/g);
      if (match) {
        violations.push(`${file.path}: ${match.join(', ')}`);
      }

      // Also check for env('NEXT_PUBLIC_...') from the utility
      const match2 = file.content.match(/\benv\s*\(\s*['"]NEXT_PUBLIC_[^'"]+['"]\s*\)/g);
      if (match2) {
        // Filter out process.env.NEXT_PUBLIC which is fine
        const realViolations = match2.filter(m => !m.startsWith('process.'));
        if (realViolations.length > 0) {
          violations.push(`${file.path}: ${realViolations.join(', ')}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

// =============================================================================
// Rule 2: Server-side secret keys must use envRequired() for sanitization
// =============================================================================

describe('Server-side secret key sanitization', () => {
  it('Stripe server client uses envRequired for STRIPE_SECRET_KEY', () => {
    const source = readFile('lib/stripe/server.ts');
    expect(source).toMatch(/envRequired\s*\(\s*['"]STRIPE_SECRET_KEY['"]\s*\)/);
  });

  it('Stripe webhook handler uses envRequired for STRIPE_WEBHOOK_SECRET', () => {
    const source = readFile('app/api/stripe/webhook/route.ts');
    expect(source).toMatch(/envRequired\s*\(\s*['"]STRIPE_WEBHOOK_SECRET['"]\s*\)/);
  });

  it('Stripe webhook handler uses envRequired for Supabase service role key', () => {
    const source = readFile('app/api/stripe/webhook/route.ts');
    expect(source).toMatch(/envRequired\s*\(\s*['"]SUPABASE_SERVICE_ROLE_KEY['"]\s*\)/);
    expect(source).toMatch(/envRequired\s*\(\s*['"]NEXT_PUBLIC_SUPABASE_URL['"]\s*\)/);
  });

  it('server Supabase client uses envRequired', () => {
    const source = readFile('lib/supabase/server.ts');
    expect(source).toMatch(/envRequired\s*\(\s*['"]NEXT_PUBLIC_SUPABASE_URL['"]\s*\)/);
    expect(source).toMatch(/envRequired\s*\(\s*['"]NEXT_PUBLIC_SUPABASE_ANON_KEY['"]\s*\)/);
  });

  it('middleware uses envRequired for Supabase keys', () => {
    const source = readFile('middleware.ts');
    expect(source).toMatch(/envRequired\s*\(\s*['"]NEXT_PUBLIC_SUPABASE_URL['"]\s*\)/);
    expect(source).toMatch(/envRequired\s*\(\s*['"]NEXT_PUBLIC_SUPABASE_ANON_KEY['"]\s*\)/);
  });
});

// =============================================================================
// Rule 3: No real secrets in source code
// =============================================================================

describe('No real secrets in source code', () => {
  const sourceFiles = readAllSourceFiles();

  it('no live Stripe secret keys in source code', () => {
    const violations: string[] = [];
    for (const file of sourceFiles) {
      // sk_live_ is a real Stripe secret key
      if (file.content.includes('sk_live_')) {
        violations.push(file.path);
      }
    }
    expect(violations).toEqual([]);
  });

  it('no real webhook secrets in source code (only test placeholders)', () => {
    const violations: string[] = [];
    for (const file of sourceFiles) {
      // Find all whsec_ values
      const matches = file.content.match(/whsec_[A-Za-z0-9]{20,}/g) || [];
      for (const match of matches) {
        // Allow known test placeholders
        if (match === 'whsec_test_placeholder_secret_value') continue;
        if (match === 'whsec_abc123def456') continue;
        if (match.startsWith('whsec_xxx')) continue;
        violations.push(`${file.path}: ${match}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('no real Supabase service role keys in source code', () => {
    const violations: string[] = [];
    for (const file of sourceFiles) {
      // Real service role JWTs have "role":"service_role" in the payload
      // The base64 of that is "cm9sZSI6InNlcnZpY2Vfcm9sZSI"
      if (file.content.includes('cm9sZSI6InNlcnZpY2Vfcm9sZSI')) {
        // Allow the local dev key (from supabase start)
        if (file.content.includes('eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSI')) continue;
        violations.push(file.path);
      }
    }
    expect(violations).toEqual([]);
  });

  it('no SendGrid API keys in source code', () => {
    const violations: string[] = [];
    for (const file of sourceFiles) {
      const matches = file.content.match(/SG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g) || [];
      if (matches.length > 0) {
        violations.push(`${file.path}: ${matches.length} key(s)`);
      }
    }
    expect(violations).toEqual([]);
  });
});

// =============================================================================
// Rule 4: env() utility itself is correct
// =============================================================================

describe('env utility correctness', () => {
  it('env.ts exports env and envRequired functions', () => {
    const source = readFile('lib/utils/env.ts');
    expect(source).toMatch(/export function env\(/);
    expect(source).toMatch(/export function envRequired\(/);
  });

  it('env() strips trailing whitespace using regex', () => {
    const source = readFile('lib/utils/env.ts');
    // Must use a regex or trim to strip trailing chars
    expect(source).toMatch(/replace\(|trim/);
  });

  it('envRequired() throws on empty values', () => {
    const source = readFile('lib/utils/env.ts');
    expect(source).toMatch(/throw new Error/);
  });

  it('env.ts documents the NEXT_PUBLIC_ limitation', () => {
    const source = readFile('lib/utils/env.ts');
    expect(source).toContain('NEXT_PUBLIC_');
    expect(source).toMatch(/client|browser|build.time/i);
  });
});
