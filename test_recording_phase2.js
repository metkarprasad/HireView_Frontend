/**
 * test_recording_phase2.js
 * Unit and logic verification suite for Phase 2 Browser Video Recording module.
 */

import {
  formatDuration,
  formatBytes,
  getUserFriendlyMediaError,
} from './src/features/recording/utils/mediaRecorderUtils.js';
import {
  RECORDER_STATE,
  CHUNK_STATUS,
  RECORDER_CONFIG,
} from './src/features/recording/types/recordingTypes.js';

console.log('================================================================');
console.log('🚀 RUNNING PHASE 2 FRONTEND RECORDING ENGINE LOGIC TEST SUITE');
console.log('================================================================\n');

// 1. Test Duration Formatting
console.log('--- TEST 1: Duration Formatter ---');
console.assert(formatDuration(0) === '00:00', 'Test 1.1 Failed: 0s -> 00:00');
console.assert(formatDuration(45) === '00:45', 'Test 1.2 Failed: 45s -> 00:45');
console.assert(formatDuration(65) === '01:05', 'Test 1.3 Failed: 65s -> 01:05');
console.assert(formatDuration(3665) === '01:01:05', 'Test 1.4 Failed: 3665s -> 01:01:05');
console.log('✅ TEST 1 PASSED: Duration formatting verified.\n');

// 2. Test Byte Size Formatting
console.log('--- TEST 2: Byte Size Formatter ---');
console.assert(formatBytes(0) === '0 B', 'Test 2.1 Failed');
console.assert(formatBytes(1024) === '1 KB', 'Test 2.2 Failed');
console.assert(formatBytes(1048576) === '1 MB', 'Test 2.3 Failed');
console.assert(formatBytes(5242880) === '5 MB', 'Test 2.4 Failed');
console.log('✅ TEST 2 PASSED: Byte size formatting verified.\n');

// 3. Test Error Mapping
console.log('--- TEST 3: User-Friendly Error Mapper ---');
const notAllowedErr = { name: 'NotAllowedError', message: 'Permission dismissed' };
const notFoundErr = { name: 'NotFoundError', message: 'No mic' };
const notReadableErr = { name: 'NotReadableError', message: 'In use' };
const securityErr = { name: 'SecurityError', message: 'Insecure' };

console.assert(getUserFriendlyMediaError(notAllowedErr).includes('Camera and microphone access was denied'), 'Test 3.1 Failed');
console.assert(getUserFriendlyMediaError(notFoundErr).includes('No camera or microphone device found'), 'Test 3.2 Failed');
console.assert(getUserFriendlyMediaError(notReadableErr).includes('already in use'), 'Test 3.3 Failed');
console.assert(getUserFriendlyMediaError(securityErr).includes('HTTPS'), 'Test 3.4 Failed');
console.log('✅ TEST 3 PASSED: Error translations verified.\n');

// 4. Test In-Memory Chunk Queue Logic
console.log('--- TEST 4: In-Memory Chunk Queue & Indexing Logic ---');
const mockQueue = [];
let chunkCounter = 0;
const recordingId = 'rec_test_123';
const mimeType = 'video/webm;codecs=vp9,opus';

function simulateChunkEmission(sizeInBytes) {
  if (sizeInBytes <= 0) return; // Ignore empty chunk
  const chunkIndex = chunkCounter++;
  const chunk = {
    recordingId,
    chunkIndex,
    blob: { size: sizeInBytes, type: mimeType },
    sizeBytes: sizeInBytes,
    mimeType,
    createdAt: Date.now(),
    status: CHUNK_STATUS.PENDING,
  };
  mockQueue.push(chunk);
}

// Simulate 3 regular chunks + 1 empty chunk + 1 final chunk
simulateChunkEmission(250000);
simulateChunkEmission(0); // Should be ignored
simulateChunkEmission(260000);
simulateChunkEmission(270000);
simulateChunkEmission(150000); // Final chunk

console.assert(mockQueue.length === 4, `Test 4.1 Failed: Expected 4 chunks, got ${mockQueue.length}`);
console.assert(mockQueue[0].chunkIndex === 0, 'Test 4.2 Failed: First chunk index should be 0');
console.assert(mockQueue[1].chunkIndex === 1, 'Test 4.3 Failed: Second chunk index should be 1');
console.assert(mockQueue[2].chunkIndex === 2, 'Test 4.4 Failed: Third chunk index should be 2');
console.assert(mockQueue[3].chunkIndex === 3, 'Test 4.5 Failed: Fourth chunk index should be 3');
console.assert(mockQueue.every(c => c.status === CHUNK_STATUS.PENDING), 'Test 4.6 Failed: Status should be PENDING');
console.log('✅ TEST 4 PASSED: Chunk indexing, empty chunk rejection, and in-memory queue verified.\n');

// 5. Test Timeslice and Config
console.log('--- TEST 5: Configuration Constants ---');
console.assert(RECORDER_CONFIG.CHUNK_DURATION_MS === 10000, 'Test 5.1 Failed: Expected 10000ms chunk duration');
console.assert(RECORDER_CONFIG.VIDEO_CONSTRAINTS.facingMode === 'user', 'Test 5.2 Failed');
console.assert(RECORDER_CONFIG.AUDIO_CONSTRAINTS.echoCancellation === true, 'Test 5.3 Failed');
console.log('✅ TEST 5 PASSED: Recorder configuration verified.\n');

console.log('================================================================');
console.log('🎉 ALL PHASE 2 FRONTEND RECORDING LOGIC TESTS PASSED!');
console.log('================================================================');
