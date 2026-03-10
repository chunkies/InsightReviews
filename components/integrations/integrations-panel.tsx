'use client';

import { useState } from 'react';
import {
  Box, Paper, Typography, Button, Chip, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, List, ListItemButton, ListItemText, Avatar,
  CircularProgress, Alert,
} from '@mui/material';
import {
  Link2, Unlink, RefreshCw, Star, ExternalLink,
  Search, CheckCircle2, Clock, AlertCircle,
} from 'lucide-react';
import { useSnackbar } from '@/components/providers/snackbar-provider';
import type { OrganizationIntegration } from '@/lib/types/database';

const PLATFORM_INFO = {
  google: {
    name: 'Google Business',
    color: '#4285F4',
    bgColor: '#E8F0FE',
    description: 'Import reviews from your Google Business Profile. Requires Google OAuth.',
    icon: '🔍',
  },
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    bgColor: '#E7F3FF',
    description: 'Import ratings and recommendations from your Facebook Page.',
    icon: '📘',
  },
  yelp: {
    name: 'Yelp',
    color: '#D32323',
    bgColor: '#FDE8E8',
    description: 'Import reviews from your Yelp business listing. Uses free Yelp Fusion API.',
    icon: '⭐',
  },
};

interface IntegrationsPanelProps {
  integrations: OrganizationIntegration[];
  reviewCounts: Record<string, number>;
  isOwner: boolean;
  organizationId: string;
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
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [yelpDialog, setYelpDialog] = useState(false);
  const [yelpSearch, setYelpSearch] = useState({ name: orgName, location: orgAddress });
  const [yelpResults, setYelpResults] = useState<Array<{
    id: string; name: string; url: string; rating: number; review_count: number;
    location: { display_address: string[] }; image_url: string;
  }> | null>(null);
  const [yelpSearching, setYelpSearching] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);

  const integrationMap = new Map(integrations.map(i => [i.platform, i]));

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

  async function handleSync(platform: string) {
    setSyncing(prev => ({ ...prev, [platform]: true }));
    try {
      const res = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });

      const data = await res.json();
      if (res.ok && data.results?.[platform]) {
        const r = data.results[platform];
        showSnackbar(`Synced ${r.synced} reviews from ${PLATFORM_INFO[platform as keyof typeof PLATFORM_INFO]?.name}`);
        // Reload to show updated counts
        window.location.reload();
      } else {
        showSnackbar(data.error || 'Sync failed', 'error');
      }
    } catch {
      showSnackbar('Sync failed', 'error');
    }
    setSyncing(prev => ({ ...prev, [platform]: false }));
  }

  async function handleYelpSearch() {
    setYelpSearching(true);
    try {
      const res = await fetch('/api/integrations/yelp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: yelpSearch.name,
          location: yelpSearch.location,
        }),
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
        body: JSON.stringify({
          yelpBusinessId: business.id,
          businessName: business.name,
          businessUrl: business.url,
        }),
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
      <Grid container spacing={3}>
        {(Object.entries(PLATFORM_INFO) as [keyof typeof PLATFORM_INFO, typeof PLATFORM_INFO[keyof typeof PLATFORM_INFO]][]).map(
          ([platform, info]) => {
            const integration = integrationMap.get(platform as OrganizationIntegration['platform']);
            const isConnected = !!integration;
            const count = reviewCounts[platform] || 0;

            return (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={platform}>
                <Paper
                  sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: isConnected ? info.color : 'divider',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Platform header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        backgroundColor: info.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                      }}
                    >
                      {info.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {info.name}
                      </Typography>
                      <Chip
                        label={isConnected ? 'Connected' : 'Not connected'}
                        size="small"
                        icon={isConnected ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          backgroundColor: isConnected ? '#dcfce7' : '#f3f4f6',
                          color: isConnected ? '#166534' : '#6b7280',
                          '& .MuiChip-icon': { color: 'inherit' },
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Description or connected info */}
                  {isConnected ? (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        {integration.platform_account_name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Star size={14} color={info.color} />
                          <Typography variant="caption" color="text.secondary">
                            {count} reviews synced
                          </Typography>
                        </Box>
                        {integration.last_synced_at && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Clock size={14} />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(integration.last_synced_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {info.description}
                    </Typography>
                  )}

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {isConnected ? (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={syncing[platform] ? <CircularProgress size={14} /> : <RefreshCw size={14} />}
                          onClick={() => handleSync(platform)}
                          disabled={syncing[platform]}
                        >
                          {syncing[platform] ? 'Syncing...' : 'Sync Now'}
                        </Button>
                        {integration.platform_url && (
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<ExternalLink size={14} />}
                            href={integration.platform_url}
                            target="_blank"
                            component="a"
                          >
                            View
                          </Button>
                        )}
                        {isOwner && (
                          <Button
                            size="small"
                            color="error"
                            variant="text"
                            startIcon={disconnecting === platform ? <CircularProgress size={14} /> : <Unlink size={14} />}
                            onClick={() => handleDisconnect(platform)}
                            disabled={disconnecting === platform}
                          >
                            Disconnect
                          </Button>
                        )}
                      </>
                    ) : (
                      isOwner && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={connecting === platform ? <CircularProgress size={14} color="inherit" /> : <Link2 size={14} />}
                          onClick={() => handleConnect(platform)}
                          disabled={connecting === platform}
                          sx={{
                            backgroundColor: info.color,
                            '&:hover': { backgroundColor: info.color, filter: 'brightness(0.9)' },
                          }}
                        >
                          Connect {info.name}
                        </Button>
                      )
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          }
        )}
      </Grid>

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
