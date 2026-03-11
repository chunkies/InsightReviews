'use client';

import { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, MenuItem,
  Typography, Alert, Chip, CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Send, Clock, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
}

const CATEGORIES = [
  { value: 'general', label: 'General Question' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'billing', label: 'Billing Issue' },
  { value: 'account', label: 'Account Help' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: 'Open', color: '#2563eb', icon: Clock },
  in_progress: { label: 'In Progress', color: '#f59e0b', icon: AlertCircle },
  resolved: { label: 'Resolved', color: '#16a34a', icon: CheckCircle },
  closed: { label: 'Closed', color: '#6b7280', icon: CheckCircle },
};

export function SupportForm({ tickets: initialTickets }: { tickets: SupportTicket[] }) {
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  const [tickets, setTickets] = useState(initialTickets);
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

      setTickets([data.ticket, ...tickets]);
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
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
      {/* Submit New Ticket */}
      <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Submit a Support Request
          </Typography>

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Your support request has been submitted. We&apos;ll get back to you soon.
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              fullWidth
              placeholder="Brief description of your issue"
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                fullWidth
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
              rows={5}
              placeholder="Describe your issue or feedback in detail..."
            />
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !subject.trim() || !message.trim()}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
              sx={{
                alignSelf: 'flex-start',
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',
                },
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Previous Tickets */}
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Your Tickets
        </Typography>

        {tickets.length === 0 ? (
          <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <MessageSquare size={40} color={isDark ? '#475569' : '#cbd5e1'} style={{ marginBottom: 8 }} />
              <Typography color="text.secondary">
                No support tickets yet. Submit one if you need help.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {tickets.map((ticket) => {
              const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
              return (
                <Card
                  key={ticket.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: isDark
                        ? '0 2px 8px rgba(37, 99, 235, 0.15)'
                        : '0 2px 8px rgba(37, 99, 235, 0.1)',
                    },
                    transition: 'all 0.15s ease',
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ flex: 1, mr: 1 }}>
                        {ticket.subject}
                      </Typography>
                      <Chip
                        label={statusConfig.label}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: `${statusConfig.color}18`,
                          color: statusConfig.color,
                          flexShrink: 0,
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      {CATEGORIES.find((c) => c.value === ticket.category)?.label || ticket.category}
                      {' · '}
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {ticket.message}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
