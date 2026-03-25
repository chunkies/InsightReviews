'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Box, Container, Typography, Button, TextField, Paper,
  LinearProgress, Chip, Avatar, IconButton,
} from '@mui/material';
import {
  Send, Star, ArrowRight, ArrowLeft, Shield, CheckCircle2,
  TrendingUp, MessageSquare, BarChart3,
  ExternalLink, RotateCcw, QrCode,
  Clock, DollarSign, Zap, Gift, Copy, Palette,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';

type DemoStep = 'collect' | 'review-form' | 'routing' | 'dashboard' | 'customize';

const DEMO_BUSINESS = 'Sage & Vine Cafe';
const SIGNUP_URL = '/auth/login?mode=signup';

const PLATFORM_COLORS: Record<string, string> = {
  google: '#4285F4',
  yelp: '#D32323',
  facebook: '#1877F2',
};

/* ─── Shared logo used everywhere ─────────────────────────────── */
function BrandLogo({ size = 32 }: { size?: number }) {
  return (
    <Box sx={{
      width: size, height: size, borderRadius: `${size * 0.25}px`,
      background: 'linear-gradient(135deg, #1565c0 0%, #7c3aed 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Star size={size * 0.56} color="#fff" fill="#fff" />
    </Box>
  );
}

export function InteractiveDemo() {
  const [step, setStep] = useState<DemoStep>('collect');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);

  const isPositive = selectedRating >= 4;
  const customerName = 'Sarah';

  const scrollToDemo = useCallback(() => {
    demoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleSubmitReview = useCallback(() => {
    setReviewSubmitted(true);
    setTimeout(() => {
      setStep('routing');
    }, 1200);
  }, []);

  const handleSendSms = useCallback(() => {
    setSmsSending(true);
    setTimeout(() => {
      setSmsSending(false);
      setStep('review-form');
    }, 1200);
  }, []);

  const handleReset = useCallback(() => {
    setStep('collect');
    setSelectedRating(0);
    setComment('');
    setReviewSubmitted(false);
    setSmsSending(false);
    scrollToDemo();
  }, [scrollToDemo]);

  const steps: { key: DemoStep; label: string }[] = [
    { key: 'collect', label: 'Collect' },
    { key: 'review-form', label: 'Customer Rates' },
    { key: 'routing', label: 'Smart Route' },
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'customize', label: 'Customize' },
  ];

  const currentIndex = steps.findIndex(s => s.key === step);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* ─── Sticky Header ─── */}
      <Box sx={{
        bgcolor: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: 1.5,
        px: { xs: 2, md: 3 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BrandLogo size={32} />
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#2563eb' }}>
            InsightReviews
          </Typography>
        </Link>
        <Button
          component={Link}
          href={SIGNUP_URL}
          variant="contained"
          size="small"
          sx={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#000',
            '&:hover': { background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', transform: 'translateY(-1px)' },
            px: { xs: 2, md: 3 },
            fontWeight: 700,
            borderRadius: '50px',
            boxShadow: '0 2px 12px rgba(245,158,11,0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          Start Free Trial
        </Button>
      </Box>

      {/* ─── HERO ─── */}
      <Box sx={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #2563eb 100%)',
        color: 'white',
        py: { xs: 6, md: 8 },
        px: 2,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography sx={{
            fontWeight: 900,
            fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.6rem' },
            lineHeight: 1.15,
            mb: 2,
          }}>
            Your Google rating is costing you customers.{' '}
            <Box component="span" sx={{
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Let&apos;s fix that.
            </Box>
          </Typography>

          <Typography sx={{
            fontSize: { xs: '1rem', md: '1.15rem' },
            color: 'rgba(255,255,255,0.8)',
            mb: 3,
            maxWidth: 480,
            mx: 'auto',
            lineHeight: 1.6,
          }}>
            88% of customers check reviews before choosing a local business.
            One QR code at the counter fixes your rating. See how.
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={scrollToDemo}
            endIcon={<ArrowRight size={20} />}
            sx={{
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              color: '#0f172a',
              '&:hover': { background: 'linear-gradient(135deg, #fde68a, #fbbf24)', transform: 'translateY(-2px)' },
              px: 4, py: 1.5,
              fontSize: '1.05rem',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(251,191,36,0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            Try the Demo — It&apos;s Interactive
          </Button>

          <Box sx={{
            display: 'flex', gap: { xs: 2, md: 3 }, justifyContent: 'center',
            mt: 3, flexWrap: 'wrap',
          }}>
            {['No account needed', 'See results in 60 seconds', 'Built for Aussie businesses'].map(t => (
              <Box key={t} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircle2 size={14} color="#4ade80" />
                <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                  {t}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ─── VALUE PROPS ─── */}
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 5 } }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2.5,
          mb: { xs: 4, md: 6 },
        }}>
          {[
            {
              icon: <QrCode size={24} color="#2563eb" />,
              title: 'One QR code',
              desc: 'Print it, stick it at the counter. Customer scans, taps a rating, done in 30 seconds.',
            },
            {
              icon: <TrendingUp size={24} color="#16a34a" />,
              title: 'Happy → Google',
              desc: '4-5 star reviews get directed to Google, Yelp, or Facebook. Your rating goes up.',
            },
            {
              icon: <Shield size={24} color="#f59e0b" />,
              title: 'Unhappy → Private',
              desc: '1-3 stars stay between you and the customer. You follow up. They never post publicly.',
            },
          ].map((item) => (
            <Paper key={item.title} elevation={0} sx={{
              p: 3, textAlign: 'center',
              border: '1px solid #e2e8f0',
              borderRadius: 3,
            }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: '12px',
                bgcolor: '#f8fafc', mx: 'auto', mb: 1.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.icon}
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', mb: 0.5 }}>
                {item.title}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                {item.desc}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* ─── INTERACTIVE DEMO ─── */}
        <Box ref={demoRef} sx={{ scrollMarginTop: '80px' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Chip label="INTERACTIVE DEMO" size="small" sx={{
              bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 700, fontSize: '0.7rem',
              mb: 1.5, letterSpacing: '0.5px',
            }} />
            <Typography sx={{
              fontWeight: 800,
              fontSize: { xs: '1.4rem', md: '1.8rem' },
              color: '#0f172a',
              mb: 0.5,
            }}>
              Try it yourself — tap through the flow
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.95rem' }}>
              This is exactly what your staff and customers will experience
            </Typography>
          </Box>

          {/* Progress Steps */}
          <Box sx={{
            display: 'flex', justifyContent: 'center', gap: { xs: 0.5, sm: 1 }, mb: 3,
            flexWrap: 'wrap',
          }}>
            {steps.map((s, i) => (
              <Box
                key={s.key}
                onClick={() => { if (i <= currentIndex) setStep(s.key); }}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.5,
                  cursor: i <= currentIndex ? 'pointer' : 'default',
                  opacity: i <= currentIndex ? 1 : 0.4,
                }}
              >
                <Box sx={{
                  width: 28, height: 28, borderRadius: '50%',
                  bgcolor: i <= currentIndex ? '#2563eb' : '#e2e8f0',
                  color: i <= currentIndex ? 'white' : '#94a3b8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700,
                  transition: 'all 0.3s ease',
                }}>
                  {i < currentIndex ? '✓' : i + 1}
                </Box>
                <Typography sx={{
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                  fontWeight: i === currentIndex ? 700 : 500,
                  color: i === currentIndex ? '#0f172a' : '#64748b',
                  display: { xs: i === currentIndex ? 'block' : 'none', sm: 'block' },
                }}>
                  {s.label}
                </Typography>
                {i < steps.length - 1 && (
                  <Box sx={{
                    width: { xs: 8, sm: 20 }, height: 2,
                    bgcolor: i < currentIndex ? '#2563eb' : '#e2e8f0',
                    mx: 0.5,
                    display: { xs: 'none', sm: 'block' },
                  }} />
                )}
              </Box>
            ))}
          </Box>

          {/* Step Content */}
          <Paper elevation={0} sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: 'white',
          }}>
            {/* ───────── Step 1: Collect (QR + SMS) ───────── */}
            {step === 'collect' && (
              <Box sx={{ p: { xs: 3, md: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <QrCode size={20} color="#2563eb" />
                  <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
                    Step 1: Collect reviews with a QR code or SMS
                  </Typography>
                </Box>
                <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mb: 3 }}>
                  Print a QR code for the counter — customers scan and review in 30 seconds. Or send a text.
                </Typography>

                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 3,
                  maxWidth: 600,
                  mx: 'auto',
                }}>
                  {/* QR Code Card */}
                  <Box sx={{
                    bgcolor: '#f8fafc', borderRadius: 2, p: 3,
                    border: '2px solid #2563eb',
                    textAlign: 'center',
                    position: 'relative',
                  }}>
                    <Chip label="PRIMARY" size="small" sx={{
                      position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                      bgcolor: '#2563eb', color: 'white', fontWeight: 700, fontSize: '0.6rem',
                    }} />
                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', mb: 2 }}>
                      QR Code at the Counter
                    </Typography>

                    {/* QR Code mockup */}
                    <Box sx={{
                      width: 140, height: 140, mx: 'auto', mb: 2,
                      bgcolor: 'white', borderRadius: 2, p: 1.5,
                      border: '1px solid #e2e8f0',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Box sx={{
                        width: 100, height: 100,
                        backgroundImage: `
                          repeating-conic-gradient(#0f172a 0% 25%, transparent 0% 50%)
                          0% 0% / 12px 12px
                        `,
                        borderRadius: 1,
                        opacity: 0.85,
                      }} />
                    </Box>

                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mb: 1.5 }}>
                      Customers scan with their phone camera
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Chip icon={<Copy size={12} />} label="Copy Link" size="small"
                        sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', fontSize: '0.7rem' }} />
                      <Chip icon={<QrCode size={12} />} label="Print Card" size="small"
                        sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', fontSize: '0.7rem' }} />
                    </Box>
                  </Box>

                  {/* SMS Card */}
                  <Box sx={{
                    bgcolor: '#f8fafc', borderRadius: 2, p: 3,
                    border: '1px solid #e2e8f0',
                    textAlign: 'center',
                  }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', mb: 2 }}>
                      Or Send an SMS
                    </Typography>

                    <TextField
                      label="Phone number"
                      value="0412 345 678"
                      fullWidth size="small"
                      sx={{ mb: 1.5 }}
                      slotProps={{ input: { readOnly: true } }}
                    />
                    <TextField
                      label="Name (optional)"
                      value="Sarah"
                      fullWidth size="small"
                      sx={{ mb: 2 }}
                      slotProps={{ input: { readOnly: true } }}
                    />

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleSendSms}
                      disabled={smsSending}
                      startIcon={smsSending ? undefined : <Send size={16} />}
                      sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
                    >
                      {smsSending ? 'Sending...' : 'Send Review Request'}
                    </Button>
                    {smsSending && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}

                    <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mt: 1.5 }}>
                      Customer gets: &ldquo;Thanks for visiting {DEMO_BUSINESS}! We&apos;d love your feedback 😊&rdquo;
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={() => setStep('review-form')}
                    endIcon={<ArrowRight size={16} />}
                    sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
                  >
                    See what the customer sees
                  </Button>
                </Box>
              </Box>
            )}

            {/* ───────── Step 2: Review Form ───────── */}
            {step === 'review-form' && (
              <Box sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, justifyContent: 'center' }}>
                  <Star size={20} color="#f59e0b" />
                  <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
                    Step 2: Customer taps a rating
                  </Typography>
                </Box>
                <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mb: 3 }}>
                  Branded with your logo and business name. Under 30 seconds. Try it!
                </Typography>

                <Box sx={{
                  maxWidth: 380, mx: 'auto',
                  borderRadius: 3,
                  bgcolor: 'white', p: { xs: 3, md: 4 },
                  boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Background glow like real app */}
                  {selectedRating > 0 && (
                    <Box sx={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      background: selectedRating >= 4
                        ? 'radial-gradient(ellipse at top, rgba(250,204,21,0.12) 0%, transparent 70%)'
                        : 'radial-gradient(ellipse at top, rgba(234,179,8,0.08) 0%, transparent 70%)',
                      pointerEvents: 'none', zIndex: 0,
                    }} />
                  )}

                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Avatar sx={{
                      width: 64, height: 64, mx: 'auto', mb: 1.5,
                      bgcolor: '#2563eb', fontSize: '1.3rem', fontWeight: 700,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                    }}>
                      SV
                    </Avatar>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', mb: 0.3 }}>
                      {DEMO_BUSINESS}
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: '#64748b', mb: 3 }}>
                      How was your experience?
                    </Typography>

                    {/* Star rating */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                      {[1, 2, 3, 4, 5].map((rating) => {
                        const ratingColors: Record<number, string> = {
                          1: '#EF4444', 2: '#F97316', 3: '#EAB308', 4: '#22C55E', 5: '#16A34A',
                        };
                        const isActive = rating <= selectedRating;
                        const activeColor = selectedRating > 0 ? ratingColors[selectedRating] : '#94a3b8';
                        return (
                          <IconButton
                            key={rating}
                            onClick={() => setSelectedRating(rating)}
                            disabled={reviewSubmitted}
                            sx={{
                              width: 48, height: 48, borderRadius: '12px',
                              bgcolor: isActive ? activeColor : '#f1f5f9',
                              '&:hover': {
                                bgcolor: isActive ? activeColor : '#e2e8f0',
                                transform: 'scale(1.15)',
                              },
                              transition: 'all 0.2s ease',
                              transform: isActive ? 'scale(1.05)' : 'scale(1)',
                            }}
                          >
                            <Star
                              size={22}
                              color={isActive ? '#fff' : '#94a3b8'}
                              fill={isActive ? '#fff' : 'none'}
                            />
                          </IconButton>
                        );
                      })}
                    </Box>

                    {selectedRating > 0 && (
                      <Typography sx={{
                        fontSize: '0.85rem', fontWeight: 600, mb: 2,
                        color: ['#94a3b8', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#16A34A'][selectedRating],
                      }}>
                        {['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent'][selectedRating]}
                      </Typography>
                    )}

                    {selectedRating > 0 && !reviewSubmitted && (
                      <>
                        <TextField
                          multiline rows={2}
                          placeholder="Tell us more (optional)..."
                          value={comment}
                          onChange={e => setComment(e.target.value)}
                          fullWidth size="small"
                          sx={{ mb: 2 }}
                        />
                        <Button
                          variant="contained" fullWidth
                          onClick={handleSubmitReview}
                          sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, py: 1.2, fontWeight: 700 }}
                        >
                          Submit Review
                        </Button>
                      </>
                    )}

                    {reviewSubmitted && (
                      <Box sx={{
                        mt: 1, p: 2, borderRadius: 2,
                        bgcolor: selectedRating >= 4 ? '#f0fdf4' : '#f8fafc',
                        animation: 'fadeIn 0.4s ease',
                      }}>
                        <CheckCircle2
                          size={28}
                          color={selectedRating >= 4 ? '#16a34a' : '#64748b'}
                          style={{ margin: '0 auto 8px', display: 'block' }}
                        />
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                          {selectedRating >= 4 ? 'Thank you!' : 'Thank you for your feedback'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.5 }}>
                          Redirecting...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {!reviewSubmitted && selectedRating === 0 && (
                  <Typography sx={{ mt: 2, color: '#94a3b8', fontSize: '0.8rem' }}>
                    👆 Tap a star rating to try it out
                  </Typography>
                )}
              </Box>
            )}

            {/* ───────── Step 3: Smart Routing ───────── */}
            {step === 'routing' && (
              <Box sx={{ p: { xs: 3, md: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, justifyContent: 'center' }}>
                  {isPositive
                    ? <TrendingUp size={20} color="#16a34a" />
                    : <Shield size={20} color="#f59e0b" />
                  }
                  <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
                    Step 3: Smart routing kicks in
                  </Typography>
                </Box>

                {isPositive ? (
                  /* ─── Positive ─── */
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mb: 3 }}>
                      {selectedRating} stars = happy customer. They get directed to leave a public review on your chosen platforms.
                    </Typography>

                    {/* Mimics the real thank-you card */}
                    <Box sx={{
                      maxWidth: 400, mx: 'auto',
                      borderRadius: 3,
                      bgcolor: 'white', p: { xs: 3, md: 4 },
                      boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(0,0,0,0.06)',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      {/* Gold glow */}
                      <Box sx={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'radial-gradient(ellipse at top, rgba(250,204,21,0.15) 0%, rgba(34,197,94,0.06) 50%, transparent 80%)',
                        pointerEvents: 'none',
                      }} />

                      <Box sx={{ position: 'relative', zIndex: 1 }}>
                        {/* Animated checkmark */}
                        <Box sx={{
                          width: 64, height: 64, borderRadius: '50%', mx: 'auto', mb: 2,
                          background: 'linear-gradient(135deg, #16A34A, #22C55E)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          animation: 'fadeIn 0.4s ease',
                        }}>
                          <CheckCircle2 size={32} color="#fff" />
                        </Box>

                        <Typography sx={{
                          fontWeight: 800, fontSize: '1.6rem', mb: 1,
                          background: 'linear-gradient(135deg, #16A34A 0%, #22C55E 50%, #4ADE80 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}>
                          Thank You!
                        </Typography>

                        <Typography sx={{ fontSize: '0.9rem', color: '#64748b', mb: 3, lineHeight: 1.6 }}>
                          We really appreciate your feedback. Would you mind sharing your experience on one of these platforms?
                        </Typography>

                        {/* Platform buttons with real brand colors */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {[
                            { platform: 'google', label: 'Google' },
                            { platform: 'yelp', label: 'Yelp' },
                            { platform: 'facebook', label: 'Facebook' },
                          ].map((p) => {
                            const brandColor = PLATFORM_COLORS[p.platform];
                            return (
                              <Button
                                key={p.platform}
                                variant="contained"
                                size="large"
                                endIcon={<ExternalLink size={18} />}
                                sx={{
                                  backgroundColor: brandColor,
                                  py: 1.8,
                                  fontSize: '1rem',
                                  fontWeight: 700,
                                  borderRadius: 3,
                                  textTransform: 'none',
                                  boxShadow: `0 4px 14px ${brandColor}33`,
                                  '&:hover': {
                                    backgroundColor: brandColor,
                                    filter: 'brightness(1.08)',
                                    transform: 'translateY(-2px) scale(1.02)',
                                    boxShadow: `0 8px 24px ${brandColor}44`,
                                  },
                                }}
                              >
                                Review us on {p.label}
                              </Button>
                            );
                          })}
                        </Box>

                        {/* Coupon example */}
                        <Box sx={{
                          mt: 3, p: 2.5, borderRadius: 3,
                          background: 'linear-gradient(135deg, rgba(250,204,21,0.1) 0%, rgba(251,191,36,0.06) 100%)',
                          border: '1px dashed rgba(250,204,21,0.5)',
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                            <Gift size={18} color="#EAB308" />
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                              Here&apos;s a little thank you from us:
                            </Typography>
                          </Box>
                          <Box sx={{
                            display: 'inline-block',
                            bgcolor: 'white', px: 2.5, py: 1,
                            borderRadius: 2, border: '1px solid #e2e8f0',
                          }}>
                            <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '0.1em' }}>
                              THANKYOU10
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mt: 0.5 }}>
                            10% off your next visit
                          </Typography>
                        </Box>

                        <Typography sx={{ mt: 2, fontSize: '0.75rem', color: '#94a3b8' }}>
                          Every review helps small businesses like ours grow. Thank you!
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  /* ─── Negative ─── */
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mb: 3 }}>
                      {selectedRating} star{selectedRating !== 1 ? 's' : ''} — that feedback stays private. No public post. You get notified so you can follow up.
                    </Typography>

                    <Box sx={{
                      maxWidth: 400, mx: 'auto',
                      borderRadius: 3,
                      bgcolor: 'white', p: { xs: 3, md: 4 },
                      boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(0,0,0,0.06)',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <Box sx={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'radial-gradient(ellipse at top, rgba(99,102,241,0.08) 0%, transparent 70%)',
                        pointerEvents: 'none',
                      }} />

                      <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Box sx={{ color: '#6366f1', mb: 2 }}>
                          <MessageCircle size={56} strokeWidth={1.5} />
                        </Box>

                        <Typography sx={{
                          fontWeight: 800, fontSize: '1.4rem', mb: 1.5, color: '#0f172a',
                        }}>
                          Thank You for Your Feedback
                        </Typography>

                        <Typography sx={{ fontSize: '0.9rem', color: '#64748b', mb: 3, lineHeight: 1.7 }}>
                          We appreciate you letting us know. Your feedback helps us improve. We&apos;ll follow up with you soon.
                        </Typography>

                        {/* No platform buttons — that's the point */}

                        {/* Notification preview */}
                        <Box sx={{
                          bgcolor: '#f8fafc', borderRadius: 2, p: 2,
                          border: '1px solid #e2e8f0', textAlign: 'left',
                        }}>
                          <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mb: 1 }}>
                            Meanwhile, you get a notification:
                          </Typography>
                          <Box sx={{
                            bgcolor: '#fef2f2', borderRadius: 1.5, p: 1.5,
                            border: '1px solid #fecaca',
                          }}>
                            <Typography sx={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>
                              ⚠️ New {selectedRating}-star review from {customerName}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.5 }}>
                              {comment || 'No comment left.'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#2563eb', mt: 0.5, fontWeight: 600 }}>
                              Tap to follow up →
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3, flexWrap: 'wrap' }}>
                  <Button
                    component={Link}
                    href={SIGNUP_URL}
                    variant="contained"
                    endIcon={<ArrowRight size={16} />}
                    sx={{
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      color: '#0f172a',
                      fontWeight: 700,
                      '&:hover': { background: 'linear-gradient(135deg, #fde68a, #fbbf24)', transform: 'translateY(-1px)' },
                      boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
                    }}
                  >
                    Get Your Free QR Code
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setStep('dashboard')}
                    endIcon={<ArrowRight size={16} />}
                    sx={{ borderColor: '#e2e8f0', color: '#64748b', '&:hover': { borderColor: '#cbd5e1' } }}
                  >
                    See the dashboard
                  </Button>
                </Box>
              </Box>
            )}

            {/* ───────── Step 4: Dashboard ───────── */}
            {step === 'dashboard' && (
              <Box sx={{ p: { xs: 3, md: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, justifyContent: 'center' }}>
                  <BarChart3 size={20} color="#2563eb" />
                  <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
                    Step 4: Your dashboard — everything in one place
                  </Typography>
                </Box>
                <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mb: 3, textAlign: 'center' }}>
                  Track every review, see your stats trend up, and never miss negative feedback.
                </Typography>

                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                  gap: 2, mb: 3,
                }}>
                  {[
                    { label: 'Total Reviews', value: '47', change: '+12 this week' },
                    { label: 'Avg Rating', value: '4.6 ★', change: 'Up from 4.2' },
                    { label: 'Positive Rate', value: '85%', change: '40 of 47' },
                    { label: 'Google Reviews', value: '31', change: '+8 this month' },
                  ].map((stat) => (
                    <Box key={stat.label} sx={{
                      bgcolor: '#f8fafc', borderRadius: 2, p: 2,
                      border: '1px solid #e2e8f0',
                    }}>
                      <Typography sx={{ fontSize: '0.7rem', color: '#64748b', mb: 0.5 }}>
                        {stat.label}
                      </Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#0f172a' }}>
                        {stat.value}
                      </Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: 500 }}>
                        {stat.change}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a', mb: 1.5 }}>
                  Recent Reviews
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Their review */}
                  <ReviewRow
                    name={customerName}
                    rating={selectedRating}
                    comment={comment || '(No comment)'}
                    time="just now"
                    isPublic={isPositive}
                    highlighted
                  />
                  <ReviewRow name="James M." rating={5} comment="Best flat white in Melbourne. Staff are always friendly." time="2 hours ago" isPublic />
                  <ReviewRow name="Lisa K." rating={2} comment="Waited 25 minutes for a simple order. Not happy." time="5 hours ago" isPublic={false} />
                  <ReviewRow name="Tom R." rating={5} comment="Love this place! Great atmosphere and food." time="Yesterday" isPublic />
                </Box>

                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={() => setStep('customize')}
                    endIcon={<ArrowRight size={16} />}
                    sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
                  >
                    See the customization options
                  </Button>
                </Box>
              </Box>
            )}

            {/* ───────── Step 5: Customize ───────── */}
            {step === 'customize' && (
              <Box sx={{ p: { xs: 3, md: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, justifyContent: 'center' }}>
                  <Palette size={20} color="#7c3aed" />
                  <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
                    Step 5: Fully customizable — your brand, your rules
                  </Typography>
                </Box>
                <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mb: 3, textAlign: 'center' }}>
                  Everything is branded to your business. Customers see your name and logo, never ours.
                </Typography>

                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2.5,
                }}>
                  {/* Review Form Customization */}
                  <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Star size={16} color="#f59e0b" />
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                        Review Form
                      </Typography>
                    </Box>
                    {[
                      'Your logo & business name',
                      'Custom heading & subheading text',
                      'Branded colors & fonts',
                      'Optional photo upload',
                      '7 design presets (Clean, Dark, Warm, Ocean...)',
                    ].map(f => (
                      <Box key={f} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <CheckCircle2 size={14} color="#16a34a" style={{ marginTop: 3, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.8rem', color: '#374151' }}>{f}</Typography>
                      </Box>
                    ))}
                  </Paper>

                  {/* Smart Routing */}
                  <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <TrendingUp size={16} color="#16a34a" />
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                        Smart Routing
                      </Typography>
                    </Box>
                    {[
                      'Set your threshold (3+, 4+, or 5 stars only)',
                      'Choose platforms: Google, Yelp, Facebook, TripAdvisor, or custom',
                      'Custom thank-you messages (positive & negative)',
                      'Add a coupon code on the thank-you page',
                      'Auto follow-up on negative reviews',
                    ].map(f => (
                      <Box key={f} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <CheckCircle2 size={14} color="#16a34a" style={{ marginTop: 3, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.8rem', color: '#374151' }}>{f}</Typography>
                      </Box>
                    ))}
                  </Paper>

                  {/* Notifications */}
                  <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <MessageSquare size={16} color="#2563eb" />
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                        Notifications & SMS
                      </Typography>
                    </Box>
                    {[
                      'Email alerts on negative reviews',
                      'Custom SMS template with your branding',
                      'Weekly/daily email digest',
                      'Webhook integration (Zapier, etc.)',
                    ].map(f => (
                      <Box key={f} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <CheckCircle2 size={14} color="#16a34a" style={{ marginTop: 3, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.8rem', color: '#374151' }}>{f}</Typography>
                      </Box>
                    ))}
                  </Paper>

                  {/* Testimonial Wall */}
                  <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Palette size={16} color="#7c3aed" />
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                        Testimonial Wall
                      </Typography>
                    </Box>
                    {[
                      'Public page showcasing your best reviews',
                      'Custom colors, fonts & layout',
                      'Embed on your website',
                      'Curate which reviews to show',
                    ].map(f => (
                      <Box key={f} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                        <CheckCircle2 size={14} color="#16a34a" style={{ marginTop: 3, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.8rem', color: '#374151' }}>{f}</Typography>
                      </Box>
                    ))}
                  </Paper>
                </Box>
              </Box>
            )}
          </Paper>

          {/* Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, mb: 4 }}>
            <Button
              startIcon={<ArrowLeft size={16} />}
              onClick={() => {
                const prev = steps[currentIndex - 1];
                if (prev) setStep(prev.key);
              }}
              disabled={currentIndex === 0}
              sx={{ color: '#64748b' }}
            >
              Back
            </Button>
            {step === 'customize' ? (
              <Button
                startIcon={<RotateCcw size={16} />}
                onClick={handleReset}
                sx={{ color: '#64748b' }}
              >
                Try Again
              </Button>
            ) : step !== 'review-form' && step !== 'collect' ? (
              <Button
                endIcon={<ArrowRight size={16} />}
                onClick={() => {
                  const next = steps[currentIndex + 1];
                  if (next) setStep(next.key);
                }}
                sx={{ color: '#2563eb' }}
              >
                Next
              </Button>
            ) : null}
          </Box>
        </Box>

        {/* ─── PROOF STATS ─── */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2.5,
          mb: { xs: 4, md: 6 },
        }}>
          {[
            { icon: <Clock size={20} color="#2563eb" />, value: '<30 sec', label: 'For a customer to leave a review' },
            { icon: <DollarSign size={20} color="#16a34a" />, value: '$1,500+', label: 'Extra revenue from a 0.5-star boost' },
            { icon: <Zap size={20} color="#f59e0b" />, value: '95%', label: 'SMS open rate (vs 20% email)' },
          ].map((stat) => (
            <Box key={stat.value} sx={{
              textAlign: 'center', p: 3,
              bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 3,
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>{stat.icon}</Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#0f172a', mb: 0.3 }}>
                {stat.value}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>{stat.label}</Typography>
            </Box>
          ))}
        </Box>

        {/* ─── FINAL CTA ─── */}
        <Box sx={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #2563eb 100%)',
          borderRadius: 4,
          p: { xs: 4, md: 6 },
          textAlign: 'center',
          color: 'white',
          mb: 4,
        }}>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.4rem', md: '1.8rem' }, mb: 1 }}>
            Ready to get more 5-star Google reviews?
          </Typography>
          <Typography sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', mb: 3, maxWidth: 460, mx: 'auto' }}>
            14-day free trial. No credit card. Set up your QR code in under 5 minutes. Cancel anytime.
          </Typography>
          <Button
            component={Link}
            href={SIGNUP_URL}
            variant="contained"
            size="large"
            endIcon={<ArrowRight size={20} />}
            sx={{
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              color: '#0f172a',
              '&:hover': { background: 'linear-gradient(135deg, #fde68a, #fbbf24)', transform: 'translateY(-2px)' },
              px: 4, py: 1.5,
              fontSize: '1.05rem',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(251,191,36,0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            Get Your Free QR Code
          </Button>
          <Typography sx={{ mt: 2, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
            $79/mo after trial. No lock-in. Cancel in one click.
          </Typography>
        </Box>

        {/* ─── FAQ ─── */}
        <Box sx={{ mb: 6 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#0f172a', textAlign: 'center', mb: 3 }}>
            Common questions
          </Typography>
          {[
            { q: 'Do I need to be technical?', a: 'No. You sign up, enter your business name and Google review link, and print your QR code. That\'s it. Your staff just enters a phone number and taps Send.' },
            { q: 'What if I don\'t have many customers yet?', a: 'Even better — start collecting reviews from day one. Businesses that start early build a strong rating before competitors.' },
            { q: 'Can customers see that negative reviews are being filtered?', a: 'No. Every customer sees a simple thank-you page. Positive reviewers get a gentle nudge to share on Google. Negative reviewers see a message that you\'ll follow up. It\'s transparent and ethical — no reviews are deleted or faked.' },
            { q: 'What\'s the catch with the free trial?', a: 'No catch. No credit card required to start. Use it for 14 days. If it\'s not for you, just stop. We don\'t even ask why.' },
          ].map((faq) => (
            <Paper key={faq.q} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 2.5, mb: 1.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', mb: 0.5 }}>{faq.q}</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>{faq.a}</Typography>
            </Paper>
          ))}
        </Box>
      </Container>

      {/* ─── STICKY MOBILE CTA ─── */}
      <Box sx={{
        display: { xs: 'block', md: 'none' },
        position: 'fixed', bottom: 0, left: 0, right: 0,
        bgcolor: 'white',
        borderTop: '1px solid #e2e8f0',
        p: 2, zIndex: 99,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
      }}>
        <Button
          component={Link}
          href={SIGNUP_URL}
          variant="contained"
          fullWidth size="large"
          sx={{
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            color: '#0f172a', fontWeight: 700, fontSize: '1rem', py: 1.5,
            boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
          }}
        >
          Get Your Free QR Code — 14 Days Free
        </Button>
      </Box>

      <Box sx={{ height: { xs: 80, md: 0 } }} />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
}

/* ─── Review Row Component ─── */
function ReviewRow({ name, rating, comment, time, isPublic, highlighted }: {
  name: string; rating: number; comment: string; time: string;
  isPublic: boolean; highlighted?: boolean;
}) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'flex-start', gap: 2,
      bgcolor: highlighted ? (isPublic ? '#f0fdf4' : '#fffbeb') : 'white',
      border: '1px solid',
      borderColor: highlighted ? (isPublic ? '#dcfce7' : '#fef3c7') : '#e2e8f0',
      borderRadius: 2, p: 2,
    }}>
      <Avatar sx={{
        width: 36, height: 36,
        bgcolor: highlighted ? (isPublic ? '#dcfce7' : '#fef3c7') : '#f1f5f9',
        color: highlighted ? (isPublic ? '#16a34a' : '#d97706') : '#64748b',
        fontSize: '0.8rem', fontWeight: 700,
      }}>
        {name[0].toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#0f172a' }}>
            {name} — {time}
          </Typography>
          <Chip
            label={isPublic ? 'Public' : 'Private'}
            size="small"
            sx={{
              height: 20, fontSize: '0.6rem', fontWeight: 600,
              bgcolor: isPublic ? '#dcfce7' : '#fef3c7',
              color: isPublic ? '#16a34a' : '#d97706',
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 0.3, mb: 0.5 }}>
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} size={12} color={s <= rating ? '#fbbf24' : '#e2e8f0'} fill={s <= rating ? '#fbbf24' : 'none'} />
          ))}
        </Box>
        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{comment}</Typography>
      </Box>
    </Box>
  );
}
