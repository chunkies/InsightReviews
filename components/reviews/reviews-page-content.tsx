'use client';

import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { Star, Globe, Link2 } from 'lucide-react';
import { ReviewList } from '@/components/reviews/review-list';
import { UnifiedReviewList } from '@/components/integrations/unified-review-list';
import { IntegrationsPanel } from '@/components/integrations/integrations-panel';
import type { Review, ExternalReview, OrganizationIntegration } from '@/lib/types/database';

interface ReviewsPageContentProps {
  reviews: Review[];
  externalReviews: ExternalReview[];
  integrations: OrganizationIntegration[];
  reviewCounts: Record<string, number>;
  isOwner: boolean;
  orgEmail: string | null;
  orgName: string;
  orgSlug: string;
  orgAddress: string;
  organizationId: string;
}

export function ReviewsPageContent({
  reviews,
  externalReviews,
  integrations,
  reviewCounts,
  isOwner,
  orgEmail,
  orgName,
  orgSlug,
  orgAddress,
  organizationId,
}: ReviewsPageContentProps) {
  const [tab, setTab] = useState(0);

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
          icon={<Star size={16} />}
          iconPosition="start"
          label="Your Reviews"
        />
        <Tab
          icon={<Globe size={16} />}
          iconPosition="start"
          label="All Platforms"
        />
        <Tab
          icon={<Link2 size={16} />}
          iconPosition="start"
          label="Integrations"
        />
      </Tabs>

      {tab === 0 && (
        <ReviewList
          reviews={reviews}
          isOwner={isOwner}
          orgEmail={orgEmail}
          orgName={orgName}
          orgSlug={orgSlug}
        />
      )}

      {tab === 1 && (
        <UnifiedReviewList
          internalReviews={reviews}
          externalReviews={externalReviews}
          integrations={integrations}
          isOwner={isOwner}
        />
      )}

      {tab === 2 && (
        <IntegrationsPanel
          integrations={integrations}
          reviewCounts={reviewCounts}
          isOwner={isOwner}
          organizationId={organizationId}
          orgName={orgName}
          orgAddress={orgAddress}
        />
      )}
    </Box>
  );
}
