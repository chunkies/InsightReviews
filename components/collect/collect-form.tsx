'use client';

import { useState, useCallback } from 'react';
import {
  Box, TextField, Button, Typography, Alert, Card, CardContent, Divider,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import { Send, Phone, Mail, RotateCcw, Clock, User, Download, Printer, Copy, Check, ChevronDown, QrCode } from 'lucide-react';
import { useSnackbar } from '@/components/providers/snackbar-provider';
import { QRCodeDisplay, generateQRDataUrl } from '@/components/shared/qr-code';

interface RecentRequest {
  name: string;
  contact: string;
  method: 'sms' | 'email';
  time: string;
}

interface CollectFormProps {
  orgId: string;
  orgName: string;
  orgSlug: string;
  reviewUrl: string;
  qrUrl?: string;
  recentRequests?: RecentRequest[];
}

export function CollectForm({ orgId, orgName, orgSlug, reviewUrl, qrUrl, recentRequests = [] }: CollectFormProps) {
  const qrCodeUrl = qrUrl || reviewUrl;
  const { showSnackbar } = useSnackbar();

  // SMS form state
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [sentMethod, setSentMethod] = useState<'sms' | 'email'>('sms');
  const [error, setError] = useState<string | null>(null);
  const [isThrottled, setIsThrottled] = useState(false);

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
    setIsThrottled(false);
  }, []);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(reviewUrl);
      showSnackbar('Link copied!', 'success');
    } catch {
      showSnackbar('Failed to copy', 'error');
    }
  }, [reviewUrl, showSnackbar]);

  const handleDownloadQR = useCallback(async () => {
    try {
      const dataUrl = await generateQRDataUrl(qrCodeUrl, 600);
      const link = document.createElement('a');
      link.download = `${orgSlug}-qr-code.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      showSnackbar('Failed to generate QR code', 'error');
    }
  }, [reviewUrl, orgSlug, showSnackbar]);

  const handlePrintCard = useCallback(async () => {
    try {
      const dataUrl = await generateQRDataUrl(qrCodeUrl, 400);
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Review Card — ${orgName}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            @page { size: 148mm 210mm; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .card {
              width: 148mm; height: 210mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              padding: 14mm 12mm 10mm;
              background: white;
              border: 1px dashed #ddd;
              position: relative;
            }
            .header { text-align: center; }
            .business-name {
              font-size: 22pt;
              font-weight: 900;
              color: #0f172a;
              letter-spacing: -0.02em;
              line-height: 1.1;
              margin-bottom: 3mm;
            }
            .tagline {
              font-size: 11pt;
              font-weight: 500;
              color: #64748b;
              margin-bottom: 6mm;
            }
            .divider {
              width: 32mm;
              height: 1mm;
              border-radius: 1mm;
              background: linear-gradient(135deg, #2563eb, #7c3aed);
              margin: 0 auto;
            }
            .body { text-align: center; }
            .cta {
              font-size: 15pt;
              font-weight: 800;
              color: #0f172a;
              margin-bottom: 3mm;
              letter-spacing: -0.01em;
            }
            .subtitle {
              font-size: 10pt;
              color: #64748b;
              font-weight: 400;
              margin-bottom: 6mm;
              line-height: 1.5;
            }
            .qr-wrapper {
              background: white;
              border: 2px solid #e2e8f0;
              border-radius: 5mm;
              padding: 4mm;
              display: inline-block;
              margin-bottom: 5mm;
            }
            .qr-wrapper img { width: 48mm; height: 48mm; display: block; }
            .stars {
              font-size: 20pt;
              margin-bottom: 3mm;
              letter-spacing: 2px;
            }
            .instruction {
              font-size: 9pt;
              color: #94a3b8;
              font-weight: 400;
              line-height: 1.6;
            }
            .footer {
              text-align: center;
              border-top: 1px solid #e2e8f0;
              padding-top: 4mm;
              width: 100%;
            }
            .powered {
              font-size: 7pt;
              color: #94a3b8;
              font-weight: 500;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }
            @media print { .card { border: none; } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="business-name">${orgName}</div>
              <div class="tagline">We value your feedback</div>
              <div class="divider"></div>
            </div>
            <div class="body">
              <div class="cta">How was your experience?</div>
              <div class="subtitle">Scan the QR code below to leave us<br/>a quick review — it only takes 30 seconds.</div>
              <div class="qr-wrapper">
                <img src="${dataUrl}" alt="QR Code" />
              </div>
              <div class="stars">★ ★ ★ ★ ★</div>
              <div class="instruction">Open your phone camera &middot; Point at the code &middot; Tap the link</div>
            </div>
            <div class="footer">
              <div class="powered">Powered by InsightReviews</div>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    } catch {
      showSnackbar('Failed to open print dialog', 'error');
    }
  }, [reviewUrl, orgName, showSnackbar]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setIsThrottled(false);

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
        if (res.status === 429) {
          setError(data.error || 'This customer was recently contacted. Please wait before sending again.');
          setIsThrottled(true);
          return;
        }
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
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      {/* QR Code — Primary */}
      <Card
        sx={{
          borderRadius: 4,
          boxShadow: '0 4px 30px rgba(0,0,0,0.06)',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          mb: 3,
        }}
      >
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
            <QrCode size={20} color="white" />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
              Your Review QR Code
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              Print and place at your checkout counter
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <QRCodeDisplay url={qrCodeUrl} size={200} />

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, mb: 2 }}>
            Customers scan this with their phone camera to leave a review
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Printer size={18} />}
              onClick={handlePrintCard}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2.5 }}
            >
              Print Counter Card
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download size={18} />}
              onClick={handleDownloadQR}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2.5 }}
            >
              Download PNG
            </Button>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              justifyContent: 'center',
              p: 1.5,
              borderRadius: 2,
              backgroundColor: 'action.hover',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {reviewUrl}
            </Typography>
            <Button size="small" startIcon={<Copy size={14} />} onClick={handleCopyLink} sx={{ textTransform: 'none', flexShrink: 0 }}>
              Copy
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* SMS / Email — Secondary (collapsible) */}
      <Accordion
        sx={{
          borderRadius: '16px !important',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
          mb: 3,
          '&:before': { display: 'none' },
          '&.Mui-expanded': { margin: '0 0 24px 0' },
        }}
      >
        <AccordionSummary expandIcon={<ChevronDown size={20} />} sx={{ px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Send size={18} color="#6b7280" />
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                Send a Direct Request
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Text or email a review link to a specific customer
              </Typography>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 3, pb: 3 }}>
          {sent ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <Check size={32} color="white" />
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                Sent!
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 0.5 }}>
                Review request sent to {sentTo}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                via {sentMethod === 'sms' ? 'SMS' : 'Email'}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RotateCcw size={16} />}
                onClick={handleReset}
                sx={{ textTransform: 'none' }}
              >
                Send Another
              </Button>
            </Box>
          ) : (
            <form onSubmit={handleSend}>
              <TextField
                fullWidth
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+61 400 000 000"
                autoComplete="off"
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                slotProps={{
                  input: {
                    startAdornment: <Phone size={18} color="#9ca3af" style={{ marginRight: 12 }} />,
                  },
                }}
              />
              <TextField
                fullWidth
                label="Email (optional)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                autoComplete="off"
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                slotProps={{
                  input: {
                    startAdornment: <Mail size={18} color="#9ca3af" style={{ marginRight: 12 }} />,
                  },
                }}
              />
              <TextField
                fullWidth
                label="Customer Name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="First name"
                autoComplete="off"
                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                slotProps={{
                  input: {
                    startAdornment: <User size={18} color="#9ca3af" style={{ marginRight: 12 }} />,
                  },
                }}
              />
              {error && (
                <Alert severity={isThrottled ? 'warning' : 'error'} sx={{ mb: 2, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !canSubmit}
                startIcon={loading ? undefined : <Send size={18} />}
                sx={{
                  py: 1.5,
                  borderRadius: 2.5,
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                {loading ? 'Sending...' : 'Send Review Link'}
              </Button>
            </form>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Recent Sends */}
      {recentRequests.length > 0 && (
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
                Recent Requests
              </Typography>
            </Box>
            <Divider />
            {recentRequests.map((item, idx) => (
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
                {idx < recentRequests.length - 1 && <Divider />}
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
