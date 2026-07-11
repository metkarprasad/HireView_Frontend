// src/services/sttService.js
/**
 * STT Service abstraction.
 * Uses the browser Web Speech API (SpeechRecognition) for live speech-to-text.
 * Exposes `start(onResult, onEnd)` and `stop()` methods.
 * Future implementations can replace with cloud providers.
 */
export const sttService = {
  recognition: null,
  start(onResult, onEnd) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech Recognition API not supported');
      if (onEnd) onEnd();
      return;
    }
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal && onResult) {
          onResult(transcript.trim());
          transcript = '';
        }
      }
    };
    this.recognition.onend = () => {
      if (onEnd) onEnd();
    };
    this.recognition.start();
  },
  stop() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
  },
};
