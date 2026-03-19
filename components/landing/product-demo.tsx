'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { Star, QrCode, ArrowRight } from 'lucide-react';

const demoSteps = [
  {
    label: 'Customer scans QR code',
    phone: 'scanning',
  },
  {
    label: 'Taps a star rating',
    phone: 'rating',
  },
  {
    label: 'Happy? → Directed to Google',
    phone: 'redirect-positive',
  },
  {
    label: 'Unhappy? → Private feedback to you',
    phone: 'redirect-negative',
  },
];

export function ProductDemo() {
  const theme = useTheme();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % demoSteps.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const current = demoSteps[step];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Phone frame */}
      <Box
        sx={{
          width: { xs: 220, sm: 240, md: 260 },
          maxWidth: '85vw',
          borderRadius: '32px',
          border: `3px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          p: 1.5,
          boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
          transition: 'all 0.4s ease',
        }}
      >
        {/* Notch */}
        <Box sx={{ width: 80, height: 18, borderRadius: '0 0 12px 12px', backgroundColor: theme.palette.background.default, mx: 'auto', mb: 2 }} />

        {/* Screen */}
        <Box
          sx={{
            borderRadius: '18px',
            backgroundColor: theme.palette.background.default,
            p: 2.5,
            minHeight: 280,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.4s ease',
          }}
        >
          {current.phone === 'scanning' && (
            <Box sx={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
              <Box sx={{
                width: 80, height: 80, borderRadius: '16px',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 2,
              }}>
                <QrCode size={40} color="white" />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: theme.palette.text.primary, mb: 0.5 }}>
                Sage & Vine Cafe
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary }}>
                Scanning QR code...
              </Typography>
              <Box sx={{ mt: 2, width: 120, height: 3, borderRadius: 2, backgroundColor: theme.palette.divider, overflow: 'hidden' }}>
                <Box sx={{ width: '60%', height: '100%', backgroundColor: theme.palette.primary.main, borderRadius: 2, animation: 'loadBar 2.5s ease infinite' }} />
              </Box>
            </Box>
          )}

          {current.phone === 'rating' && (
            <Box sx={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: theme.palette.text.primary, mb: 0.5 }}>
                Sage & Vine Cafe
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary, mb: 2 }}>
                How was your visit today?
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', mb: 2 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Box
                    key={s}
                    sx={{
                      width: 32, height: 32, borderRadius: '8px',
                      backgroundColor: s <= 4 ? '#fbbf24' : theme.palette.divider,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      transform: s === 4 ? 'scale(1.15)' : 'scale(1)',
                    }}
                  >
                    <Star size={16} color={s <= 4 ? '#fff' : '#94a3b8'} fill={s <= 4 ? '#fff' : 'none'} />
                  </Box>
                ))}
              </Box>
              <Box sx={{ backgroundColor: theme.palette.background.default, borderRadius: '8px', p: 1.5, mb: 1.5 }}>
                <Typography sx={{ fontSize: '0.65rem', color: theme.palette.text.secondary }}>
                  Great coffee, lovely staff!
                </Typography>
              </Box>
              <Box sx={{ py: 0.8, borderRadius: '8px', backgroundColor: theme.palette.primary.main, textAlign: 'center' }}>
                <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>
                  Submit Review
                </Typography>
              </Box>
            </Box>
          )}

          {current.phone === 'redirect-positive' && (
            <Box sx={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
              <Box sx={{
                width: 56, height: 56, borderRadius: '50%',
                backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 2,
              }}>
                <Typography sx={{ fontSize: '1.5rem' }}>✓</Typography>
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: theme.palette.success.main, mb: 0.5 }}>
                Thank you!
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary, mb: 2 }}>
                Would you mind sharing on Google?
              </Typography>
              <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                py: 0.8, px: 2, borderRadius: '8px', backgroundColor: theme.palette.primary.main,
              }}>
                <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>
                  Leave a Google Review
                </Typography>
                <ArrowRight size={12} color="white" />
              </Box>
            </Box>
          )}

          {current.phone === 'redirect-negative' && (
            <Box sx={{ textAlign: 'center', animation: 'fadeIn 0.4s ease' }}>
              <Box sx={{
                width: 56, height: 56, borderRadius: '50%',
                backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 2,
              }}>
                <Typography sx={{ fontSize: '1.5rem' }}>🔒</Typography>
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: theme.palette.text.primary, mb: 0.5 }}>
                Thank you for letting us know
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary, mb: 2 }}>
                We&apos;ll follow up with you directly.
              </Typography>
              <Box sx={{
                py: 0.8, px: 2, borderRadius: '8px',
                border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.default, textAlign: 'center',
              }}>
                <Typography sx={{ fontSize: '0.65rem', color: theme.palette.text.secondary }}>
                  Feedback stays private — never posted publicly
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Step indicators */}
      <Box sx={{ display: 'flex', gap: 1, mt: 3, mb: 1.5 }}>
        {demoSteps.map((_, i) => (
          <Box
            key={i}
            onClick={() => setStep(i)}
            sx={{
              width: step === i ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: step === i ? theme.palette.primary.main : theme.palette.divider,
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }}
          />
        ))}
      </Box>

      {/* Step label */}
      <Typography
        sx={{
          fontWeight: 600,
          fontSize: '0.9rem',
          color: theme.palette.text.primary,
          textAlign: 'center',
          minHeight: 24,
          transition: 'all 0.3s ease',
        }}
      >
        {current.label}
      </Typography>

      {/* CSS keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loadBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </Box>
  );
}
