'use client';

import { useEffect, useRef } from 'react';
import { Box, Container, Typography, Avatar } from '@mui/material';
import { Star } from 'lucide-react';
import { format } from 'date-fns';

interface WallReview {
  id: string;
  rating: number;
  comment: string | null;
  customer_name: string | null;
  created_at: string;
}

interface TestimonialWallProps {
  org: {
    name: string;
    logo_url: string | null;
  };
  reviews: WallReview[];
}

function StarRating({ rating, size = 22 }: { rating: number; size?: number }) {
  return (
    <Box sx={{ display: 'flex', gap: '3px' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          fill={s <= rating ? '#f59e0b' : 'none'}
          color={s <= rating ? '#f59e0b' : '#e5e7eb'}
          style={{
            filter: s <= rating ? 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.4))' : 'none',
          }}
        />
      ))}
    </Box>
  );
}

export function TestimonialWall({ org, reviews }: TestimonialWallProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  useEffect(() => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll('[data-animate-card]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = '1';
            (entry.target as HTMLElement).style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [reviews]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #f0f4ff 0%, #faf5ff 30%, #fff1f2 60%, #f0fdf4 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.08) 1px, transparent 0)',
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 4, md: 6 } }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
          {org.logo_url ? (
            <Avatar
              src={org.logo_url}
              alt={org.name}
              sx={{
                width: { xs: 72, md: 96 },
                height: { xs: 72, md: 96 },
                mx: 'auto',
                mb: 2,
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                border: '3px solid white',
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: { xs: 72, md: 96 },
                height: { xs: 72, md: 96 },
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: { xs: 28, md: 36 },
                fontWeight: 700,
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                border: '3px solid white',
              }}
            >
              {org.name.charAt(0).toUpperCase()}
            </Avatar>
          )}
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.75rem', md: '2.5rem' },
              background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
            }}
          >
            {org.name}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              fontWeight: 400,
              fontSize: { xs: '0.95rem', md: '1.1rem' },
              mb: 3,
            }}
          >
            What our customers are saying
          </Typography>

          {/* Rating summary */}
          {totalReviews > 0 && (
            <Box
              sx={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                borderRadius: 3,
                px: { xs: 3, md: 5 },
                py: { xs: 2, md: 2.5 },
                boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
                border: '1px solid rgba(255,255,255,0.6)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    lineHeight: 1,
                    color: '#1e293b',
                  }}
                >
                  {averageRating.toFixed(1)}
                </Typography>
                <Box>
                  <StarRating rating={Math.round(averageRating)} size={26} />
                </Box>
              </Box>
              <Typography
                sx={{
                  color: 'text.secondary',
                  fontSize: { xs: '0.8rem', md: '0.875rem' },
                }}
              >
                Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Masonry grid */}
        {!reviews || reviews.length === 0 ? (
          <Typography textAlign="center" color="text.secondary" sx={{ py: 8 }}>
            No testimonials yet.
          </Typography>
        ) : (
          <Box
            ref={containerRef}
            sx={{
              columnCount: { xs: 1, sm: 2, md: 3 },
              columnGap: '20px',
              maxWidth: 1000,
              mx: 'auto',
            }}
          >
            {reviews.map((review, index) => (
              <Box
                key={review.id}
                data-animate-card
                sx={{
                  breakInside: 'avoid',
                  mb: '20px',
                  opacity: 0,
                  transform: 'translateY(24px)',
                  transition: `opacity 0.5s ease ${index * 0.04}s, transform 0.5s ease ${index * 0.04}s`,
                  borderRadius: 3,
                  position: 'relative',
                  background: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.6)',
                  boxShadow:
                    '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background:
                      review.rating === 5
                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        : 'linear-gradient(90deg, #94a3b8, #cbd5e1)',
                    borderRadius: '12px 12px 0 0',
                  },
                  '&:hover': {
                    boxShadow:
                      '0 4px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08)',
                    transform: 'translateY(-2px)',
                    transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                  },
                }}
              >
                <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                  <StarRating rating={review.rating} />

                  {review.comment && (
                    <Typography
                      sx={{
                        mt: 2,
                        mb: 2,
                        fontSize: { xs: '0.925rem', md: '1rem' },
                        lineHeight: 1.7,
                        color: '#334155',
                        fontStyle: 'italic',
                        '&::before': { content: '"\\201C"' },
                        '&::after': { content: '"\\201D"' },
                      }}
                    >
                      {review.comment}
                    </Typography>
                  )}

                  <Box sx={{ mt: 2 }}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        color: '#1e293b',
                      }}
                    >
                      {review.customer_name || 'Anonymous'}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        mt: 0.25,
                      }}
                    >
                      {format(new Date(review.created_at), 'MMM d, yyyy')}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: { xs: 5, md: 6 }, pb: 2 }}>
          <Typography
            sx={{
              fontSize: '0.8rem',
              color: '#94a3b8',
              mb: 0.5,
            }}
          >
            Powered by{' '}
            <Box
              component="a"
              href="/"
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                fontWeight: 600,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              InsightReviews
            </Box>
          </Typography>
          <Box
            component="a"
            href="/"
            sx={{
              display: 'inline-block',
              fontSize: '0.75rem',
              color: 'primary.main',
              textDecoration: 'none',
              fontWeight: 500,
              opacity: 0.8,
              '&:hover': { opacity: 1, textDecoration: 'underline' },
            }}
          >
            Get more reviews for your business &rarr;
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
