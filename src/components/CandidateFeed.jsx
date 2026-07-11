// src/components/CandidateFeed.jsx
import React, { useEffect, useRef, useState } from 'react';
import { sttService } from '../services/sttService';
/**
 * CandidateFeed displays the user's webcam feed and captures live speech.
 * Props:
 *   - interviewId: string (unused currently but kept for future extensions)
 *   - onTranscript: function(text) – called with the latest finalized transcript.
 */
const CandidateFeed = ({ interviewId, onTranscript }) => {
  const videoRef = useRef(null);
  const [listening, setListening] = useState(false);

  // Initialize webcam stream
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Unable to access webcam:', err);
      }
    };
    startCamera();
  }, []);

  // Handle speech recognition start/stop
  useEffect(() => {
    if (!listening) return;
    const handleResult = (text) => {
      if (onTranscript) onTranscript(text);
    };
    const handleEnd = () => {
      setListening(false);
    };
    sttService.start(handleResult, handleEnd);
    return () => {
      sttService.stop();
    };
  }, [listening, onTranscript]);

  const toggleListening = () => {
    setListening((prev) => !prev);
  };

  return (
    <div className="candidate-feed">
      <video ref={videoRef} autoPlay muted className="webcam-video" />
      <button className="mic-toggle" onClick={toggleListening}>
        {listening ? 'Stop Listening' : 'Start Listening'}
      </button>
    </div>
  );
};

export default CandidateFeed;
