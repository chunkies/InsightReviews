'use client';

import { useState } from 'react';
import {
  Box, Paper, TextField, Button, MenuItem,
  Typography, Alert, CircularProgress, Divider,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Send, HelpCircle,
  ChevronDown, Bug, Lightbulb, CreditCard, User, Mail,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'general', label: 'General Question', icon: HelpCircle, color: '#2563eb' },
  { value: 'bug', label: 'Bug Report', icon: Bug, color: '#dc2626' },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: '#f59e0b' },
  { value: 'billing', label: 'Billing Issue', icon: CreditCard, color: '#16a34a' },
  { value: 'account', label: 'Account Help', icon: User, color: '#7c3aed' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const FAQ_ITEMS = [
  {
    q: 'How do I connect my Google Business Profile?',
    a: 'Go to Settings and paste your Google review URL. You can find this by searching for your business on Google, clicking "Write a review", and copying the URL.',
  },
  {
    q: 'How does the smart routing work?',
    a: 'When a customer leaves a 4 or 5-star review, they are prompted to share it on Google, Yelp, or other platforms you have configured. Reviews of 3 stars or below stay private so you can follow up directly.',
  },
  {
    q: 'Can I customise the SMS message?',
    a: 'Yes! Go to Settings and edit the SMS template. Use {business_name} and {link} as placeholders that will be automatically filled in.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'Go to Billing and click "Manage Subscription" to access the Stripe customer portal where you can cancel, update payment methods, or view invoices.',
  },
  {
    q: 'Can staff members see billing information?',
    a: 'No. Only the account owner can access billing settings. Staff members can only use the review collection terminal and view reviews.',
  },
];

export function SupportForm({ userEmail }: { userEmail: string }) {
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, category, priority }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit ticket');
        return;
      }

      setSubject('');
      setMessage('');
      setCategory('general');
      setPriority('normal');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
      <Box sx={{ width: '100%', maxWidth: 800 }}>

        {/* Hero header */}
        <Paper sx={{ p: 0, mb: 3, overflow: 'hidden' }}>
          <Box
            sx={{
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              px: 4,
              py: 3.5,
              color: 'white',
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1.5,
              }}
            >
              <HelpCircle size={24} color="white" />
            </Box>
            <Typography variant="h5" fontWeight={800}>
              How can we help?
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
              Submit a support request or browse common questions below
            </Typography>
          </Box>

          {/* Quick contact info */}
          <Box
            sx={{
              px: 4,
              py: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              backgroundColor: isDark ? 'rgba(37, 99, 235, 0.08)' : 'rgba(37, 99, 235, 0.04)',
            }}
          >
            <Mail size={14} color="#2563eb" />
            <Typography variant="body2" color="text.secondary">
              Logged in as <strong>{userEmail}</strong> &mdash; we&apos;ll respond to this address
            </Typography>
          </Box>
        </Paper>

        {/* Category quick-picks */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: `repeat(${CATEGORIES.length}, 1fr)` }, gap: 1.5, mb: 3 }}>
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const isSelected = category === c.value;
            return (
              <Paper
                key={c.value}
                onClick={() => setCategory(c.value)}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: isSelected ? c.color : 'divider',
                  backgroundColor: isSelected ? `${c.color}0a` : 'transparent',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: c.color,
                    backgroundColor: `${c.color}0a`,
                  },
                }}
              >
                <Icon size={20} color={isSelected ? c.color : (isDark ? '#94a3b8' : '#64748b')} style={{ marginBottom: 4 }} />
                <Typography variant="caption" fontWeight={isSelected ? 700 : 500} sx={{ display: 'block', color: isSelected ? c.color : 'text.secondary' }}>
                  {c.label}
                </Typography>
              </Paper>
            );
          })}
        </Box>

        {/* Support form */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Send size={18} />
            <Typography variant="subtitle2" fontWeight={700}>
              Submit a Request
            </Typography>
          </Box>
          <Divider sx={{ mb: 2.5 }} />

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Your support request has been submitted. We&apos;ll get back to you via email soon.
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              fullWidth
              placeholder="Brief description of your issue"
              size="small"
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                fullWidth
                size="small"
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                fullWidth
                size="small"
              >
                {PRIORITIES.map((p) => (
                  <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField
              label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              fullWidth
              multiline
              rows={4}
              placeholder="Describe your issue or feedback in detail..."
            />
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !subject.trim() || !message.trim()}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
              sx={{
                alignSelf: 'flex-start',
                px: 4,
                py: 1.2,
                transition: 'all 0.3s ease',
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
                transform: 'translateY(0)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
                  boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
                  transform: 'translateY(-1px)',
                },
                '&:active': {
                  transform: 'translateY(1px)',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                },
                '&.Mui-disabled': {
                  background: '#d1d5db',
                  color: '#9ca3af',
                  boxShadow: 'none',
                  transform: 'none',
                },
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </Box>
        </Paper>

        {/* FAQ */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <HelpCircle size={18} />
            <Typography variant="subtitle2" fontWeight={700}>
              Frequently Asked Questions
            </Typography>
          </Box>
          <Divider sx={{ mb: 1 }} />
          {FAQ_ITEMS.map((faq, i) => (
            <Accordion
              key={i}
              disableGutters
              elevation={0}
              sx={{
                '&:before': { display: 'none' },
                backgroundColor: 'transparent',
              }}
            >
              <AccordionSummary expandIcon={<ChevronDown size={16} />} sx={{ px: 0 }}>
                <Typography variant="body2" fontWeight={600}>{faq.q}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {faq.a}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>

      </Box>
    </Box>
  );
}
