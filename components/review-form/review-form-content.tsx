'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Avatar, IconButton,
} from '@mui/material';
import { Star, ExternalLink, MessageCircle } from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────── */

interface ReviewFormContentProps {
  org: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    positiveThreshold: number;
  };
  platforms: Array<{
    id: string;
    platform: string;
    platform_name: string | null;
    url: string;
    display_order: number;
  }>;
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
  from { opacity: 0; max-height: 0; transform: translateY(-12px); }
  to   { opacity: 1; max-height: 600px; transform: translateY(0); }
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

export function ReviewFormContent({ org, platforms }: ReviewFormContentProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [formState, setFormState] = useState<FormState>('rating');
  const [showConfetti, setShowConfetti] = useState(false);
  const [stylesInjected, setStylesInjected] = useState(false);
  const [lastTappedStar, setLastTappedStar] = useState(0);

  // Inject keyframes once
  useEffect(() => {
    if (stylesInjected) return;
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);
    setStylesInjected(true);
    return () => { document.head.removeChild(style); };
  }, [stylesInjected]);

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
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: org.slug,
          rating,
          comment: comment || null,
          customerName: customerName || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit');

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
    p: { xs: 3, sm: 4 },
    textAlign: 'center' as const,
    borderRadius: 4,
    boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid',
    borderColor: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(10px)',
    background: 'rgba(255,255,255,0.96)',
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
            Thank you!
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mb: 3.5,
              animation: 'rf-fade-in 0.5s ease 0.45s both',
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              lineHeight: 1.6,
              maxWidth: 380,
              mx: 'auto',
            }}
          >
            We&apos;re thrilled you had a great experience at <strong>{org.name}</strong>!
            Would you mind sharing your review?
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
            color: '#6366F1',
          }}>
            <MessageCircle size={56} strokeWidth={1.5} />
          </Box>

          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              animation: 'rf-fade-in 0.5s ease 0.3s both',
              mb: 1.5,
              fontSize: { xs: '1.5rem', sm: '1.85rem' },
              color: 'text.primary',
            }}
          >
            Thank you for your feedback
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              animation: 'rf-fade-in 0.5s ease 0.45s both',
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              lineHeight: 1.7,
              maxWidth: 380,
              mx: 'auto',
              mb: 2,
            }}
          >
            We appreciate you taking the time to share your thoughts.
            Your feedback is important to us, and someone from{' '}
            <strong>{org.name}</strong> will follow up with you.
          </Typography>

          <Box sx={{
            animation: 'rf-fade-in 0.5s ease 0.6s both',
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
            fontSize: { xs: '1.6rem', sm: '2.1rem' },
            letterSpacing: '-0.02em',
            color: 'text.primary',
            lineHeight: 1.2,
          }}
        >
          How was your experience?
        </Typography>
        <Typography
          color="text.secondary"
          sx={{
            mb: { xs: 3, sm: 3.5 },
            fontSize: { xs: '1rem', sm: '1.1rem' },
          }}
        >
          at <strong>{org.name}</strong>
        </Typography>

        {/* Star Rating */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: { xs: 0.5, sm: 1 },
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
                  size={56}
                  fill={isActive ? '#FACC15' : 'none'}
                  color={isActive ? '#F59E0B' : '#D1D5DB'}
                  strokeWidth={isActive ? 1.2 : 1.5}
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
            overflow: 'hidden',
            textAlign: 'left',
          }}>
            <TextField
              fullWidth
              label="Your name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              variant="outlined"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  transition: 'box-shadow 0.2s ease',
                  '&.Mui-focused': {
                    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.12)',
                  },
                },
              }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Tell us more (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={rating >= 4 ? "What made your experience great?" : "What could we improve?"}
              variant="outlined"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  transition: 'box-shadow 0.2s ease',
                  '&.Mui-focused': {
                    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.12)',
                  },
                },
              }}
            />

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
                  : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': {
                  transform: 'translateY(-1px) scale(1.01)',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
                  background: 'linear-gradient(135deg, #5558E6 0%, #7C4FE0 100%)',
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
  );
}
