import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// =============================================================================
// Type Safety — No `as unknown as` double casts
// =============================================================================

describe('Type safety — no unsafe double casts (as unknown as)', () => {
  const filesToCheck = [
    { path: 'middleware.ts', label: 'middleware.ts' },
    { path: 'app/dashboard/layout.tsx', label: 'dashboard layout' },
    { path: 'app/dashboard/page.tsx', label: 'dashboard page' },
    { path: 'app/dashboard/integrations/page.tsx', label: 'integrations page' },
    { path: 'app/dashboard/testimonials/page.tsx', label: 'testimonials page' },
  ];

  for (const { path, label } of filesToCheck) {
    it(`${label} does not contain "as unknown as" double casts`, () => {
      const source = readFileSync(resolve(__dirname, '..', path), 'utf-8');
      const matches = source.match(/as unknown as/g);
      expect(matches).toBeNull();
    });
  }

  it('no source files in app/ or lib/ contain "as unknown as"', () => {
    // Broader sweep: check all key directories
    const { execSync } = require('child_process');
    const rootDir = resolve(__dirname, '..');
    const result = execSync(
      `grep -r "as unknown as" --include="*.ts" --include="*.tsx" "${rootDir}/app" "${rootDir}/lib" "${rootDir}/middleware.ts" || true`,
      { encoding: 'utf-8' },
    );
    expect(result.trim()).toBe('');
  });
});
