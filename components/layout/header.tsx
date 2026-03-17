'use client';

import { useState } from 'react';
import {
  AppBar, Toolbar, Box, IconButton, Avatar, Menu as MuiMenu,
  MenuItem, ListItemIcon, ListItemText, Divider, Typography,
} from '@mui/material';
import { LogOut, Sun, Moon, Menu, UserCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DRAWER_WIDTH } from './sidebar';
import { useThemeMode } from '@/components/providers/theme-provider';

interface HeaderProps {
  onMenuToggle?: () => void;
  userDisplayName?: string | null;
  userEmail?: string | null;
  userAvatarUrl?: string | null;
}

export function Header({ onMenuToggle, userDisplayName, userEmail, userAvatarUrl }: HeaderProps) {
  const router = useRouter();
  const { mode, toggleTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  async function handleSignOut() {
    setAnchorEl(null);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  const initials = userDisplayName
    ? userDisplayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail?.[0]?.toUpperCase() ?? '?';

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { xs: 0, md: `${DRAWER_WIDTH}px` },
        borderBottom: '1px solid',
        borderColor: 'divider',
        transition: 'background-color 0.3s ease',
      }}
    >
      <Toolbar>
        {onMenuToggle && (
          <IconButton
            onClick={onMenuToggle}
            edge="start"
            sx={{ mr: 1, display: { md: 'none' } }}
          >
            <Menu size={22} />
          </IconButton>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          size="small"
          sx={{ p: 0.5 }}
        >
          <Avatar
            src={userAvatarUrl ?? undefined}
            sx={{
              width: 34,
              height: 34,
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            }}
          >
            {initials}
          </Avatar>
        </IconButton>
        <MuiMenu
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{ paper: { sx: { minWidth: 220, mt: 1 } } }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {userDisplayName || 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {userEmail}
            </Typography>
          </Box>
          <Divider />
          <MenuItem component={Link} href="/dashboard/profile" onClick={() => setAnchorEl(null)}>
            <ListItemIcon><UserCircle size={18} /></ListItemIcon>
            <ListItemText>My Profile</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { toggleTheme(); setAnchorEl(null); }}>
            <ListItemIcon>{mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}</ListItemIcon>
            <ListItemText>{mode === 'light' ? 'Dark Mode' : 'Light Mode'}</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleSignOut}>
            <ListItemIcon><LogOut size={18} /></ListItemIcon>
            <ListItemText>Sign Out</ListItemText>
          </MenuItem>
        </MuiMenu>
      </Toolbar>
    </AppBar>
  );
}
