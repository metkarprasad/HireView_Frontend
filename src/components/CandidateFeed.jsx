import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { sttService } from '../services/sttService';
import { VideoOff, MicOff, AlertCircle } from 'lucide-react';

/**
 * CandidateFeed displays the user's webcam feed and captures live speech.
 * Exposes methods to parent via ref to control mic/camera visually and functionally.
 */
const CandidateFeed = forwardRef(({ interviewId, onTranscript, isListening, setIsListening }, ref) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cameraOn, setCameraOn] = useState(true);

  useImperativeHandle(ref, () => ({
    toggleCamera: () => {
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach(track => {
          track.enabled = !track.enabled;
        });
        setCameraOn(prev => !prev);
      }
    },
    isCameraOn: () => cameraOn
  }));

  // Initialize webcam stream
  useEffect(() => {
    let activeStream = null;
    let isMounted = true;

    const startCamera = async () => {
      try {
        console.log('[DEBUG] Starting camera initialization...');
        setLoading(true);
        setError('');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('navigator.mediaDevices API is not supported in this browser context (requires HTTPS or localhost).');
        }

        console.log('[DEBUG] Requesting getUserMedia({ video: true, audio: true })...');
        // Request both to trigger browser permission, though we use custom STT
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log('[DEBUG] getUserMedia succeeded. Stream ID:', stream.id);
        
        if (!isMounted) {
          console.log('[DEBUG] Component unmounted before promise resolved. Stopping tracks.');
          // If the component unmounted before the promise resolved, stop the tracks immediately
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();
        
        console.log(`[DEBUG] Found ${videoTracks.length} video tracks and ${audioTracks.length} audio tracks.`);
        if (videoTracks.length > 0) {
          console.log('[DEBUG] Video track settings:', videoTracks[0].getSettings());
          console.log('[DEBUG] Video track label:', videoTracks[0].label);
          console.log('[DEBUG] Video track readyState:', videoTracks[0].readyState);
          console.log('[DEBUG] Video track enabled:', videoTracks[0].enabled);
        } else {
          console.error('[DEBUG] NO VIDEO TRACKS FOUND IN STREAM!');
          throw new Error('Webcam returned a stream with no video tracks.');
        }

        streamRef.current = stream;
        activeStream = stream;
        
        // Mute audio track locally to avoid feedback loop, we just need it for permissions/STT
        audioTracks.forEach(track => {
          track.enabled = false;
          console.log(`[DEBUG] Disabled audio track: ${track.label}`);
        });

        if (videoRef.current) {
          console.log('[DEBUG] videoRef.current is available. Assigning srcObject...');
          videoRef.current.srcObject = stream;
          console.log('[DEBUG] srcObject assigned. Calling play()...');
          
          try {
            await videoRef.current.play();
            console.log('[DEBUG] videoRef.current.play() succeeded! Video should be playing.');
          } catch (playErr) {
            console.error('[DEBUG] Error playing video directly:', playErr);
            if (isMounted) {
              setError(`Video playback failed: ${playErr.message}. The stream was assigned but could not be played.`);
            }
          }
        } else {
          console.error('[DEBUG] videoRef.current IS NULL! The <video> element is not in the DOM.');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('[DEBUG] Unable to access webcam:', err);
        if (isMounted) {
          setError(`Camera Error: ${err.name} - ${err.message}. Please check browser permissions and ensure no other app is using the camera.`);
          setLoading(false);
        }
      }
    };
    startCamera();

    return () => {
      isMounted = false;
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle speech recognition start/stop based on isListening prop
  useEffect(() => {
    if (!isListening) {
      sttService.stop();
      return;
    }

    const handleResult = (text) => {
      if (onTranscript) onTranscript(text);
    };
    const handleEnd = () => {
      if (setIsListening) setIsListening(false);
    };
    
    sttService.start(handleResult, handleEnd);
    
    return () => {
      sttService.stop();
    };
  }, [isListening, onTranscript, setIsListening]);

  return (
    <div className="candidate-feed-wrapper relative w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-2xl overflow-hidden border dark:border-slate-700 border-slate-300 shadow-inner">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-10">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-medium text-indigo-400 animate-pulse">Initializing Camera...</p>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10 px-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4 opacity-90" />
          <p className="text-sm font-medium text-red-300 bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</p>
        </div>
      )}

      {!cameraOn && !error && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 z-10 transition-all duration-300">
          <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center mb-3 shadow-lg">
            <VideoOff className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-400 font-medium">Camera is disabled</p>
        </div>
      )}

      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        onLoadedMetadata={() => {
          console.log('[DEBUG] Video onLoadedMetadata fired.');
          if (videoRef.current) {
            console.log(`[DEBUG] Video dimensions: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
            if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
              console.warn('[DEBUG] WARNING: Video dimensions are 0x0. The webcam might be sending an empty/black stream.');
            }
            if (videoRef.current.paused) {
              console.log('[DEBUG] Video is paused on metadata load, attempting to play...');
              videoRef.current.play().catch(e => console.error('[DEBUG] Video play error on loaded metadata:', e));
            }
          }
        }}
        onPlaying={() => console.log('[DEBUG] Video onPlaying fired. Video should be visible now.')}
        onTimeUpdate={() => {
          // Just a one-time log to confirm frames are advancing
          if (videoRef.current && videoRef.current.currentTime > 0 && !videoRef.current.dataset.loggedTime) {
            console.log(`[DEBUG] Video time is updating (currentTime: ${videoRef.current.currentTime}). Frames are being rendered.`);
            videoRef.current.dataset.loggedTime = 'true';
          }
        }}
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500 ${loading || error || !cameraOn ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
      />
      
      {/* Floating Status Indicators */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-20">
        {!cameraOn && (
          <div className="bg-red-500/90 backdrop-blur-md p-2 rounded-lg shadow-lg">
            <VideoOff className="w-4 h-4 text-white" />
          </div>
        )}
        {!isListening && !error && !loading && (
          <div className="bg-red-500/90 backdrop-blur-md p-2 rounded-lg shadow-lg">
            <MicOff className="w-4 h-4 text-white" />
          </div>
        )}
        {isListening && (
          <div className="bg-indigo-500/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Listening</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default CandidateFeed;
