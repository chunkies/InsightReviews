import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { envRequired } from '@/lib/utils/env';

export async function POST(request: NextRequest) {
  // Verify the user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Verify user has org membership
  const { data: member } = await supabase
    .from('organization_members')
    .select('id, organization_id')
    .eq('user_id', user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'No organization membership' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 2MB' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${member.organization_id}/${member.id}.${ext}`;

  // Use service role to bypass storage RLS
  const serviceClient = createServiceClient(
    envRequired('NEXT_PUBLIC_SUPABASE_URL'),
    envRequired('SUPABASE_SERVICE_ROLE_KEY'),
  );

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await serviceClient.storage
    .from('avatars')
    .upload(path, buffer, {
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: { publicUrl } } = serviceClient.storage
    .from('avatars')
    .getPublicUrl(path);

  return NextResponse.json({ publicUrl });
}
