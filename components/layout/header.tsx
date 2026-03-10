'use client';

import { AppBar, Toolbar, Button, Box, IconButton, Tooltip } from '@mui/material';
import { LogOut, Sun, Moon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { DRAWER_WIDTH } from './sidebar';
import { useThemeMode } from '@/components/providers/theme-provider';

export function Header() {
  const router = useRouter();
  const { mode, toggleTheme } = useThemeMode();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        width: `calc(100% - ${DRAWER_WIDTH}px)`,
        ml: `${DRAWER_WIDTH}px`,
        borderBottom: '1px solid',
        borderColor: 'divider',
        transition: 'background-color 0.3s ease',
      }}
    >
      <Toolbar>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
          <IconButton
            onClick={toggleTheme}
            color="inherit"
            size="small"
            sx={{
              mr: 1,
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'rotate(30deg)',
              },
            }}
          >
            {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </IconButton>
        </Tooltip>
        <Button
          onClick={handleSignOut}
          startIcon={<LogOut size={18} />}
          color="inherit"
          size="small"
        >
          Sign Out
        </Button>
      </Toolbar>
    </AppBar>
  );
}
