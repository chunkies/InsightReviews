import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { reviewId, platform } = await request.json();

    if (!reviewId || !platform || typeof platform !== 'string') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Service role client — this is a public endpoint
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }
    );

    // Fetch current redirected_to array
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('redirected_to')
      .eq('id', reviewId)
      .single();

    if (fetchError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const currentRedirects: string[] = Array.isArray(review.redirected_to)
      ? review.redirected_to
      : [];

    // Only append if the platform isn't already tracked
    if (!currentRedirects.includes(platform)) {
      const updatedRedirects = [...currentRedirects, platform];

      const { error: updateError } = await supabase
        .from('reviews')
        .update({ redirected_to: updatedRedirects })
        .eq('id', reviewId);

      if (updateError) {
        console.error('Track click update error:', updateError);
        return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
