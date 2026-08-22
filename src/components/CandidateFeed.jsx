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
        setLoading(true);
        setError('');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('navigator.mediaDevices API is not supported in this browser context (requires HTTPS or localhost).');
        }

        // Request both to trigger browser permission, though we use custom STT
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: true 
        });
        
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();
        
        if (videoTracks.length === 0) {
          throw new Error('Webcam returned a stream with no video tracks.');
        }

        streamRef.current = stream;
        activeStream = stream;
        
        // Mute audio track locally to avoid feedback loop, we just need it for permissions/STT
        audioTracks.forEach(track => {
          track.enabled = false;
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            if (isMounted) {
              setError(`Video playback failed: ${playErr.message}. The stream was assigned but could not be played.`);
            }
          }
        }
        
        setLoading(false);
      } catch (err) {
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
