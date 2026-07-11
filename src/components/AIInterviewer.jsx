// src/components/AIInterviewer.jsx
import React, { useEffect } from 'react';
import AIAvatar from './AIAvatar';
import { ttsService } from '../services/ttsService';

/**
 * AIInterviewer component displays the AI avatar and speaks the current question.
 * Props:
 *   - question: string – the current question text to display and speak.
 */
const AIInterviewer = ({ question = '' }) => {
  // Speak the question whenever it changes.
  useEffect(() => {
    if (question) {
      ttsService.speak(question);
    }
  }, [question]);

  return (
    <div className="ai-interviewer">
      <AIAvatar state={question ? 'speaking' : 'idle'} />
      <div className="question-text">
        {question || 'Waiting for the next question...'}
      </div>
    </div>
  );
};

export default AIInterviewer;
