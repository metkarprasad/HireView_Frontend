// src/services/ttsService.js
/**
 * TTS Service abstraction.
 * Currently uses the browser's native SpeechSynthesis API.
 * Exported as an object implementing `speak(text, onEnd?)`.
 * Future providers can replace this file without changing callers.
 */
export const ttsService = {
  speak(text, options, onEnd) {
    if (!window.speechSynthesis) {
      console.warn('SpeechSynthesis API not supported');
      if (onEnd) onEnd();
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    
    // Configure voice if requested
    if (options && options.voiceURI) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.voiceURI === options.voiceURI);
      if (selectedVoice) {
        utter.voice = selectedVoice;
      }
    }
    
    // Configure speed if requested
    if (options && options.speed) {
      utter.rate = options.speed;
    }

    utter.onend = () => {
      if (onEnd) onEnd();
    };
    window.speechSynthesis.speak(utter);
  },
  cancel() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  },
};
