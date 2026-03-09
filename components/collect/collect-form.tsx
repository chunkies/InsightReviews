'use client';

import { useState, useCallback } from 'react';
import {
  Box, TextField, Button, Typography, Alert, Card, CardContent, Divider,
} from '@mui/material';
import { Send, Check, Phone, Mail, RotateCcw, Clock, User } from 'lucide-react';
import { useSnackbar } from '@/components/providers/snackbar-provider';

interface CollectFormProps {
  orgId: string;
  orgName: string;
  orgSlug: string;
}

interface RecentRequest {
  name: string;
  contact: string;
  method: 'sms' | 'email';
  time: string;
}

const placeholderRecents: RecentRequest[] = [
  { name: 'Sarah M.', contact: '+61 412 *** 340', method: 'sms', time: '10 min ago' },
  { name: 'James', contact: 'j***@gmail.com', method: 'email', time: '25 min ago' },
  { name: 'Customer', contact: '+61 433 *** 118', method: 'sms', time: '1 hr ago' },
  { name: 'Lisa K.', contact: 'lisa***@yahoo.com', method: 'email', time: '2 hrs ago' },
  { name: 'Tom B.', contact: '+61 408 *** 762', method: 'sms', time: '3 hrs ago' },
];

export function CollectForm({ orgId, orgName: _orgName, orgSlug }: CollectFormProps) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [sentMethod, setSentMethod] = useState<'sms' | 'email'>('sms');
  const [error, setError] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  const hasPhone = phone.trim().length > 0;
  const hasEmail = email.trim().length > 0;
  const canSubmit = hasPhone || hasEmail;

  const handleReset = useCallback(() => {
    setPhone('');
    setEmail('');
    setCustomerName('');
    setSent(false);
    setSentTo('');
    setError(null);
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    // Prefer phone if both are given
    const contactMethod = hasPhone ? 'sms' : 'email';

    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          customerPhone: hasPhone ? phone.trim() : undefined,
          customerEmail: hasEmail ? email.trim() : undefined,
          customerName: customerName || undefined,
          contactMethod,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send review request');
      }

      setSentTo(customerName || (hasPhone ? phone : email));
      setSentMethod(contactMethod);
      setSent(true);
      showSnackbar(`Review request sent via ${contactMethod === 'sms' ? 'SMS' : 'email'}!`, 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 520, mx: 'auto' }}>
      <Card
        sx={{
          borderRadius: 4,
          boxShadow: '0 4px 30px rgba(0,0,0,0.06)',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        {/* Header bar */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send size={20} color="white" />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
              Send Review Request
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              Phone preferred, email works too
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {sent ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  '@keyframes popIn': {
                    '0%': { transform: 'scale(0)', opacity: 0 },
                    '60%': { transform: 'scale(1.1)' },
                    '100%': { transform: 'scale(1)', opacity: 1 },
                  },
                }}
              >
                <Box
                  component="svg"
                  viewBox="0 0 24 24"
                  sx={{
                    width: 40,
                    height: 40,
                    '& path': {
                      strokeDasharray: 30,
                      strokeDashoffset: 30,
                      animation: 'drawCheck 0.5s 0.3s ease forwards',
                    },
                    '@keyframes drawCheck': {
                      to: { strokeDashoffset: 0 },
                    },
                  }}
                >
                  <path
                    d="M5 13l4 4L19 7"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                Sent!
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 0.5 }}>
                Review request sent to {sentTo}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
                via {sentMethod === 'sms' ? 'SMS' : 'Email'}
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<RotateCcw size={18} />}
                onClick={handleReset}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  px: 4,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                }}
              >
                Send Another
              </Button>
            </Box>
          ) : (
            <form onSubmit={handleSend}>
              {/* Phone — primary field */}
              <TextField
                fullWidth
                label="Phone Number (preferred)"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+61 400 000 000"
                autoFocus
                autoComplete="off"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    fontSize: '1.35rem',
                    fontWeight: 500,
                    letterSpacing: 1,
                    py: 0.5,
                    '&.Mui-focused': {
                      boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.12)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '1rem',
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <Phone size={20} color="#9ca3af" style={{ marginRight: 12 }} />
                    ),
                  },
                }}
              />

              {/* Email — secondary field */}
              <TextField
                fullWidth
                label="Email (optional)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                autoComplete="off"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    '&.Mui-focused': {
                      boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.12)',
                    },
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <Mail size={18} color="#9ca3af" style={{ marginRight: 12 }} />
                    ),
                  },
                }}
              />

              {/* Customer name */}
              <TextField
                fullWidth
                label="Customer Name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="First name"
                autoComplete="off"
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <User size={18} color="#9ca3af" style={{ marginRight: 12 }} />
                    ),
                  },
                }}
              />

              {/* Info about which method will be used */}
              {canSubmit && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 2, textAlign: 'center' }}
                >
                  {hasPhone && hasEmail
                    ? 'Will send via SMS (preferred). Email saved as backup.'
                    : hasPhone
                      ? 'Will send via SMS'
                      : 'Will send via email'}
                </Typography>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !canSubmit}
                startIcon={loading ? undefined : <Send size={20} />}
                sx={{
                  py: 1.8,
                  borderRadius: 3,
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                {loading ? 'Sending...' : 'Send Review Link'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Message preview */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', textAlign: 'center', mt: 2, mb: 3, px: 2 }}
      >
        Customer will receive a link to: {typeof window !== 'undefined' ? window.location.origin : ''}/r/{orgSlug}
      </Typography>

      {/* Recent Sends */}
      <Card
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Clock size={14} color="#9ca3af" />
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              Recent
            </Typography>
          </Box>
          <Divider />
          {placeholderRecents.map((item, idx) => (
            <Box key={idx}>
              <Box
                sx={{
                  px: 2.5,
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.15s ease',
                  '&:hover': { backgroundColor: 'action.hover' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: 'action.selected',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.method === 'sms' ? (
                      <Phone size={14} color="#16a34a" />
                    ) : (
                      <Mail size={14} color="#2563eb" />
                    )}
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.contact}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Check size={12} color="#16a34a" />
                  <Typography variant="caption" color="text.secondary">
                    {item.time}
                  </Typography>
                </Box>
              </Box>
              {idx < placeholderRecents.length - 1 && <Divider />}
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}
