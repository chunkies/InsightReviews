'use client';

import { Box, Card, CardContent, Typography, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { HelpCircle } from 'lucide-react';

interface NpsGaugeProps {
  npsScore: number | null;
  promoterCount: number;
  passiveCount: number;
  detractorCount: number;
  totalReviews: number;
}

function getNpsColor(score: number): string {
  if (score < 0) return '#ef4444';
  if (score < 50) return '#f59e0b';
  return '#16a34a';
}

function getNpsLabel(score: number): string {
  if (score < 0) return 'Needs Improvement';
  if (score < 30) return 'Good';
  if (score < 50) return 'Great';
  if (score < 70) return 'Excellent';
  return 'World Class';
}

export function NpsGauge({
  npsScore,
  promoterCount,
  passiveCount,
  detractorCount,
  totalReviews,
}: NpsGaugeProps) {
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === 'dark';
  const hasData = npsScore !== null && totalReviews > 0;

  const promoterPct = totalReviews > 0 ? Math.round((promoterCount / totalReviews) * 100) : 0;
  const passivePct = totalReviews > 0 ? Math.round((passiveCount / totalReviews) * 100) : 0;
  const detractorPct = totalReviews > 0 ? Math.round((detractorCount / totalReviews) * 100) : 0;

  // Marker position: -100 = 0%, +100 = 100%
  const markerPct = hasData ? ((npsScore + 100) / 200) * 100 : 50;

  return (
    <Card
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Net Promoter Score
          </Typography>
          <Tooltip
            title="NPS measures customer loyalty. 5-star = Promoters, 4-star = Passives, 1-3 stars = Detractors. NPS = % Promoters - % Detractors. Range: -100 to +100."
            arrow
            placement="top"
          >
            <Box sx={{ display: 'flex', cursor: 'help', color: 'text.secondary' }}>
              <HelpCircle size={16} />
            </Box>
          </Tooltip>
        </Box>

        {/* Score display */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography
            variant="h2"
            fontWeight={800}
            sx={{
              color: hasData ? getNpsColor(npsScore) : 'text.disabled',
              lineHeight: 1,
              mb: 0.5,
            }}
          >
            {hasData ? npsScore : '--'}
          </Typography>
          {hasData && (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {getNpsLabel(npsScore)}
            </Typography>
          )}
        </Box>

        {/* Range bar with marker */}
        <Box sx={{ px: 1, mb: 1 }}>
          <Box sx={{ position: 'relative' }}>
            {/* Gradient bar */}
            <Box
              sx={{
                height: 12,
                borderRadius: 6,
                background: isDark
                  ? 'linear-gradient(90deg, #7f1d1d 0%, #78350f 50%, #14532d 100%)'
                  : 'linear-gradient(90deg, #fecaca 0%, #fde68a 50%, #bbf7d0 100%)',
              }}
            />
            {/* Marker */}
            {hasData && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: `${markerPct}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: getNpsColor(npsScore),
                  border: '3px solid',
                  borderColor: muiTheme.palette.background.paper,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transition: 'left 0.6s ease',
                }}
              />
            )}
          </Box>
          {/* Scale labels */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">-100</Typography>
            <Typography variant="caption" color="text.secondary">0</Typography>
            <Typography variant="caption" color="text.secondary">+100</Typography>
          </Box>
        </Box>

        {/* Breakdown bar */}
        {totalReviews > 0 && (
          <Box sx={{ mx: 1, mt: 2, mb: 1 }}>
            <Box sx={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
              <Box sx={{ width: `${promoterPct}%`, bgcolor: '#16a34a', minWidth: promoterCount > 0 ? 4 : 0 }} />
              <Box sx={{ width: `${passivePct}%`, bgcolor: '#f59e0b', minWidth: passiveCount > 0 ? 4 : 0 }} />
              <Box sx={{ width: `${detractorPct}%`, bgcolor: '#ef4444', minWidth: detractorCount > 0 ? 4 : 0 }} />
            </Box>
          </Box>
        )}

        {/* Breakdown legend */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
            pt: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <BreakdownItem color="#16a34a" label="Promoters" count={promoterCount} pct={promoterPct} />
          <BreakdownItem color="#f59e0b" label="Passives" count={passiveCount} pct={passivePct} />
          <BreakdownItem color="#ef4444" label="Detractors" count={detractorCount} pct={detractorPct} />
        </Box>
      </CardContent>
    </Card>
  );
}

function BreakdownItem({ color, label, count, pct }: { color: string; label: string; count: number; pct: number }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center', mb: 0.25 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: color,
            flexShrink: 0,
          }}
        />
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          {label}
        </Typography>
      </Box>
      <Typography variant="body2" fontWeight={700}>
        {pct}%
      </Typography>
      <Typography variant="caption" color="text.secondary">
        ({count})
      </Typography>
    </Box>
  );
}
