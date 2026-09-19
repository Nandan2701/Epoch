/**
 * Cadence Voice Engine
 * Real-time voice-to-text dictation utilizing native Web Speech API alongside OS-level shortcuts.
 */
(function() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const CadenceSpeech = {
    recognition: null,
    isListening: false,
    activeTextarea: null,
    onStateChange: null,

    init: function() {
      if (!SpeechRecognition) {
        console.warn('Web Speech API not supported in this browser environment.');
        return false;
      }

      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          this.isListening = true;
          if (this.onStateChange) this.onStateChange(true);
        };

        this.recognition.onend = () => {
          this.isListening = false;
          if (this.onStateChange) this.onStateChange(false);
        };

        this.recognition.onerror = (event) => {
          console.warn('Speech recognition error:', event.error);
          this.isListening = false;
          if (this.onStateChange) this.onStateChange(false, event.error);
        };

        this.recognition.onresult = (event) => {
          if (!this.activeTextarea) return;

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
            // Append formatted transcribed text with proper spacing
            const currentVal = this.activeTextarea.value;
            const needsSpace = currentVal.length > 0 && !currentVal.endsWith(' ') && !currentVal.endsWith('\n');
            this.activeTextarea.value = currentVal + (needsSpace ? ' ' : '') + finalTranscript.trim() + ' ';
            
            // Dispatch input event to trigger auto-resize and auto-save
            this.activeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
          }
        };

        return true;
      } catch (err) {
        console.error('Error initializing Web Speech API:', err);
        return false;
      }
    },

    toggle: function(textareaElement) {
      this.activeTextarea = textareaElement;

      if (!this.recognition) {
        const initialized = this.init();
        if (!initialized) {
          alert('Native in-browser microphone dictation requires Chrome/Edge.\n\nTip: You can press Windows Key + H (or Wispr Flow / Mac Dictation) anywhere in this box to voice-type with zero friction!');
          return;
        }
      }

      if (this.isListening) {
        this.stop();
      } else {
        this.start();
      }
    },

    start: function() {
      if (this.recognition && !this.isListening) {
        try {
          this.recognition.start();
        } catch (e) {
          console.warn('Speech start warning:', e);
        }
      }
    },

    stop: function() {
      if (this.recognition && this.isListening) {
        try {
          this.recognition.stop();
        } catch (e) {
          console.warn('Speech stop warning:', e);
        }
      }
    }
  };

  window.CadenceSpeech = CadenceSpeech;
})();
