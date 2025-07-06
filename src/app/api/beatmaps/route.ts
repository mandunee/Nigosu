import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.beatmap.findMany({
      orderBy: [{ id: 'desc' }],
    });
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
