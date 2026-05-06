import React, { useState, useRef, useEffect } from 'react';
import API_BASE_URL from '../../api.config';

const API_BASE = API_BASE_URL;
const MODEL_URL_LOCAL = process.env.PUBLIC_URL + '/models';
const MODEL_URL_CDN = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';

/**
 * Charge les modèles face-api.js (CDN puis fallback local) et retourne l'API, ou null en cas d'échec.
 */
async function loadFaceApi() {
    const mod = await import('face-api.js').catch((e) => {
        console.error('Import face-api.js:', e);
        return null;
    });
    if (!mod) return null;
    const faceapi = mod.default || mod;
    for (const baseUrl of [MODEL_URL_CDN, MODEL_URL_LOCAL]) {
        try {
            await faceapi.nets.ssdMobilenetv1.loadFromUri(baseUrl);
            await faceapi.nets.tinyFaceDetector.loadFromUri(baseUrl);
            await faceapi.nets.faceLandmark68Net.loadFromUri(baseUrl);
            await faceapi.nets.faceRecognitionNet.loadFromUri(baseUrl);
            return faceapi;
        } catch (e) {
            console.warn('Modèles non chargés depuis', baseUrl, e?.message || e);
        }
    }
    return null;
}

/** Dessine la frame vidéo actuelle dans un canvas pour une détection stable */
function captureVideoFrame(video) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0);
    return canvas;
}

/** Attendre que la vidéo ait des frames utilisables */
function waitForVideoReady(video, maxWaitMs = 4000) {
    return new Promise((resolve) => {
        const check = () => {
            if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
                resolve();
                return true;
            }
            return false;
        };
        if (check()) return;
        const onReady = () => {
            video.removeEventListener('loadeddata', onReady);
            video.removeEventListener('playing', onReady);
            setTimeout(resolve, 200);
        };
        video.addEventListener('loadeddata', onReady);
        video.addEventListener('playing', onReady);
        setTimeout(resolve, maxWaitMs);
    });
}

async function runDetectorsOnInput(faceApi, input) {
    const detectors = [
        () => faceApi.detectSingleFace(input, new faceApi.SsdMobilenetv1Options({ minConfidence: 0.25 })),
        () => faceApi.detectSingleFace(input, new faceApi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.25 })),
    ];
    for (const detect of detectors) {
        try {
            const detection = await detect()
                .withFaceLandmarks()
                .withFaceDescriptor();
            if (detection?.descriptor) return Array.from(detection.descriptor);
        } catch (e) {
            console.warn('Détecteur:', e?.message || e);
        }
    }
    return null;
}

/**
 * Capture un descripteur facial 128D depuis la vidéo.
 * Utilise un canvas (frame figée) puis essaie SSD puis TinyFace avec seuils bas.
 */
async function getFaceDescriptor(video, faceApi) {
    if (!video || !faceApi) return null;
    await waitForVideoReady(video);
    for (let attempt = 0; attempt < 3; attempt++) {
        const input = captureVideoFrame(video);
        const descriptor = await runDetectorsOnInput(faceApi, input);
        if (descriptor) return descriptor;
        await new Promise((r) => setTimeout(r, 300));
    }
    return null;
}

