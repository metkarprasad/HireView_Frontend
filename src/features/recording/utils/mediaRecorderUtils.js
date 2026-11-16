/**
 * src/features/recording/utils/mediaRecorderUtils.js
 * Browser MediaRecorder & MediaDevices compatibility and utility helpers.
 */

const PREFERRED_MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=h264,opus',
  'video/webm',
  'video/mp4;codecs=avc1,mp4a.40.2',
  'video/mp4',
];

/**
 * Detect the optimal supported MIME type on the current browser.
 * @returns {string|null}
 */
export function getSupportedMimeType() {
  if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') {
    return null;
  }

  for (const mimeType of PREFERRED_MIME_TYPES) {
    try {
      if (window.MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    } catch {
      // Continue checking next candidate
    }
  }

  return null;
}

/**
 * Check if the browser supports MediaRecorder API.
 * @returns {boolean}
 */
export function isMediaRecorderSupported() {
  return typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined';
}

/**
 * Check if the browser supports getUserMedia.
 * @returns {boolean}
 */
export function isMediaDevicesSupported() {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}

/**
 * Format elapsed duration seconds into MM:SS or HH:MM:SS display string.
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatDuration(totalSeconds) {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) {
    return '00:00';
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Format byte count to human-readable string (KB/MB).
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Translate browser media capture errors into clean, user-friendly messages.
 * @param {Error} error
 * @returns {string}
 */
export function getUserFriendlyMediaError(error) {
  if (!error) return 'An unknown error occurred while accessing media devices.';

  const errorName = error.name || '';
  const errorMessage = error.message || '';

  if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
    return 'Camera and microphone access was denied. Please allow camera and microphone permissions in your browser to enable interview recording.';
  }

  if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
    return 'No camera or microphone device found. Please connect a working camera and microphone.';
  }

  if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
    return 'Your camera or microphone is already in use by another application. Please close other video apps and retry.';
  }

  if (errorName === 'OverconstrainedError') {
    return 'The requested video resolution is not supported by your camera hardware.';
  }

  if (errorName === 'SecurityError') {
    return 'Camera and microphone access requires a secure HTTPS connection or localhost.';
  }

  return `Media access error: ${errorMessage || errorName || 'Could not start camera stream.'}`;
}
