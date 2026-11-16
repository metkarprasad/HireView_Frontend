/**
 * src/features/recording/services/uploadQueue.js
 * Dedicated video chunk upload queue manager with controlled concurrency,
 * exponential backoff retry, offline detection, backpressure monitoring,
 * and immediate in-memory Blob cleanup upon upload completion.
 */

import { CHUNK_STATUS } from '../types/recordingTypes.js';
import { authorizeChunkUpload, completeChunkUpload } from './recordingApi.js';
import { uploadBlobToSignedUrl } from './supabaseUploadClient.js';

export const QUEUE_CONFIG = Object.freeze({
  MAX_CONCURRENT_UPLOADS: 2,
  MAX_RETRIES: 5,
  RETRY_BASE_DELAY_MS: 2000,
  BACKPRESSURE_THRESHOLD: 8, // Warning if > 8 pending chunks in memory
});

export class UploadQueue {
  /**
   * @param {Object} options
   * @param {number} [options.maxConcurrent=2]
   * @param {number} [options.maxRetries=5]
   * @param {Function} [options.onProgress]
   * @param {Function} [options.onBackpressure]
   * @param {Function} [options.onError]
   */
  constructor({
    maxConcurrent = QUEUE_CONFIG.MAX_CONCURRENT_UPLOADS,
    maxRetries = QUEUE_CONFIG.MAX_RETRIES,
    onProgress,
    onBackpressure,
    onError,
  } = {}) {
    this.maxConcurrent = maxConcurrent;
    this.maxRetries = maxRetries;
    this.onProgress = onProgress;
    this.onBackpressure = onBackpressure;
    this.onError = onError;

    this.queue = [];
    this.activeUploads = new Map();
    this.completedChunks = new Map();
    this.failedChunks = new Map();

    this.isPaused = false;
    this.isOnline = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
    this.totalChunksCreated = 0;
    this.totalUploadedBytes = 0;
    this.retryTimers = new Set();
    this.flushResolvers = [];

    this.bindNetworkEvents();
  }

