'use client';

import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { Star, TrendingUp, Send, BarChart3, ArrowUp, ArrowDown, Clock } from 'lucide-react';
import type { ReviewStats } from '@/lib/types/database';

interface RecentReview {
  name: string;
  rating: number;
  time: string;
  comment: string;
}

interface DashboardStatsProps {
  stats: ReviewStats;
  recentReviews: RecentReview[];
}

const statCards = [
  {
    key: 'totalReviews' as const,
    label: 'Total Reviews',
    icon: Star,
    color: '#2563eb',
    gradient: 'linear-gradient(135deg, #2563eb08 0%, #2563eb18 100%)',
    sparkline: [30, 45, 35, 60, 50, 70, 65],
  },
  {
    key: 'averageRating' as const,
    label: 'Average Rating',
    icon: BarChart3,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b08 0%, #f59e0b18 100%)',
    suffix: '/5',
    sparkline: [4.2, 4.3, 4.1, 4.5, 4.4, 4.6, 4.5],
  },
  {
    key: 'positivePercentage' as const,
    label: 'Positive Reviews',
    icon: TrendingUp,
    color: '#16a34a',
    gradient: 'linear-gradient(135deg, #16a34a08 0%, #16a34a18 100%)',
    suffix: '%',
    sparkline: [78, 82, 80, 85, 88, 86, 90],
  },
  {
    key: 'totalRequests' as const,
    label: 'SMS Sent',
    icon: Send,
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf608 0%, #8b5cf618 100%)',
    sparkline: [12, 18, 15, 22, 20, 28, 25],
  },
  {
    key: 'responseRate' as const,
    label: 'Response Rate',
    icon: BarChart3,
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec489908 0%, #ec489918 100%)',
    suffix: '%',
    sparkline: [40, 45, 42, 50, 48, 55, 52],
  },
];

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 32;
  const width = 80;
  const step = width / (data.length - 1);

  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(' ');

  return (
    <Box
      component="svg"
      viewBox={`0 0 ${width} ${height}`}
      sx={{ width: 80, height: 32, flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={`sparkGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <polygon
        fill={`url(#sparkGrad-${color.replace('#', '')})`}
        points={`0,${height} ${points} ${width},${height}`}
      />
    </Box>
  );
}

export function DashboardStats({ stats, recentReviews }: DashboardStatsProps) {
  const weekChange = stats.thisWeekReviews - stats.lastWeekReviews;

  return (
    <Box>
      <Grid container spacing={2.5}>
        {/* This Week - prominent card */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 500, letterSpacing: 0.5 }}>
                    THIS WEEK
                  </Typography>
                  <Typography variant="h3" fontWeight={800} sx={{ mt: 0.5, lineHeight: 1.1 }}>
                    {stats.thisWeekReviews}
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.5 }}>
                    reviews collected
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        backgroundColor: weekChange >= 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,100,100,0.3)',
                        borderRadius: 10,
                        px: 1.5,
                        py: 0.5,
                      }}
                    >
                      {weekChange >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      <Typography variant="body2" fontWeight={600}>
                        {Math.abs(weekChange)} vs last week
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ opacity: 0.15, position: 'absolute', right: -10, top: -10 }}>
                  <TrendingUp size={160} strokeWidth={1} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick metric cards on the right */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Grid container spacing={2.5} sx={{ height: '100%' }}>
            <Grid size={12}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #f59e0b08 0%, #f59e0b18 100%)',
                  border: '1px solid',
                  borderColor: '#f59e0b20',
                  height: '100%',
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ letterSpacing: 0.3 }}>
                        AVG RATING
                      </Typography>
                      <Typography variant="h4" fontWeight={800} sx={{ color: '#f59e0b', lineHeight: 1.2 }}>
                        {stats.averageRating}<Typography component="span" variant="body1" sx={{ color: 'text.secondary' }}>/5</Typography>
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.25 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          fill={s <= Math.round(stats.averageRating) ? '#f59e0b' : 'transparent'}
                          color={s <= Math.round(stats.averageRating) ? '#f59e0b' : '#d1d5db'}
                        />
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={12}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, #16a34a08 0%, #16a34a18 100%)',
                  border: '1px solid',
                  borderColor: '#16a34a20',
                  height: '100%',
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ letterSpacing: 0.3 }}>
                        POSITIVE
                      </Typography>
                      <Typography variant="h4" fontWeight={800} sx={{ color: '#16a34a', lineHeight: 1.2 }}>
                        {stats.positivePercentage}<Typography component="span" variant="body1" sx={{ color: 'text.secondary' }}>%</Typography>
                      </Typography>
                    </Box>
                    <TrendingUp size={22} color="#16a34a" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Remaining stat cards with sparklines */}
        {statCards
          .filter((c) => c.key !== 'averageRating' && c.key !== 'positivePercentage')
          .map(({ key, label, icon: Icon, color, suffix, sparkline, gradient }) => (
            <Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  background: gradient,
                  border: '1px solid',
                  borderColor: `${color}20`,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 25px ${color}15`,
                  },
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: `${color}15`,
                        }}
                      >
                        <Icon size={18} color={color} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        {label}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <Typography variant="h4" fontWeight={800}>
                      {stats[key]}{suffix ?? ''}
                    </Typography>
                    <MiniSparkline data={sparkline} color={color} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      {/* Recent Reviews Quick Preview */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Recent Reviews
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <Clock size={14} />
            <Typography variant="caption">Last 24 hours</Typography>
          </Box>
        </Box>
        <Grid container spacing={2}>
          {recentReviews.map((review, idx) => (
            <Grid key={idx} size={{ xs: 12, sm: 4 }}>
              <Card
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  },
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {review.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {review.time}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.25, mb: 1 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={s <= review.rating ? '#f59e0b' : 'transparent'}
                        color={s <= review.rating ? '#f59e0b' : '#d1d5db'}
                      />
                    ))}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    &ldquo;{review.comment}&rdquo;
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
