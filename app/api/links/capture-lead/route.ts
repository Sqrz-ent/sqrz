import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

export async function POST(req: Request) {
  try {
    const { link_id, email } = await req.json();
    if (!link_id || !email) return NextResponse.json({ ok: false }, { status: 400 });

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    const ip_hash = createHash('sha256').update(ip).digest('hex');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch profile_id from link to denormalise into link_leads
    const { data: link } = await supabase
      .from('private_booking_links')
      .select('profile_id')
      .eq('id', link_id)
      .single();

    if (!link) return NextResponse.json({ ok: false }, { status: 404 });

    const { error } = await supabase.from('link_leads').insert({
      link_id,
      profile_id: link.profile_id,
      email,
      ip_hash,
      collected_at: new Date().toISOString(),
    });

    // Unique constraint violation (23505) = duplicate email — silently succeed
    if (error && error.code !== '23505') {
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
