import React, { useState, useRef, useCallback, useEffect } from "react";
import { useCart } from "../context/CartContext";

const VoiceProductSearch = () => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [lastProduct, setLastProduct] = useState(null);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationType, setNotificationType] = useState("info"); // info, success, error, warning
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const notificationTimerRef = useRef(null);
    const { addToCart } = useCart();

    // ============ SPEECH SYNTHESIS (Voice Feedback) ============
    const speak = useCallback((text, lang = "fr-FR") => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }, []);

    // ============ NOTIFICATION HELPERS ============
    const showNotif = useCallback((message, type = "info", duration = 5000) => {
        setStatusMessage(message);
        setNotificationType(type);
        setShowNotification(true);
        if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = setTimeout(() => {
            setShowNotification(false);
        }, duration);
    }, []);

    // ============ BEEP SOUND ============
    const playBeep = useCallback((freq = 440, duration = 0.15) => {
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
        } catch (e) { /* ignore */ }
    }, []);

    // ============ START RECORDING ============
    const startRecording = useCallback(async () => {
        if (isListening || isProcessing) return;
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
                await sendAudioForProductSearch(audioBlob);
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsListening(true);
            playBeep(800, 0.15);
            showNotif("🎤 Écoute en cours... Dites un nom de produit", "info");
            speak("Écoute en cours", "fr-FR");
            console.log("🎤 [ProductSearch] Listening...");
        } catch (error) {
            console.error("Mic error:", error);
            showNotif("❌ Impossible d'accéder au microphone", "error");
            speak("Impossible d'accéder au microphone", "fr-FR");
        }
    }, [isListening, isProcessing, playBeep, showNotif, speak]);

    // ============ STOP RECORDING ============
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isListening) {
            mediaRecorderRef.current.stop();
            setIsListening(false);
            showNotif("⏳ Traitement en cours...", "info");
        }
    }, [isListening, showNotif]);

    // ============ SEND AUDIO TO BACKEND ============
    // Using a ref-based approach to avoid AbortController issues with React re-renders
    const addToCartRef = useRef(addToCart);
    const showNotifRef = useRef(showNotif);
    const speakRef = useRef(speak);

    useEffect(() => { addToCartRef.current = addToCart; }, [addToCart]);
    useEffect(() => { showNotifRef.current = showNotif; }, [showNotif]);
    useEffect(() => { speakRef.current = speak; }, [speak]);

    const sendAudioForProductSearch = useCallback(async (audioBlob) => {
        setIsProcessing(true);
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.webm");

        try {
            console.log("📤 [ProductSearch] Sending audio to backend...");

            const response = await fetch("http://localhost:8001/product-voice-search", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            console.log("📦 [ProductSearch] Response:", data);

            if (!data.success) {
                showNotifRef.current(`❌ ${data.message || "Erreur de reconnaissance"}`, "error");
                speakRef.current("Je n'ai pas compris. Réessayez.", "fr-FR");
                return;
            }

            const { intent, matched_product, available, product_name } = data;

            if (!matched_product) {
                // Product not found
                showNotifRef.current(`❌ Produit "${product_name}" non trouvé`, "error", 6000);
                speakRef.current(`Le produit ${product_name} n'a pas été trouvé.`, "fr-FR");
                return;
            }

            if (intent === "search") {
                // User is searching for a product
                setLastProduct(matched_product);
                if (available) {
                    showNotifRef.current(
                        `✅ "${matched_product.nomP}" est disponible ! (${matched_product.prix}$) — Dites "ajouter au panier" pour l'ajouter.`,
                        "success",
                        8000
                    );
                    speakRef.current(`Le produit ${matched_product.nomP} est disponible. Son prix est de ${matched_product.prix} dollars. Dites ajouter au panier pour l'ajouter.`, "fr-FR");
                } else {
                    showNotifRef.current(
                        `⚠️ "${matched_product.nomP}" trouvé mais en rupture de stock`,
                        "warning",
                        6000
                    );
                    speakRef.current(`Le produit ${matched_product.nomP} est en rupture de stock.`, "fr-FR");
                }
            } else if (intent === "add_to_cart") {
                // User wants to add to cart
                if (available) {
                    addToCartRef.current({
                        _id: matched_product._id,
                        nomP: matched_product.nomP,
                        prix: matched_product.prix,
                        imagePUrl: matched_product.imagePUrl,
                        categorie: matched_product.categorie,
                        description: matched_product.description,
                    });
                    setLastProduct(null);
                    showNotifRef.current(
                        `🛒 "${matched_product.nomP}" ajouté au panier avec succès !`,
                        "success",
                        6000
                    );
                    speakRef.current(`${matched_product.nomP} a été ajouté au panier.`, "fr-FR");
                } else {
                    showNotifRef.current(
                        `⚠️ "${matched_product.nomP}" est en rupture de stock, impossible de l'ajouter`,
                        "warning",
                        6000
                    );
                    speakRef.current(`Le produit ${matched_product.nomP} est en rupture de stock. Impossible de l'ajouter au panier.`, "fr-FR");
                }
            }
        } catch (error) {
            console.error("❌ [ProductSearch] Error:", error);
            showNotifRef.current("❌ Erreur de connexion au serveur", "error");
            speakRef.current("Erreur de connexion.", "fr-FR");
        } finally {
            setIsProcessing(false);
        }
    }, []);

    // ============ KEY HANDLER (J key) ============
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't activate if user is typing in a text field
            const target = e.target;
            if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
                return;
            }
            if (e.key && e.key.toLowerCase() === "j") {
                e.preventDefault();
                if (isListening) {
                    stopRecording();
                } else {
                    startRecording();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isListening, startRecording, stopRecording]);

    // ============ NOTIFICATION COLORS ============
    const getNotificationStyle = () => {
        const base = {
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: showNotification ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(-120px)",
            zIndex: 10001,
            padding: "16px 28px",
            borderRadius: "16px",
            fontSize: "15px",
            fontWeight: "500",
            maxWidth: "600px",
            width: "auto",
            textAlign: "center",
            transition: "all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            letterSpacing: "0.3px",
            lineHeight: "1.5",
        };

        switch (notificationType) {
            case "success":
                return { ...base, background: "linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" };
            case "error":
                return { ...base, background: "linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(185, 28, 28, 0.95))", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" };
            case "warning":
                return { ...base, background: "linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95))", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" };
            default:
                return { ...base, background: "linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.95))", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" };
        }
    };

    return (
        <>
            {/* Notification Banner */}
            <div style={getNotificationStyle()}>
                {statusMessage}
            </div>

            {/* Floating Button */}
            <div style={{ position: "fixed", bottom: "100px", right: "30px", zIndex: 10000 }}>
                <button
                    onClick={isListening ? stopRecording : startRecording}
                    disabled={isProcessing}
                    title="Appuyez sur J ou cliquez pour rechercher un produit par la voix"
                    style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        border: "none",
                        cursor: isProcessing ? "wait" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        transition: "all 0.3s ease",
                        background: isListening
                            ? "linear-gradient(135deg, #ef4444, #dc2626)"
                            : isProcessing
                            ? "linear-gradient(135deg, #f59e0b, #d97706)"
                            : "linear-gradient(135deg, #10b981, #059669)",
                        color: "#fff",
                        boxShadow: isListening
                            ? "0 0 0 0 rgba(239, 68, 68, 0.7)"
                            : "0 4px 15px rgba(0,0,0,0.3)",
                        animation: isListening ? "pulse-product 1.5s infinite" : "none",
                    }}
                >
                    {isProcessing ? "⏳" : isListening ? "⏹" : "🔍"}
                </button>

                {/* Key hint label */}
                <div
                    style={{
                        position: "absolute",
                        bottom: "-24px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        color: "#fff",
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        whiteSpace: "nowrap",
                        fontFamily: "'Inter', sans-serif",
                        letterSpacing: "0.5px",
                    }}
                >
                   
                </div>
            </div>

            {/* Pulse Animation */}
            <style>{`
                @keyframes pulse-product {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: scale(1.1); box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>
        </>
    );
};

export default VoiceProductSearch;
