'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Box, Button, Chip, TextField,
  ToggleButtonGroup, ToggleButton, IconButton, Tooltip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Checkbox, FormControlLabel,
  Menu, MenuItem, ListItemIcon, ListItemText, Snackbar,
  Select, FormControl, InputLabel, CircularProgress, Alert,
} from '@mui/material';
import {
  Star, Eye, EyeOff, Download, MessageSquare,
  Image as ImageIcon, Share2, Copy, Facebook, Twitter, ImageDown,
  Globe, RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import type { Review, ExternalReview } from '@/lib/types/database';
import { RATING_COLORS } from '@/lib/utils/constants';
import { EmptyState } from '@/components/shared/empty-state';
import { generateReviewsCsv, downloadCsv } from '@/lib/utils/generate-csv';
import { generateReviewCard } from '@/lib/utils/share-card';

interface ResponseTemplate {
  label: string;
  template: string;
}

const RESPONSE_TEMPLATES: ResponseTemplate[] = [
  {
    label: 'Thank You',
    template:
      "Thank you for your wonderful feedback, {customer_name}! We're so glad you had a great experience.",
  },
  {
    label: 'Follow Up',
    template:
      'Thank you for letting us know, {customer_name}. We take all feedback seriously and would love to make things right. Could we reach out to discuss?',
  },
  {
    label: 'Apology',
    template:
      "We're sorry to hear about your experience, {customer_name}. This isn't the standard we hold ourselves to. We'd like to make this right \u2014 please contact us at {email}.",
  },
  {
    label: 'Invitation',
    template:
      "Thank you {customer_name}! We'd love to see you again soon. Your next visit is on us!",
  },
];

const PLATFORM_BADGE: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  internal: { label: 'InsightReviews', color: '#7c3aed', bgColor: 'rgba(124, 58, 237, 0.12)', icon: '\u2B50' },
  google: { label: 'Google', color: '#4285F4', bgColor: 'rgba(66, 133, 244, 0.12)', icon: '\uD83D\uDD0D' },
  facebook: { label: 'Facebook', color: '#1877F2', bgColor: 'rgba(24, 119, 242, 0.12)', icon: '\uD83D\uDCD8' },
  yelp: { label: 'Yelp', color: '#D32323', bgColor: 'rgba(211, 35, 35, 0.12)', icon: '\uD83D\uDD25' },
};

interface ConnectedPlatform {
  id: string;
  platform: string;
  platform_account_name: string | null;
  sync_enabled: boolean;
  last_synced_at: string | null;
}

/** Unified row type for the table */
interface UnifiedRow {
  id: string;
  source: string; // 'internal' | 'google' | 'facebook' | 'yelp'
  rating: number | null;
  comment: string | null;
  reviewer_name: string | null;
  date: string;
  // Internal-only fields
  is_positive?: boolean;
  is_public?: boolean;
  responded?: boolean;
  response_notes?: string | null;
  photo_url?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  review_request_id?: string | null;
  // External-only fields
  reply_text?: string | null;
  // Original review ref for internal actions
  _internalReview?: Review;
}

interface ReviewListProps {
  reviews: Review[];
  externalReviews?: ExternalReview[];
  connectedPlatforms?: ConnectedPlatform[];
  isOwner: boolean;
  orgEmail?: string | null;
  orgName?: string;
  orgSlug?: string;
}

function buildStarString(rating: number): string {
  return Array.from({ length: rating }, () => '\u2B50').join('');
}

function getShareText(review: Review): string {
  const stars = buildStarString(review.rating);
  const comment = review.comment ? `'${review.comment}'` : '';
  const name = review.customer_name || 'A Customer';
  const parts = [stars];
  if (comment) parts.push(`- ${comment}`);
  parts.push(`\u2014 ${name} | via InsightReviews`);
  return parts.join(' ');
}

function getWallUrl(orgSlug: string): string {
  const siteUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://localhost:3000').trim();
  return `${siteUrl}/wall/${orgSlug}`;
}

