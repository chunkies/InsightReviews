'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Avatar, IconButton,
} from '@mui/material';
import { Star, ExternalLink, MessageCircle, Instagram, Facebook, Gift, Camera, X, Copy, Check, Globe } from 'lucide-react';

import type { WallConfig } from '@/lib/types/wall-config';
import { DEFAULT_WALL_CONFIG } from '@/lib/types/wall-config';

/* ─── Types ─────────────────────────────────────────────────────── */

export interface ThankYouConfig {
  positiveTitle: string;
  positiveMessage: string;
  negativeTitle: string;
  negativeMessage: string;
  couponCode: string | null;
  couponText: string;
  socialLinks: Record<string, string>;
}

const DEFAULT_THANKYOU_CONFIG: ThankYouConfig = {
  positiveTitle: 'Thank You!',
  positiveMessage: 'We really appreciate your feedback. Would you mind sharing your experience on one of these platforms?',
  negativeTitle: 'Thank You for Your Feedback',
  negativeMessage: 'We appreciate you letting us know. Your feedback helps us improve. We\'ll follow up with you soon.',
  couponCode: null,
  couponText: 'Here\'s a little thank you from us:',
  socialLinks: {},
};

interface ReviewFormContentProps {
  org: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    positiveThreshold: number;
    reviewFormHeading?: string;
    reviewFormSubheading?: string;
  };
  platforms: Array<{
    id: string;
    platform: string;
    platform_name: string | null;
    url: string;
    display_order: number;
  }>;
  reviewRequestId?: string;
  source?: string;
  config?: WallConfig;
  thankYouConfig?: ThankYouConfig;
}

type FormState = 'rating' | 'submitting' | 'positive' | 'negative' | 'error';

/* ─── Constants ─────────────────────────────────────────────────── */

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

const RATING_LABELS = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent'] as const;

const RATING_COLORS: Record<number, string> = {
  1: '#EF4444',
  2: '#F97316',
  3: '#EAB308',
  4: '#22C55E',
  5: '#16A34A',
};

/* ─── CSS Keyframes (injected once) ─────────────────────────────── */

const keyframes = `
@keyframes rf-bounce-in {
  0%   { transform: scale(0.3); opacity: 0; }
  50%  { transform: scale(1.08); }
  70%  { transform: scale(0.96); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes rf-slide-down {
  from { opacity: 0; transform: translateY(-12px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes rf-check-draw {
  0%   { stroke-dashoffset: 80; opacity: 0; }
  40%  { opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 1; }
}

@keyframes rf-check-circle-scale {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes rf-confetti-fall {
  0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(420px) rotate(720deg); opacity: 0; }
}

@keyframes rf-confetti-fall-alt {
  0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(380px) rotate(-540deg); opacity: 0; }
}

@keyframes rf-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

@keyframes rf-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes rf-pulse-soft {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.04); }
}

@keyframes rf-star-pop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.35); }
  70%  { transform: scale(0.92); }
  100% { transform: scale(1); }
}

@keyframes rf-glow-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0); }
  50%      { box-shadow: 0 0 24px 4px rgba(250, 204, 21, 0.18); }
}
`;

/* ─── Confetti Particle Component ───────────────────────────────── */

const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

