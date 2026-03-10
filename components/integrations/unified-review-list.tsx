'use client';

import { useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Chip, Avatar, Rating,
  TextField, ToggleButtonGroup, ToggleButton,
  Select, MenuItem, FormControl, InputLabel,
  Divider,
} from '@mui/material';
import {
  Star, MessageSquare, ExternalLink, Search,
  Globe, Building2,
} from 'lucide-react';
import type { Review, ExternalReview } from '@/lib/types/database';

interface UnifiedReview {
  id: string;
  source: 'internal' | 'google' | 'facebook' | 'yelp';
  rating: number | null;
  comment: string | null;
  reviewer_name: string | null;
  reviewer_avatar: string | null;
  date: string;
  reply_text?: string | null;
  is_positive?: boolean;
  is_public?: boolean;
  has_reply: boolean;
}

const PLATFORM_BADGE: Record<string, { label: string; color: string; bgColor: string }> = {
  internal: { label: 'InsightReviews', color: '#7c3aed', bgColor: '#f3e8ff' },
  google: { label: 'Google', color: '#4285F4', bgColor: '#E8F0FE' },
  facebook: { label: 'Facebook', color: '#1877F2', bgColor: '#E7F3FF' },
  yelp: { label: 'Yelp', color: '#D32323', bgColor: '#FDE8E8' },
};

interface UnifiedReviewListProps {
  internalReviews: Review[];
  externalReviews: ExternalReview[];
  integrations: { id: string; platform: string; platform_account_name: string | null }[];
  isOwner: boolean;
}

export function UnifiedReviewList({
  internalReviews,
  externalReviews,
}: UnifiedReviewListProps) {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Merge all reviews into a unified format
  const allReviews = useMemo<UnifiedReview[]>(() => {
    const internal: UnifiedReview[] = internalReviews.map(r => ({
      id: r.id,
      source: 'internal',
      rating: r.rating,
      comment: r.comment,
      reviewer_name: r.customer_name,
      reviewer_avatar: null,
      date: r.created_at,
      is_positive: r.is_positive,
      is_public: r.is_public,
      has_reply: r.responded,
    }));

    const external: UnifiedReview[] = externalReviews.map(r => ({
      id: r.id,
      source: r.platform as UnifiedReview['source'],
      rating: r.rating,
      comment: r.comment,
      reviewer_name: r.reviewer_name,
      reviewer_avatar: r.reviewer_avatar_url,
      date: r.review_date || r.created_at,
      reply_text: r.reply_text,
      has_reply: !!r.reply_text,
    }));

    return [...internal, ...external];
  }, [internalReviews, externalReviews]);

  // Apply filters and search
  const filtered = useMemo(() => {
    let results = allReviews;

    // Platform filter
    if (platformFilter !== 'all') {
      results = results.filter(r => r.source === platformFilter);
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      const minRating = parseInt(ratingFilter);
      results = results.filter(r => r.rating === minRating);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(r =>
        r.comment?.toLowerCase().includes(q) ||
        r.reviewer_name?.toLowerCase().includes(q)
      );
    }

    // Sort
    results.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'highest') return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === 'lowest') return (a.rating ?? 0) - (b.rating ?? 0);
      return 0;
    });

    return results;
  }, [allReviews, platformFilter, ratingFilter, search, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const total = allReviews.length;
    const withRating = allReviews.filter(r => r.rating);
    const avg = withRating.length > 0
      ? withRating.reduce((sum, r) => sum + (r.rating ?? 0), 0) / withRating.length
      : 0;
    const byPlatform: Record<string, number> = {};
    allReviews.forEach(r => {
      byPlatform[r.source] = (byPlatform[r.source] || 0) + 1;
    });
    return { total, avg, byPlatform };
  }, [allReviews]);

  // Available platforms for filter
  const availablePlatforms = useMemo(() => {
    const platforms = new Set(allReviews.map(r => r.source));
    return Array.from(platforms);
  }, [allReviews]);

  return (
    <Box>
      {/* Stats row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ px: 3, py: 2, borderRadius: 3, flex: '1 1 140px', minWidth: 140 }}>
          <Typography variant="caption" color="text.secondary">Total Reviews</Typography>
          <Typography variant="h4" fontWeight={800}>{stats.total}</Typography>
        </Paper>
        <Paper sx={{ px: 3, py: 2, borderRadius: 3, flex: '1 1 140px', minWidth: 140 }}>
          <Typography variant="caption" color="text.secondary">Average Rating</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h4" fontWeight={800}>{stats.avg.toFixed(1)}</Typography>
            <Star size={20} fill="#f59e0b" color="#f59e0b" />
          </Box>
        </Paper>
        {Object.entries(stats.byPlatform).map(([platform, count]) => (
          <Paper key={platform} sx={{ px: 3, py: 2, borderRadius: 3, flex: '1 1 140px', minWidth: 140 }}>
            <Typography variant="caption" color="text.secondary">
              {PLATFORM_BADGE[platform]?.label || platform}
            </Typography>
            <Typography variant="h4" fontWeight={800}>{count}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{ input: { startAdornment: <Search size={16} style={{ marginRight: 8, opacity: 0.5 }} /> } }}
            sx={{ flex: '1 1 200px', minWidth: 200 }}
          />
          <ToggleButtonGroup
            size="small"
            value={platformFilter}
            exclusive
            onChange={(_, v) => v && setPlatformFilter(v)}
          >
            <ToggleButton value="all">All</ToggleButton>
            {availablePlatforms.map(p => (
              <ToggleButton key={p} value={p}>
                {PLATFORM_BADGE[p]?.label || p}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Rating</InputLabel>
            <Select value={ratingFilter} label="Rating" onChange={(e) => setRatingFilter(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="5">5 stars</MenuItem>
              <MenuItem value="4">4 stars</MenuItem>
              <MenuItem value="3">3 stars</MenuItem>
              <MenuItem value="2">2 stars</MenuItem>
              <MenuItem value="1">1 star</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort</InputLabel>
            <Select value={sortBy} label="Sort" onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="oldest">Oldest</MenuItem>
              <MenuItem value="highest">Highest rated</MenuItem>
              <MenuItem value="lowest">Lowest rated</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Review list */}
      {filtered.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Globe size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <Typography variant="h6" color="text.secondary">
            No reviews yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {allReviews.length === 0
              ? 'Connect your review platforms in Integrations to see reviews here.'
              : 'No reviews match your current filters.'
            }
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((review) => (
            <ReviewCard key={`${review.source}-${review.id}`} review={review} />
          ))}
        </Box>
      )}
    </Box>
  );
}

