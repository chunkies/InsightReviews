'use client';

import { useState, useRef } from 'react';
import { Box, Avatar, Button, Typography, CircularProgress } from '@mui/material';
import { Upload, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSnackbar } from '@/components/providers/snackbar-provider';

interface LogoUploadProps {
  orgId: string;
  orgName: string;
  currentLogoUrl: string | null;
  onLogoChange: (url: string | null) => void;
  size?: number;
}

export function LogoUpload({ orgId, orgName, currentLogoUrl, onLogoChange, size = 96 }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { showSnackbar } = useSnackbar();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      showSnackbar('Please select an image file', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showSnackbar('Image must be under 2MB', 'error');
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'png';
      const path = `${orgId}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(path);

      // Add cache-busting param
      const url = `${publicUrl}?v=${Date.now()}`;

      // Update org record
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: url })
        .eq('id', orgId);

      if (updateError) throw updateError;

      onLogoChange(url);
      showSnackbar('Logo uploaded!', 'success');
    } catch {
      showSnackbar('Failed to upload logo', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleRemove() {
    setUploading(true);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('organizations')
        .update({ logo_url: null })
        .eq('id', orgId);

      if (error) throw error;

      onLogoChange(null);
      showSnackbar('Logo removed', 'info');
    } catch {
      showSnackbar('Failed to remove logo', 'error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
      <Box sx={{ position: 'relative' }}>
        <Avatar
          src={currentLogoUrl ?? undefined}
          alt={orgName}
          sx={{
            width: size,
            height: size,
            fontSize: size * 0.4,
            fontWeight: 700,
            bgcolor: currentLogoUrl ? 'transparent' : 'primary.main',
            border: '3px solid',
            borderColor: 'divider',
          }}
        >
          {orgName.charAt(0).toUpperCase()}
        </Avatar>
        {uploading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.4)',
              borderRadius: '50%',
            }}
          >
            <CircularProgress size={24} sx={{ color: 'white' }} />
          </Box>
        )}
      </Box>
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Business Logo
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          PNG or JPG, max 2MB. Shows on your review page and testimonial wall.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Upload size={14} />}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            sx={{ textTransform: 'none' }}
          >
            Upload
          </Button>
          {currentLogoUrl && (
            <Button
              size="small"
              color="error"
              startIcon={<Trash2 size={14} />}
              onClick={handleRemove}
              disabled={uploading}
              sx={{ textTransform: 'none' }}
            >
              Remove
            </Button>
          )}
        </Box>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
      </Box>
    </Box>
  );
}
