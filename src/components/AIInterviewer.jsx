// src/components/AIInterviewer.jsx
import React, { useEffect } from 'react';
import AIAvatar from './AIAvatar';
import { ttsService } from '../services/ttsService';

/**
 * AIInterviewer component displays the AI avatar and speaks the current question.
 * Props:
 *   - question: string – the current question text to display and speak.
 */
const AIInterviewer = ({ question = '', avatarState = 'idle' }) => {
  // Speak the question whenever it changes.
  useEffect(() => {
    if (question) {
      ttsService.speak(question);
    }
  }, [question]);

  return (
    <div className="ai-interviewer w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-2xl p-6 shadow-inner border dark:border-slate-700 border-slate-300 relative">
      <div className="absolute top-4 left-4 bg-indigo-500/20 text-indigo-400 text-xs font-bold px-3 py-1.5 rounded-full border border-indigo-500/30">
        AI Interviewer
      </div>
      
      <div className="flex-1 flex items-center justify-center w-full max-w-sm max-h-64 mb-6">
        <AIAvatar state={avatarState} />
      </div>
      
      <div className="question-text w-full text-center bg-slate-800/80 p-4 rounded-xl border border-slate-700 min-h-[4rem] flex items-center justify-center">
        <p className="text-slate-200 font-medium text-lg">
          {question || 'Waiting to start interview...'}
        </p>
      </div>
    </div>
  );
};

export default AIInterviewer;
