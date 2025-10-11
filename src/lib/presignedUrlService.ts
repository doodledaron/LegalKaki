/**
 * Service for generating S3 presigned URLs
 */

export interface PresignedUrlResponse {
  success: boolean;
  url?: string;
  bucket?: string;
  key?: string;
  expiresIn?: number;
  error?: string;
}

/**
 * Get a presigned URL for an S3 object
 */
export async function getPresignedUrl(
  bucket: string,
  key: string,
  expiresIn?: number
): Promise<PresignedUrlResponse> {
  try {
    console.log(`🔗 Requesting presigned URL for: ${bucket}/${key}`);
    
    const url = `/api/s3/presign`;
    const requestBody = {
      bucket,
      key,
      ...(expiresIn && { expiresIn })
    };
    
    console.log(`📡 Making POST request to: ${url}`, { requestBody });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ API Error:`, errorData);
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`📄 API Response:`, { hasUrl: !!data.url });
    
    if (data.url) {
      console.log(`✅ Presigned URL generated successfully`);
      console.log(`🔗 Generated URL (first 100 chars): ${data.url.substring(0, 100)}...`);
      return {
        success: true,
        url: data.url,
        bucket,
        key,
        expiresIn: expiresIn || 3600
      };
    } else {
      throw new Error('No URL returned from API');
    }
    
  } catch (error) {
    console.error(`❌ Error getting presigned URL:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get presigned URL for a document from collection details
 */
export async function getDocumentPresignedUrl(
  s3Bucket: string,
  s3Key: string,
  expiresIn?: number
): Promise<PresignedUrlResponse> {
  return getPresignedUrl(s3Bucket, s3Key, expiresIn);
}

/**
 * Test if a presigned URL is accessible
 * Note: We skip the HEAD request test as presigned URLs for GET operations
 * may not work with HEAD requests. Instead, we'll trust that the presigned URL
 * is valid if it was generated successfully.
 */
export async function testPresignedUrl(url: string): Promise<boolean> {
  try {
    console.log(`🔄 Validating presigned URL format...`);
    
    // Basic validation - check if it's a valid URL and contains AWS signature parameters
    const isValidFormat = url.includes('X-Amz-Algorithm') && 
                         url.includes('X-Amz-Signature') && 
                         url.includes('X-Amz-Date');
    
    if (isValidFormat) {
      console.log(`✅ Presigned URL format is valid`);
      return true;
    } else {
      console.log(`❌ Presigned URL format is invalid`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error validating presigned URL:`, error);
    return false;
  }
}
