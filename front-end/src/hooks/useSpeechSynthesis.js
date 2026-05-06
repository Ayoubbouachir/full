import { useState, useRef, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'fullstakers_speech_synthesis_prefs';

export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

function getStoredPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return {
      voiceUri: p.voiceUri ?? null,
      rate: Math.min(2, Math.max(0.5, Number(p.rate) || 1)),
      pitch: Math.min(2, Math.max(0.5, Number(p.pitch) || 1)),
      muted: !!p.muted,
    };
  } catch {
    return null;
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {}
}

/**
 * useSpeechSynthesis – Web Speech API SpeechSynthesis
 * Persists voice, rate, pitch, muted in localStorage.
 * Respects prefers-reduced-motion for auto-speak.
 */
export function useSpeechSynthesis(options = {}) {
  const { autoSpeakOnMessage = true } = options;

  const [voices, setVoices] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMutedState] = useState(() => getStoredPrefs()?.muted ?? false);
  const [voiceUri, setVoiceUriState] = useState(() => getStoredPrefs()?.voiceUri ?? null);
  const [rate, setRateState] = useState(() => getStoredPrefs()?.rate ?? 1);
  const [pitch, setPitchState] = useState(() => getStoredPrefs()?.pitch ?? 1);
  const lastSpokenTextRef = useRef('');

  const supported = isSpeechSynthesisSupported();
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  useEffect(() => {
    if (!synth) return;
    const loadVoices = () => {
      const list = synth.getVoices();
      setVoices(list.filter((v) => v.lang.startsWith('fr') || v.lang.startsWith('en')));
    };
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
    return () => {
      synth.onvoiceschanged = null;
    };
  }, [synth]);

  const persistPrefs = useCallback((updates) => {
    const prev = getStoredPrefs() || { voiceUri: null, rate: 1, pitch: 1, muted: false };
    const next = { ...prev, ...updates };
    savePrefs(next);
    if (updates.muted !== undefined) setMutedState(updates.muted);
    if (updates.voiceUri !== undefined) setVoiceUriState(updates.voiceUri);
    if (updates.rate !== undefined) setRateState(updates.rate);
    if (updates.pitch !== undefined) setPitchState(updates.pitch);
  }, []);

  const speak = useCallback(
    (text, optionsOverride = {}) => {
      if (!supported || !synth || !text || typeof text !== 'string') return;
      const prefs = getStoredPrefs() || {};
      const force = optionsOverride.force === true;
      if (prefs.muted && !force) return;

      synth.cancel();
      const u = new SpeechSynthesisUtterance(text.trim());
      u.rate = optionsOverride.rate ?? prefs.rate ?? 1;
      u.pitch = optionsOverride.pitch ?? prefs.pitch ?? 1;
      const voice = voices.find((v) => v.voiceURI === (prefs.voiceUri || voiceUri)) || voices.find((v) => v.lang.startsWith('fr')) || voices[0];
      if (voice) u.voice = voice;
      u.lang = 'fr-FR';
      u.onend = () => setIsSpeaking(false);
      u.onstart = () => setIsSpeaking(true);
      u.onerror = () => setIsSpeaking(false);
      lastSpokenTextRef.current = text.trim();
      synth.speak(u);
    },
    [supported, synth, voices, voiceUri]
  );

  const stop = useCallback(() => {
    if (synth) synth.cancel();
    setIsSpeaking(false);
  }, [synth]);

  const replay = useCallback(() => {
    if (lastSpokenTextRef.current) speak(lastSpokenTextRef.current, { force: true });
  }, [speak]);

  const setMuted = useCallback(
    (value) => {
      setMutedState(!!value);
      persistPrefs({ muted: !!value });
      if (!!value) stop();
    },
    [persistPrefs, stop]
  );

  const setVoiceUri = useCallback(
    (uri) => {
      setVoiceUriState(uri);
      persistPrefs({ voiceUri: uri });
    },
    [persistPrefs]
  );

  const setRate = useCallback(
    (r) => {
      const val = Math.min(2, Math.max(0.5, Number(r) || 1));
      setRateState(val);
      persistPrefs({ rate: val });
    },
    [persistPrefs]
  );

  const setPitch = useCallback(
    (p) => {
      const val = Math.min(2, Math.max(0.5, Number(p) || 1));
      setPitchState(val);
      persistPrefs({ pitch: val });
    },
    [persistPrefs]
  );

  const speakIfAllowed = useCallback(
    (text) => {
      if (!autoSpeakOnMessage || !text) return;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion) return;
      if (getStoredPrefs()?.muted) return;
      speak(text);
    },
    [autoSpeakOnMessage, speak]
  );

  return {
    isSupported: supported,
    isSpeaking,
    voices,
    voiceUri,
    rate,
    pitch,
    muted,
    speak,
    stop,
    replay,
    setMuted,
    setVoiceUri,
    setRate,
    setPitch,
    speakIfAllowed,
    lastSpokenText: lastSpokenTextRef.current,
  };
}
