'use client';

import { useState } from 'react';
import {
  Box, Paper, Typography, Button, Chip, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, List, ListItemButton, ListItemText, Avatar,
  CircularProgress, Alert, Divider,
} from '@mui/material';
import {
  Unlink, ExternalLink, Search, CheckCircle2, Clock, AlertCircle, Zap,
} from 'lucide-react';
import { useSnackbar } from '@/components/providers/snackbar-provider';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import type { OrganizationIntegration } from '@/lib/types/database';

const PLATFORM_INFO = {
  google: {
    name: 'Google',
    fullName: 'Google Business Profile',
    color: '#4285F4',
    bgGradient: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
    lightBg: 'linear-gradient(135deg, #E8F0FE 0%, #E6F4EA 100%)',
    description: 'Sync reviews from Google Maps and Search',
    icon: '🔍',
  },
  facebook: {
    name: 'Facebook',
    fullName: 'Facebook Page',
    color: '#1877F2',
    bgGradient: 'linear-gradient(135deg, #1877F2 0%, #42A5F5 100%)',
    lightBg: 'linear-gradient(135deg, #E7F3FF 0%, #E3F2FD 100%)',
    description: 'Import ratings and recommendations',
    icon: '📘',
  },
  yelp: {
    name: 'Yelp',
    fullName: 'Yelp Business',
    color: '#D32323',
    bgGradient: 'linear-gradient(135deg, #D32323 0%, #FF5722 100%)',
    lightBg: 'linear-gradient(135deg, #FDE8E8 0%, #FFEBEE 100%)',
    description: 'Connect your Yelp business listing',
    icon: '⭐',
  },
};

interface IntegrationsPanelProps {
  integrations: OrganizationIntegration[];
  reviewCounts: Record<string, number>;
  isOwner: boolean;
  orgName: string;
  orgAddress: string;
}