function FaceAuth({ mode = 'login', onSuccess, onCancel, email, password, captureOnly = false }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const autoDetectIntervalRef = useRef(null);
    const processingRef = useRef(false);
    const backendAvailableRef = useRef(true); // Track if backend is available
    const [status, setStatus] = useState('loading'); // loading | ready | capturing | error | done
    const [message, setMessage] = useState('');
    const [faceApi, setFaceApi] = useState(null);
    const [failureCount, setFailureCount] = useState(0);
    const [isCooldown, setIsCooldown] = useState(false);

    useEffect(() => {
        let cancelled = false;
        loadFaceApi().then((api) => {
            if (!cancelled) {
                setFaceApi(api);
                setStatus(api ? 'ready' : 'error');
                setMessage(api ? '' : 'Modèles non chargés. Ajoutez les fichiers dans public/models (voir README).');
            }
        });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (status !== 'ready' || !faceApi || !videoRef.current) return;
        const video = videoRef.current;
        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
            .then((stream) => {
                streamRef.current = stream;
                video.srcObject = stream;
                video.play();
            })
            .catch((e) => {
                setStatus('error');
                setMessage('Accès à la caméra refusé ou indisponible.');
            });
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
        };
    }, [status, faceApi]);

    // Helper pour centraliser l'appel API (réduit la complexité cognitive)
    const performAuthAction = async (descriptor, startMsg) => {
        setMessage(startMsg);
        setStatus('capturing');
        try {
            if (captureOnly) {
                onSuccess && onSuccess({ descriptor });
                setStatus('done');
                return;
            }

            const endpoint = mode === 'login' ? '/auth/login-face' : '/auth/register-face';
            const body = mode === 'login' ? { descriptor } : { email, password, descriptor };

            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.status === 404) {
                backendAvailableRef.current = false;
                setMessage('Fonctionnalité de reconnaissance faciale non disponible sur le serveur.');
                setStatus('error');
                return;
            }

            const data = await res.json();
            if (!res.ok) {
                if (res.status === 401) {
                    setFailureCount(prev => prev + 1);
                    setIsCooldown(true);
                    setTimeout(() => setIsCooldown(false), 3000); // 3s cooldown after 401
                }
                throw new Error(data.message || `Échec ${mode === 'login' ? 'connexion' : 'enregistrement'}`);
            }

            setFailureCount(0);
            onSuccess && onSuccess(data);
            setStatus('done');
        } catch (e) {
            setMessage(e.message || 'Erreur');
            setStatus('ready');
        }
    };

    // Détection automatique en continu
    useEffect(() => {
        if (status !== 'ready' || !faceApi || !videoRef.current || !backendAvailableRef.current || isCooldown || failureCount >= 5) return;
        
        const video = videoRef.current;
        const runAutoDetect = async () => {
            if (processingRef.current || video.readyState < 2 || video.videoWidth === 0) return;
            if (!backendAvailableRef.current && !captureOnly) return;
            if (isCooldown || failureCount >= 5) return;
            
            processingRef.current = true;
            const descriptor = await getFaceDescriptor(video, faceApi);
            processingRef.current = false;

            if (!descriptor) return;

            if (autoDetectIntervalRef.current) {
                clearInterval(autoDetectIntervalRef.current);
                autoDetectIntervalRef.current = null;
            }

            const msg = mode === 'login' ? 'Visage détecté, connexion...' : 'Visage détecté, enregistrement...';
            await performAuthAction(descriptor, msg);
        };

        autoDetectIntervalRef.current = setInterval(runAutoDetect, 1500);
        return () => {
            if (autoDetectIntervalRef.current) {
                clearInterval(autoDetectIntervalRef.current);
                autoDetectIntervalRef.current = null;
            }
        };
    }, [status, faceApi, mode, email, password, captureOnly, isCooldown, failureCount]);

    const handleCapture = async () => {
        if (!faceApi || !videoRef.current) return;
        setStatus('capturing');
        setMessage('Détection du visage...');
        
        const descriptor = await getFaceDescriptor(videoRef.current, faceApi);
        if (!descriptor) {
            setMessage('Aucun visage détecté. Placez-vous face à la caméra.');
            setStatus('ready');
            return;
        }

        const msg = mode === 'login' ? 'Connexion...' : 'Enregistrement...';
        await performAuthAction(descriptor, msg);
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
        }
    };

    useEffect(() => () => stopCamera(), []);

    if (status === 'loading') {
        return (
            <p style={{ padding: '1rem' }} role="status" aria-live="polite">
                Chargement des modèles de reconnaissance faciale...
            </p>
        );
    }
    if (status === 'error') {
        return (
            <div style={{ padding: '1rem', textAlign: 'center' }} role="alert">
                <p style={{ color: '#c00' }}>{message}</p>
                {onCancel && (
                    <button type="button" className="main-btn" onClick={onCancel} aria-label="Retour au formulaire">
                        Retour
                    </button>
                )}
            </div>
        );
    }

    return (
        <div style={{ padding: '1rem', textAlign: 'center' }} role="region" aria-label="Reconnaissance faciale">
            <p style={{ marginBottom: '0.5rem', fontSize: '14px', color: '#666' }}>
                {mode === 'login'
                    ? 'Placez votre visage face à la caméra. La détection est automatique.'
                    : 'Placez votre visage face à la caméra. Votre visage sera enregistré automatiquement.'}
            </p>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    width={320}
                    height={240}
                    style={{ borderRadius: '8px', background: '#000', transform: 'scaleX(-1)' }}
                    aria-label="Flux de la caméra pour la reconnaissance du visage"
                    title="Caméra"
                />
            </div>
            <div>
                {failureCount >= 5 ? (
                    <button
                        type="button"
                        className="main-btn"
                        onClick={() => {
                            setFailureCount(0);
                            setIsCooldown(false);
                            setMessage('Réessai de la détection...');
                        }}
                    >
                        Réessayer la détection
                    </button>
                ) : (
                    <button
                        type="button"
                        className="main-btn"
                        onClick={handleCapture}
                        disabled={status === 'capturing' || status === 'done' || isCooldown}
                        title="Déclencher la capture manuellement"
                        aria-label={status === 'capturing' ? 'Capture en cours' : status === 'done' ? 'Terminé' : 'Capturer maintenant'}
                    >
                        {status === 'capturing' ? '...' : status === 'done' ? 'OK' : 'Capturer maintenant'}
                    </button>
                )}
                {onCancel && status !== 'done' && (
                    <button type="button" className="main-btn" style={{ marginLeft: '8px', background: '#666' }} onClick={onCancel} aria-label="Annuler et retour">
                        Annuler
                    </button>
                )}
            </div>
            <p
                role="status"
                aria-live="polite"
                aria-atomic="true"
                style={{ marginTop: '0.5rem', fontSize: '13px', minHeight: '1.2em' }}
            >
                {message || (status === 'ready' ? 'Détection automatique en cours...' : '')}
            </p>
        </div>
    );
}

export default FaceAuth;
