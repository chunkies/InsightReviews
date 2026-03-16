'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Chip, useMediaQuery,
} from '@mui/material';
import {
  LayoutDashboard, Star, Send, Users, Palette, Link2,
  Settings, CreditCard, Phone, Sparkles, HelpCircle,
} from 'lucide-react';
import { useTheme, alpha } from '@mui/material/styles';

const DRAWER_WIDTH = 260;

const navItems = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'reviews', label: 'Reviews', href: '/dashboard/reviews', icon: Star },
  { key: 'collect', label: 'Collect Reviews', href: '/dashboard/collect', icon: Send },
  { key: 'integrations', label: 'Integrations', href: '/dashboard/integrations', icon: Link2 },
  { key: 'staff', label: 'Staff', href: '/dashboard/staff', icon: Users },
  { key: 'customization', label: 'Customization', href: '/dashboard/testimonials', icon: Palette },
  { key: 'billing', label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { key: 'settings', label: 'Settings', href: '/dashboard/settings', icon: Settings },
  { key: 'support', label: 'Support', href: '/dashboard/support', icon: HelpCircle },
];

interface SidebarProps {
  orgName?: string;
  billingPlan?: string | null;
  trialEndsAt?: string | null;
  subscriptionEndsAt?: string | null;
  permissions?: string[] | null;
  memberRole?: 'owner' | 'staff';
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function getPlanDisplay(billingPlan?: string | null, trialEndsAt?: string | null, subscriptionEndsAt?: string | null) {
  if (billingPlan === 'active') return { label: 'Active', gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)' };
  if (billingPlan === 'cancelling' && subscriptionEndsAt) {
    const daysLeft = Math.max(0, Math.ceil((new Date(subscriptionEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    return { label: `Cancelling · ${daysLeft}d left`, gradient: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)' };
  }
  if (billingPlan === 'past_due') return { label: 'Past Due', gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' };
  if (billingPlan === 'cancelled') return { label: 'Cancelled', gradient: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)' };
  if (billingPlan === 'trial' && trialEndsAt) {
    const daysLeft = Math.max(0, Math.floor((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    return { label: `Trial · ${daysLeft}d left`, gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' };
  }
  return { label: 'Trial', gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' };
}

export function Sidebar({ orgName, billingPlan, trialEndsAt, subscriptionEndsAt, permissions, memberRole, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === 'dark';
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  // Owners see everything; staff see only permitted pages
  const filteredNavItems = memberRole === 'owner' || !permissions
    ? navItems
    : navItems.filter((item) => permissions.includes(item.key));

  const drawerContent = (
    <>
      {/* Logo + Branding */}
      <Box sx={{ p: 2.5, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              flexShrink: 0,
            }}
          >
            <Star size={18} color="white" fill="white" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2, letterSpacing: -0.3 }}>
              InsightReviews
            </Typography>
            {orgName && (
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }} noWrap>
                {orgName}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.6 }} />

      {/* Navigation */}
      <List sx={{ px: 1.5, py: 1.5, flex: 1 }}>
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={item.href}
                onClick={isMobile ? onMobileClose : undefined}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  px: 1.5,
                  borderLeft: '3px solid',
                  borderColor: isActive ? 'primary.main' : 'transparent',
                  backgroundColor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'white' : 'text.primary',
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.dark' : alpha(muiTheme.palette.primary.main, isDark ? 0.15 : 0.06),
                    borderColor: isActive ? 'primary.dark' : alpha(muiTheme.palette.primary.main, 0.3),
                  },
                  '& .MuiListItemIcon-root': {
                    color: isActive ? 'white' : 'text.secondary',
                  },
                  '& .MuiListItemText-primary': {
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.875rem',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Icon size={18} />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Quick Send Shortcut — only show if user has collect permission */}
      {(memberRole === 'owner' || !permissions || permissions.includes('collect')) && <Box sx={{ px: 2, mb: 1.5 }}>
        <Box
          component={Link}
          href="/dashboard/collect"
          onClick={isMobile ? onMobileClose : undefined}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: 2.5,
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            color: 'white',
            textDecoration: 'none',
            boxShadow: '0 2px 10px rgba(37, 99, 235, 0.25)',
            '&:hover': {
              boxShadow: '0 4px 15px rgba(37, 99, 235, 0.35)',
            },
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Phone size={16} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', lineHeight: 1.2 }}>
              Quick Send
            </Typography>
            <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
              Send Review Request
            </Typography>
          </Box>
        </Box>
      </Box>}

      <Divider sx={{ mx: 2, opacity: 0.6 }} />

      {/* Subscription Status */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Sparkles size={14} color={muiTheme.palette.secondary.main} />
          <Typography variant="caption" color="text.secondary">
            Plan Status
          </Typography>
        </Box>
        <Chip
          label={getPlanDisplay(billingPlan, trialEndsAt, subscriptionEndsAt).label}
          size="small"
          sx={{
            height: 22,
            fontSize: '0.7rem',
            fontWeight: 600,
            background: getPlanDisplay(billingPlan, trialEndsAt, subscriptionEndsAt).gradient,
            color: 'white',
            letterSpacing: 0.3,
          }}
        />
      </Box>

      {/* Build Version */}
      <Box sx={{ px: 2, pb: 1.5 }}>
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
          {process.env.NEXT_PUBLIC_BUILD_ID} {process.env.NEXT_PUBLIC_BUILD_ENV === 'preview' ? '(staging)' : process.env.NEXT_PUBLIC_BUILD_ENV === 'production' ? '' : '(dev)'}
        </Typography>
      </Box>
    </>
  );

  const drawerPaperStyles = {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box',
    borderRight: '1px solid',
    borderColor: 'divider',
    background: isDark
      ? `linear-gradient(180deg, ${muiTheme.palette.background.default} 0%, ${muiTheme.palette.background.paper} 100%)`
      : undefined,
    backgroundColor: muiTheme.palette.background.default,
    display: 'flex',
    flexDirection: 'column',
  } as const;

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': drawerPaperStyles,
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': drawerPaperStyles,
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

export { DRAWER_WIDTH };
