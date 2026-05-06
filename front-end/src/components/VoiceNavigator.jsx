import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const VoiceNavigator = () => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const navigate = useNavigate();

    React.useEffect(() => {
        const handleKeyDown = (e) => {
            // Ne pas activer si l'utilisateur écrit dans un champ de texte
            const target = e.target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }
            if (e.key && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                if (isListening) {
                    stopRecording();
                } else {
                    startRecording();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isListening]); // Dépendance sur isListening pour savoir s'il faut stopper ou démarrer

    const speak = (text) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);
    };

    const playBeep = (freq = 440, duration = 0.1) => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
            osc.stop(ctx.currentTime + duration);
        } catch (e) { }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                playBeep(400, 0.1);
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                await sendAudioToBackend(audioBlob);
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsListening(true);
            playBeep(600, 0.1);
            speak("Navigator listening");
            console.log("🎙️ Navigator listening...");
        } catch (error) {
            console.error("Mic error:", error);
            speak("I can't access your microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isListening) {
            mediaRecorderRef.current.stop();
            setIsListening(false);
            speak("Processing");
        }
    };

    const sendAudioToBackend = async (audioBlob) => {
        setIsProcessing(true);
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.webm");
        formData.append("field", "navigation");
        formData.append("context", "navigation");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        try {
            console.log("📤 Sending navigation audio to backend...");

            // 1. Essayer Gemini d'abord
            let response = await fetch("http://localhost:8001/gemini-stt", {
                method: "POST",
                body: formData,
                signal: controller.signal,
            });

            let data = await response.json();

            // 2. FALLBACK si Gemini échoue ou renvoie vide
            if (!data.success || !data.text) {
                console.warn("⚠️ Gemini failed for navigation. Falling back to Whisper...");
                const fallbackResponse = await fetch("http://localhost:8001/speech-to-text", {
                    method: "POST",
                    body: formData,
                    signal: controller.signal,
                });
                if (fallbackResponse.ok) {
                    data = await fallbackResponse.json();
                }
            }

            clearTimeout(timeoutId);
            const text = data.text?.toLowerCase() || "";
            console.log(`✨ Command detected: "${text}"`);

            handleNavigation(text);
        } catch (error) {
            console.error("API error:", error);
            if (error.name === 'AbortError') {
                speak("Server too slow.");
            } else {
                speak("Connection error.");
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNavigation = (text) => {
        const t = text.toLowerCase();
        if (t.includes("home") || t.includes("accueil") || t.includes("main")) {
            speak("Navigating to home");
            navigate("/");
        } else if (t.includes("blog")) {
            speak("Navigating to blog");
            navigate("/blog");
        } else if (t.includes("about") || t.includes("propos")) {
            speak("Navigating to about");
            navigate("/about");
        } else if (t.includes("contact")) {
            speak("Navigating to contact");
            navigate("/contact");
        } else if (t.includes("product") || t.includes("produit")) {
            speak("Navigating to product");
            navigate("/produit");
        } else if (t.includes("login") || t.includes("connexion") || t.includes("connect")) {
            speak("Navigating to login");
            navigate("/login");
        } else if (t.includes("registre") || t.includes("inscription") || t.includes("register") || t.includes("signup")) {
            speak("Navigating to register");
            navigate("/registre");
        } else if (t.includes("estimate") || t.includes("estimation") || t.includes("price") || t.includes("prix") || t.includes("pro")) {
            speak("Navigating to price estimation");
            navigate("/estimate");
        } else {
            speak("Command not recognized: " + text);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
            <button
                onClick={isListening ? stopRecording : startRecording}
                className={`btn rounded-circle p-3 ${isListening ? "btn-danger pulse" : isProcessing ? "btn-warning" : "btn-primary"}`}
                style={{
                    width: '60px', height: '60px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', transition: 'all 0.3s ease'
                }}
                disabled={isProcessing}
                title="Click to navigate"
            >
                {isProcessing ? "⏳" : isListening ? "⏹" : "🎤"}
            </button>
            <style>{`
                .pulse { animation: pulse-red 1.5s infinite; }
                @keyframes pulse-red {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
                    70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(255, 0, 0, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
                }
            `}</style>
        </div>
    );
};

export default VoiceNavigator;
