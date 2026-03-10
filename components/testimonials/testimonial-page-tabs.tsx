'use client';

import { useState, type ReactNode } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { Settings2, LayoutGrid } from 'lucide-react';

interface TestimonialPageTabsProps {
  managerContent: ReactNode;
  customizerContent: ReactNode;
}

export function TestimonialPageTabs({ managerContent, customizerContent }: TestimonialPageTabsProps) {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab
          icon={<LayoutGrid size={16} />}
          iconPosition="start"
          label="Manage & Share"
          sx={{ textTransform: 'none', fontWeight: 600 }}
        />
        <Tab
          icon={<Settings2 size={16} />}
          iconPosition="start"
          label="Customize Design"
          sx={{ textTransform: 'none', fontWeight: 600 }}
        />
      </Tabs>

      <Box sx={{ display: tab === 0 ? 'block' : 'none' }}>
        {managerContent}
      </Box>
      <Box sx={{ display: tab === 1 ? 'block' : 'none' }}>
        {customizerContent}
      </Box>
    </Box>
  );
}
