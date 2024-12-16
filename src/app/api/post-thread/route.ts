import { NextRequest, NextResponse } from 'next/server';
import { postThreadWithImages } from '@/lib/twitter-api';

export async function POST(request: NextRequest) {
  try {
    const { post } = await request.json();

    const postedThread = await postThreadWithImages(post, [
      'Thanks for reading Inked from the mind!',
      'Subscribe for free to receive new posts and support my work.',
    ]);
    console.log(postedThread);
    console.log('postedThread');

    return NextResponse.json({
      success: true,
      threadLinks: postedThread,
    });
  } catch (error) {
    // console.error('Twitter thread posting error:', error?.data);
    // console.error('Twitter thread posting error:', error.rateLimit);
    return NextResponse.json(
      {
        message: 'Failed to post Twitter thread',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
