'use client';

import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { DRAWER_WIDTH } from './sidebar';

export function Header() {
  const router = useRouter();

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
      }}
    >
      <Toolbar>
        <Box sx={{ flexGrow: 1 }} />
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