  bindNetworkEvents() {
    if (typeof window === 'undefined') return;

    this.handleOnline = () => {
      console.log('[UPLOAD QUEUE] Network online detected. Resuming chunk upload queue...');
      this.isOnline = true;
      this.notifyProgress();
      this.processQueue();
    };

    this.handleOffline = () => {
      console.warn('[UPLOAD QUEUE] Network offline detected. Pausing chunk upload queue...');
      this.isOnline = false;
      this.notifyProgress();
    };

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  /**
   * Enqueue a new video chunk for processing.
   * @param {Object} chunk
   */
  enqueue(chunk) {
    if (!chunk || !chunk.blob || chunk.blob.size <= 0) {
      console.warn('[UPLOAD QUEUE] Ignoring invalid or empty chunk.');
      return;
    }

    chunk.status = CHUNK_STATUS.PENDING;
    chunk.retryCount = 0;

    this.queue.push(chunk);
    this.totalChunksCreated++;

    console.log(
      `[UPLOAD QUEUE] Enqueued Chunk #${chunk.chunkIndex} (${(chunk.sizeBytes / 1024).toFixed(1)} KB). Queue length: ${this.queue.length}`
    );

    this.checkBackpressure();
    this.notifyProgress();
    this.processQueue();
  }

  /**
   * Main queue loop respecting MAX_CONCURRENT_UPLOADS.
   */
  processQueue() {
    if (this.isPaused || !this.isOnline) {
      return;
    }

    while (this.activeUploads.size < this.maxConcurrent && this.queue.length > 0) {
      const nextChunk = this.queue.shift();
      this.activeUploads.set(nextChunk.chunkIndex, nextChunk);
      this.uploadWorker(nextChunk);
    }

    this.checkFlushComplete();
  }

  /**
   * Worker responsible for authorizing, uploading, completing, and cleaning a single chunk.
   * @param {Object} chunk
   */
  async uploadWorker(chunk) {
    const { recordingId, chunkIndex, blob, sizeBytes, mimeType } = chunk;

    chunk.status = CHUNK_STATUS.UPLOADING;
    this.notifyProgress();

    try {
      console.log(`[UPLOAD WORKER] Starting upload flow for Chunk #${chunkIndex} of recording ${recordingId}...`);

      // Step 1: Request backend authorization & signed upload URL
      const authResponse = await authorizeChunkUpload({
        recordingId,
        chunkIndex,
        sizeBytes,
        mimeType,
      });

      if (!authResponse || !authResponse.success) {
        throw new Error(authResponse?.message || 'Backend upload authorization failed.');
      }

      // Step 2: Handle idempotent already-uploaded case
      if (authResponse.alreadyUploaded) {
        console.log(`[UPLOAD WORKER] Chunk #${chunkIndex} was already uploaded in storage.`);
        this.markChunkCompleted(chunk, sizeBytes);
        return;
      }

      const { uploadUrl, token } = authResponse;
      if (!uploadUrl) {
        throw new Error('No uploadUrl returned from backend authorization.');
      }

      // Step 3: Upload binary video chunk Blob directly to Supabase Storage
      console.log(`[UPLOAD WORKER] Uploading binary Blob directly to Supabase Storage for Chunk #${chunkIndex}...`);
      await uploadBlobToSignedUrl({
        uploadUrl,
        blob,
        mimeType: mimeType || 'video/webm',
      });

      // Step 4: Confirm upload completion with backend
      console.log(`[UPLOAD WORKER] Direct storage upload succeeded. Confirming completion for Chunk #${chunkIndex}...`);
      const completeResponse = await completeChunkUpload({
        recordingId,
        chunkIndex,
        sizeBytes,
      });

      if (!completeResponse || !completeResponse.success) {
        throw new Error(completeResponse?.message || 'Failed to confirm chunk completion on backend.');
      }

      // Step 5: Finalize & release memory
      this.markChunkCompleted(chunk, sizeBytes);
    } catch (err) {
      console.error(`[UPLOAD WORKER ERROR] Failed uploading Chunk #${chunkIndex}:`, err.message);
      this.handleUploadFailure(chunk, err);
    }
  }

  /**
   * Finalize chunk success: mark UPLOADED, record stats, release Blob from memory.
   * @param {Object} chunk
   * @param {number} sizeBytes
   */
  markChunkCompleted(chunk, sizeBytes) {
    chunk.status = CHUNK_STATUS.UPLOADED;
    chunk.uploadedAt = Date.now();

    // Critical: Release binary Blob from memory immediately!
    chunk.blob = null;

    this.activeUploads.delete(chunk.chunkIndex);
    this.completedChunks.set(chunk.chunkIndex, {
      chunkIndex: chunk.chunkIndex,
      sizeBytes,
      uploadedAt: chunk.uploadedAt,
    });
    this.totalUploadedBytes += sizeBytes || 0;

    console.log(
      `[UPLOAD QUEUE SUCCESS] Chunk #${chunk.chunkIndex} successfully uploaded & released from memory. Total uploaded: ${this.completedChunks.size}`
    );

    this.checkBackpressure();
    this.notifyProgress();
    this.processQueue();
  }

  /**
   * Handle worker failure with exponential backoff retry.
   * @param {Object} chunk
   * @param {Error} error
   */
  handleUploadFailure(chunk, error) {
    this.activeUploads.delete(chunk.chunkIndex);

    const errorMessage = error?.message || 'Upload error';
    const status = error?.response?.status;

    // Permanent errors (400, 401, 403, 404) should not be retried
    const isPermanent = status === 400 || status === 401 || status === 403 || status === 404;

    chunk.retryCount = (chunk.retryCount || 0) + 1;

    if (!isPermanent && chunk.retryCount <= this.maxRetries) {
      chunk.status = 'RETRYING';
      // Exponential backoff: 2s, 4s, 8s, 16s, 32s + random jitter
      const delayMs =
        QUEUE_CONFIG.RETRY_BASE_DELAY_MS * Math.pow(2, chunk.retryCount - 1) + Math.floor(Math.random() * 500);

      console.warn(
        `[UPLOAD QUEUE RETRY] Scheduling retry #${chunk.retryCount}/${this.maxRetries} for Chunk #${chunk.chunkIndex} in ${delayMs}ms`
      );

      const timerId = setTimeout(() => {
        this.retryTimers.delete(timerId);
        // Place retry chunk at the front of queue to preserve order
        this.queue.unshift(chunk);
        this.processQueue();
      }, delayMs);

      this.retryTimers.add(timerId);
    } else {
      chunk.status = CHUNK_STATUS.FAILED;
      chunk.errorMessage = errorMessage;
      this.failedChunks.set(chunk.chunkIndex, {
        chunkIndex: chunk.chunkIndex,
        error: errorMessage,
      });

      console.error(
        `[UPLOAD QUEUE FAILED] Chunk #${chunk.chunkIndex} permanently failed after ${chunk.retryCount} attempts: ${errorMessage}`
      );

      if (this.onError) {
        this.onError(`Chunk #${chunk.chunkIndex} upload failed: ${errorMessage}`);
      }
    }

    this.checkBackpressure();
    this.notifyProgress();
    this.processQueue();
  }

  /**
   * Monitor backpressure and alert if upload is slower than generation.
   */
  checkBackpressure() {
    const pendingCount = this.queue.length;
    const isWarning = pendingCount >= QUEUE_CONFIG.BACKPRESSURE_THRESHOLD;
    if (isWarning && this.onBackpressure) {
      this.onBackpressure({
        pendingCount,
        threshold: QUEUE_CONFIG.BACKPRESSURE_THRESHOLD,
      });
    }
  }

  /**
   * Get current lightweight statistics for UI display.
   */
  getStats() {
    return {
      totalCreated: this.totalChunksCreated,
      totalUploaded: this.completedChunks.size,
      totalPending: this.queue.length,
      currentlyUploading: this.activeUploads.size,
      totalFailed: this.failedChunks.size,
      totalUploadedBytes: this.totalUploadedBytes,
      isBackpressureWarning: this.queue.length >= QUEUE_CONFIG.BACKPRESSURE_THRESHOLD,
      isOnline: this.isOnline,
    };
  }

  notifyProgress() {
    if (this.onProgress) {
      try {
        this.onProgress(this.getStats());
      } catch (e) {
        console.warn('[UPLOAD QUEUE] onProgress callback error:', e);
      }
    }
  }

  checkFlushComplete() {
    if (this.queue.length === 0 && this.activeUploads.size === 0 && this.retryTimers.size === 0) {
      while (this.flushResolvers.length > 0) {
        const resolver = this.flushResolvers.shift();
        resolver(this.getStats());
      }
    }
  }

  /**
   * Wait until all pending and active chunk uploads complete cleanly.
   * @returns {Promise<Object>}
   */
  async flushAndStop() {
    console.log('[UPLOAD QUEUE] Flushing remaining chunk uploads...');
    if (this.queue.length === 0 && this.activeUploads.size === 0 && this.retryTimers.size === 0) {
      return this.getStats();
    }

    return new Promise((resolve) => {
      this.flushResolvers.push(resolve);
      this.processQueue();
    });
  }

  /**
   * Clean up all network listeners and pending timers.
   */
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    this.retryTimers.forEach((timerId) => clearTimeout(timerId));
    this.retryTimers.clear();
    this.queue = [];
    this.activeUploads.clear();
  }
}
