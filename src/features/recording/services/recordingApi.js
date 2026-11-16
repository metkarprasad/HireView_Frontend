/**
 * src/features/recording/services/recordingApi.js
 * API client for Phase 1 Interview Recording backend endpoints.
 */

import axios from 'axios';

const API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:5635/api';

/**
 * Start or resume a recording session for an interview attempt (Idempotent).
 * @param {Object} params
 * @param {string} params.attemptOrInterviewId
 * @param {string} [params.mimeType]
 * @param {Object} [params.metadata]
 * @returns {Promise<{ success: boolean, reused: boolean, recording: Object, message?: string }>}
 */
export async function startRecordingSession({ attemptOrInterviewId, mimeType, metadata = {} }) {
  const response = await axios.post(`${API_URL}/recordings/attempts/${attemptOrInterviewId}/start`, {
    mimeType,
    metadata,
  });
  return response.data;
}

/**
 * Retrieve active or completed recording session for an interview attempt.
 * @param {string} attemptOrInterviewId
 * @returns {Promise<{ success: boolean, recording: Object }>}
 */
export async function getRecordingByAttempt(attemptOrInterviewId) {
  const response = await axios.get(`${API_URL}/recordings/attempts/${attemptOrInterviewId}`);
  return response.data;
}

/**
 * Retrieve recording metadata by recordingId.
 * @param {string} recordingId
 * @returns {Promise<{ success: boolean, recording: Object }>}
 */
export async function getRecordingById(recordingId) {
  const response = await axios.get(`${API_URL}/recordings/${recordingId}`);
  return response.data;
}

/**
 * Update recording lifecycle status according to the state machine.
 * @param {Object} params
 * @param {string} params.recordingId
 * @param {string} params.status
 * @param {number} [params.durationSeconds]
 * @param {number} [params.totalSizeBytes]
 * @param {number} [params.uploadedChunks]
 * @param {number} [params.totalChunks]
 * @param {string} [params.errorMessage]
 * @returns {Promise<{ success: boolean, recording: Object }>}
 */
export async function updateRecordingStatus({
  recordingId,
  status,
  durationSeconds,
  totalSizeBytes,
  uploadedChunks,
  totalChunks,
  errorMessage,
}) {
  const response = await axios.patch(`${API_URL}/recordings/${recordingId}/status`, {
    status,
    durationSeconds,
    totalSizeBytes,
    uploadedChunks,
    totalChunks,
    errorMessage,
  });
  return response.data;
}

/**
 * Request secure upload authorization & signed upload URL for a specific chunk.
 * @param {Object} params
 * @param {string} params.recordingId
 * @param {number} params.chunkIndex
 * @param {number} [params.sizeBytes]
 * @param {string} [params.mimeType]
 * @returns {Promise<{ success: boolean, alreadyUploaded: boolean, uploadUrl: string, storagePath: string, bucketName: string, token?: string }>}
 */
export async function authorizeChunkUpload({ recordingId, chunkIndex, sizeBytes, mimeType }) {
  const response = await axios.post(`${API_URL}/recordings/${recordingId}/chunks/${chunkIndex}/upload-authorize`, {
    sizeBytes,
    mimeType,
  });
  return response.data;
}

/**
 * Notify backend that a chunk was successfully uploaded directly to Supabase storage.
 * @param {Object} params
 * @param {string} params.recordingId
 * @param {number} params.chunkIndex
 * @param {number} [params.sizeBytes]
 * @returns {Promise<{ success: boolean, status: string, chunkIndex: number }>}
 */
export async function completeChunkUpload({ recordingId, chunkIndex, sizeBytes }) {
  const response = await axios.post(`${API_URL}/recordings/${recordingId}/chunks/${chunkIndex}/complete`, {
    sizeBytes,
  });
  return response.data;
}

