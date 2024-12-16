import { parseSubstackPost } from '@/lib/substack-parser';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { message: 'Substack URL is required' },
        { status: 400 }
      );
    }

    const postContent = await parseSubstackPost(url);

    return NextResponse.json(postContent);
  } catch (error) {
    console.error('Substack fetch error:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch Substack post',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
