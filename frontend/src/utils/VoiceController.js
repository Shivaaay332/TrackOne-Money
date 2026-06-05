import { useEffect, useRef, useState, useCallback } from 'react';

export const useVoiceController = (onResult) => {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech Recognition API not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; 
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e) => { setError(e.error); setIsListening(false); };
    recognition.onresult = (e) => { onResult(e.results[0][0].transcript); };

    recognitionRef.current = recognition;
    return () => { if (recognitionRef.current) recognitionRef.current.abort(); };
  }, [onResult]);

  const startListening = useCallback(() => {
    setError(null);
    if (recognitionRef.current && !isListening) {
      try { recognitionRef.current.start(); } catch (e) { console.error("Voice error", e); }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) recognitionRef.current.stop();
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  return { isListening, toggleListening, error };
};