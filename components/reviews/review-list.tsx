'use client';

import { useState } from 'react';
import {
  Box, Chip, TextField,
  ToggleButtonGroup, ToggleButton, IconButton, Tooltip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
} from '@mui/material';
import { Star, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import type { Review } from '@/lib/types/database';
import { RATING_COLORS } from '@/lib/utils/constants';
import { EmptyState } from '@/components/shared/empty-state';

interface ReviewListProps {
  reviews: Review[];
  isOwner: boolean;
}

export function ReviewList({ reviews: initialReviews, isOwner }: ReviewListProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [search, setSearch] = useState('');

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
    await supabase
      .from('reviews')
      .update({ is_public: !currentPublic })
      .eq('id', reviewId);

    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, is_public: !currentPublic } : r))
    );
  }

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
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
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
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rating</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Comment</TableCell>
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
                <TableCell>{review.customer_name || '—'}</TableCell>
                <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {review.comment || '—'}
                </TableCell>
                <TableCell>{format(new Date(review.created_at), 'dd MMM yyyy')}</TableCell>
                <TableCell>
                  <Chip
                    label={review.is_positive ? 'Positive' : 'Negative'}
                    color={review.is_positive ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                {isOwner && (
                  <TableCell align="right">
                    <Tooltip title={review.is_public ? 'Hide from testimonials' : 'Show on testimonials'}>
                      <IconButton
                        size="small"
                        onClick={() => togglePublic(review.id, review.is_public)}
                      >
                        {review.is_public ? <Eye size={18} /> : <EyeOff size={18} />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