export function IntegrationsPanel({
  integrations,
  reviewCounts,
  isOwner,
  orgName,
  orgAddress,
}: IntegrationsPanelProps) {
  const { showSnackbar } = useSnackbar();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);
  const [yelpDialog, setYelpDialog] = useState(false);
  const [yelpSearch, setYelpSearch] = useState({ name: orgName, location: orgAddress });
  const [yelpResults, setYelpResults] = useState<Array<{
    id: string; name: string; url: string; rating: number; review_count: number;
    location: { display_address: string[] }; image_url: string;
  }> | null>(null);
  const [yelpSearching, setYelpSearching] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);

  const integrationMap = new Map(integrations.map(i => [i.platform, i]));
  const connectedCount = integrations.length;
  const totalSynced = Object.values(reviewCounts).reduce((a, b) => a + b, 0);

  async function handleConnect(platform: string) {
    if (platform === 'yelp') {
      setYelpDialog(true);
      return;
    }
    setConnecting(platform);
    try {
      const res = await fetch(`/api/integrations/${platform}/connect`, { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showSnackbar(data.error || 'Failed to start connection', 'error');
      }
    } catch {
      showSnackbar('Failed to connect', 'error');
    }
    setConnecting(null);
  }

  async function handleDisconnect(platform: string) {
    setDisconnecting(platform);
    try {
      const res = await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
      if (res.ok) {
        showSnackbar(`${PLATFORM_INFO[platform as keyof typeof PLATFORM_INFO]?.name} disconnected`);
        window.location.reload();
      } else {
        showSnackbar('Failed to disconnect', 'error');
      }
    } catch {
      showSnackbar('Failed to disconnect', 'error');
    }
    setDisconnecting(null);
  }

  async function handleYelpSearch() {
    setYelpSearching(true);
    try {
      const res = await fetch('/api/integrations/yelp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: yelpSearch.name, location: yelpSearch.location }),
      });
      const data = await res.json();
      if (data.businesses) {
        setYelpResults(data.businesses);
      } else {
        showSnackbar(data.error || 'No results found', 'error');
      }
    } catch {
      showSnackbar('Search failed', 'error');
    }
    setYelpSearching(false);
  }

  async function handleYelpSelect(business: { id: string; name: string; url: string }) {
    try {
      const res = await fetch('/api/integrations/yelp/connect', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yelpBusinessId: business.id, businessName: business.name, businessUrl: business.url }),
      });
      if (res.ok) {
        showSnackbar('Yelp connected!');
        setYelpDialog(false);
        window.location.reload();
      } else {
        showSnackbar('Failed to connect Yelp', 'error');
      }
    } catch {
      showSnackbar('Failed to connect Yelp', 'error');
    }
  }

  return (
    <>
      {/* Summary bar */}
      {connectedCount > 0 && (
        <Paper
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 50%, #fdf2f8 100%)',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Zap size={18} color="#7c3aed" />
            <Typography variant="subtitle2" fontWeight={700}>
              {connectedCount} platform{connectedCount !== 1 ? 's' : ''} connected
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Typography variant="body2" color="text.secondary">
            {totalSynced} reviews synced
          </Typography>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Clock size={14} style={{ opacity: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              Reviews auto-sync every 6 hours
              {(() => {
                const lastSync = integrations
                  .map(i => i.last_synced_at)
                  .filter(Boolean)
                  .sort()
                  .pop();
                return lastSync
                  ? ` \u00b7 Last synced ${new Date(lastSync).toLocaleDateString()}`
                  : '';
              })()}
            </Typography>
          </Box>
        </Paper>
      )}

      <Grid container spacing={2.5}>
        {(Object.entries(PLATFORM_INFO) as [keyof typeof PLATFORM_INFO, typeof PLATFORM_INFO[keyof typeof PLATFORM_INFO]][]).map(
          ([platform, info]) => {
            const integration = integrationMap.get(platform as OrganizationIntegration['platform']);
            const isConnected = !!integration;
            const count = reviewCounts[platform] || 0;

            return (
              <Grid size={{ xs: 12, md: 4 }} key={platform}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: isConnected ? info.color : 'divider',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: info.color,
                      boxShadow: `0 4px 20px ${info.color}15`,
                    },
                  }}
                >
                  {/* Header band */}
                  <Box
                    sx={{
                      background: isConnected ? info.bgGradient : info.lightBg,
                      px: 2.5,
                      py: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography fontSize={28}>{info.icon}</Typography>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          sx={{ color: isConnected ? 'white' : 'text.primary', lineHeight: 1.2 }}
                        >
                          {info.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: isConnected ? 'rgba(255,255,255,0.8)' : 'text.secondary' }}
                        >
                          {isConnected ? integration.platform_account_name : info.description}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={isConnected ? 'Connected' : 'Available'}
                      size="small"
                      icon={isConnected ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        backgroundColor: isConnected ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)',
                        color: isConnected ? 'white' : 'text.secondary',
                        backdropFilter: 'blur(8px)',
                        '& .MuiChip-icon': { color: 'inherit' },
                      }}
                    />
                  </Box>

                  {/* Body */}
                  <Box sx={{ p: 2.5 }}>
                    {isConnected ? (
                      <>
                        <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                          <Box>
                            <Typography variant="h5" fontWeight={800} color={info.color}>
                              {count}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              reviews
                            </Typography>
                          </Box>
                          {integration.last_synced_at && (
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Clock size={12} style={{ opacity: 0.5 }} />
                                <Typography variant="caption" color="text.secondary">
                                  Last sync
                                </Typography>
                              </Box>
                              <Typography variant="body2" fontWeight={500}>
                                {new Date(integration.last_synced_at).toLocaleDateString()}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {integration.platform_url && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ExternalLink size={14} />}
                              href={integration.platform_url}
                              target="_blank"
                              component="a"
                              sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                              View on {info.name}
                            </Button>
                          )}
                          {isOwner && (
                            <Button
                              size="small"
                              color="error"
                              variant="text"
                              startIcon={disconnecting === platform ? <CircularProgress size={14} /> : <Unlink size={14} />}
                              onClick={() => setConfirmDisconnect(platform)}
                              disabled={disconnecting === platform}
                              sx={{ textTransform: 'none', ml: 'auto' }}
                            >
                              Disconnect
                            </Button>
                          )}
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {info.description}
                        </Typography>
                        {isOwner && (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={connecting === platform ? <CircularProgress size={14} color="inherit" /> : null}
                            onClick={() => handleConnect(platform)}
                            disabled={connecting === platform}
                            sx={{
                              background: info.bgGradient,
                              textTransform: 'none',
                              fontWeight: 600,
                              px: 3,
                              '&:hover': { filter: 'brightness(1.1)' },
                            }}
                          >
                            Connect {info.name}
                          </Button>
                        )}
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          }
        )}
      </Grid>

      {/* Disconnect confirmation dialog */}
      <ConfirmDialog
        open={!!confirmDisconnect}
        title={`Disconnect ${PLATFORM_INFO[confirmDisconnect as keyof typeof PLATFORM_INFO]?.name || confirmDisconnect}?`}
        message={`This will stop syncing reviews from ${PLATFORM_INFO[confirmDisconnect as keyof typeof PLATFORM_INFO]?.name || confirmDisconnect}. Reviews already synced will be kept.`}
        confirmLabel="Disconnect"
        onConfirm={() => {
          if (confirmDisconnect) {
            handleDisconnect(confirmDisconnect);
          }
          setConfirmDisconnect(null);
        }}
        onCancel={() => setConfirmDisconnect(null)}
      />

      {/* Yelp search dialog */}
      <Dialog open={yelpDialog} onClose={() => setYelpDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Connect Yelp Business</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Search for your business on Yelp to connect it.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              size="small"
              label="Business Name"
              value={yelpSearch.name}
              onChange={(e) => setYelpSearch(prev => ({ ...prev, name: e.target.value }))}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label="City or Address"
              value={yelpSearch.location}
              onChange={(e) => setYelpSearch(prev => ({ ...prev, location: e.target.value }))}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              onClick={handleYelpSearch}
              disabled={yelpSearching || !yelpSearch.name || !yelpSearch.location}
              startIcon={yelpSearching ? <CircularProgress size={14} color="inherit" /> : <Search size={14} />}
            >
              Search
            </Button>
          </Box>

          {yelpResults && yelpResults.length === 0 && (
            <Alert severity="info">No businesses found. Try a different name or location.</Alert>
          )}

          {yelpResults && yelpResults.length > 0 && (
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {yelpResults.map((biz) => (
                <ListItemButton
                  key={biz.id}
                  onClick={() => handleYelpSelect(biz)}
                  sx={{ borderRadius: 2, mb: 0.5 }}
                >
                  <Avatar
                    src={biz.image_url}
                    sx={{ width: 48, height: 48, mr: 2, borderRadius: 1.5 }}
                    variant="rounded"
                  />
                  <ListItemText
                    primary={biz.name}
                    secondary={`${biz.rating} stars · ${biz.review_count} reviews · ${biz.location.display_address.join(', ')}`}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setYelpDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
