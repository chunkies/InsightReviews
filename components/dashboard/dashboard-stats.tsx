'use client';

import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { Star, TrendingUp, Send, ArrowUp, ArrowDown, Clock, MessageSquare } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import type { ReviewStats } from '@/lib/types/database';
import { ReviewFunnel } from '@/components/dashboard/review-funnel';
import type { FunnelData } from '@/components/dashboard/review-funnel';
import { NpsGauge } from '@/components/dashboard/nps-gauge';

interface RecentReview {
  name: string;
  rating: number;
  time: string;
  comment: string;
}

interface ChartDataPoint {
  date: string;
  reviews: number;
  requests: number;
}

interface DashboardStatsProps {
  stats: ReviewStats;
  recentReviews: RecentReview[];
  chartData: ChartDataPoint[];
  funnelData?: FunnelData;
}

export function DashboardStats({ stats, recentReviews, chartData, funnelData }: DashboardStatsProps) {
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === 'dark';
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

        {/* Secondary stat cards */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #2563eb08 0%, #2563eb18 100%)',
              border: '1px solid',
              borderColor: '#2563eb20',
            }}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb15' }}>
                  <Star size={18} color="#2563eb" />
                </Box>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Total Reviews</Typography>
              </Box>
              <Typography variant="h4" fontWeight={800}>{stats.totalReviews}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #8b5cf608 0%, #8b5cf618 100%)',
              border: '1px solid',
              borderColor: '#8b5cf620',
            }}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#8b5cf615' }}>
                  <Send size={18} color="#8b5cf6" />
                </Box>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Requests Sent</Typography>
              </Box>
              <Typography variant="h4" fontWeight={800}>{stats.totalRequests}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #ec489908 0%, #ec489918 100%)',
              border: '1px solid',
              borderColor: '#ec489920',
            }}
          >
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ec489915' }}>
                  <MessageSquare size={18} color="#ec4899" />
                </Box>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>SMS Response Rate</Typography>
              </Box>
              <Typography variant="h4" fontWeight={800}>
                {stats.totalRequests > 0 ? `${stats.responseRate}%` : '—'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reviews Chart */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Reviews Over Time
        </Typography>
        <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="reviewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="requestGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f0f0f0'} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: isDark ? '#334155' : '#e5e7eb' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                    boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: 13,
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#e2e8f0' : undefined,
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 13, paddingTop: 8 }}
                />
                <Area
                  type="monotone"
                  dataKey="reviews"
                  name="Reviews"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#reviewGrad)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  name="Requests Sent"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#requestGrad)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      {/* NPS Gauge */}
      <Box sx={{ mt: 4 }}>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <NpsGauge
              npsScore={stats.npsScore}
              promoterCount={stats.promoterCount}
              passiveCount={stats.passiveCount}
              detractorCount={stats.detractorCount}
              totalReviews={stats.totalReviews}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Review Funnel */}
      {funnelData && <ReviewFunnel data={funnelData} />}

      {/* Recent Reviews */}
      {recentReviews.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              Recent Reviews
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <Clock size={14} />
              <Typography variant="caption">Latest</Typography>
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
                    {review.comment && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        &ldquo;{review.comment}&rdquo;
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}
