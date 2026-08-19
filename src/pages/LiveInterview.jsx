import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AIInterviewer from '../components/AIInterviewer';
import CandidateFeed from '../components/CandidateFeed';
import { Play, Square, FastForward, Power, Video, VideoOff, Volume2 } from 'lucide-react';
import { ttsService } from '../services/ttsService';

const LiveInterview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, joinInterview, startInterview, enabled } = useSocket();
  const { token } = useAuth();
  const toast = useToast();

  const [currentQuestion, setCurrentQuestion] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interviewState, setInterviewState] = useState('idle'); // idle | started | completed
  const [attemptId, setAttemptId] = useState(null);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);

  const candidateFeedRef = useRef(null);

  // Join interview room on mount
  useEffect(() => {
    if (enabled && socket && token && id) {
      joinInterview(id);
    }
  }, [enabled, socket, token, id, joinInterview]);

  // Listen for AI questions and interview completion
  useEffect(() => {
    if (!socket) return;
    
    const handleAttemptCreated = (attempt) => {
      if (attempt?.id) setAttemptId(attempt.id);
    };

    const handleQuestion = (question) => {
      setCurrentQuestion(question?.text || question);
      setInterviewState('started');
      setIsListening(false); // Stop listening when a new question arrives
    };
    
    const handleCompleted = (report) => {
      setInterviewState('completed');
      toast.success('Interview completed! Redirecting to history...');
      setTimeout(() => {
        navigate(`/history/${id}`);
      }, 2000);
    };

    socket.on('attemptCreated', handleAttemptCreated);
    socket.on('question', handleQuestion);
    socket.on('interviewCompleted', handleCompleted);
    
    return () => {
      socket.off('attemptCreated', handleAttemptCreated);
      socket.off('question', handleQuestion);
      socket.off('interviewCompleted', handleCompleted);
    };
  }, [socket, navigate, id, toast]);

  // Emit transcript to backend when updated (while listening)
  useEffect(() => {
    if (!socket || !isListening) return;
    if (transcript) {
      // In a real scenario, this might trigger live AI evaluation or just log it.
      // We will wait for them to click "Stop Listening" to trigger next step.
    }
  }, [socket, transcript, id, isListening]);

  const handleStartInterview = () => {
    setInterviewState('started');
    startInterview(id);
    toast.info('Starting interview...');
  };

  const handleStopListening = () => {
    setIsListening(false);
    toast.success('Response recorded.');
  };

  const handleNextQuestion = () => {
    if (!transcript.trim()) {
      toast.warning("Please provide an answer before moving to the next question.");
      return;
    }
    // Submit answer to socket to get the next question
    if (socket && attemptId) {
      socket.emit('submitAnswer', { interviewId: id, attemptId, answer: transcript });
      setTranscript(''); // reset for next question
      toast.info('Generating next question...');
    }
  };

  const handleRepeatQuestion = () => {
    if (currentQuestion) {
      ttsService.speak(currentQuestion);
    }
  };

  const handleEndInterview = () => {
    setShowConfirmEnd(true);
  };

  const confirmEndInterview = () => {
    setShowConfirmEnd(false);
    toast.info('Ending interview session...');
    setIsListening(false);
    navigate(`/history/${id}`);
  };

  const toggleCamera = () => {
    if (candidateFeedRef.current) {
      candidateFeedRef.current.toggleCamera();
    }
  };

  // Determine Avatar State
  let avatarState = 'idle';
  if (interviewState === 'started') {
    if (isListening) {
      avatarState = 'thinking'; // Listening to candidate
    } else {
      avatarState = 'speaking';
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-between p-4 md:p-8">
      {/* Header */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
          Live Session
        </h1>
        <button 
          onClick={handleEndInterview}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20"
        >
          <Power className="w-4 h-4" />
          End Interview
        </button>
      </div>

      {/* Main Video Grids */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 mb-8">
        <div className="w-full h-full min-h-[400px]">
          <AIInterviewer question={currentQuestion} avatarState={avatarState} />
        </div>
        <div className="w-full h-full min-h-[400px] flex flex-col gap-4">
          <div className="flex-1 relative rounded-2xl overflow-hidden shadow-lg border border-slate-700 bg-slate-900">
            <CandidateFeed 
              ref={candidateFeedRef}
              interviewId={id} 
              onTranscript={setTranscript} 
              isListening={isListening}
              setIsListening={setIsListening}
            />
          </div>
          
          {/* Transcript Box */}
          <div className="h-32 bg-slate-900 rounded-xl border border-slate-700 p-4 overflow-y-auto">
            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Live Transcript</h3>
            <p className="text-slate-300 text-sm">{transcript || <span className="text-slate-600 italic">Waiting for speech...</span>}</p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700 p-4 shadow-2xl flex flex-wrap items-center justify-center gap-4">
        
        {interviewState === 'idle' && (
          <button 
            onClick={handleStartInterview}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            Start AI Interview
          </button>
        )}

        {interviewState === 'started' && (
          <>
            <button 
              onClick={() => setIsListening(!isListening)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all ${isListening ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
            >
              {isListening ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              {isListening ? 'Stop Listening' : 'Start Answering'}
            </button>

            <button 
              onClick={handleNextQuestion}
              disabled={isListening}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all"
            >
              Next Question
              <FastForward className="w-5 h-5 fill-current" />
            </button>

            <div className="w-px h-8 bg-slate-700 mx-2"></div>

            <button 
              onClick={handleRepeatQuestion}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors tooltip"
              title="Repeat Question"
            >
              <Volume2 className="w-5 h-5" />
            </button>

            <button 
              onClick={toggleCamera}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors tooltip"
              title="Toggle Camera"
            >
              <Video className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmEnd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">End Interview?</h3>
            <p className="text-slate-400 mb-6">Are you sure you want to end this interview? Your progress so far will be saved, but you won't be able to resume this session.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmEnd(false)}
                className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={confirmEndInterview}
                className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg transition-colors font-medium shadow-lg shadow-red-500/20"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveInterview;
