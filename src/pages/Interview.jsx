import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSocket } from '../context/SocketContext';
import {
  Mic,
  MicOff,
  Send,
  Timer,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';

const TIMER_SECONDS = 180; // 3 minutes per question

const Interview = () => {
  const { socket, joinInterview, startInterview, submitAnswer, enabled } = useSocket();
  const { token } = useAuth(); // ensure token available for socket auth
  const { id } = useParams();
  const navigate = useNavigate();
  const { apiUrl } = useAuth();
  const toast = useToast();

  // Active Session State
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [answerText, setAnswerText] = useState('');
  const [attempt, setAttempt] = useState(null);

  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Loaders & Error handlers
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Timer Ref
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            setAnswerText((prev) => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + finalTranscript);
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    } catch (err) {
      console.warn('Speech recognition is not supported or failed to initialize:', err);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleAttempt = (attemptData) => {
      setAttempt(attemptData);
    };
    const handleQuestion = (question) => {
      setCurrentQuestion(question);
      setQuestionIndex((prev) => prev + 1);
    };
    const handleFeedback = (feedback) => {
      toast.info(feedback?.message || 'Feedback received');
    };
    const handleCompleted = (report) => {
      navigate(`/history/${id}`);
    };
    socket.on('attemptCreated', handleAttempt);
    socket.on('question', handleQuestion);
    socket.on('feedback', handleFeedback);
    socket.on('interviewCompleted', handleCompleted);
    return () => {
      socket.off('attemptCreated', handleAttempt);
      socket.off('question', handleQuestion);
      socket.off('feedback', handleFeedback);
      socket.off('interviewCompleted', handleCompleted);
    };
  }, [socket, id]);

  // Fetch / Resume Session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await axios.get(`${apiUrl}/interviews/${id}`);
        const data = res.data.interview;

        if (data.status === 'completed') {
          navigate(`/history/${id}`);
          return;
        }

        setSession(data);
        setTotalQuestions(5); // default setup limit

        // Find currently unanswered question
        const questionsList = data.questions || [];
        const unansweredIdx = questionsList.findIndex((q) => !q.answerText);

        if (unansweredIdx !== -1) {
          setCurrentQuestion(questionsList[unansweredIdx].questionText);
          setQuestionIndex(unansweredIdx);
        } else {
          // If all answered in DB but status not updated, we handle as fallback
          setCurrentQuestion(questionsList[questionsList.length - 1].questionText);
          setQuestionIndex(questionsList.length - 1);
        }

        setError('');
      } catch (err) {
        setError('Failed to load active interview session.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
if (enabled && socket && id) { joinInterview(id); startInterview(id); } // Join socket room after session is set
    loadSession();
  }, [id, apiUrl, navigate]);

  // Handle Question Timer Countdowns
  useEffect(() => {
    if (loading || submitting || error) return;

    setTimeLeft(TIMER_SECONDS);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Auto submit answer when timer runs out
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questionIndex, loading, submitting, error]);

  const handleAutoSubmit = () => {
    // Submit whatever the candidate has written so far (or a placeholder if empty)
    const finalAnswer = answerText.trim() || "(No response recorded - Time Expired)";
    submitAnswerRequest(finalAnswer);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.warning('Speech Recognition is not supported by your current browser. Please type your response.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!answerText.trim()) {
      toast.error('Please enter a response before submitting.');
      return;
    }
    submitAnswerRequest(answerText.trim());
  };

  const submitAnswerRequest = (answer) => {
    // Stop recording if listening
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    // Emit via socket
    if (socket) {
      submitAnswer(id, attempt?.id, answer);
    } else {
      console.warn('Socket not available, cannot submit answer');
    }
    setAnswerText('');
    setSubmitting(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercentage = ((questionIndex) / totalQuestions) * 100;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center dark:bg-darkBg bg-lightBg px-4">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-indigo-400 font-medium animate-pulse">Scaffolding Interview Environment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold dark:text-white text-slate-900 mb-2">Access Denied</h2>
        <p className="dark:text-slate-400 text-slate-600 mb-6">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] dark:bg-darkBg bg-lightBg py-8 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Dashboard Context */}
        <div className="flex justify-between items-center bg-white dark:bg-darkCard border dark:border-darkBorder border-lightBorder px-6 py-4 rounded-2xl shadow-sm">
          <div>
            <h2 className="text-lg font-bold dark:text-white text-slate-800">
              {session?.technology} Interview
            </h2>
            <p className="text-xs dark:text-slate-400 text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
              Difficulty: <span className="text-indigo-400">{session?.difficulty}</span>
            </p>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-bold ${
            timeLeft < 30 
              ? 'text-red-400 bg-red-500/10 border-red-500/25 animate-pulse'
              : 'dark:text-slate-200 text-slate-700 dark:bg-slate-800 bg-slate-100 dark:border-slate-700 border-slate-200'
          }`}>
            <Timer className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider">
            <span>Progress: {Math.round(progressPercentage)}%</span>
            <span>Question {questionIndex + 1} of {totalQuestions}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-darkBorder h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Question Panel */}
        <div className="p-6 md:p-8 rounded-2xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder relative overflow-hidden glow-indigo min-h-[14rem] flex flex-col justify-between">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-bold flex items-center justify-center">
                Q
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">
                Technical Query
              </span>
            </div>
            
            {submitting ? (
              <div className="space-y-3 animate-pulse py-4">
                <div className="h-4 bg-slate-300 dark:bg-slate-800 rounded w-full"></div>
                <div className="h-4 bg-slate-300 dark:bg-slate-800 rounded w-5/6"></div>
              </div>
            ) : (
              <p className="text-lg md:text-xl font-medium dark:text-slate-100 text-slate-800 leading-relaxed font-sans">
                {currentQuestion}
              </p>
            )}
          </div>
          
          <div className="absolute right-4 bottom-4 opacity-5 dark:text-white text-slate-900 pointer-events-none">
            <Sparkles className="w-32 h-32" />
          </div>
        </div>

        {/* Input Panel */}
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="relative rounded-2xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder focus-within:border-indigo-500 transition-all overflow-hidden">
            
            {submitting ? (
              <div className="h-48 flex flex-col justify-center items-center gap-3">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-2 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-indigo-400 font-semibold animate-pulse">Evaluating answer with AI...</p>
              </div>
            ) : (
              <>
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Type your structured explanation here... Be specific and feel free to outline code examples or architecture diagrams."
                  rows={8}
                  className="w-full p-6 outline-none bg-transparent dark:text-white text-slate-800 text-sm md:text-base resize-none placeholder-slate-400 dark:placeholder-slate-500 leading-relaxed"
                />

                {/* Speech indicator bar */}
                {isListening && (
                  <div className="px-6 py-2 bg-indigo-500/10 flex items-center gap-2 border-t border-b dark:border-darkBorder border-slate-100 animate-pulse text-indigo-400 text-xs font-semibold">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                    Microphone is active. Speak clearly to dictate your response...
                  </div>
                )}

                {/* Toolbar */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-darkBg/50 border-t dark:border-darkBorder border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-semibold ${
                        isListening
                          ? 'bg-red-500 text-white border-red-500 glow-indigo'
                          : 'dark:border-darkBorder dark:bg-darkCard bg-white border-slate-200 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={isListening ? 'Stop Recording' : 'Start Speech to Text'}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-4 h-4" />
                          Stop Dictation
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          Dictate Response
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!answerText.trim() || submitting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Answer
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </form>

      </div>
    </div>
  );
};

export default Interview;
