'use client';

import { useState } from 'react';
import {
  Box, Paper, Typography, ToggleButtonGroup, ToggleButton, IconButton,
} from '@mui/material';
import { Monitor, Star, MessageSquare, LayoutGrid } from 'lucide-react';
import { ReviewFormContent } from '@/components/review-form/review-form-content';
import type { ThankYouConfig } from '@/components/review-form/review-form-content';
import type { WallConfig } from '@/lib/types/wall-config';

export type PreviewMode = 'wall' | 'review' | 'thankyou';

interface LivePreviewProps {
  config: WallConfig;
  orgName: string;
  logoUrl: string | null;
  platforms: Array<{
    id: string;
    platform: string;
    platform_name: string | null;
    url: string;
    display_order: number;
  }>;
  thankYouConfig: ThankYouConfig;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    customer_name: string | null;
    created_at: string;
  }>;
}

function getCardShadow(shadow: string) {
  switch (shadow) {
    case 'none': return 'none';
    case 'sm': return '0 1px 3px rgba(0,0,0,0.06)';
    case 'lg': return '0 4px 16px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.08)';
    default: return '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)';
  }
}

export function LivePreview({ config, orgName, logoUrl, platforms, thankYouConfig, reviews }: LivePreviewProps) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('wall');
  const [previewRating, setPreviewRating] = useState(5);

  const bgStyle = config.bgType === 'gradient'
    ? `linear-gradient(${config.bgGradientAngle}deg, ${config.bgGradientFrom} 0%, ${config.bgGradientTo} 100%)`
    : config.bgColor;

  const previewReviews = reviews.length > 0 ? reviews.slice(0, 4) : [
    { id: '1', rating: 5, comment: 'Absolutely amazing experience! Will definitely be back.', customer_name: 'Sarah M.', created_at: new Date().toISOString() },
    { id: '2', rating: 5, comment: 'Best service in town. Highly recommend!', customer_name: 'James K.', created_at: new Date().toISOString() },
    { id: '3', rating: 4, comment: 'Great quality and friendly staff.', customer_name: 'Emily R.', created_at: new Date().toISOString() },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Monitor size={16} />
          <Typography variant="subtitle2" color="text.secondary">
            Live Preview
          </Typography>
        </Box>
      </Box>

      {/* Mode selector */}
      <ToggleButtonGroup
        value={previewMode}
        exclusive
        onChange={(_, v) => v && setPreviewMode(v)}
        size="small"
        fullWidth
        sx={{ mb: 1.5 }}
      >
        <ToggleButton value="wall" sx={{ textTransform: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
          <LayoutGrid size={14} style={{ marginRight: 6 }} />
          Wall
        </ToggleButton>
        <ToggleButton value="review" sx={{ textTransform: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
          <Star size={14} style={{ marginRight: 6 }} />
          Review Form
        </ToggleButton>
        <ToggleButton value="thankyou" sx={{ textTransform: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
          <MessageSquare size={14} style={{ marginRight: 6 }} />
          Thank You
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Star selector for thank-you preview */}
      {previewMode === 'thankyou' && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1.5, py: 1, px: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1, fontWeight: 600 }}>
            Simulate rating:
          </Typography>
          {[1, 2, 3, 4, 5].map((star) => (
            <IconButton
              key={star}
              size="small"
              onClick={() => setPreviewRating(star)}
              sx={{ p: 0.25 }}
            >
              <Star
                size={22}
                fill={star <= previewRating ? config.starColor : 'none'}
                color={star <= previewRating ? config.starColor : '#CBD5E1'}
                strokeWidth={star <= previewRating ? 1.2 : 1.8}
              />
            </IconButton>
          ))}
        </Box>
      )}

      <Paper
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          minHeight: 400,
        }}
      >
        {/* Wall preview */}
        {previewMode === 'wall' && (
          <Box
            sx={{
              background: bgStyle,
              p: { xs: 2, md: 3 },
              minHeight: 400,
            }}
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              {config.showLogo && (
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: logoUrl ? 'transparent' : config.accentColor,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 1,
                    fontSize: 20,
                    fontWeight: 700,
                    overflow: 'hidden',
                    border: '2px solid white',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  }}
                >
                  {logoUrl ? (
                    <Box component="img" src={logoUrl} alt={orgName} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    orgName.charAt(0).toUpperCase()
                  )}
                </Box>
              )}
              <Typography
                sx={{
                  fontFamily: config.headerFont,
                  fontWeight: 800,
                  fontSize: `${1.5 * config.headerSize}rem`,
                  color: config.headerColor,
                  mb: 0.5,
                }}
              >
                {orgName}
              </Typography>
              <Typography
                sx={{
                  fontFamily: config.bodyFont,
                  color: config.bodyColor,
                  fontSize: '0.8rem',
                  opacity: 0.8,
                  mb: 1.5,
                }}
              >
                {config.headerText}
              </Typography>

              {config.showRatingBadge && previewReviews.length > 0 && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    background: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 1.5,
                    px: 2,
                    py: 0.75,
                    border: '1px solid rgba(255,255,255,0.6)',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                  }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: config.headerColor }}>
                    {(previewReviews.reduce((s, r) => s + r.rating, 0) / previewReviews.length).toFixed(1)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Box
                        key={s}
                        sx={{
                          width: 14,
                          height: 14,
                          backgroundColor: s <= Math.round(previewReviews.reduce((sum, r) => sum + r.rating, 0) / previewReviews.length)
                            ? config.starColor
                            : '#e5e7eb',
                          mask: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'currentColor\'%3E%3Cpath d=\'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z\'/%3E%3C/svg%3E")',
                          WebkitMask: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'currentColor\'%3E%3Cpath d=\'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z\'/%3E%3C/svg%3E")',
                          maskSize: 'contain',
                          WebkitMaskSize: 'contain',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            {/* Cards Grid */}
            <Box
              sx={{
                columnCount: { xs: 1, sm: Math.min(config.columns, 2) },
                columnGap: '12px',
                maxWidth: config.maxWidth,
                mx: 'auto',
              }}
            >
              {previewReviews.map((review) => (
                <Box
                  key={review.id}
                  sx={{
                    breakInside: 'avoid',
                    mb: '12px',
                    borderRadius: `${config.cardBorderRadius}px`,
                    background: config.cardBg,
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: getCardShadow(config.cardShadow),
                    overflow: 'hidden',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: review.rating === 5
                        ? `linear-gradient(90deg, ${config.starColor}, ${config.starColor}88)`
                        : `linear-gradient(90deg, ${config.accentColor}44, ${config.accentColor}22)`,
                    },
                  }}
                >
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', gap: '2px', mb: 1 }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Box
                          key={s}
                          sx={{
                            width: 14,
                            height: 14,
                            backgroundColor: s <= review.rating ? config.starColor : '#e5e7eb',
                            mask: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'currentColor\'%3E%3Cpath d=\'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z\'/%3E%3C/svg%3E")',
                            WebkitMask: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'currentColor\'%3E%3Cpath d=\'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z\'/%3E%3C/svg%3E")',
                            maskSize: 'contain',
                            WebkitMaskSize: 'contain',
                          }}
                        />
                      ))}
                    </Box>
                    {review.comment && (
                      <Typography
                        sx={{
                          fontFamily: config.bodyFont,
                          fontSize: '0.8rem',
                          lineHeight: 1.5,
                          color: config.bodyColor,
                          fontStyle: 'italic',
                          mb: 1,
                          '&::before': { content: '"\\201C"' },
                          '&::after': { content: '"\\201D"' },
                        }}
                      >
                        {review.comment}
                      </Typography>
                    )}
                    <Typography
                      sx={{
                        fontFamily: config.bodyFont,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        color: config.headerColor,
                      }}
                    >
                      {review.customer_name || 'Anonymous'}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Review form preview */}
        {previewMode === 'review' && (
          <Box sx={{ background: bgStyle, p: 2, minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: 420, pointerEvents: 'none' }}>
              <ReviewFormContent
                org={{
                  id: 'preview',
                  name: orgName,
                  slug: 'preview',
                  logoUrl,
                  positiveThreshold: 4,
                }}
                platforms={[]}
                config={config}
                thankYouConfig={thankYouConfig}
              />
            </Box>
          </Box>
        )}

        {/* Thank you preview */}
        {previewMode === 'thankyou' && (
          <Box sx={{ background: bgStyle, p: 2, minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: 420 }}>
              <ThankYouPreview
                orgName={orgName}
                logoUrl={logoUrl}
                config={config}
                thankYouConfig={thankYouConfig}
                platforms={platforms}
                rating={previewRating}
                positiveThreshold={4}
              />
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

/* ─── Static Thank You Preview (no submission logic) ─────────── */

function ThankYouPreview({
  orgName,
  logoUrl,
  config,
  thankYouConfig,
  platforms,
  rating,
  positiveThreshold,
}: {
  orgName: string;
  logoUrl: string | null;
  config: WallConfig;
  thankYouConfig: ThankYouConfig;
  platforms: Array<{ id: string; platform: string; platform_name: string | null; url: string; display_order: number }>;
  rating: number;
  positiveThreshold: number;
}) {
  const isPositive = rating >= positiveThreshold;
  const accentColor = config.accentColor;

  const PLATFORM_LABELS: Record<string, string> = {
    google: 'Google',
    yelp: 'Yelp',
    facebook: 'Facebook',
    tripadvisor: 'TripAdvisor',
  };

  const PLATFORM_COLORS: Record<string, string> = {
    google: '#4285F4',
    yelp: '#D32323',
    facebook: '#1877F2',
    tripadvisor: '#00AF87',
    other: '#6B7280',
  };

  const cardSx = {
    position: 'relative' as const,
    overflow: 'hidden',
    p: { xs: 3, sm: 3.5 },
    textAlign: 'center' as const,
    borderRadius: `${config.cardBorderRadius}px`,
    boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid',
    borderColor: 'rgba(255,255,255,0.6)',
    background: config.cardBg,
  };

  if (isPositive) {
    return (
      <Paper sx={cardSx}>
        {logoUrl && (
          <Box
            component="img"
            src={logoUrl}
            alt={orgName}
            sx={{ width: 60, height: 60, borderRadius: '50%', mx: 'auto', mb: 1.5, display: 'block', objectFit: 'cover', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
          />
        )}

        {/* Checkmark */}
        <Box sx={{ mb: 1.5 }}>
          <svg width={60} height={60} viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="34" fill="#16A34A" opacity="0.12" />
            <circle cx="36" cy="36" r="34" stroke="#16A34A" strokeWidth="2.5" opacity="0.3" />
            <path d="M22 36 L32 46 L50 28" stroke="#16A34A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </Box>

        <Typography
          variant="h5"
          fontWeight={800}
          sx={{
            mb: 1,
            fontSize: '1.5rem',
            background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 50%, #4ADE80 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {thankYouConfig.positiveTitle}
        </Typography>

        <Typography
          sx={{
            mb: 3,
            fontSize: '0.9rem',
            lineHeight: 1.6,
            maxWidth: 340,
            mx: 'auto',
            color: config.bodyColor,
            fontFamily: config.bodyFont,
          }}
        >
          {thankYouConfig.positiveMessage}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {platforms.map((p) => {
            const brandColor = PLATFORM_COLORS[p.platform] ?? PLATFORM_COLORS.other;
            return (
              <Box
                key={p.id}
                sx={{
                  backgroundColor: brandColor,
                  color: 'white',
                  py: 1.5,
                  px: 3,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  borderRadius: 3,
                  textAlign: 'center',
                  cursor: 'default',
                }}
              >
                Review us on {PLATFORM_LABELS[p.platform] ?? p.platform_name ?? p.platform}
              </Box>
            );
          })}
          {platforms.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No review platforms configured
            </Typography>
          )}
        </Box>

        {thankYouConfig.couponCode && (
          <Box sx={{
            mt: 2.5,
            p: 2,
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(250,204,21,0.1) 0%, rgba(251,191,36,0.06) 100%)',
            border: '1px dashed rgba(250,204,21,0.5)',
          }}>
            <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
              {thankYouConfig.couponText}
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '0.1em', color: '#B45309', fontFamily: 'monospace' }}>
              {thankYouConfig.couponCode}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  }

  // Negative
  return (
    <Paper sx={cardSx}>
      {logoUrl && (
        <Box
          component="img"
          src={logoUrl}
          alt={orgName}
          sx={{ width: 60, height: 60, borderRadius: '50%', mx: 'auto', mb: 1.5, display: 'block', objectFit: 'cover', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
        />
      )}

      <Box sx={{ mb: 1.5, color: accentColor }}>
        <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </Box>

      <Typography
        variant="h5"
        fontWeight={800}
        sx={{
          mb: 1,
          fontSize: `${1.4 * config.headerSize}rem`,
          color: config.headerColor,
          fontFamily: config.headerFont,
        }}
      >
        {thankYouConfig.negativeTitle}
      </Typography>

      <Typography
        sx={{
          fontSize: '0.9rem',
          lineHeight: 1.7,
          maxWidth: 340,
          mx: 'auto',
          mb: 2,
          color: config.bodyColor,
          fontFamily: config.bodyFont,
        }}
      >
        {thankYouConfig.negativeMessage}
      </Typography>

      {thankYouConfig.couponCode && (
        <Box sx={{
          mt: 1,
          mb: 2,
          p: 2,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(250,204,21,0.1) 0%, rgba(251,191,36,0.06) 100%)',
          border: '1px dashed rgba(250,204,21,0.5)',
        }}>
          <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
            {thankYouConfig.couponText}
          </Typography>
          <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '0.1em', color: '#B45309', fontFamily: 'monospace' }}>
            {thankYouConfig.couponCode}
          </Typography>
        </Box>
      )}

      <Box sx={{
        p: 2,
        borderRadius: 2.5,
        backgroundColor: 'rgba(99,102,241,0.05)',
        border: '1px solid rgba(99,102,241,0.1)',
      }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          &ldquo;We take every piece of feedback seriously and are committed to improving your experience.&rdquo;
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
          &mdash; The {orgName} Team
        </Typography>
      </Box>
    </Paper>
  );
}
