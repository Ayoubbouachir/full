import { useState, useRef, useCallback, useEffect } from 'react';

const SpeechRecognitionAPI =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

/**
 * @returns {boolean}
 */
export function isSpeechRecognitionSupported() {
  return !!SpeechRecognitionAPI;
}

const DEFAULT_OPTIONS = {
  lang: 'fr-FR',
  continuous: true,
  interimResults: true,
  maxAlternatives: 1,
};

/**
 * useSpeechRecognition – Web Speech API SpeechRecognition
 * @param {Object} options
 * @param {string} [options.lang='fr-FR']
 * @param {boolean} [options.continuous=true]
 * @param {boolean} [options.interimResults=true]
 * @param {(text: string, isFinal: boolean) => void} [options.onResult] – interim + final transcripts
 * @param {(text: string) => void} [options.onFinal] – only final transcript (e.g. fill input)
 * @param {boolean} [options.autoSendOnFinal=false] – if true, call onAutoSend(text) when final
 * @param {(text: string) => void} [options.onAutoSend] – called when autoSendOnFinal and final result
 */
export function useSpeechRecognition(options = {}) {
  const {
    lang = DEFAULT_OPTIONS.lang,
    continuous = DEFAULT_OPTIONS.continuous,
    interimResults = DEFAULT_OPTIONS.interimResults,
    onResult,
    onFinal,
    autoSendOnFinal = false,
    onAutoSend,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [status, setStatus] = useState('idle'); // idle | listening | unsupported | denied | error
  const [errorMessage, setErrorMessage] = useState(null);
  const recognitionRef = useRef(null);

  const supported = isSpeechRecognitionSupported();

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {
      // ignore
    }
    recognitionRef.current = null;
    setIsListening(false);
    setLiveTranscript('');
    setStatus('idle');
  }, []);

  const startListening = useCallback(() => {
    if (!supported) {
      setStatus('unsupported');
      setErrorMessage('Reconnaissance vocale non supportée dans ce navigateur.');
      return;
    }
    setErrorMessage(null);
    setStatus('listening');
    setLiveTranscript('');

    try {
      const Recognition = SpeechRecognitionAPI;
      const recognition = new Recognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;
      recognition.maxAlternatives = options.maxAlternatives ?? DEFAULT_OPTIONS.maxAlternatives;

      recognition.onstart = () => {
        setIsListening(true);
        setStatus('listening');
      };

      recognition.onend = () => {
        setIsListening(false);
        if (recognitionRef.current === recognition) {
          setStatus('idle');
          setLiveTranscript('');
        }
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setStatus('denied');
          setErrorMessage('Microphone autorisation refusée.');
        } else if (event.error === 'no-speech') {
          setStatus('idle');
          setLiveTranscript('');
        } else {
          setStatus('error');
          setErrorMessage(event.error || 'Erreur reconnaissance vocale.');
        }
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onresult = (event) => {
        let interim = '';
        let finalParts = [];
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = (result[0]?.transcript || '').trim();
          if (result.isFinal) {
            if (text) finalParts.push(text);
          } else {
            interim += text;
          }
        }
        const finalTextRaw = finalParts.join(' ').trim();
        const finalText = typeof finalTextRaw === 'string' ? finalTextRaw : String(finalTextRaw ?? '');
        const display = finalText ? `${finalText} ${interim}`.trim() : interim.trim();
        setLiveTranscript(display);
        if (onResult) {
          if (finalText) onResult(finalText, true);
          if (interim) onResult(interim, false);
        }
        if (finalText) {
          if (onFinal) onFinal(finalText);
          if (autoSendOnFinal && onAutoSend) onAutoSend(finalText);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'Impossible de démarrer la reconnaissance.');
      setIsListening(false);
    }
  }, [supported, lang, continuous, interimResults, onResult, onFinal, autoSendOnFinal, onAutoSend]);

  const toggle = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isSupported: supported,
    isListening,
    liveTranscript,
    status,
    errorMessage,
    startListening,
    stopListening,
    toggle,
  };
}
