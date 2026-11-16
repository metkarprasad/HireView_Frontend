import React from 'react';
import { RECORDER_STATE } from '../types/recordingTypes';
import { formatDuration, formatBytes } from '../utils/mediaRecorderUtils';
import { Video, AlertCircle, Loader2, Cloud, CloudUpload, CloudOff, AlertTriangle } from 'lucide-react';

export default function RecordingStatus({
  status = RECORDER_STATE.IDLE,
  durationSeconds = 0,
  chunkCount = 0,
  totalSizeBytes = 0,
  uploadStats = null,
  error = null,
  compact = false,
  className = '',
}) {
  if (status === RECORDER_STATE.IDLE && !error) {
    return null;
  }

  // Error view
  if (status === RECORDER_STATE.ERROR || error) {
    return (
      <div
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/10 border border-red-500/30 text-red-400 shadow-sm backdrop-blur-md ${className}`}
        title={error}
      >
        <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
        <span className="truncate max-w-[280px]">
          {error || 'Recording error occurred'}
        </span>
      </div>
    );
  }

  // Requesting permissions or Initializing
  if (
    status === RECORDER_STATE.REQUESTING_PERMISSION ||
    status === RECORDER_STATE.INITIALIZING
  ) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 backdrop-blur-md ${className}`}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
        <span>
          {status === RECORDER_STATE.REQUESTING_PERMISSION
            ? 'Requesting Camera & Mic...'
            : 'Starting Recording Session...'}
        </span>
      </div>
    );
  }

  // Stopping / Finalizing
  if (status === RECORDER_STATE.STOPPING) {
    const uploaded = uploadStats ? uploadStats.totalUploaded : 0;
    const total = uploadStats ? uploadStats.totalCreated : chunkCount;
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300 backdrop-blur-md ${className}`}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
        <span>
          Finalizing Recording & Uploads ({uploaded}/{total})...
        </span>
      </div>
    );
  }

  // Active Recording View
  if (status === RECORDER_STATE.RECORDING) {
    const totalCreated = uploadStats?.totalCreated ?? chunkCount;
    const totalUploaded = uploadStats?.totalUploaded ?? 0;
    const totalPending = uploadStats?.totalPending ?? 0;
    const currentlyUploading = uploadStats?.currentlyUploading ?? 0;
    const isOnline = uploadStats?.isOnline ?? true;
    const isBackpressure = uploadStats?.isBackpressureWarning ?? false;

    return (
      <div className="flex flex-wrap items-center gap-2">
        <div
          className={`inline-flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-red-500/40 text-white shadow-lg backdrop-blur-md transition-all ${className}`}
        >
          {/* Pulsing Red REC dot */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-[11px] font-extrabold tracking-wider text-red-400">
              REC
            </span>
          </div>

          {/* Live Elapsed Duration */}
          <span className="font-mono text-xs font-bold text-slate-200 tracking-wide">
            {formatDuration(durationSeconds)}
          </span>

          {/* Stats Pill (Hidden in compact mode) */}
          {!compact && totalCreated > 0 && (
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400 pl-2 border-l border-slate-700">
              <div className="flex items-center gap-1 text-emerald-400" title="Uploaded chunks">
                <Cloud className="w-3 h-3 text-emerald-400" />
                <span>
                  {totalUploaded}/{totalCreated} uploaded
                </span>
              </div>

              {currentlyUploading > 0 && (
                <div className="flex items-center gap-1 text-indigo-300 animate-pulse" title="Uploading in background">
                  <CloudUpload className="w-3 h-3 text-indigo-400" />
                  <span>{currentlyUploading} uploading</span>
                </div>
              )}

              {totalSizeBytes > 0 && (
                <span className="text-slate-500">({formatBytes(totalSizeBytes)})</span>
              )}
            </div>
          )}
        </div>

        {/* Offline Badge */}
        {!isOnline && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <CloudOff className="w-3.5 h-3.5 text-amber-400" />
            <span>Offline (uploads paused)</span>
          </div>
        )}

        {/* Backpressure warning */}
        {isBackpressure && isOnline && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Slow network ({totalPending} pending)</span>
          </div>
        )}
      </div>
    );
  }

  return null;
}

