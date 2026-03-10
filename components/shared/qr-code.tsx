'use client';

import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  url: string;
  size?: number;
}

export function QRCodeDisplay({ url, size = 200 }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).catch(() => setError(true));
  }, [url, size]);

  if (error) return null;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: 'white',
        p: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <canvas ref={canvasRef} />
    </Box>
  );
}

export async function generateQRDataUrl(url: string, size = 400): Promise<string> {
  return QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });
}
