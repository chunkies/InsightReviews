'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { Settings2, LayoutGrid, Star } from 'lucide-react';
import { LivePreview } from '@/components/testimonials/live-preview';
import { WallCustomizer } from '@/components/testimonials/wall-customizer';
import { ReviewExperienceForm } from '@/components/testimonials/review-experience-form';
import type { ThankYouConfig } from '@/components/review-form/review-form-content';
import type { WallConfig } from '@/lib/types/wall-config';
import type { Organization, OrganizationIntegration, ReviewPlatform } from '@/lib/types/database';

export interface Platform {
  id: string;
  platform: string;
  platform_name: string | null;
  url: string;
  display_order: number;
  enabled: boolean;
  source: 'manual' | 'integration';
}

interface TestimonialPageTabsProps {
  managerContent: ReactNode;
  initialConfig: WallConfig;
  initialThankYouConfig: ThankYouConfig;
  orgName: string;
  logoUrl: string | null;
  initialPlatforms: Platform[];
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    customer_name: string | null;
    created_at: string;
  }>;
  // WallCustomizer props
  orgId: string;
  wallUrl: string;
  reviewUrl: string;
  // ReviewExperienceForm props
  org: Organization;
  isOwner: boolean;
  integrations: OrganizationIntegration[];
  manualPlatforms: ReviewPlatform[];
}

export function TestimonialPageTabs({
  managerContent,
  initialConfig,
  initialThankYouConfig,
  orgName,
  logoUrl,
  initialPlatforms,
  reviews,
  orgId,
  wallUrl,
  reviewUrl,
  org,
  isOwner,
  integrations,
  manualPlatforms,
}: TestimonialPageTabsProps) {
  const [tab, setTab] = useState(0);
  const [config, setConfig] = useState<WallConfig>(initialConfig);
  const [thankYouConfig, setThankYouConfig] = useState<ThankYouConfig>(initialThankYouConfig);
  const [platforms, setPlatforms] = useState<Platform[]>(initialPlatforms);

  const handleConfigChange = useCallback((newConfig: WallConfig) => {
    setConfig(newConfig);
  }, []);

  const handleThankYouConfigChange = useCallback((newConfig: ThankYouConfig) => {
    setThankYouConfig(newConfig);
  }, []);

  const handlePlatformsChange = useCallback((newPlatforms: Platform[]) => {
    setPlatforms(newPlatforms);
  }, []);

  // Only show enabled platforms in preview
  const enabledPlatforms = platforms
    .filter(p => p.enabled)
    .sort((a, b) => a.display_order - b.display_order)
    .map(p => ({
      id: p.id,
      platform: p.platform,
      platform_name: p.platform_name,
      url: p.url,
      display_order: p.display_order,
    }));

  // Show preview for Customize Design and Review Experience tabs
  const showPreview = tab === 0 || tab === 1;

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            minHeight: 44,
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: 1.5,
          },
        }}
      >
        <Tab
          icon={<Settings2 size={16} />}
          iconPosition="start"
          label="Customize Design"
        />
        <Tab
          icon={<Star size={16} />}
          iconPosition="start"
          label="Review Experience"
        />
        <Tab
          icon={<LayoutGrid size={16} />}
          iconPosition="start"
          label="Manage & Share"
        />
      </Tabs>

      {showPreview ? (
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
          {/* Mobile: preview on top */}
          <Box sx={{ display: { xs: 'block', lg: 'none' }, mb: 2 }}>
            <LivePreview
              config={config}
              orgName={orgName}
              logoUrl={logoUrl}
              platforms={enabledPlatforms}
              thankYouConfig={thankYouConfig}
              reviews={reviews}
            />
          </Box>

          {/* Left column: tab content (scrollable) */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: tab === 0 ? 'block' : 'none' }}>
              <WallCustomizer
                orgId={orgId}
                initialConfig={initialConfig}
                wallUrl={wallUrl}
                reviewUrl={reviewUrl}
                onConfigChange={handleConfigChange}
              />
            </Box>
            <Box sx={{ display: tab === 1 ? 'block' : 'none' }}>
              <ReviewExperienceForm
                org={org}
                isOwner={isOwner}
                integrations={integrations}
                manualPlatforms={manualPlatforms}
                onThankYouConfigChange={handleThankYouConfigChange}
                onPlatformsChange={handlePlatformsChange}
              />
            </Box>
          </Box>

          {/* Right column: sticky preview (desktop only) */}
          <Box
            sx={{
              display: { xs: 'none', lg: 'block' },
              width: 420,
              flexShrink: 0,
              position: 'sticky',
              top: 80,
              alignSelf: 'flex-start',
              maxHeight: 'calc(100vh - 100px)',
              overflowY: 'auto',
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
            }}
          >
            <LivePreview
              config={config}
              orgName={orgName}
              logoUrl={logoUrl}
              platforms={enabledPlatforms}
              thankYouConfig={thankYouConfig}
              reviews={reviews}
            />
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: tab === 2 ? 'block' : 'none' }}>
          {managerContent}
        </Box>
      )}
    </Box>
  );
}
