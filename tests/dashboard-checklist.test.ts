import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════════
// Dashboard getting started checklist — order, links, visibility
// ═══════════════════════════════════════════════════════════════════════════════

interface ChecklistItem {
  label: string;
  done: boolean;
  href: string;
}

// Mirror the checklist logic from dashboard-stats.tsx
function buildChecklist(totalReviews: number): ChecklistItem[] {
  return [
    {
      label: 'Print your QR code for the counter',
      done: false,
      href: '/dashboard/collect',
    },
    {
      label: 'Connect a review platform',
      done: false,
      href: '/dashboard/integrations',
    },
    {
      label: 'Send your first review request',
      done: totalReviews > 0,
      href: '/dashboard/collect',
    },
    {
      label: 'Customize your testimonial wall',
      done: false,
      href: '/dashboard/testimonials',
    },
    {
      label: 'Invite your team',
      done: false,
      href: '/dashboard/staff',
    },
  ];
}

// Mirror the visibility logic
function showChecklist(totalReviews: number): boolean {
  return totalReviews < 5;
}

describe('Dashboard checklist — item order and content', () => {
  it('QR code item is first in the list', () => {
    const items = buildChecklist(0);
    expect(items[0].label).toBe('Print your QR code for the counter');
  });

  it('QR code links to collect reviews page', () => {
    const items = buildChecklist(0);
    expect(items[0].href).toBe('/dashboard/collect');
  });

  it('has 5 checklist items total', () => {
    const items = buildChecklist(0);
    expect(items).toHaveLength(5);
  });

  it('items are in correct order', () => {
    const items = buildChecklist(0);
    expect(items.map(i => i.label)).toEqual([
      'Print your QR code for the counter',
      'Connect a review platform',
      'Send your first review request',
      'Customize your testimonial wall',
      'Invite your team',
    ]);
  });

  it('all items link to dashboard sub-pages', () => {
    const items = buildChecklist(0);
    for (const item of items) {
      expect(item.href).toMatch(/^\/dashboard\//);
    }
  });
});

describe('Dashboard checklist — done states', () => {
  it('review request item is not done when 0 reviews', () => {
    const items = buildChecklist(0);
    const sendItem = items.find(i => i.label.includes('first review request'));
    expect(sendItem!.done).toBe(false);
  });

  it('review request item is done when reviews exist', () => {
    const items = buildChecklist(1);
    const sendItem = items.find(i => i.label.includes('first review request'));
    expect(sendItem!.done).toBe(true);
  });

  it('QR code item starts as not done', () => {
    const items = buildChecklist(0);
    expect(items[0].done).toBe(false);
  });
});

describe('Dashboard checklist — visibility', () => {
  it('shows checklist when fewer than 5 reviews', () => {
    expect(showChecklist(0)).toBe(true);
    expect(showChecklist(1)).toBe(true);
    expect(showChecklist(4)).toBe(true);
  });

  it('hides checklist when 5 or more reviews', () => {
    expect(showChecklist(5)).toBe(false);
    expect(showChecklist(10)).toBe(false);
    expect(showChecklist(100)).toBe(false);
  });
});
