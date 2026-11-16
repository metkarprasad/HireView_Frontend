/**
 * src/features/recording/types/recordingTypes.js
 * Frontend type definitions and status enums for Interview Video Recording.
 */

/**
 * Recording lifecycle states on the frontend client.
 */
export const RECORDER_STATE = Object.freeze({
  IDLE: 'IDLE',
  REQUESTING_PERMISSION: 'REQUESTING_PERMISSION',
  INITIALIZING: 'INITIALIZING',
  RECORDING: 'RECORDING',
  STOPPING: 'STOPPING',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR',
});

/**
 * Status of individual video chunks in memory.
 */
export const CHUNK_STATUS = Object.freeze({
  PENDING: 'PENDING',
  UPLOADING: 'UPLOADING',
  UPLOADED: 'UPLOADED',
  FAILED: 'FAILED',
});

/**
 * Default recording configuration
 */
export const RECORDER_CONFIG = Object.freeze({
  CHUNK_DURATION_MS: 10000, // 10 seconds per chunk
  VIDEO_CONSTRAINTS: {
    facingMode: 'user',
    width: { ideal: 1280, min: 640 },
    height: { ideal: 720, min: 480 },
    frameRate: { ideal: 30, min: 15 },
  },
  AUDIO_CONSTRAINTS: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
});
