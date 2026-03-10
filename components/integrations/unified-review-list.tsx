'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Box, Paper, Typography, Chip, Avatar, Rating,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Divider, ToggleButton, Button, CircularProgress, Alert,
} from '@mui/material';
import {
  Star, MessageSquare, Search, Globe, Building2, RefreshCw,
} from 'lucide-react';
import type { Review, ExternalReview } from '@/lib/types/database';

interface UnifiedReview {
  id: string;
  source: string;
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

interface ConnectedPlatform {
  id: string;
  platform: string;
  platform_account_name: string | null;
  sync_enabled: boolean;
  last_synced_at: string | null;
}

const PLATFORM_BADGE: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  gradient: string;
}> = {
  internal: { label: 'InsightReviews', color: '#7c3aed', bgColor: '#f3e8ff', icon: '⭐', gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)' },
  google: { label: 'Google', color: '#4285F4', bgColor: '#E8F0FE', icon: '🔍', gradient: 'linear-gradient(135deg, #4285F4, #34A853)' },
  facebook: { label: 'Facebook', color: '#1877F2', bgColor: '#E7F3FF', icon: '📘', gradient: 'linear-gradient(135deg, #1877F2, #42A5F5)' },
  yelp: { label: 'Yelp', color: '#D32323', bgColor: '#FDE8E8', icon: '🔥', gradient: 'linear-gradient(135deg, #D32323, #FF5722)' },
};

interface UnifiedReviewListProps {
  internalReviews: Review[];
  externalReviews: ExternalReview[];
  connectedPlatforms: ConnectedPlatform[];
}

