'use client';

import { useState, memo } from 'react';
import {
  Box, Paper, Typography, IconButton,
} from '@mui/material';
import { Star, MessageSquare, LayoutGrid, Smartphone, Instagram, Facebook, Globe } from 'lucide-react';
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

const MODES: { value: PreviewMode; label: string; icon: typeof LayoutGrid }[] = [
  { value: 'wall', label: 'Wall', icon: LayoutGrid },
  { value: 'review', label: 'Form', icon: Star },
  { value: 'thankyou', label: 'Thank You', icon: MessageSquare },
];

export const LivePreview = memo(function LivePreview({ config, orgName, logoUrl, platforms, thankYouConfig, reviews }: LivePreviewProps) {
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

  const isPositive = previewRating >= 4;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Smartphone size={15} />
        <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.8rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary' }}>
          Preview
        </Typography>
      </Box>

      {/* Mode selector — pill tabs */}
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          p: 0.5,
          borderRadius: 2.5,
          bgcolor: 'action.hover',
          mb: 2,
        }}
      >
        {MODES.map(({ value, label, icon: Icon }) => {
          const active = previewMode === value;
          return (
            <Box
              key={value}
              onClick={() => setPreviewMode(value)}
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.75,
                py: 0.85,
                px: 1,
                borderRadius: 2,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.78rem',
                transition: 'all 0.2s ease',
                color: active ? 'primary.main' : 'text.secondary',
                bgcolor: active ? 'background.paper' : 'transparent',
                boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                '&:hover': {
                  color: active ? 'primary.main' : 'text.primary',
                },
              }}
            >
              <Icon size={13} />
              {label}
            </Box>
          );
        })}
      </Box>

      {/* Star selector for thank-you preview */}
      {previewMode === 'thankyou' && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.75,
            mb: 2,
            py: 1,
            px: 2,
            borderRadius: 2.5,
            bgcolor: 'action.hover',
          }}
        >
          <Typography variant="caption" sx={{ mr: 0.5, fontWeight: 600, color: 'text.secondary', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Rating
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.25 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <IconButton
                key={star}
                size="small"
                onClick={() => setPreviewRating(star)}
                sx={{
                  p: 0.4,
                  transition: 'transform 0.15s ease',
                  '&:hover': { transform: 'scale(1.2)', bgcolor: 'transparent' },
                }}
              >
                <Star
                  size={20}
                  fill={star <= previewRating ? config.starColor : 'none'}
                  color={star <= previewRating ? config.starColor : '#CBD5E1'}
                  strokeWidth={star <= previewRating ? 1.2 : 1.8}
                />
              </IconButton>
            ))}
          </Box>
          <Box
            sx={{
              ml: 0.75,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: isPositive ? 'success.main' : 'warning.main',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.03em',
            }}
          >
            {isPositive ? 'POSITIVE' : 'NEGATIVE'}
          </Box>
        </Box>
      )}

      {/* Wall preview — browser-style wide frame */}
      {previewMode === 'wall' && (
        <Box
          sx={{
            borderRadius: 3,
            border: '2px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}
        >
          {/* Browser chrome bar */}
          <Box sx={{
            height: 32,
            bgcolor: 'grey.100',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            gap: 0.75,
          }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#FF5F57' }} />
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#FEBC2E' }} />
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#28C840' }} />
            <Box sx={{
              flex: 1,
              ml: 1,
              height: 20,
              borderRadius: 1.5,
              bgcolor: 'white',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              px: 1.5,
            }}>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled', fontFamily: 'monospace' }}>
                yoursite.com/wall/{orgName.toLowerCase().replace(/\s+/g, '-')}
              </Typography>
            </Box>
          </Box>

          {/* Wall content */}
          <Box
            sx={{
              background: bgStyle,
              p: 3,
              maxHeight: 540,
              overflowY: 'auto',
              '&::-webkit-scrollbar': { width: 3 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.15)', borderRadius: 2 },
            }}
          >
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
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
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
                  mb: 0.25,
                  lineHeight: 1.2,
                }}
              >
                {orgName}
              </Typography>
              <Typography
                sx={{
                  fontFamily: config.bodyFont,
                  color: config.bodyColor,
                  fontSize: '0.82rem',
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
                    borderRadius: 2,
                    px: 2,
                    py: 0.75,
                    border: '1px solid rgba(255,255,255,0.5)',
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

            {/* Cards Grid — multi-column like real wall */}
            <Box
              sx={{
                columnCount: Math.min(config.columns, 2),
                columnGap: '14px',
                mx: 'auto',
              }}
            >
              {previewReviews.map((review) => (
                <Box
                  key={review.id}
                  sx={{
                    breakInside: 'avoid',
                    mb: '14px',
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
                          fontSize: '0.82rem',
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
        </Box>
      )}

      {/* Phone mockup frame — for Form and Thank You */}
      {(previewMode === 'review' || previewMode === 'thankyou') && (
        <Box
          sx={{
            position: 'relative',
            borderRadius: '24px',
            border: '3px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'grey.900',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
            maxWidth: 340,
            mx: 'auto',
          }}
        >
          {/* Phone notch */}
          <Box sx={{ height: 28, bgcolor: 'grey.900', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ width: 80, height: 6, borderRadius: 3, bgcolor: 'grey.800' }} />
          </Box>

          {/* Screen content */}
          <Box
            sx={{
              borderRadius: '0 0 20px 20px',
              overflow: 'hidden',
              maxHeight: 520,
              overflowY: 'auto',
              '&::-webkit-scrollbar': { width: 0 },
            }}
          >
            {previewMode === 'review' && (
              <Box sx={{ background: bgStyle, p: 2, minHeight: 460, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ width: '100%', pointerEvents: 'none' }}>
                  <ReviewFormContent
                    org={{ id: 'preview', name: orgName, slug: 'preview', logoUrl, positiveThreshold: 4 }}
                    platforms={[]}
                    config={config}
                    thankYouConfig={thankYouConfig}
                  />
                </Box>
              </Box>
            )}
            {previewMode === 'thankyou' && (
              <Box sx={{ background: bgStyle, p: 2, minHeight: 460, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ width: '100%' }}>
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
          </Box>

          {/* Phone bottom bar */}
          <Box sx={{ height: 20, bgcolor: 'grey.900', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ width: 48, height: 4, borderRadius: 2, bgcolor: 'grey.700' }} />
          </Box>
        </Box>
      )}
    </Box>
  );
});

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
    p: 3,
    textAlign: 'center' as const,
    borderRadius: `${config.cardBorderRadius}px`,
    boxShadow: '0 16px 48px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
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
            sx={{ width: 52, height: 52, borderRadius: '50%', mx: 'auto', mb: 1.5, display: 'block', objectFit: 'cover', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
          />
        )}

        <Box sx={{ mb: 1.5 }}>
          <svg width={52} height={52} viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="34" fill="#16A34A" opacity="0.12" />
            <circle cx="36" cy="36" r="34" stroke="#16A34A" strokeWidth="2.5" opacity="0.3" />
            <path d="M22 36 L32 46 L50 28" stroke="#16A34A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </Box>

        <Typography
          variant="h6"
          fontWeight={800}
          sx={{
            mb: 0.75,
            fontSize: '1.25rem',
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
            mb: 2.5,
            fontSize: '0.82rem',
            lineHeight: 1.55,
            maxWidth: 300,
            mx: 'auto',
            color: config.bodyColor,
            fontFamily: config.bodyFont,
          }}
        >
          {thankYouConfig.positiveMessage}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {platforms.map((p) => {
            const brandColor = PLATFORM_COLORS[p.platform] ?? PLATFORM_COLORS.other;
            return (
              <Box
                key={p.id}
                sx={{
                  backgroundColor: brandColor,
                  color: 'white',
                  py: 1.25,
                  px: 2.5,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  textAlign: 'center',
                  cursor: 'default',
                  boxShadow: `0 2px 8px ${brandColor}33`,
                }}
              >
                Review us on {PLATFORM_LABELS[p.platform] ?? p.platform_name ?? p.platform}
              </Box>
            );
          })}
          {platforms.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No review platforms configured
            </Typography>
          )}
        </Box>

        {thankYouConfig.couponCode && (
          <Box sx={{
            mt: 2,
            p: 1.75,
            borderRadius: 2.5,
            background: 'linear-gradient(135deg, rgba(250,204,21,0.1) 0%, rgba(251,191,36,0.06) 100%)',
            border: '1px dashed rgba(250,204,21,0.5)',
          }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
              {thankYouConfig.couponText}
            </Typography>
            <Typography fontWeight={800} sx={{ letterSpacing: '0.1em', color: '#B45309', fontFamily: 'monospace', fontSize: '1.1rem' }}>
              {thankYouConfig.couponCode}
            </Typography>
          </Box>
        )}

        {Object.keys(thankYouConfig.socialLinks).length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
              Follow us
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
              {thankYouConfig.socialLinks.instagram && (
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(228,64,95,0.1)', color: '#E4405F' }}>
                  <Instagram size={18} />
                </Box>
              )}
              {thankYouConfig.socialLinks.facebook && (
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(24,119,242,0.1)', color: '#1877F2' }}>
                  <Facebook size={18} />
                </Box>
              )}
              {thankYouConfig.socialLinks.google && (
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(66,133,244,0.1)', color: '#4285F4' }}>
                  <Globe size={18} />
                </Box>
              )}
            </Box>
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
          sx={{ width: 52, height: 52, borderRadius: '50%', mx: 'auto', mb: 1.5, display: 'block', objectFit: 'cover', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
        />
      )}

      <Box sx={{ mb: 1.5, color: accentColor }}>
        <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </Box>

      <Typography
        variant="h6"
        fontWeight={800}
        sx={{
          mb: 0.75,
          fontSize: `${1.2 * config.headerSize}rem`,
          color: config.headerColor,
          fontFamily: config.headerFont,
        }}
      >
        {thankYouConfig.negativeTitle}
      </Typography>

      <Typography
        sx={{
          fontSize: '0.82rem',
          lineHeight: 1.6,
          maxWidth: 300,
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
          mb: 2,
          p: 1.75,
          borderRadius: 2.5,
          background: 'linear-gradient(135deg, rgba(250,204,21,0.1) 0%, rgba(251,191,36,0.06) 100%)',
          border: '1px dashed rgba(250,204,21,0.5)',
        }}>
          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
            {thankYouConfig.couponText}
          </Typography>
          <Typography fontWeight={800} sx={{ letterSpacing: '0.1em', color: '#B45309', fontFamily: 'monospace', fontSize: '1.1rem' }}>
            {thankYouConfig.couponCode}
          </Typography>
        </Box>
      )}

      {Object.keys(thankYouConfig.socialLinks).length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
              Follow us
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
              {thankYouConfig.socialLinks.instagram && (
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(228,64,95,0.1)', color: '#E4405F' }}>
                  <Instagram size={18} />
                </Box>
              )}
              {thankYouConfig.socialLinks.facebook && (
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(24,119,242,0.1)', color: '#1877F2' }}>
                  <Facebook size={18} />
                </Box>
              )}
              {thankYouConfig.socialLinks.google && (
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(66,133,244,0.1)', color: '#4285F4' }}>
                  <Globe size={18} />
                </Box>
              )}
            </Box>
          </Box>
        )}

      <Box sx={{
        p: 1.75,
        borderRadius: 2,
        backgroundColor: 'rgba(99,102,241,0.05)',
        border: '1px solid rgba(99,102,241,0.1)',
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', lineHeight: 1.5 }}>
          &ldquo;We take every piece of feedback seriously and are committed to improving your experience.&rdquo;
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600, fontSize: '0.7rem' }}>
          &mdash; The {orgName} Team
        </Typography>
      </Box>
    </Paper>
  );
}
