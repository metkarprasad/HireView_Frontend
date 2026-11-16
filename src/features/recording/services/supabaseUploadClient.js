/**
 * src/features/recording/services/supabaseUploadClient.js
 * Client-side direct upload utility for uploading video chunk Blobs to Supabase Storage
 * via temporary signed upload URLs without exposing backend service_role credentials.
 */

/**
 * Upload a video chunk Blob directly to Supabase Storage using a temporary signed upload URL.
 * @param {Object} params
 * @param {string} params.uploadUrl - Signed upload target URL
 * @param {Blob} params.blob - Raw binary video chunk Blob
 * @param {string} [params.mimeType='video/webm'] - Content-Type header
 * @param {number} [params.timeoutMs=60000] - Upload timeout in milliseconds
 * @returns {Promise<{ success: boolean, status: number }>}
 */
export async function uploadBlobToSignedUrl({
  uploadUrl,
  blob,
  mimeType = 'video/webm',
  timeoutMs = 60000,
}) {
  if (!uploadUrl) {
    throw new Error('uploadUrl is required to upload chunk directly to storage');
  }

  if (!blob || blob.size <= 0) {
    throw new Error('Cannot upload empty or invalid video Blob');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
      },
      body: blob,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Direct storage upload failed with HTTP status ${response.status}: ${errorText || response.statusText}`);
    }

    return {
      success: true,
      status: response.status,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Direct storage upload timed out after ${timeoutMs / 1000}s`);
    }
    throw err;
  }
}
