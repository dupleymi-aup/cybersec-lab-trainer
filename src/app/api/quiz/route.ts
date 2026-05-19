import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, unauthorized } from '@/lib/api-middleware';

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  const body = await request.json();
  const { quizId, score, total } = body;

  if (!quizId || score === undefined || total === undefined) {
    return NextResponse.json({ error: 'quizId, score, and total required' }, { status: 400 });
  }

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const result = await prisma.quizResult.upsert({
    where: { userId_quizId: { userId: auth.id, quizId } },
    create: {
      id: crypto.randomUUID(),
      userId: auth.id,
      quizId,
      score,
      total,
      percentage,
    },
    update: { score, total, percentage },
  });

  return NextResponse.json({ success: true, result });
}
