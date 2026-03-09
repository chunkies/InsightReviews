'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Chip,
} from '@mui/material';
import {
  LayoutDashboard, Star, Send, Users, MessageSquareQuote,
  Settings, CreditCard, Phone, Sparkles,
} from 'lucide-react';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Reviews', href: '/dashboard/reviews', icon: Star },
  { label: 'Collect Reviews', href: '/dashboard/collect', icon: Send },
  { label: 'Testimonials', href: '/dashboard/testimonials', icon: MessageSquareQuote },
  { label: 'Staff', href: '/dashboard/staff', icon: Users },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
];

interface SidebarProps {
  orgName?: string;
}

export function Sidebar({ orgName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(180deg, #fafbff 0%, #f8f9fc 100%)',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
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
            }}
          >
            <Star size={18} color="white" fill="white" />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2, letterSpacing: -0.3 }}>
              InsightReviews
            </Typography>
            {orgName && (
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                {orgName}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.6 }} />

      {/* Navigation */}
      <List sx={{ px: 1.5, py: 1.5, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={item.href}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  px: 1.5,
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  borderLeft: '3px solid',
                  borderColor: isActive ? 'primary.main' : 'transparent',
                  backgroundColor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'white' : 'text.primary',
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.dark' : 'rgba(37, 99, 235, 0.06)',
                    borderColor: isActive ? 'primary.dark' : 'rgba(37, 99, 235, 0.3)',
                    transform: 'translateX(2px)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: isActive ? 'white' : 'text.secondary',
                    transition: 'color 0.2s ease',
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

      {/* Quick Send Shortcut */}
      <Box sx={{ px: 2, mb: 1.5 }}>
        <Box
          component={Link}
          href="/dashboard/collect"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: 2.5,
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            color: 'white',
            textDecoration: 'none',
            transition: 'all 0.25s ease',
            boxShadow: '0 2px 10px rgba(37, 99, 235, 0.25)',
            '&:hover': {
              transform: 'translateY(-1px)',
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
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.6 }} />

      {/* Subscription Status */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Sparkles size={14} color="#f59e0b" />
          <Typography variant="caption" color="text.secondary">
            Plan Status
          </Typography>
        </Box>
        <Chip
          label="Trial"
          size="small"
          sx={{
            height: 22,
            fontSize: '0.7rem',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
            color: 'white',
            letterSpacing: 0.3,
          }}
        />
      </Box>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