export function ReviewList({
  reviews: initialReviews,
  externalReviews = [],
  connectedPlatforms = [],
  isOwner,
  orgEmail,
  orgName = '',
  orgSlug = '',
}: ReviewListProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Response dialog state
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [markResponded, setMarkResponded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [photoDialogUrl, setPhotoDialogUrl] = useState<string | null>(null);

  // Share menu state
  const [shareAnchorEl, setShareAnchorEl] = useState<HTMLElement | null>(null);
  const [shareReview, setShareReview] = useState<Review | null>(null);
  const [snackMessage, setSnackMessage] = useState<string | null>(null);

  // Build unified rows
  const allRows = useMemo<UnifiedRow[]>(() => {
    const internalRows: UnifiedRow[] = reviews.map(r => ({
      id: r.id,
      source: 'internal',
      rating: r.rating,
      comment: r.comment,
      reviewer_name: r.customer_name,
      date: r.created_at,
      is_positive: r.is_positive,
      is_public: r.is_public,
      responded: r.responded,
      response_notes: r.response_notes,
      photo_url: r.photo_url,
      customer_phone: r.customer_phone,
      customer_email: r.customer_email,
      review_request_id: r.review_request_id,
      _internalReview: r,
    }));

    const externalRows: UnifiedRow[] = externalReviews.map(r => ({
      id: r.id,
      source: r.platform,
      rating: r.rating,
      comment: r.comment,
      reviewer_name: r.reviewer_name,
      date: r.review_date || r.created_at,
      reply_text: r.reply_text,
    }));

    return [...internalRows, ...externalRows];
  }, [reviews, externalReviews]);

  // Platform stats
  const platformStats = useMemo(() => {
    const stats: Record<string, number> = {};
    allRows.forEach(r => {
      stats[r.source] = (stats[r.source] || 0) + 1;
    });
    return stats;
  }, [allRows]);

  // Available platforms for filter
  const filterPlatforms = useMemo(() => {
    const platforms = new Set<string>();
    platforms.add('internal');
    connectedPlatforms.forEach(p => platforms.add(p.platform));
    Object.keys(platformStats).forEach(p => platforms.add(p));
    return Array.from(platforms);
  }, [connectedPlatforms, platformStats]);

  const hasExternalReviews = externalReviews.length > 0 || connectedPlatforms.length > 0;

  // Filter and sort
  const filtered = useMemo(() => {
    let results = allRows;

    // Platform filter
    if (platformFilter !== 'all') {
      results = results.filter(r => r.source === platformFilter);
    }

    // Positive/negative filter (only applies to internal reviews, or show all external)
    if (filter === 'positive') {
      results = results.filter(r => r.source !== 'internal' || r.is_positive);
    } else if (filter === 'negative') {
      results = results.filter(r => r.source === 'internal' && !r.is_positive);
    }

    // Search
    if (search) {
      const s = search.toLowerCase();
      results = results.filter(r =>
        r.reviewer_name?.toLowerCase().includes(s) ||
        r.comment?.toLowerCase().includes(s)
      );
    }

    // Sort
    results = [...results].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'highest') return (b.rating ?? 0) - (a.rating ?? 0);
      return (a.rating ?? 0) - (b.rating ?? 0);
    });

    return results;
  }, [allRows, platformFilter, filter, search, sortBy]);

  // Sync handler
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

  async function togglePublic(reviewId: string, currentPublic: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from('reviews')
      .update({ is_public: !currentPublic })
      .eq('id', reviewId);

    if (!error) {
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, is_public: !currentPublic } : r))
      );
    }
  }

  function handleDownloadCsv() {
    // Only export internal reviews that match current filters
    const internalFiltered = filtered
      .filter(r => r._internalReview)
      .map(r => r._internalReview!);
    const csv = generateReviewsCsv(internalFiltered);
    const today = format(new Date(), 'dd-MM-yyyy');
    downloadCsv(csv, `reviews-export-${today}.csv`);
  }

  function openRespondDialog(review: Review) {
    setSelectedReview(review);
    setResponseNotes(review.response_notes ?? '');
    setMarkResponded(review.responded);
    setRespondDialogOpen(true);
  }

  function closeRespondDialog() {
    setRespondDialogOpen(false);
    setSelectedReview(null);
    setResponseNotes('');
    setMarkResponded(false);
  }

  function applyTemplate(template: string) {
    if (!selectedReview) return;
    const customerName = selectedReview.customer_name || 'there';
    const email = orgEmail || 'our team';
    const filled = template
      .replace(/\{customer_name\}/g, customerName)
      .replace(/\{email\}/g, email);
    setResponseNotes(filled);
  }

  async function handleSaveResponse() {
    if (!selectedReview) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('reviews')
      .update({
        response_notes: responseNotes || null,
        responded: markResponded,
      })
      .eq('id', selectedReview.id);

    if (!error) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === selectedReview.id
            ? { ...r, response_notes: responseNotes || null, responded: markResponded }
            : r
        )
      );
      closeRespondDialog();
    }
    setSaving(false);
  }

  // Share handlers
  const handleShareClick = useCallback((event: React.MouseEvent<HTMLElement>, review: Review) => {
    setShareAnchorEl(event.currentTarget);
    setShareReview(review);
  }, []);

  const handleShareClose = useCallback(() => {
    setShareAnchorEl(null);
    setShareReview(null);
  }, []);

  const handleCopyText = useCallback(async () => {
    if (!shareReview) return;
    const text = getShareText(shareReview);
    try {
      await navigator.clipboard.writeText(text);
      setSnackMessage('Review copied to clipboard');
    } catch {
      setSnackMessage('Failed to copy');
    }
    handleShareClose();
  }, [shareReview, handleShareClose]);

  const handleShareFacebook = useCallback(() => {
    if (!shareReview) return;
    const wallUrl = getWallUrl(orgSlug);
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(wallUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    handleShareClose();
  }, [shareReview, orgSlug, handleShareClose]);

  const handleShareTwitter = useCallback(() => {
    if (!shareReview) return;
    const text = getShareText(shareReview);
    const wallUrl = getWallUrl(orgSlug);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(wallUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    handleShareClose();
  }, [shareReview, orgSlug, handleShareClose]);

  const handleDownloadImage = useCallback(async () => {
    if (!shareReview) return;
    try {
      const blob = await generateReviewCard(
        {
          rating: shareReview.rating,
          comment: shareReview.comment,
          customerName: shareReview.customer_name,
        },
        orgName,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = shareReview.customer_name?.replace(/\s+/g, '-').toLowerCase() || 'review';
      a.download = `review-${safeName}-${shareReview.rating}star.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSnackMessage('Review card downloaded');
    } catch {
      setSnackMessage('Failed to generate image');
    }
    handleShareClose();
  }, [shareReview, orgName, handleShareClose]);

  if (allRows.length === 0) {
    return (
      <EmptyState
        icon={<Star size={48} />}
        title="No reviews yet"
        description="Send your first review request from the Collect page to get started."
        action={{ label: 'Collect Reviews', href: '/dashboard/collect' }}
      />
    );
  }

  const _internalCount = reviews.length;
  const positiveCount = reviews.filter(r => r.is_positive).length;
  const negativeCount = reviews.filter(r => !r.is_positive).length;

  return (
    <Box>
      {/* Platform filter chips */}
      {hasExternalReviews && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <ToggleButton
            value="all"
            selected={platformFilter === 'all'}
            onChange={() => setPlatformFilter('all')}
            sx={{
              border: 'none',
              borderRadius: '12px !important',
              px: 2,
              py: 0.75,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              gap: 0.75,
              backgroundColor: platformFilter === 'all' ? 'primary.main' : 'action.hover',
              color: platformFilter === 'all' ? 'white' : 'text.primary',
              '&:hover': { backgroundColor: platformFilter === 'all' ? 'primary.dark' : 'action.selected' },
              '&.Mui-selected': { backgroundColor: 'primary.main', color: 'white' },
            }}
          >
            <Globe size={15} />
            All ({allRows.length})
          </ToggleButton>

          {filterPlatforms.map(platform => {
            const badge = PLATFORM_BADGE[platform] || { label: platform, color: '#666', bgColor: 'rgba(102, 102, 102, 0.12)', icon: '\uD83D\uDCCB' };
            const count = platformStats[platform] || 0;
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
                  px: 2,
                  py: 0.75,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  gap: 0.75,
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
                {badge.label} ({count})
              </ToggleButton>
            );
          })}

          {/* Sync button */}
          {connectedPlatforms.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              startIcon={syncing ? <CircularProgress size={14} /> : <RefreshCw size={14} />}
              onClick={handleSync}
              disabled={syncing}
              sx={{ textTransform: 'none', borderRadius: 3, ml: 'auto' }}
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          )}
        </Box>
      )}

      {syncMessage && (
        <Alert
          severity={syncMessage.includes('failed') ? 'error' : 'success'}
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setSyncMessage(null)}
        >
          {syncMessage}
        </Alert>
      )}

      {/* Filters row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search reviews..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 250 } }}
        />
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, v) => v && setFilter(v)}
          size="small"
        >
          <ToggleButton value="all">All ({platformFilter === 'all' ? allRows.length : filtered.length})</ToggleButton>
          <ToggleButton value="positive">
            Positive ({positiveCount})
          </ToggleButton>
          <ToggleButton value="negative">
            Negative ({negativeCount})
          </ToggleButton>
        </ToggleButtonGroup>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Sort by</InputLabel>
          <Select value={sortBy} label="Sort by" onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <MenuItem value="newest">Newest first</MenuItem>
            <MenuItem value="oldest">Oldest first</MenuItem>
            <MenuItem value="highest">Highest rated</MenuItem>
            <MenuItem value="lowest">Lowest rated</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Download size={16} />}
          onClick={handleDownloadCsv}
          disabled={filtered.filter(r => r.source === 'internal').length === 0}
          sx={{ ml: 'auto' }}
        >
          Download CSV
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: { xs: '100%', md: 900 } }}>
          <TableHead>
            <TableRow>
              {hasExternalReviews && <TableCell>Source</TableCell>}
              <TableCell>Rating</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Comment</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Photo</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Date</TableCell>
              <TableCell>Status</TableCell>
              {isOwner && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((row) => {
              const badge = PLATFORM_BADGE[row.source] || { label: row.source, color: '#666', bgColor: 'rgba(102, 102, 102, 0.12)', icon: '\uD83D\uDCCB' };
              const isInternal = row.source === 'internal';

              return (
                <TableRow key={`${row.source}-${row.id}`}>
                  {hasExternalReviews && (
                    <TableCell>
                      <Chip
                        label={badge.label}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: badge.bgColor,
                          color: badge.color,
                          '& .MuiChip-label': { px: 1 },
                        }}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={16}
                          fill={row.rating && s <= row.rating ? RATING_COLORS[row.rating as keyof typeof RATING_COLORS] || '#d1d5db' : 'none'}
                          color={row.rating && s <= row.rating ? RATING_COLORS[row.rating as keyof typeof RATING_COLORS] || '#d1d5db' : '#d1d5db'}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>{row.reviewer_name || '\u2014'}</TableCell>
                  <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.comment || '\u2014'}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    {isInternal && row.photo_url ? (
                      <Box
                        component="img"
                        src={row.photo_url}
                        alt="Review photo"
                        onClick={() => {
                          setPhotoDialogUrl(row.photo_url!);
                          setPhotoDialogOpen(true);
                        }}
                        sx={{
                          width: 48,
                          height: 48,
                          objectFit: 'cover',
                          borderRadius: 1,
                          cursor: 'pointer',
                          border: '1px solid rgba(0,0,0,0.1)',
                          transition: 'opacity 0.2s',
                          '&:hover': { opacity: 0.8 },
                        }}
                      />
                    ) : (
                      <Box sx={{ color: 'text.disabled' }}>
                        <ImageIcon size={18} />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    {format(new Date(row.date), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {isInternal ? (
                        <>
                          <Chip
                            label={row.is_positive ? 'Positive' : 'Negative'}
                            color={row.is_positive ? 'success' : 'error'}
                            size="small"
                          />
                          {row.responded && (
                            <Chip
                              label="Responded"
                              color="info"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </>
                      ) : (
                        <>
                          {row.reply_text && (
                            <Chip
                              label="Replied"
                              color="info"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </>
                      )}
                    </Box>
                  </TableCell>
                  {isOwner && (
                    <TableCell align="right">
                      {isInternal && row._internalReview ? (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="Respond">
                            <IconButton
                              size="small"
                              onClick={() => openRespondDialog(row._internalReview!)}
                            >
                              <MessageSquare size={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={row.is_public ? 'Hide from testimonials' : 'Show on testimonials'}>
                            <IconButton
                              size="small"
                              onClick={() => togglePublic(row.id, row.is_public!)}
                            >
                              {row.is_public ? <Eye size={18} /> : <EyeOff size={18} />}
                            </IconButton>
                          </Tooltip>
                          {row.is_positive && (
                            <Tooltip title="Share review">
                              <IconButton
                                size="small"
                                onClick={(e) => handleShareClick(e, row._internalReview!)}
                              >
                                <Share2 size={18} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.disabled">\u2014</Typography>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Share Menu */}
      <Menu
        anchorEl={shareAnchorEl}
        open={Boolean(shareAnchorEl)}
        onClose={handleShareClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleCopyText}>
          <ListItemIcon><Copy size={18} /></ListItemIcon>
          <ListItemText>Copy as text</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShareFacebook}>
          <ListItemIcon><Facebook size={18} /></ListItemIcon>
          <ListItemText>Share to Facebook</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShareTwitter}>
          <ListItemIcon><Twitter size={18} /></ListItemIcon>
          <ListItemText>Share to X / Twitter</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownloadImage}>
          <ListItemIcon><ImageDown size={18} /></ListItemIcon>
          <ListItemText>Download as image</ListItemText>
        </MenuItem>
      </Menu>

      {/* Feedback snackbar */}
      <Snackbar
        open={Boolean(snackMessage)}
        autoHideDuration={3000}
        onClose={() => setSnackMessage(null)}
        message={snackMessage}
      />

      {/* Photo Preview Dialog */}
      <Dialog
        open={photoDialogOpen}
        onClose={() => setPhotoDialogOpen(false)}
        maxWidth="md"
      >
        <DialogContent sx={{ p: 1 }}>
          {photoDialogUrl && (
            <Box
              component="img"
              src={photoDialogUrl}
              alt="Review photo"
              sx={{
                maxWidth: '100%',
                maxHeight: '80vh',
                display: 'block',
                borderRadius: 1,
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog
        open={respondDialogOpen}
        onClose={closeRespondDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Respond to Review</DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Box>
              <Paper variant="outlined" sx={{ p: 2, mb: 3, mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      fill={s <= selectedReview.rating ? RATING_COLORS[selectedReview.rating] : 'none'}
                      color={s <= selectedReview.rating ? RATING_COLORS[selectedReview.rating] : '#d1d5db'}
                    />
                  ))}
                </Box>
                <Typography variant="subtitle2">
                  {selectedReview.customer_name || 'Anonymous'}
                </Typography>
                {(selectedReview.customer_email || selectedReview.customer_phone) && (
                  <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                    {selectedReview.customer_email || selectedReview.customer_phone}
                  </Typography>
                )}
                {selectedReview.comment && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    &ldquo;{selectedReview.comment}&rdquo;
                  </Typography>
                )}
                {!selectedReview.customer_email && !selectedReview.customer_phone && !selectedReview.review_request_id && (
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                    No contact info — customer submitted via QR code without providing email or phone.
                  </Typography>
                )}
              </Paper>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Quick Templates
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {RESPONSE_TEMPLATES.map((t) => (
                  <Button
                    key={t.label}
                    variant="outlined"
                    size="small"
                    onClick={() => applyTemplate(t.template)}
                  >
                    {t.label}
                  </Button>
                ))}
              </Box>

              <TextField
                label="Response Notes"
                multiline
                minRows={4}
                maxRows={8}
                fullWidth
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                placeholder="Write a private response note..."
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={markResponded}
                    onChange={(e) => setMarkResponded(e.target.checked)}
                  />
                }
                label="Mark as Responded"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRespondDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveResponse}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
