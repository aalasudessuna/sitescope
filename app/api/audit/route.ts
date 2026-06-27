import { NextRequest, NextResponse } from 'next/server';
import { runAudit } from '@/lib/audit-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Geçerli bir "url" değeri gerekli.' }, { status: 400 });
    }

    const result = await runAudit(url);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Denetim sırasında bilinmeyen bir hata oluştu.';
    const isTimeout = message.toLowerCase().includes('abort');
    return NextResponse.json(
      { error: isTimeout ? 'Hedef site zamanında yanıt vermedi.' : message },
      { status: 502 },
    );
  }
}