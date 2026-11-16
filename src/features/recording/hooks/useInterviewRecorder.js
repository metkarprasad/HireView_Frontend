import { useState, useRef, useEffect, useCallback } from 'react';
import {
  RECORDER_STATE,
  CHUNK_STATUS,
  RECORDER_CONFIG,
} from '../types/recordingTypes';
import {
  getSupportedMimeType,
  isMediaRecorderSupported,
  isMediaDevicesSupported,
  getUserFriendlyMediaError,
  formatBytes,
} from '../utils/mediaRecorderUtils';
import { startRecordingSession } from '../services/recordingApi';
import { UploadQueue } from '../services/uploadQueue';

/**
 * Hook for managing the interview video recording session.
 * @param {Object} params
 * @param {string} params.attemptOrInterviewId - Interview or Attempt ID
 * @param {MediaStream} [params.externalStream] - Optional existing stream to reuse
 * @param {Function} [params.onChunkGenerated] - Callback whenever a non-empty chunk is produced
 * @param {Function} [params.onUploadProgress] - Callback for upload queue progress
 * @param {Function} [params.onError] - Error callback
 */
export function useInterviewRecorder({
  attemptOrInterviewId,
  externalStream = null,
  onChunkGenerated,
  onUploadProgress,
  onError,
} = {}) {
  // Lightweight UI State
  const [status, setStatus] = useState(RECORDER_STATE.IDLE);
  const [recordingId, setRecordingId] = useState(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);
  const [totalSizeBytes, setTotalSizeBytes] = useState(0);
  const [selectedMimeType, setSelectedMimeType] = useState(null);
  const [error, setError] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [uploadStats, setUploadStats] = useState({
    totalCreated: 0,
    totalUploaded: 0,
    totalPending: 0,
    currentlyUploading: 0,
    totalFailed: 0,
    totalUploadedBytes: 0,
    isBackpressureWarning: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });

  // Heavyweight Internal Refs (prevent React re-render memory overhead)
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const isExternalStreamRef = useRef(false);
  const pendingChunksRef = useRef([]);
  const chunkIndexCounterRef = useRef(0);
  const isOperatingRef = useRef(false);
  const timerIntervalRef = useRef(null);
  const stopPromiseResolverRef = useRef(null);
  const isMountedRef = useRef(true);
  const uploadQueueRef = useRef(null);

  // Initialize upload queue on mount
  useEffect(() => {
    uploadQueueRef.current = new UploadQueue({
      onProgress: (stats) => {
        if (isMountedRef.current) {
          setUploadStats(stats);
        }
        if (onUploadProgress) {
          onUploadProgress(stats);
        }
      },
      onError: (err) => {
        console.warn('[RECORDER HOOK] Upload queue error:', err);
      },
    });

    return () => {
      if (uploadQueueRef.current) {
        uploadQueueRef.current.destroy();
      }
    };
  }, [onUploadProgress]);

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update mediaStream state if externalStream changes
  useEffect(() => {
    if (externalStream && !streamRef.current) {
      streamRef.current = externalStream;
      isExternalStreamRef.current = true;
      setMediaStream(externalStream);
    }
  }, [externalStream]);

  // Clean timer helper
  const clearDurationTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Release media tracks cleanly
  const releaseMediaStream = useCallback(() => {
    if (streamRef.current && !isExternalStreamRef.current) {
      console.log('[RECORDER CLEANUP] Stopping local media stream tracks');
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('[RECORDER CLEANUP] Error stopping track:', e);
        }
      });
      streamRef.current = null;
      if (isMountedRef.current) {
        setMediaStream(null);
      }
    }
  }, []);

  /**
   * Start or resume the recording session.
   */
  const startRecording = useCallback(async () => {
    if (!attemptOrInterviewId) {
      const err = 'Cannot start recording: Missing attempt or interview ID.';
      setError(err);
      if (onError) onError(err);
      return false;
    }

    // Protect against double initialization / re-render races
    if (
      status === RECORDER_STATE.RECORDING ||
      status === RECORDER_STATE.REQUESTING_PERMISSION ||
      status === RECORDER_STATE.INITIALIZING ||
      isOperatingRef.current
    ) {
      console.warn('[RECORDER] startRecording called while already starting/recording. Ignoring duplicate call.');
      return false;
    }

    isOperatingRef.current = true;
    setError(null);
    setStatus(RECORDER_STATE.REQUESTING_PERMISSION);

    try {
      // 1. Validate browser environment
      if (!isMediaDevicesSupported() || !isMediaRecorderSupported()) {
        throw new Error('Your browser does not support MediaRecorder or Camera/Microphone access.');
      }

      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        throw new Error('No supported video MIME type found for MediaRecorder on this browser.');
      }
      setSelectedMimeType(mimeType);

      // 2. Request / obtain Camera + Microphone stream
      let stream = externalStream || streamRef.current;
      if (!stream || !stream.active) {
        console.log('[RECORDER] Requesting user camera & microphone permissions...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: RECORDER_CONFIG.VIDEO_CONSTRAINTS,
          audio: RECORDER_CONFIG.AUDIO_CONSTRAINTS,
        });
        streamRef.current = stream;
        isExternalStreamRef.current = false;
        if (isMountedRef.current) {
          setMediaStream(stream);
        }
      }

      if (!isMountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return false;
      }

      setStatus(RECORDER_STATE.INITIALIZING);

      // 3. Initiate Phase 1 Backend Recording Session
      console.log(`[RECORDER] Registering recording session with backend for ID: ${attemptOrInterviewId}...`);
      const backendResponse = await startRecordingSession({
        attemptOrInterviewId,
        mimeType,
        metadata: {
          userAgent: navigator.userAgent,
          startedAt: new Date().toISOString(),
        },
      });

      if (!backendResponse || !backendResponse.success || !backendResponse.recording) {
        throw new Error(backendResponse?.message || 'Failed to initialize recording session on server.');
      }

      const activeRecording = backendResponse.recording;
      const recId = activeRecording.id || activeRecording._id;
      setRecordingId(recId);

      // 4. Create and configure MediaRecorder
      console.log(`[RECORDER] Initializing MediaRecorder with MIME: ${mimeType} for recordingId: ${recId}`);
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunkIndexCounterRef.current = 0;
      pendingChunksRef.current = [];

      // Handler for timesliced chunks
      recorder.ondataavailable = (event) => {
        // Critical: Ignore empty chunks
        if (!event.data || event.data.size <= 0) {
          return;
        }

        const chunkIndex = chunkIndexCounterRef.current++;
        const newChunk = {
          recordingId: recId,
          chunkIndex,
          blob: event.data,
          sizeBytes: event.data.size,
          mimeType,
          createdAt: Date.now(),
          status: CHUNK_STATUS.PENDING,
        };

        pendingChunksRef.current.push(newChunk);

        if (isMountedRef.current) {
          setChunkCount((prev) => prev + 1);
          setTotalSizeBytes((prev) => prev + event.data.size);
        }

        console.log(
          `[RECORDER CHUNK] Chunk #${chunkIndex} generated | Size: ${formatBytes(event.data.size)} | Total recorded: ${pendingChunksRef.current.length}`
        );

        // Phase 3: Enqueue directly into upload queue
        if (uploadQueueRef.current) {
          uploadQueueRef.current.enqueue(newChunk);
        }

        if (onChunkGenerated) {
          try {
            onChunkGenerated(newChunk);
          } catch (cbErr) {
            console.error('[RECORDER] onChunkGenerated callback error:', cbErr);
          }
        }
      };

      // Handler for recorder stop event
      recorder.onstop = () => {
        console.log(`[RECORDER STOP] MediaRecorder stopped. Total chunks captured: ${chunkIndexCounterRef.current}`);
        if (isMountedRef.current) {
          setStatus(RECORDER_STATE.STOPPED);
        }
        if (stopPromiseResolverRef.current) {
          stopPromiseResolverRef.current();
          stopPromiseResolverRef.current = null;
        }
      };

      recorder.onerror = (recErr) => {
        console.error('[RECORDER ERROR] MediaRecorder runtime error:', recErr);
        const errMsg = 'MediaRecorder encountered a runtime error.';
        if (isMountedRef.current) {
          setError(errMsg);
          setStatus(RECORDER_STATE.ERROR);
        }
        if (onError) onError(errMsg);
      };

      // 5. Start MediaRecorder with controlled 10s timeslice
      recorder.start(RECORDER_CONFIG.CHUNK_DURATION_MS);
      console.log(`[RECORDER START] Recording active with ${RECORDER_CONFIG.CHUNK_DURATION_MS}ms timeslice.`);

      if (isMountedRef.current) {
        setStatus(RECORDER_STATE.RECORDING);
        setDurationSeconds(0);
      }

      // 6. Start elapsed time ticker
      clearDurationTimer();
      timerIntervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          setDurationSeconds((prev) => prev + 1);
        }
      }, 1000);

      isOperatingRef.current = false;
      return true;
    } catch (err) {
      console.error('[RECORDER ERROR] Failed to start recording:', err);
      const friendlyMsg = getUserFriendlyMediaError(err);
      if (isMountedRef.current) {
        setError(friendlyMsg);
        setStatus(RECORDER_STATE.ERROR);
      }
      releaseMediaStream();
      isOperatingRef.current = false;
      if (onError) onError(friendlyMsg);
      return false;
    }
  }, [attemptOrInterviewId, externalStream, status, onChunkGenerated, onError, clearDurationTimer, releaseMediaStream]);

  /**
   * Stop recording safely, capturing the final chunk, flushing upload queue, and releasing all devices.
   * @returns {Promise<{ recordingId: string, totalChunks: number, totalSizeBytes: number, durationSeconds: number, chunks: Array, uploadStats: Object }>}
   */
  const stopRecording = useCallback(async () => {
    if (status !== RECORDER_STATE.RECORDING && !mediaRecorderRef.current) {
      console.warn('[RECORDER] stopRecording called while not in RECORDING state. No-op.');
      return {
        recordingId,
        totalChunks: pendingChunksRef.current.length,
        totalSizeBytes,
        durationSeconds,
        chunks: pendingChunksRef.current,
        uploadStats: uploadQueueRef.current ? uploadQueueRef.current.getStats() : uploadStats,
      };
    }

    console.log('[RECORDER] Initiating safe recorder shutdown and final chunk capture...');
    if (isMountedRef.current) {
      setStatus(RECORDER_STATE.STOPPING);
    }
    clearDurationTimer();

    const recorder = mediaRecorderRef.current;

    // Await onstop and final dataavailable event
    if (recorder && recorder.state !== 'inactive') {
      await new Promise((resolve) => {
        stopPromiseResolverRef.current = resolve;
        try {
          // Request final data chunk and stop
          recorder.requestData();
          recorder.stop();
        } catch (e) {
          console.warn('[RECORDER] Error while stopping recorder:', e);
          resolve();
        }
      });
    }

    // Release camera and microphone hardware tracks
    releaseMediaStream();
    mediaRecorderRef.current = null;
    isOperatingRef.current = false;

    // Phase 3: Flush remaining upload queue chunks
    let finalUploadStats = uploadStats;
    if (uploadQueueRef.current) {
      console.log('[RECORDER] Awaiting upload queue to finalize all pending chunks...');
      finalUploadStats = await uploadQueueRef.current.flushAndStop();
    }

    console.log(`[RECORDER FINISHED] Finalized recording ${recordingId}. Captured ${pendingChunksRef.current.length} total chunks (${finalUploadStats.totalUploaded} uploaded).`);

    return {
      recordingId,
      totalChunks: pendingChunksRef.current.length,
      totalSizeBytes: pendingChunksRef.current.reduce((acc, c) => acc + c.sizeBytes, 0),
      durationSeconds,
      chunks: [...pendingChunksRef.current],
      uploadStats: finalUploadStats,
    };
  }, [status, recordingId, totalSizeBytes, durationSeconds, uploadStats, clearDurationTimer, releaseMediaStream]);

  // Page unload warning when actively recording
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (status === RECORDER_STATE.RECORDING) {
        const message = 'Your interview recording is still active. Leaving now may interrupt the recording.';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [status]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      clearDurationTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          // Ignore during unmount
        }
      }
      releaseMediaStream();
    };
  }, [clearDurationTimer, releaseMediaStream]);

  const getPendingChunks = useCallback(() => {
    return [...pendingChunksRef.current];
  }, []);

  const clearPendingChunks = useCallback(() => {
    pendingChunksRef.current = [];
    setChunkCount(0);
    setTotalSizeBytes(0);
  }, []);

  return {
    status,
    recordingId,
    durationSeconds,
    chunkCount,
    totalSizeBytes,
    selectedMimeType,
    error,
    mediaStream,
    uploadStats,
    totalUploadedChunks: uploadStats.totalUploaded,
    pendingUploadChunks: uploadStats.totalPending,
    isUploading: uploadStats.currentlyUploading > 0,
    isBackpressureWarning: uploadStats.isBackpressureWarning,
    isOnline: uploadStats.isOnline,
    isRecording: status === RECORDER_STATE.RECORDING,
    isRequestingPermission: status === RECORDER_STATE.REQUESTING_PERMISSION,
    isInitializing: status === RECORDER_STATE.INITIALIZING,
    isStopping: status === RECORDER_STATE.STOPPING,
    startRecording,
    stopRecording,
    getPendingChunks,
    clearPendingChunks,
  };
}
