import { Box } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { TestimonialManager } from '@/components/testimonials/testimonial-manager';

export default async function TestimonialsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!member) redirect('/onboarding');

  const { data: org } = await supabase
    .from('organizations')
    .select('slug')
    .eq('id', member.organization_id)
    .single();

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('organization_id', member.organization_id)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  return (
    <Box>
      <PageHeader
        title="Testimonials"
        subtitle="Manage your public testimonial wall"
      />
      <TestimonialManager
        reviews={reviews ?? []}
        wallUrl={`${process.env.NEXT_PUBLIC_SITE_URL}/wall/${org?.slug}`}
      />
    </Box>
  );
}