function ConfettiEffect() {
  const particles = Array.from({ length: 28 }, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 0.8;
    const duration = 1.8 + Math.random() * 1.2;
    const size = 6 + Math.random() * 6;
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const isAlt = i % 2 === 0;
    return { left, delay, duration, size, color, isAlt, id: i };
  });

  return (
    <Box sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      borderRadius: 'inherit',
      zIndex: 1,
    }}>
      {particles.map((p) => (
        <Box
          key={p.id}
          sx={{
            position: 'absolute',
            top: -10,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            borderRadius: p.id % 3 === 0 ? '50%' : p.id % 3 === 1 ? '2px' : 0,
            backgroundColor: p.color,
            animation: `${p.isAlt ? 'rf-confetti-fall-alt' : 'rf-confetti-fall'} ${p.duration}s ease-in ${p.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}
    </Box>
  );
}

/* ─── Animated Checkmark SVG ────────────────────────────────────── */

function AnimatedCheckmark({ color = '#16A34A', size = 72 }: { color?: string; size?: number }) {
  return (
    <Box sx={{
      display: 'inline-flex',
      animation: 'rf-check-circle-scale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
    }}>
      <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
        <circle cx="36" cy="36" r="34" fill={color} opacity="0.12" />
        <circle cx="36" cy="36" r="34" stroke={color} strokeWidth="2.5" opacity="0.3" />
        <path
          d="M22 36 L32 46 L50 28"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{
            strokeDasharray: 80,
            strokeDashoffset: 80,
            animation: 'rf-check-draw 0.7s ease-out 0.35s forwards',
          }}
        />
      </svg>
    </Box>
  );
}

/* ─── Background Gradient Overlay ───────────────────────────────── */

function BackgroundGlow({ rating, formState }: { rating: number; formState: FormState }) {
  let gradient = 'radial-gradient(ellipse at top, rgba(99,102,241,0.08) 0%, transparent 70%)';

  if (formState === 'positive') {
    gradient = 'radial-gradient(ellipse at top, rgba(250,204,21,0.15) 0%, rgba(34,197,94,0.06) 50%, transparent 80%)';
  } else if (formState === 'negative') {
    gradient = 'radial-gradient(ellipse at top, rgba(99,102,241,0.08) 0%, transparent 70%)';
  } else if (rating >= 4) {
    gradient = 'radial-gradient(ellipse at top, rgba(250,204,21,0.12) 0%, rgba(251,191,36,0.04) 50%, transparent 80%)';
  } else if (rating >= 2) {
    gradient = 'radial-gradient(ellipse at top, rgba(234,179,8,0.08) 0%, transparent 70%)';
  } else if (rating === 1) {
    gradient = 'radial-gradient(ellipse at top, rgba(239,68,68,0.06) 0%, transparent 70%)';
  }

  return (
    <Box sx={{
      position: 'absolute',
      inset: 0,
      background: gradient,
      transition: 'background 0.6s ease',
      borderRadius: 'inherit',
      pointerEvents: 'none',
      zIndex: 0,
    }} />
  );
}

/* ─── Main Component ────────────────────────────────────────────── */

export function ReviewFormContent({ org, platforms, reviewRequestId, source, config: cfg, thankYouConfig: tyc }: ReviewFormContentProps) {
  const config = cfg ?? DEFAULT_WALL_CONFIG;
  const tyConfig = tyc ?? DEFAULT_THANKYOU_CONFIG;
  const accentColor = config.accentColor;
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [formState, setFormState] = useState<FormState>('rating');
  const [showConfetti, setShowConfetti] = useState(false);
  const [stylesInjected, setStylesInjected] = useState(false);
  const [lastTappedStar, setLastTappedStar] = useState(0);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [couponCopied, setCouponCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inject keyframes once
  useEffect(() => {
    if (stylesInjected) return;
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);
    setStylesInjected(true);
    return () => { document.head.removeChild(style); };
  }, [stylesInjected]);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be under 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  function handlePhotoRemove() {
    setPhotoFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  const handleStarClick = useCallback((star: number) => {
    setRating(star);
    setLastTappedStar(star);
    // Reset the pop animation trigger
    setTimeout(() => setLastTappedStar(0), 400);
  }, []);

  async function handleSubmit() {
    if (rating === 0) return;
    setFormState('submitting');

    try {
      // Upload photo first if one was selected
      let photoUrl: string | null = null;
      if (photoFile) {
        const photoFormData = new FormData();
        photoFormData.append('photo', photoFile);
        photoFormData.append('orgId', org.id);

        const uploadRes = await fetch('/api/reviews/upload-photo', {
          method: 'POST',
          body: photoFormData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          photoUrl = uploadData.url;
        }
        // If upload fails, still submit the review without photo
      }

      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: org.slug,
          rating,
          comment: comment || null,
          customerName: customerName || null,
          customerContact: customerContact || null,
          reviewRequestId: reviewRequestId || null,
          source: source || 'direct',
          photoUrl,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit');

      const resData = await res.json();
      if (resData.reviewId) {
        setReviewId(resData.reviewId);
      }

      const isPositive = rating >= org.positiveThreshold;
      if (isPositive && rating === 5) {
        setShowConfetti(true);
      }
      setFormState(isPositive ? 'positive' : 'negative');
    } catch {
      setFormState('error');
    }
  }

  const displayRating = hoveredRating || rating;

  const cardSx = {
    position: 'relative' as const,
    overflow: 'hidden',
    p: { xs: 2.5, sm: 4 },
    textAlign: 'center' as const,
    borderRadius: { xs: `${Math.min(config.cardBorderRadius, 20)}px`, sm: `${config.cardBorderRadius}px` },
    boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid',
    borderColor: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(10px)',
    background: config.cardBg,
  };

  /* ─── Positive Thank-You ────────────────────────────────── */
  if (formState === 'positive') {
    return (
      <Paper sx={cardSx}>
        <BackgroundGlow rating={rating} formState={formState} />
        {showConfetti && <ConfettiEffect />}

        <Box sx={{ position: 'relative', zIndex: 2 }}>
          {org.logoUrl && (
            <Avatar
              src={org.logoUrl}
              alt={org.name}
              sx={{
                width: 72, height: 72, mx: 'auto', mb: 2,
                animation: 'rf-bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
              }}
            />
          )}

          <Box sx={{ mb: 2, animation: 'rf-fade-in 0.5s ease 0.2s both' }}>
            <AnimatedCheckmark color="#16A34A" size={72} />
          </Box>

          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              animation: 'rf-fade-in 0.5s ease 0.3s both',
              mb: 1,
              fontSize: { xs: '1.6rem', sm: '2rem' },
              background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 50%, #4ADE80 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {tyConfig.positiveTitle}
          </Typography>

          <Typography
            sx={{
              mb: 3.5,
              animation: 'rf-fade-in 0.5s ease 0.45s both',
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              lineHeight: 1.6,
              maxWidth: 380,
              mx: 'auto',
              color: config.bodyColor,
              fontFamily: config.bodyFont,
            }}
          >
            {tyConfig.positiveMessage}
          </Typography>

          <Box sx={{
            display: 'flex', flexDirection: 'column', gap: 1.5,
            animation: 'rf-fade-in 0.5s ease 0.6s both',
          }}>
            {platforms.map((p, i) => {
              const brandColor = PLATFORM_COLORS[p.platform] ?? PLATFORM_COLORS.other;
              return (
                <Button
                  key={p.id}
                  variant="contained"
                  size="large"
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (reviewId) {
                      fetch('/api/reviews/track-click', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reviewId, platform: p.platform }),
                        keepalive: true,
                      });
                    }
                  }}
                  endIcon={<ExternalLink size={18} />}
                  sx={{
                    backgroundColor: brandColor,
                    py: 1.8,
                    fontSize: '1rem',
                    fontWeight: 700,
                    letterSpacing: '0.01em',
                    borderRadius: 3,
                    textTransform: 'none',
                    boxShadow: `0 4px 14px ${brandColor}33`,
                    animation: `rf-fade-in 0.4s ease ${0.7 + i * 0.1}s both`,
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    '&:hover': {
                      backgroundColor: brandColor,
                      filter: 'brightness(1.08)',
                      transform: 'translateY(-2px) scale(1.02)',
                      boxShadow: `0 8px 24px ${brandColor}44`,
                    },
                    '&:active': {
                      transform: 'translateY(0) scale(0.98)',
                      transition: 'transform 0.1s ease',
                    },
                  }}
                >
                  Review us on {PLATFORM_LABELS[p.platform] ?? p.platform_name ?? p.platform}
                </Button>
              );
            })}
          </Box>

          {/* Coupon Code Box */}
          {tyConfig.couponCode && (
            <Box sx={{
              animation: 'rf-fade-in 0.5s ease 0.85s both',
              mt: 3,
              p: 2.5,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(250,204,21,0.1) 0%, rgba(251,191,36,0.06) 100%)',
              border: '1px dashed rgba(250,204,21,0.5)',
              textAlign: 'center',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <Gift size={18} color="#EAB308" />
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  {tyConfig.couponText}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{
                    letterSpacing: '0.1em',
                    color: '#B45309',
                    fontFamily: 'monospace',
                    fontSize: '1.3rem',
                  }}
                >
                  {tyConfig.couponCode}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(tyConfig.couponCode!);
                    setCouponCopied(true);
                    setTimeout(() => setCouponCopied(false), 2000);
                  }}
                  sx={{
                    color: couponCopied ? '#16A34A' : '#B45309',
                    transition: 'color 0.2s ease',
                    '&:hover': { backgroundColor: 'rgba(180,83,9,0.08)' },
                  }}
                >
                  {couponCopied ? <Check size={16} /> : <Copy size={16} />}
                </IconButton>
              </Box>
            </Box>
          )}

          {/* Social Links */}
          {Object.keys(tyConfig.socialLinks).length > 0 && (
            <Box sx={{
              animation: 'rf-fade-in 0.5s ease 0.95s both',
              mt: 2.5,
            }}>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                Follow us
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
                {tyConfig.socialLinks.instagram && (
                  <IconButton
                    href={tyConfig.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: '#E4405F',
                      '&:hover': { backgroundColor: 'rgba(228,64,95,0.08)' },
                    }}
                  >
                    <Instagram size={22} />
                  </IconButton>
                )}
                {tyConfig.socialLinks.facebook && (
                  <IconButton
                    href={tyConfig.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: '#1877F2',
                      '&:hover': { backgroundColor: 'rgba(24,119,242,0.08)' },
                    }}
                  >
                    <Facebook size={22} />
                  </IconButton>
                )}
                {tyConfig.socialLinks.google && (
                  <IconButton
                    href={tyConfig.socialLinks.google}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: '#4285F4',
                      '&:hover': { backgroundColor: 'rgba(66,133,244,0.08)' },
                    }}
                  >
                    <Globe size={22} />
                  </IconButton>
                )}
              </Box>
            </Box>
          )}

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block', mt: 3.5, opacity: 0.7,
              animation: 'rf-fade-in 0.5s ease 1s both',
              fontSize: '0.8rem',
            }}
          >
            Every review helps small businesses like ours grow. Thank you!
          </Typography>
        </Box>
      </Paper>
    );
  }

  /* ─── Negative Thank-You ────────────────────────────────── */
  if (formState === 'negative') {
    return (
      <Paper sx={cardSx}>
        <BackgroundGlow rating={rating} formState={formState} />

        <Box sx={{ position: 'relative', zIndex: 2 }}>
          {org.logoUrl && (
            <Avatar
              src={org.logoUrl}
              alt={org.name}
              sx={{
                width: 72, height: 72, mx: 'auto', mb: 2,
                animation: 'rf-bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
              }}
            />
          )}

          <Box sx={{
            mb: 2,
            animation: 'rf-fade-in 0.5s ease 0.2s both',
            color: accentColor,
          }}>
            <MessageCircle size={56} strokeWidth={1.5} />
          </Box>

          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              animation: 'rf-fade-in 0.5s ease 0.3s both',
              mb: 1.5,
              fontSize: { xs: `${1.5 * config.headerSize}rem`, sm: `${1.85 * config.headerSize}rem` },
              color: config.headerColor,
              fontFamily: config.headerFont,
            }}
          >
            {tyConfig.negativeTitle}
          </Typography>

          <Typography
            sx={{
              animation: 'rf-fade-in 0.5s ease 0.45s both',
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              lineHeight: 1.7,
              maxWidth: 380,
              mx: 'auto',
              mb: 2,
              color: config.bodyColor,
              fontFamily: config.bodyFont,
            }}
          >
            {(reviewRequestId || customerContact)
              ? tyConfig.negativeMessage
              : 'We appreciate you letting us know. Your feedback helps us improve.'
            }
          </Typography>

          {/* Coupon Code Box (also shown on negative if configured) */}
          {tyConfig.couponCode && (
            <Box sx={{
              animation: 'rf-fade-in 0.5s ease 0.6s both',
              mt: 2,
              mb: 2,
              p: 2.5,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(250,204,21,0.1) 0%, rgba(251,191,36,0.06) 100%)',
              border: '1px dashed rgba(250,204,21,0.5)',
              textAlign: 'center',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <Gift size={18} color="#EAB308" />
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  {tyConfig.couponText}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{
                    letterSpacing: '0.1em',
                    color: '#B45309',
                    fontFamily: 'monospace',
                    fontSize: '1.3rem',
                  }}
                >
                  {tyConfig.couponCode}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(tyConfig.couponCode!);
                    setCouponCopied(true);
                    setTimeout(() => setCouponCopied(false), 2000);
                  }}
                  sx={{
                    color: couponCopied ? '#16A34A' : '#B45309',
                    transition: 'color 0.2s ease',
                    '&:hover': { backgroundColor: 'rgba(180,83,9,0.08)' },
                  }}
                >
                  {couponCopied ? <Check size={16} /> : <Copy size={16} />}
                </IconButton>
              </Box>
            </Box>
          )}

          <Box sx={{
            animation: 'rf-fade-in 0.5s ease 0.7s both',
            mt: 3,
            p: 2,
            borderRadius: 2.5,
            backgroundColor: 'rgba(99,102,241,0.05)',
            border: '1px solid rgba(99,102,241,0.1)',
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              &ldquo;We take every piece of feedback seriously and are committed to improving your experience.&rdquo;
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
              &mdash; The {org.name} Team
            </Typography>
          </Box>

          {/* Social Links */}
          {Object.keys(tyConfig.socialLinks).length > 0 && (
            <Box sx={{
              animation: 'rf-fade-in 0.5s ease 0.8s both',
              mt: 2.5,
            }}>
              <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                Follow us
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
                {tyConfig.socialLinks.instagram && (
                  <IconButton
                    href={tyConfig.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: '#E4405F',
                      '&:hover': { backgroundColor: 'rgba(228,64,95,0.08)' },
                    }}
                  >
                    <Instagram size={22} />
                  </IconButton>
                )}
                {tyConfig.socialLinks.facebook && (
                  <IconButton
                    href={tyConfig.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: '#1877F2',
                      '&:hover': { backgroundColor: 'rgba(24,119,242,0.08)' },
                    }}
                  >
                    <Facebook size={22} />
                  </IconButton>
                )}
                {tyConfig.socialLinks.google && (
                  <IconButton
                    href={tyConfig.socialLinks.google}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      color: '#4285F4',
                      '&:hover': { backgroundColor: 'rgba(66,133,244,0.08)' },
                    }}
                  >
                    <Globe size={22} />
                  </IconButton>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    );
  }

  /* ─── Error Screen ──────────────────────────────────────── */
  if (formState === 'error') {
    return (
      <Paper sx={cardSx}>
        <BackgroundGlow rating={0} formState={formState} />
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Something went wrong
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            We couldn&apos;t submit your review. Please try again.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => setFormState('rating')}
            sx={{
              borderRadius: 3,
              py: 1.5,
              px: 5,
              fontWeight: 700,
              textTransform: 'none',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              '&:active': { transform: 'scale(0.96)' },
            }}
          >
            Try Again
          </Button>
        </Box>
      </Paper>
    );
  }

  /* ─── Main Rating Form ──────────────────────────────────── */
  return (
    <>
    <Paper sx={{
      ...cardSx,
      animation: 'rf-fade-in 0.5s ease forwards',
    }}>
      <BackgroundGlow rating={rating} formState={formState} />

      <Box sx={{ position: 'relative', zIndex: 2 }}>
        {/* Logo */}
        {org.logoUrl && (
          <Avatar
            src={org.logoUrl}
            alt={org.name}
            sx={{
              width: 88,
              height: 88,
              mx: 'auto',
              mb: 2.5,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '3px solid white',
              animation: 'rf-bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
          />
        )}

        {/* Heading */}
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{
            mb: 0.5,
            fontSize: { xs: `${1.45 * config.headerSize}rem`, sm: `${2.1 * config.headerSize}rem` },
            letterSpacing: '-0.02em',
            wordBreak: 'break-word',
            color: config.headerColor,
            lineHeight: 1.2,
            fontFamily: config.headerFont,
          }}
        >
          {org.reviewFormHeading || 'How was your experience?'}
        </Typography>
        <Typography
          sx={{
            mb: { xs: 3, sm: 3.5 },
            fontSize: { xs: '1rem', sm: '1.1rem' },
            color: config.bodyColor,
            fontFamily: config.bodyFont,
          }}
        >
          {(org.reviewFormSubheading || 'at {business_name}').replace(/\{business_name\}/g, org.name)}
        </Typography>

        {/* Star Rating */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: { xs: 0.25, sm: 1 },
          mb: 2,
        }}>
          {([1, 2, 3, 4, 5] as const).map((star) => {
            const isActive = star <= displayRating;
            const isPopping = star === lastTappedStar;
            return (
              <IconButton
                key={star}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                disableRipple
                sx={{
                  p: { xs: 0.5, sm: 0.75 },
                  transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  animation: isPopping ? 'rf-star-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
                  '&:hover': {
                    transform: 'scale(1.2)',
                    backgroundColor: 'transparent',
                  },
                  '&:active': {
                    transform: 'scale(0.9)',
                    transition: 'transform 0.1s ease',
                  },
                  // Glow effect for selected stars
                  ...(isActive && rating > 0 ? {
                    filter: 'drop-shadow(0 2px 6px rgba(250, 204, 21, 0.4))',
                  } : {}),
                }}
              >
                <Star
                  size={42}
                  fill={isActive ? config.starColor : 'none'}
                  color={isActive ? config.starColor : '#CBD5E1'}
                  strokeWidth={isActive ? 1.2 : 1.8}
                  style={{
                    transition: 'fill 0.2s ease, color 0.2s ease',
                  }}
                />
              </IconButton>
            );
          })}
        </Box>

        {/* Rating Label */}
        <Box sx={{ minHeight: 32, mb: 1 }}>
          {rating > 0 && (
            <Typography
              variant="body1"
              fontWeight={700}
              sx={{
                animation: 'rf-bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                fontSize: '1.1rem',
                letterSpacing: '0.02em',
                color: RATING_COLORS[rating] ?? 'text.primary',
                transition: 'color 0.3s ease',
              }}
            >
              {RATING_LABELS[rating]}
            </Typography>
          )}
        </Box>

        {/* Comment Section - Animated Slide-Down */}
        {rating > 0 && (
          <Box sx={{
            animation: 'rf-slide-down 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            textAlign: 'left',
            pt: 0.5,
          }}>
            <TextField
              fullWidth
              placeholder="Your name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              variant="outlined"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                },
              }}
            />
            {/* Contact field for QR walk-ins (no SMS review request) */}
            {!reviewRequestId && (
              <TextField
                fullWidth
                placeholder="Email or phone (optional — for follow-up)"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                variant="outlined"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                  },
                }}
              />
            )}
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder={rating >= 4 ? "Tell us more (optional)" : "What could we improve? (optional)"}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              variant="outlined"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                },
              }}
            />

            {/* Photo Upload */}
            <Box sx={{ mb: 3 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />
              {!photoPreview ? (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Camera size={18} />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: 'rgba(0,0,0,0.15)',
                    color: 'text.secondary',
                    '&:hover': {
                      borderColor: accentColor,
                      color: accentColor,
                      backgroundColor: `${accentColor}08`,
                    },
                  }}
                >
                  Add a photo (optional)
                </Button>
              ) : (
                <Box sx={{
                  display: 'inline-flex',
                  position: 'relative',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid rgba(0,0,0,0.1)',
                }}>
                  <Box
                    component="img"
                    src={photoPreview}
                    alt="Selected photo"
                    sx={{
                      width: 120,
                      height: 90,
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={handlePhotoRemove}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      backgroundColor: 'rgba(0,0,0,0.55)',
                      color: 'white',
                      width: 24,
                      height: 24,
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.75)',
                      },
                    }}
                  >
                    <X size={14} />
                  </IconButton>
                </Box>
              )}
            </Box>

            {/* Submit Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={formState === 'submitting'}
              sx={{
                py: 1.8,
                fontSize: '1.05rem',
                fontWeight: 700,
                borderRadius: 3,
                textTransform: 'none',
                letterSpacing: '0.01em',
                background: formState === 'submitting'
                  ? undefined
                  : `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`,
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': {
                  transform: 'translateY(-1px) scale(1.01)',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
                  background: `linear-gradient(135deg, ${accentColor}ee 0%, ${accentColor}aa 100%)`,
                },
                '&:active': {
                  transform: 'translateY(0) scale(0.98)',
                  transition: 'transform 0.1s ease',
                },
                '&.Mui-disabled': {
                  background: undefined,
                },
                // Shimmer loading effect
                ...(formState === 'submitting' ? {
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'rf-shimmer 1.5s linear infinite',
                  },
                } : {}),
              }}
            >
              {formState === 'submitting' ? 'Submitting...' : 'Submit Review'}
            </Button>
          </Box>
        )}
      </Box>
    </Paper>
    <Box sx={{ textAlign: 'center', mt: 2, opacity: 0.5 }}>
      <a
        href="https://insightreviews.com.au?utm_source=review_form&utm_medium=badge"
        target="_blank"
        rel="noopener"
        style={{ color: 'inherit', textDecoration: 'none', fontSize: '0.7rem' }}
      >
        Powered by InsightReviews
      </a>
    </Box>
    </>
  );
}
