import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { envRequired } from '@/lib/utils/env';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Magic bytes for validating actual file content
function hasValidMagicBytes(buffer: Uint8Array): boolean {
  if (buffer.length < 4) return false;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return true;
  // WebP: RIFF....WEBP
  if (buffer.length >= 12 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
    && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return true;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    const orgId = formData.get('orgId') as string | null;

    if (!file || !orgId) {
      return NextResponse.json({ error: 'Missing photo or orgId' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Service role client — this is a public endpoint (anonymous photo uploads)
    const supabase = createServerClient(
      envRequired('NEXT_PUBLIC_SUPABASE_URL'),
      envRequired('SUPABASE_SERVICE_ROLE_KEY'),
      {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }
    );

    // Verify the org exists
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', orgId)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Rate limit: max 20 uploads per org per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentUploads } = await supabase.storage
      .from('review-photos')
      .list(orgId, { limit: 21, sortBy: { column: 'created_at', order: 'desc' } })
      .then(async () => {
        // Count recent reviews as a proxy for uploads
        return await supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .gte('created_at', oneHourAgo);
      });

    if (recentUploads !== null && recentUploads >= 20) {
      return NextResponse.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 });
    }

    // Generate a unique file path
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${orgId}/${randomUUID()}.${ext}`;

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Validate magic bytes to ensure the file is actually an image
    if (!hasValidMagicBytes(buffer)) {
      return NextResponse.json({ error: 'File content does not match a valid image format.' }, { status: 400 });
    }

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('review-photos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Photo upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('review-photos')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
