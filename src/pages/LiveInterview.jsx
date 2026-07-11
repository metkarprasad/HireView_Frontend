import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AIInterviewer from '../components/AIInterviewer';
import CandidateFeed from '../components/CandidateFeed';
import '../styles/liveInterview.css';

const LiveInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, joinInterview, startInterview, enabled } = useSocket();
  const { token } = useAuth();
  const toast = useToast();

  const [currentQuestion, setCurrentQuestion] = useState('');
  const [transcript, setTranscript] = useState('');

  // Join and start interview when socket is ready
  useEffect(() => {
    if (enabled && socket && token && id) {
      joinInterview(id);
      startInterview(id);
    }
  }, [enabled, socket, token, id, joinInterview, startInterview]);

  // Listen for AI questions and interview completion
  useEffect(() => {
    if (!socket) return;
    const handleQuestion = (question) => {
      // question may be object { text } or string
      setCurrentQuestion(question?.text || question);
    };
    const handleCompleted = (report) => {
      toast.success('Interview completed! Redirecting to history...');
      navigate(`/history/${id}`);
    };
    socket.on('question', handleQuestion);
    socket.on('interviewCompleted', handleCompleted);
    return () => {
      socket.off('question', handleQuestion);
      socket.off('interviewCompleted', handleCompleted);
    };
  }, [socket, navigate, id, toast]);

  // Receive live transcription from CandidateFeed
  const handleTranscriptUpdate = (text) => {
    setTranscript(text);
  };

  // Emit transcript to backend when updated
  useEffect(() => {
    if (!socket) return;
    if (transcript) {
      socket.emit('answerCandidate', { interviewId: id, transcript });
    }
  }, [socket, transcript, id]);

  return (
    <div className="live-interview-container">
      <div className="left-panel">
        <AIInterviewer question={currentQuestion} />
      </div>
      <div className="right-panel">
        <CandidateFeed interviewId={id} onTranscript={handleTranscriptUpdate} />
        <div className="transcript-box">
          <h3>Live Transcript</h3>
          <p>{transcript}</p>
        </div>
      </div>
    </div>
  );
};

export default LiveInterview;
