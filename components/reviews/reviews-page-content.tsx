'use client';

import { Box } from '@mui/material';
import { ReviewList } from '@/components/reviews/review-list';
import type { Review, ExternalReview } from '@/lib/types/database';

interface ConnectedPlatform {
  id: string;
  platform: string;
  platform_account_name: string | null;
  sync_enabled: boolean;
  last_synced_at: string | null;
}

interface ReviewsPageContentProps {
  reviews: Review[];
  externalReviews: ExternalReview[];
  connectedPlatforms: ConnectedPlatform[];
  isOwner: boolean;
  orgEmail: string | null;
  orgName: string;
  orgSlug: string;
}

export function ReviewsPageContent({
  reviews,
  externalReviews,
  connectedPlatforms,
  isOwner,
  orgEmail,
  orgName,
  orgSlug,
}: ReviewsPageContentProps) {
  return (
    <Box>
      <ReviewList
        reviews={reviews}
        externalReviews={externalReviews}
        connectedPlatforms={connectedPlatforms}
        isOwner={isOwner}
        orgEmail={orgEmail}
        orgName={orgName}
        orgSlug={orgSlug}
      />
    </Box>
  );
}
