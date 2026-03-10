'use client';

import { useState, useCallback } from 'react';
import {
  Box, Button, Chip, TextField,
  ToggleButtonGroup, ToggleButton, IconButton, Tooltip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Checkbox, FormControlLabel,
  Menu, MenuItem, ListItemIcon, ListItemText, Snackbar,
} from '@mui/material';
import {
  Star, Eye, EyeOff, Download, MessageSquare,
  Image as ImageIcon, Share2, Copy, Facebook, Twitter, ImageDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import type { Review } from '@/lib/types/database';
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

interface ReviewListProps {
  reviews: Review[];
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
    : (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://localhost:3000');
  return `${siteUrl}/wall/${orgSlug}`;
}

export function ReviewList({ reviews: initialReviews, isOwner, orgEmail, orgName = '', orgSlug = '' }: ReviewListProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [search, setSearch] = useState('');

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

  const filtered = reviews.filter((r) => {
    if (filter === 'positive' && !r.is_positive) return false;
    if (filter === 'negative' && r.is_positive) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        r.customer_name?.toLowerCase().includes(s) ||
        r.comment?.toLowerCase().includes(s)
      );
    }
    return true;
  });

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
    const csv = generateReviewsCsv(filtered);
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

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<Star size={48} />}
        title="No reviews yet"
        description="Send your first review request from the Collect page to get started."
        action={{ label: 'Collect Reviews', href: '/dashboard/collect' }}
      />
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search reviews..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 250 }}
        />
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, v) => v && setFilter(v)}
          size="small"
        >
          <ToggleButton value="all">All ({reviews.length})</ToggleButton>
          <ToggleButton value="positive">
            Positive ({reviews.filter((r) => r.is_positive).length})
          </ToggleButton>
          <ToggleButton value="negative">
            Negative ({reviews.filter((r) => !r.is_positive).length})
          </ToggleButton>
        </ToggleButtonGroup>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Download size={16} />}
          onClick={handleDownloadCsv}
          disabled={filtered.length === 0}
          sx={{ ml: 'auto' }}
        >
          Download CSV
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rating</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Comment</TableCell>
              <TableCell>Photo</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              {isOwner && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={16}
                        fill={s <= review.rating ? RATING_COLORS[review.rating] : 'none'}
                        color={s <= review.rating ? RATING_COLORS[review.rating] : '#d1d5db'}
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>{review.customer_name || '\u2014'}</TableCell>
                <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {review.comment || '\u2014'}
                </TableCell>
                <TableCell>
                  {review.photo_url ? (
                    <Box
                      component="img"
                      src={review.photo_url}
                      alt="Review photo"
                      onClick={() => {
                        setPhotoDialogUrl(review.photo_url);
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
                <TableCell>{format(new Date(review.created_at), 'dd MMM yyyy')}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      label={review.is_positive ? 'Positive' : 'Negative'}
                      color={review.is_positive ? 'success' : 'error'}
                      size="small"
                    />
                    {review.responded && (
                      <Chip
                        label="Responded"
                        color="info"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </TableCell>
                {isOwner && (
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Tooltip title="Respond">
                        <IconButton
                          size="small"
                          onClick={() => openRespondDialog(review)}
                        >
                          <MessageSquare size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={review.is_public ? 'Hide from testimonials' : 'Show on testimonials'}>
                        <IconButton
                          size="small"
                          onClick={() => togglePublic(review.id, review.is_public)}
                        >
                          {review.is_public ? <Eye size={18} /> : <EyeOff size={18} />}
                        </IconButton>
                      </Tooltip>
                      {review.is_positive && (
                        <Tooltip title="Share review">
                          <IconButton
                            size="small"
                            onClick={(e) => handleShareClick(e, review)}
                          >
                            <Share2 size={18} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
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
                {selectedReview.comment && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    &ldquo;{selectedReview.comment}&rdquo;
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