function ReviewCard({ review }: { review: UnifiedReview }) {
  const badge = PLATFORM_BADGE[review.source];

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={review.reviewer_avatar || undefined}
            sx={{ width: 40, height: 40, bgcolor: badge?.color || '#888' }}
          >
            {review.source === 'internal'
              ? <Building2 size={18} />
              : (review.reviewer_name?.[0]?.toUpperCase() || '?')
            }
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {review.reviewer_name || 'Anonymous'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {review.rating && (
                <Rating value={review.rating} readOnly size="small" />
              )}
              <Chip
                label={badge?.label || review.source}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  backgroundColor: badge?.bgColor,
                  color: badge?.color,
                }}
              />
            </Box>
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {new Date(review.date).toLocaleDateString()}
        </Typography>
      </Box>

      {review.comment && (
        <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.6 }}>
          {review.comment}
        </Typography>
      )}

      {review.reply_text && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <MessageSquare size={14} style={{ marginTop: 3, opacity: 0.5 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Business reply
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {review.reply_text}
              </Typography>
            </Box>
          </Box>
        </>
      )}

      {/* Status badges for internal reviews */}
      {review.source === 'internal' && (
        <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
          {review.is_positive !== undefined && (
            <Chip
              label={review.is_positive ? 'Positive' : 'Negative'}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                backgroundColor: review.is_positive ? '#dcfce7' : '#fee2e2',
                color: review.is_positive ? '#166534' : '#991b1b',
              }}
            />
          )}
          {review.is_public && (
            <Chip
              label="Public"
              size="small"
              icon={<ExternalLink size={12} />}
              sx={{ height: 22, fontSize: '0.7rem', '& .MuiChip-icon': { fontSize: 12 } }}
            />
          )}
          {review.has_reply && (
            <Chip
              label="Responded"
              size="small"
              sx={{ height: 22, fontSize: '0.7rem', backgroundColor: '#dbeafe', color: '#1e40af' }}
            />
          )}
        </Box>
      )}
    </Paper>
  );
}
