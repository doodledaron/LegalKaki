import { NextRequest, NextResponse } from 'next/server';

/**
 * POC Mode: Mock S3 Presigned URL endpoint
 *
 * This endpoint returns mock URLs for POC. In production, this would
 * generate real S3 presigned URLs or use Gemini API for document storage.
 *
 * POST /api/s3/presign
 * Request body: { bucket: string; key: string; expiresIn?: number }
 * Response: { url: string }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[POC Mode] Mock S3 presign endpoint called');

    // Parse the JSON request body
    const body = await request.json();
    const { bucket, key, expiresIn = 3600 } = body;

    // Validate required fields
    if (!bucket || !key) {
      return NextResponse.json(
        { error: 'Missing required fields: bucket and key are required' },
        { status: 400 }
      );
    }

    console.log(`[POC Mode] Mock presigned URL for: ${bucket}/${key}`);

    // POC Mode: Return a mock blob URL
    // In production, this would be replaced with real S3 presigned URL
    // or Gemini API file handling
    const mockUrl = `/mock-documents/${encodeURIComponent(key)}`;

    console.log(`[POC Mode] Returning mock URL: ${mockUrl}`);

    return NextResponse.json({
      url: mockUrl,
    });

  } catch (error) {
    console.error('[POC Mode] Error in mock presign endpoint:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to generate presigned URL (mock mode)',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
