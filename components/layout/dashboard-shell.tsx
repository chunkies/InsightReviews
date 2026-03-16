'use client';

import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Sidebar, DRAWER_WIDTH } from './sidebar';
import { Header } from './header';
import { ErrorBoundary } from '@/components/shared/error-boundary';

interface DashboardShellProps {
  orgName?: string;
  billingPlan?: string | null;
  trialEndsAt?: string | null;
  subscriptionEndsAt?: string | null;
  permissions?: string[] | null;
  memberRole?: 'owner' | 'staff';
  children: React.ReactNode;
}

export function DashboardShell({ orgName, billingPlan, trialEndsAt, subscriptionEndsAt, permissions, memberRole, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar
        orgName={orgName}
        billingPlan={billingPlan}
        trialEndsAt={trialEndsAt}
        subscriptionEndsAt={subscriptionEndsAt}
        permissions={permissions}
        memberRole={memberRole}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Header onMenuToggle={() => setMobileOpen((o) => !o)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
          overflow: 'hidden',
        }}
      >
        <Toolbar />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </Box>
    </Box>
  );
}
