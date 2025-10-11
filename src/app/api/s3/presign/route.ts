import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

// Ensure Node.js runtime for AWS SDK compatibility
export const runtime = 'nodejs';

// Initialize S3 client with credential provider
// This will use environment variables or default AWS credential chain
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-5',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN }),
      }
    : defaultProvider(),
});

/**
 * POST /api/s3/presign
 * Creates a presigned GET URL for an S3 object
 * 
 * Request body: { bucket: string; key: string; expiresIn?: number }
 * Response: { url: string }
 */
export async function POST(request: NextRequest) {
  try {
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

    // Validate expiresIn is a positive number
    if (typeof expiresIn !== 'number' || expiresIn <= 0) {
      return NextResponse.json(
        { error: 'expiresIn must be a positive number (seconds)' },
        { status: 400 }
      );
    }

    console.log(`🔗 Generating presigned URL for: ${bucket}/${key} (expires in ${expiresIn}s)`);

    // Create the GetObjectCommand for the S3 object
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    // Generate presigned URL with specified expiration time
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn, // Expiration time in seconds
    });

    console.log(`✅ Presigned URL generated successfully`);

    // Return the presigned URL as specified in requirements
    return NextResponse.json({
      url: presignedUrl,
    });

  } catch (error) {
    // Log detailed error information for debugging
    console.error('❌ Error generating presigned URL:', error);
    
    // Return descriptive error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isCredentialsError = errorMessage.includes('credentials') || errorMessage.includes('Credential');
    
    return NextResponse.json(
      { 
        error: isCredentialsError 
          ? 'AWS credentials error: Please check your AWS credentials configuration'
          : 'Failed to generate presigned URL',
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
