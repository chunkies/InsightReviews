'use client';

import { Box, Card, CardContent, Typography, LinearProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Trophy, Medal, Award, Users } from 'lucide-react';

export interface StaffLeaderboardEntry {
  userId: string;
  displayName: string;
  requestsSent: number;
  reviewsGenerated: number;
}

interface StaffLeaderboardProps {
  entries: StaffLeaderboardEntry[];
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy size={20} color="#f59e0b" fill="#f59e0b" />;
    case 2:
      return <Medal size={20} color="#94a3b8" fill="#94a3b8" />;
    case 3:
      return <Award size={20} color="#cd7f32" fill="#cd7f32" />;
    default:
      return null;
  }
}

function getRankBgColor(rank: number) {
  switch (rank) {
    case 1:
      return '#f59e0b10';
    case 2:
      return '#94a3b810';
    case 3:
      return '#cd7f3210';
    default:
      return 'transparent';
  }
}

export function StaffLeaderboard({ entries }: StaffLeaderboardProps) {
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  if (entries.length === 0) {
    return null;
  }

  const maxRequests = Math.max(...entries.map((e) => e.requestsSent), 1);

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          Staff Leaderboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
          <Users size={14} />
          <Typography variant="caption">This month</Typography>
        </Box>
      </Box>
      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {/* Header */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '40px 1fr 50px 50px 80px', sm: '56px 1fr 100px 100px 140px' },
              alignItems: 'center',
              px: 2.5,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              backgroundColor: isDark ? '#1e293b' : '#f9fafb',
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ letterSpacing: 0.3 }}>
              RANK
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ letterSpacing: 0.3 }}>
              STAFF MEMBER
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ letterSpacing: 0.3, textAlign: 'center' }}>
              SENT
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ letterSpacing: 0.3, textAlign: 'center' }}>
              REVIEWS
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ letterSpacing: 0.3 }}>
              PERFORMANCE
            </Typography>
          </Box>

          {/* Rows */}
          {entries.map((entry, idx) => {
            const rank = idx + 1;
            const barPercent = (entry.requestsSent / maxRequests) * 100;
            const conversionRate = entry.requestsSent > 0
              ? Math.round((entry.reviewsGenerated / entry.requestsSent) * 100)
              : 0;

            return (
              <Box
                key={entry.userId}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '40px 1fr 50px 50px 80px', sm: '56px 1fr 100px 100px 140px' },
                  alignItems: 'center',
                  px: 2.5,
                  py: 1.5,
                  backgroundColor: getRankBgColor(rank),
                  borderBottom: idx < entries.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  transition: 'background-color 0.15s',
                  '&:hover': {
                    backgroundColor: rank <= 3 ? getRankBgColor(rank) : (isDark ? '#1e293b' : '#f9fafb'),
                  },
                }}
              >
                {/* Rank */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {getRankIcon(rank) || (
                    <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ width: 20, textAlign: 'center' }}>
                      {rank}
                    </Typography>
                  )}
                </Box>

                {/* Name */}
                <Typography variant="body2" fontWeight={rank <= 3 ? 700 : 500} noWrap>
                  {entry.displayName}
                </Typography>

                {/* Requests Sent */}
                <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'center' }}>
                  {entry.requestsSent}
                </Typography>

                {/* Reviews Generated */}
                <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'center', color: '#16a34a' }}>
                  {entry.reviewsGenerated}
                </Typography>

                {/* Performance bar */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={barPercent}
                    sx={{
                      flex: 1,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: isDark ? '#334155' : '#e5e7eb',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: rank === 1
                          ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                          : rank === 2
                            ? 'linear-gradient(90deg, #94a3b8, #64748b)'
                            : rank === 3
                              ? 'linear-gradient(90deg, #cd7f32, #b8860b)'
                              : 'linear-gradient(90deg, #2563eb, #3b82f6)',
                      },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ minWidth: 32, textAlign: 'right' }}>
                    {conversionRate}%
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </CardContent>
      </Card>
    </Box>
  );
}
