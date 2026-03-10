'use client';

import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { MessageSquare, ThumbsUp, ExternalLink, Send, QrCode } from 'lucide-react';
import type { ReactNode } from 'react';

export interface FunnelData {
  requestsSent: number;
  reviewsReceived: number;
  positiveReviews: number;
  redirectedToplatform: number;
  walkInReviews: number;
}

interface FunnelStage {
  label: string;
  count: number;
  icon: ReactNode;
  color: string;
}

function conversionLabel(from: number, to: number): string {
  if (from === 0) return '—';
  const pct = Math.round((to / from) * 100);
  return `${pct}%`;
}

export function ReviewFunnel({ data }: { data: FunnelData }) {
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  const totalReviews = data.reviewsReceived + data.walkInReviews;
  const totalPositive = data.positiveReviews;
  const totalRedirected = data.redirectedToplatform;

  // Main funnel stages — tracks ALL reviews regardless of source
  const stages: FunnelStage[] = [
    { label: 'Total Reviews', count: totalReviews, icon: <MessageSquare size={18} />, color: '#2563eb' },
    { label: 'Positive Reviews', count: totalPositive, icon: <ThumbsUp size={18} />, color: '#16a34a' },
    { label: 'Redirected to Platform', count: totalRedirected, icon: <ExternalLink size={18} />, color: '#8b5cf6' },
  ];

  const maxCount = Math.max(totalReviews, 1);

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Review Funnel
      </Typography>
      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          {/* Main funnel */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {stages.map((stage, idx) => {
              const widthPct = Math.max((stage.count / maxCount) * 100, totalReviews > 0 ? 8 : 0);
              const prevCount = idx > 0 ? stages[idx - 1].count : null;

              return (
                <Box key={stage.label}>
                  {prevCount !== null && (
                    <Box sx={{ display: 'flex', alignItems: 'center', pl: 2, py: 0.5 }}>
                      <Box
                        sx={{
                          width: 2,
                          height: 16,
                          backgroundColor: isDark ? '#334155' : '#e5e7eb',
                          ml: 1.5,
                        }}
                      />
                      <Chip
                        label={conversionLabel(prevCount, stage.count)}
                        size="small"
                        sx={{
                          ml: 1.5,
                          fontSize: 11,
                          height: 20,
                          fontWeight: 600,
                          backgroundColor: isDark ? '#1e3a5f' : '#f0f4ff',
                          color: isDark ? '#60a5fa' : '#2563eb',
                        }}
                      />
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: `${stage.color}15`,
                        color: stage.color,
                        flexShrink: 0,
                      }}
                    >
                      {stage.icon}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={600} color="text.primary">
                          {stage.label}
                        </Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ color: stage.color }}>
                          {stage.count}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          height: 24,
                          width: '100%',
                          backgroundColor: isDark ? '#1e293b' : '#f3f4f6',
                          borderRadius: 1.5,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${widthPct}%`,
                            background: `linear-gradient(90deg, ${stage.color} 0%, ${stage.color}cc 100%)`,
                            borderRadius: 1.5,
                            transition: 'width 0.6s ease',
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Source breakdown */}
          <Box
            sx={{
              mt: 3,
              pt: 3,
              borderTop: '1px dashed',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Review Sources
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <SourceCard
                icon={<Send size={16} />}
                label="SMS Requests"
                count={data.requestsSent}
                sublabel={data.reviewsReceived > 0 ? `${data.reviewsReceived} converted` : 'No conversions yet'}
                color="#3b82f6"
                isDark={isDark}
              />
              <SourceCard
                icon={<QrCode size={16} />}
                label="Walk-in / QR"
                count={data.walkInReviews}
                sublabel="Direct submissions"
                color="#8b5cf6"
                isDark={isDark}
              />
            </Box>
          </Box>

          {totalReviews === 0 && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No reviews yet. Send SMS requests or share your review link to get started.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function SourceCard({
  icon,
  label,
  count,
  sublabel,
  color,
  isDark,
}: {
  icon: ReactNode;
  label: string;
  count: number;
  sublabel: string;
  color: string;
  isDark: boolean;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        p: 2,
        borderRadius: 2,
        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        border: '1px solid',
        borderColor: isDark ? '#1e293b' : '#e2e8f0',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Box sx={{ color }}>{icon}</Box>
        <Typography variant="caption" fontWeight={600} color="text.secondary">
          {label}
        </Typography>
      </Box>
      <Typography variant="h5" fontWeight={800} sx={{ color }}>
        {count}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {sublabel}
      </Typography>
    </Box>
  );
}