export function UnifiedReviewList({
  internalReviews,
  externalReviews,
  connectedPlatforms,
}: UnifiedReviewListProps) {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        const total = Object.values(data.results as Record<string, { synced: number }>)
          .reduce((sum, r) => sum + r.synced, 0);
        setSyncMessage(`Synced ${total} reviews. Refresh the page to see updates.`);
      } else {
        try {
          const err = await res.json();
          setSyncMessage(err.error || `Sync failed (${res.status})`);
        } catch {
          setSyncMessage(`Sync failed with status ${res.status}`);
        }
      }
    } catch (e) {
      setSyncMessage(`Sync failed: ${e instanceof Error ? e.message : 'check your connection'}`);
    } finally {
      setSyncing(false);
    }
  }, []);

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
      source: r.platform,
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

  const filtered = useMemo(() => {
    let results = allReviews;
    if (platformFilter !== 'all') {
      results = results.filter(r => r.source === platformFilter);
    }
    if (ratingFilter !== 'all') {
      results = results.filter(r => r.rating === parseInt(ratingFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(r =>
        r.comment?.toLowerCase().includes(q) || r.reviewer_name?.toLowerCase().includes(q)
      );
    }
    results.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'highest') return (b.rating ?? 0) - (a.rating ?? 0);
      return (a.rating ?? 0) - (b.rating ?? 0);
    });
    return results;
  }, [allReviews, platformFilter, ratingFilter, search, sortBy]);

  // Stats per platform
  const stats = useMemo(() => {
    const byPlatform: Record<string, { count: number; totalRating: number; ratedCount: number }> = {};
    allReviews.forEach(r => {
      if (!byPlatform[r.source]) {
        byPlatform[r.source] = { count: 0, totalRating: 0, ratedCount: 0 };
      }
      byPlatform[r.source].count++;
      if (r.rating) {
        byPlatform[r.source].totalRating += r.rating;
        byPlatform[r.source].ratedCount++;
      }
    });
    return byPlatform;
  }, [allReviews]);

  // Build filter platforms: always show "internal" + all connected platforms
  const filterPlatforms = useMemo(() => {
    const platforms = new Set<string>();
    platforms.add('internal');
    connectedPlatforms.forEach(p => platforms.add(p.platform));
    // Also include any platforms that have reviews (in case integration was disconnected)
    Object.keys(stats).forEach(p => platforms.add(p));
    return Array.from(platforms);
  }, [connectedPlatforms, stats]);

  const totalReviews = allReviews.length;
  const totalRated = allReviews.filter(r => r.rating).reduce((sum, r) => sum + (r.rating ?? 0), 0);
  const avgRating = allReviews.filter(r => r.rating).length > 0
    ? totalRated / allReviews.filter(r => r.rating).length
    : 0;

  return (
    <Box>
      {/* Sync bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {connectedPlatforms.length} platform{connectedPlatforms.length !== 1 ? 's' : ''} connected
          {connectedPlatforms.length > 0 && connectedPlatforms[0].last_synced_at && (
            <> &middot; Last synced {new Date(connectedPlatforms[0].last_synced_at).toLocaleDateString()}</>
          )}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={syncing ? <CircularProgress size={14} /> : <RefreshCw size={14} />}
          onClick={handleSync}
          disabled={syncing || connectedPlatforms.length === 0}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </Box>

      {syncMessage && (
        <Alert severity={syncMessage.includes('failed') ? 'error' : 'success'} sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSyncMessage(null)}>
          {syncMessage}
        </Alert>
      )}

      {/* Platform filter chips with stats */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <ToggleButton
          value="all"
          selected={platformFilter === 'all'}
          onChange={() => setPlatformFilter('all')}
          sx={{
            border: 'none',
            borderRadius: '12px !important',
            px: 2.5,
            py: 1,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.85rem',
            gap: 1,
            backgroundColor: platformFilter === 'all' ? 'primary.main' : 'action.hover',
            color: platformFilter === 'all' ? 'white' : 'text.primary',
            '&:hover': { backgroundColor: platformFilter === 'all' ? 'primary.dark' : 'action.selected' },
            '&.Mui-selected': { backgroundColor: 'primary.main', color: 'white' },
          }}
        >
          <Globe size={16} />
          All ({totalReviews})
        </ToggleButton>

        {filterPlatforms.map(platform => {
          const badge = PLATFORM_BADGE[platform] || { label: platform, color: '#666', bgColor: '#f5f5f5', icon: '📋', gradient: '#666' };
          const s = stats[platform] || { count: 0, totalRating: 0, ratedCount: 0 };
          const isActive = platformFilter === platform;
          return (
            <ToggleButton
              key={platform}
              value={platform}
              selected={isActive}
              onChange={() => setPlatformFilter(isActive ? 'all' : platform)}
              sx={{
                border: 'none',
                borderRadius: '12px !important',
                px: 2.5,
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                gap: 1,
                backgroundColor: isActive ? badge.color : badge.bgColor,
                color: isActive ? 'white' : badge.color,
                '&:hover': {
                  backgroundColor: isActive ? badge.color : badge.bgColor,
                  filter: 'brightness(0.95)',
                },
                '&.Mui-selected': {
                  backgroundColor: badge.color,
                  color: 'white',
                },
              }}
            >
              <span>{badge.icon}</span>
              {badge.label} ({s.count})
            </ToggleButton>
          );
        })}
      </Box>

      {/* Stats cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Paper
          elevation={0}
          sx={{
            px: 3, py: 2, borderRadius: 3, flex: '1 1 160px', minWidth: 160,
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            border: '1px solid #bae6fd',
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Reviews</Typography>
          <Typography variant="h4" fontWeight={800}>{totalReviews}</Typography>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            px: 3, py: 2, borderRadius: 3, flex: '1 1 160px', minWidth: 160,
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1px solid #fde68a',
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={600}>Average Rating</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h4" fontWeight={800}>{avgRating.toFixed(1)}</Typography>
            <Star size={20} fill="#f59e0b" color="#f59e0b" />
          </Box>
        </Paper>
        {filterPlatforms.map(platform => {
          const badge = PLATFORM_BADGE[platform] || { label: platform, color: '#666', bgColor: '#f5f5f5', icon: '📋' };
          const s = stats[platform] || { count: 0, totalRating: 0, ratedCount: 0 };
          const avg = s.ratedCount > 0 ? (s.totalRating / s.ratedCount).toFixed(1) : '—';
          return (
            <Paper
              key={platform}
              elevation={0}
              sx={{
                px: 3, py: 2, borderRadius: 3, flex: '1 1 140px', minWidth: 140,
                background: badge.bgColor,
                border: `1px solid ${badge.color}30`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <span style={{ fontSize: 14 }}>{badge.icon}</span>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {badge.label}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h5" fontWeight={800}>{s.count}</Typography>
                <Typography variant="caption" color="text.secondary">avg {avg}</Typography>
              </Box>
            </Paper>
          );
        })}
      </Box>

      {/* Search and sort */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{ input: { startAdornment: <Search size={16} style={{ marginRight: 8, opacity: 0.4 }} /> } }}
            sx={{ flex: '1 1 250px', minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Rating</InputLabel>
            <Select value={ratingFilter} label="Rating" onChange={(e) => setRatingFilter(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              {[5, 4, 3, 2, 1].map(n => (
                <MenuItem key={n} value={String(n)}>{n} star{n !== 1 ? 's' : ''}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Sort by</InputLabel>
            <Select value={sortBy} label="Sort by" onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
              <MenuItem value="newest">Newest first</MenuItem>
              <MenuItem value="oldest">Oldest first</MenuItem>
              <MenuItem value="highest">Highest rated</MenuItem>
              <MenuItem value="lowest">Lowest rated</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Review list */}
      {filtered.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Globe size={48} style={{ opacity: 0.15, marginBottom: 16 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            No reviews found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {allReviews.length === 0
              ? 'Connect your review platforms in the Integrations tab, then click "Sync Now" to pull in your reviews.'
              : 'Try adjusting your filters or search query.'
            }
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filtered.map((review) => (
            <ReviewCard key={`${review.source}-${review.id}`} review={review} />
          ))}
        </Box>
      )}
    </Box>
  );
}

function ReviewCard({ review }: { review: UnifiedReview }) {
  const badge = PLATFORM_BADGE[review.source] || { label: review.source, color: '#666', bgColor: '#f5f5f5', gradient: '#666' };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'border-color 0.15s ease',
        '&:hover': { borderColor: badge.color || 'primary.main' },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={review.reviewer_avatar || undefined}
            sx={{
              width: 38,
              height: 38,
              background: badge.gradient || '#888',
              fontSize: '0.9rem',
            }}
          >
            {review.source === 'internal'
              ? <Building2 size={16} />
              : (review.reviewer_name?.[0]?.toUpperCase() || '?')
            }
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                {review.reviewer_name || 'Anonymous'}
              </Typography>
              <Chip
                label={badge.label || review.source}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  letterSpacing: 0.3,
                  backgroundColor: badge.bgColor,
                  color: badge.color,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            </Box>
            {review.rating && (
              <Rating value={review.rating} readOnly size="small" sx={{ mt: 0.25 }} />
            )}
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {new Date(review.date).toLocaleDateString()}
        </Typography>
      </Box>

      {review.comment && (
        <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.6, color: 'text.secondary' }}>
          {review.comment}
        </Typography>
      )}

      {review.reply_text && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', pl: 1 }}>
            <MessageSquare size={13} style={{ marginTop: 3, opacity: 0.4 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Business reply
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                {review.reply_text}
              </Typography>
            </Box>
          </Box>
        </>
      )}

      {review.source === 'internal' && (
        <Box sx={{ display: 'flex', gap: 0.75, mt: 1.5 }}>
          <Chip
            label={review.is_positive ? 'Positive' : 'Negative'}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 600,
              backgroundColor: review.is_positive ? '#dcfce7' : '#fee2e2',
              color: review.is_positive ? '#166534' : '#991b1b',
            }}
          />
          {review.has_reply && (
            <Chip
              label="Responded"
              size="small"
              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, backgroundColor: '#dbeafe', color: '#1e40af' }}
            />
          )}
        </Box>
      )}
    </Paper>
  );
}
