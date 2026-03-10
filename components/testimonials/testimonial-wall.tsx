'use client';

import { useEffect, useRef } from 'react';
import { Box, Container, Typography, Avatar } from '@mui/material';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import type { WallConfig } from '@/lib/types/wall-config';
import { DEFAULT_WALL_CONFIG } from '@/lib/types/wall-config';

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
  config?: WallConfig;
}

function StarRating({ rating, size = 22, color = '#f59e0b' }: { rating: number; size?: number; color?: string }) {
  return (
    <Box sx={{ display: 'flex', gap: '3px' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          fill={s <= rating ? color : 'none'}
          color={s <= rating ? color : '#e5e7eb'}
          style={{
            filter: s <= rating ? `drop-shadow(0 0 4px ${color}66)` : 'none',
          }}
        />
      ))}
    </Box>
  );
}

function getCardShadow(shadow: string) {
  switch (shadow) {
    case 'none': return 'none';
    case 'sm': return '0 1px 3px rgba(0,0,0,0.06)';
    case 'lg': return '0 4px 16px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.08)';
    default: return '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)';
  }
}

export function TestimonialWall({ org, reviews, config: configProp }: TestimonialWallProps) {
  const config = configProp ?? DEFAULT_WALL_CONFIG;
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

  const bgStyle = config.bgType === 'gradient'
    ? `linear-gradient(${config.bgGradientAngle}deg, ${config.bgGradientFrom} 0%, ${config.bgGradientTo} 100%)`
    : config.bgColor;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: bgStyle,
        position: 'relative',
      }}
    >
      <Container maxWidth={false} sx={{ maxWidth: config.maxWidth + 48, position: 'relative', py: { xs: 4, md: 6 } }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 5 } }}>
          {config.showLogo && (
            org.logo_url ? (
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
                  bgcolor: config.accentColor,
                  fontSize: { xs: 28, md: 36 },
                  fontWeight: 700,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                  border: '3px solid white',
                }}
              >
                {org.name.charAt(0).toUpperCase()}
              </Avatar>
            )
          )}
          <Typography
            sx={{
              fontFamily: config.headerFont,
              fontWeight: 800,
              fontSize: { xs: `${1.75 * config.headerSize}rem`, md: `${2.5 * config.headerSize}rem` },
              color: config.headerColor,
              mb: 0.5,
            }}
          >
            {org.name}
          </Typography>
          <Typography
            sx={{
              fontFamily: config.bodyFont,
              color: config.bodyColor,
              fontWeight: 400,
              fontSize: { xs: '0.95rem', md: '1.1rem' },
              mb: 3,
              opacity: 0.8,
            }}
          >
            {config.headerText}
          </Typography>

          {/* Rating summary */}
          {config.showRatingBadge && totalReviews > 0 && (
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
                    fontFamily: config.headerFont,
                    fontWeight: 800,
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    lineHeight: 1,
                    color: config.headerColor,
                  }}
                >
                  {averageRating.toFixed(1)}
                </Typography>
                <Box>
                  <StarRating rating={Math.round(averageRating)} size={26} color={config.starColor} />
                </Box>
              </Box>
              <Typography
                sx={{
                  fontFamily: config.bodyFont,
                  color: config.bodyColor,
                  fontSize: { xs: '0.8rem', md: '0.875rem' },
                  opacity: 0.7,
                }}
              >
                Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Masonry grid */}
        {!reviews || reviews.length === 0 ? (
          <Typography
            textAlign="center"
            sx={{ py: 8, fontFamily: config.bodyFont, color: config.bodyColor, opacity: 0.6 }}
          >
            No testimonials yet.
          </Typography>
        ) : (
          <Box
            ref={containerRef}
            sx={{
              columnCount: { xs: 1, sm: Math.min(config.columns, 2), md: config.columns },
              columnGap: '20px',
              maxWidth: config.maxWidth,
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
                  borderRadius: `${config.cardBorderRadius}px`,
                  position: 'relative',
                  background: config.cardBg,
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: getCardShadow(config.cardShadow),
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
                        ? `linear-gradient(90deg, ${config.starColor}, ${config.starColor}88)`
                        : `linear-gradient(90deg, ${config.accentColor}44, ${config.accentColor}22)`,
                    borderRadius: `${config.cardBorderRadius}px ${config.cardBorderRadius}px 0 0`,
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
                  <StarRating rating={review.rating} color={config.starColor} />

                  {review.comment && (
                    <Typography
                      sx={{
                        fontFamily: config.bodyFont,
                        mt: 2,
                        mb: 2,
                        fontSize: { xs: '0.925rem', md: '1rem' },
                        lineHeight: 1.7,
                        color: config.bodyColor,
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
                        fontFamily: config.bodyFont,
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        color: config.headerColor,
                      }}
                    >
                      {review.customer_name || 'Anonymous'}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: config.bodyFont,
                        fontSize: '0.75rem',
                        color: config.bodyColor,
                        opacity: 0.5,
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
        {config.showPoweredBy && (
          <Box sx={{ textAlign: 'center', mt: { xs: 5, md: 6 }, pb: 2 }}>
            <Typography
              sx={{
                fontSize: '0.8rem',
                color: config.bodyColor,
                opacity: 0.4,
                mb: 0.5,
              }}
            >
              Powered by{' '}
              <Box
                component="a"
                href="/"
                sx={{
                  color: config.accentColor,
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
                color: config.accentColor,
                textDecoration: 'none',
                fontWeight: 500,
                opacity: 0.6,
                '&:hover': { opacity: 1, textDecoration: 'underline' },
              }}
            >
              Get more reviews for your business &rarr;
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
}
