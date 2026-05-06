import { useRef, useState, useEffect } from "react";

export default function VoiceInput({ value, onChange, fieldName = "texte" }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const lastSpokenRef = useRef(null);

  // Audio Context pour les bips
  const playBeep = (freq = 440, duration = 0.1) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = freq;
      osc.type = "sine";

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error("Audio Context Error", e);
    }
  };

  const speak = (text, onEndCallback) => {
    if (!window.speechSynthesis) {
      if (onEndCallback) onEndCallback();
      return;
    }

    // Cancel current to start fresh
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.volume = 1.0;
    u.rate = 1.0;

    setTimeout(() => {
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.includes("en-US") || v.lang.includes("en-GB"));
      if (englishVoice) u.voice = englishVoice;

      if (onEndCallback) u.onend = onEndCallback;
      window.speechSynthesis.speak(u);
    }, 100);
  };

  useEffect(() => {
    if (window.speechSynthesis) {
      const load = () => { window.speechSynthesis.getVoices(); };
      load();
      window.speechSynthesis.onvoiceschanged = load;

      const unlock = () => {
        const u = new SpeechSynthesisUtterance("");
        window.speechSynthesis.speak(u);
        window.removeEventListener("click", unlock);
      };
      window.addEventListener("click", unlock);
      return () => window.removeEventListener("click", unlock);
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      launchRecorder(stream);
      playBeep(600, 0.1);
      speak(`Speak ${fieldName}`);
    } catch (err) {
      console.error("Mic Access Error:", err);
      speak("Please allow microphone access.");
    }
  };

  const launchRecorder = (stream) => {
    try {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        playBeep(400, 0.1);
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        if (audioBlob.size < 100) {
          speak("I didn't hear anything.");
        } else {
          await sendAudioToBackend(audioBlob);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error("Recorder Error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      speak("Processing.");
    }
  };

  const sendAudioToBackend = async (audioBlob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");

    // Use fieldName as context for Gemini (email, password, etc)
    const context = fieldName.toLowerCase().includes("email") ? "email" :
      fieldName.toLowerCase().includes("password") ? "password" : "text";

    formData.append("context", context);
    formData.append("field", context); // For Whisper fallback if needed

    try {
      console.log(`📤 Sending audio to Backend (${context})...`);

      // 1. Try Gemini first (more accurate for emails/passwords)
      let response = await fetch("http://localhost:8001/gemini-stt", {
        method: "POST",
        body: formData,
      });

      let data = await response.json();

      // 2. Fallback to Whisper if Gemini failed or returned nothing
      if (!data.success || !data.text) {
        console.warn("⚠️ Gemini STT failed. Falling back to Whisper...");
        const whisperResponse = await fetch("http://localhost:8001/speech-to-text", {
          method: "POST",
          body: formData,
        });
        if (whisperResponse.ok) {
          data = await whisperResponse.json();
        }
      }

      const text = data.text;
      if (text) {
        onChange(text);
        speak(`I wrote: ${text}`);
      } else {
        speak("I didn't hear anything.");
      }
    } catch (error) {
      console.error("Voice API Error:", error);
      speak("Connection error.");
    } finally {
      setIsProcessing(false);
    }
  };

  const buttonStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    boxShadow: isListening ? "0 0 10px red" : "none",
    animation: isListening ? "pulse 1.5s infinite" : "none"
  };

  return (
    <div style={{ marginTop: 5, marginBottom: 15 }}>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(255, 0, 0, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
          }
        `}
      </style>
      <button
        type="button"
        className={`btn ${isListening ? "btn-danger" : "btn-primary"}`}
        onClick={isListening ? stopRecording : startRecording}
        onMouseEnter={() => {
          if (!isListening && !isProcessing && lastSpokenRef.current !== fieldName) {
            lastSpokenRef.current = fieldName;
          }
        }}
        onMouseLeave={() => { lastSpokenRef.current = null; }}
        disabled={isProcessing}
        style={buttonStyle}
      >
        {isProcessing ? "⏳" : isListening ? "⏹ Stop" : "🎤 Speak"}
      </button>
      {isListening && <small className="text-muted ms-2" style={{ color: 'red' }}>Recording...</small>}
    </div>
  );
}
