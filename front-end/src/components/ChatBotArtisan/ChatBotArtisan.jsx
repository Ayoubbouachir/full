import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChatBotArtisan.css';

// ─── Spécialités connues (miroir FR de SPECIALTY_SYNONYMS) ───────────────────
const SPECIALTY_SUGGESTIONS = [
    'Plomberie', 'Électricité', 'Peinture', 'Menuiserie', 'Carrelage',
    'Maçonnerie', 'Climatisation', 'Soudure', 'Toiture', 'Jardinage',
    'Vitrage', 'Plâtrerie', 'Ferronnerie', 'Nettoyage', 'Déménagement', 'Chef',
];

// ─── Formater les messages markdown simples ──────────────────────────────────
const formatMessage = (text) => {
    if (!text) return '';
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>');
};

const ChatBotArtisan = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: '🛠️ **Bonjour !** Je suis votre assistant Artisans.\n\nJe peux vous aider à trouver un artisan qualifié.\n\nExemple : "Cherche un plombier à Ariana" ou tapez une spécialité ci-dessous.',
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // ── Envoi vers l'endpoint artisan uniquement ──────────────────────────────
    const sendMessage = async (text) => {
        if (!text.trim()) return;

        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        setShowSuggestions(false);

        try {
            const res = await fetch('http://127.0.0.1:3100/ai-assistant/chat/artisan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });

            const data = await res.json();

            // Afficher les résultats artisans en cards si disponible
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: data.message || '🔍 Aucun résultat.',
                    artisans: data.data || [],
                    type: data.type,
                },
            ]);
        } catch (err) {
            console.error('Artisan chat error:', err);
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: '❌ Erreur de connexion. Vérifiez que le serveur est démarré.' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleSuggestion = (spec) => {
        sendMessage(`Cherche un artisan ${spec}`);
    };

    return (
        <div className="artisan-chatbot-container">
            {isOpen ? (
                <div className="artisan-chat-window">
                    {/* Header */}
                    <div className="artisan-chat-header">
                        <div className="artisan-header-info">
                            <span className="artisan-dot"></span>
                            <div>
                                <h3>🛠️ Trouver un Artisan</h3>
                                <p>Recherche intelligente multilingue</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="artisan-close-btn">×</button>
                    </div>

                    {/* Messages */}
                    <div className="artisan-chat-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`artisan-message-wrapper ${msg.role}`}>
                                {/* Bulle texte */}
                                <div
                                    className={`artisan-message ${msg.role}`}
                                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                                />

                                {/* Cards artisans si résultats */}
                                {msg.artisans && msg.artisans.length > 0 && (
                                    <div className="artisan-cards">
                                        {msg.artisans.map((a, i) => (
                                            <div 
                                                key={i} 
                                                className="artisan-card" 
                                                onClick={() => navigate(`/teamDetail?id=${a._id}`)}
                                                style={{ cursor: 'pointer' }}
                                                title="Voir le profil"
                                            >
                                                <div className="artisan-card-avatar">
                                                    {a.prenom?.[0]}{a.nom?.[0]}
                                                </div>
                                                <div className="artisan-card-info">
                                                    <strong>{a.prenom} {a.nom}</strong>
                                                    <span className="artisan-badge">{a.speciality || 'Artisan'}</span>
                                                    <div className="artisan-meta">
                                                        <span>📞 {a.numTele || 'N/A'}</span>
                                                        <span>📍 {a.address || a.position || 'Tunisie'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Indicateur de chargement */}
                        {loading && (
                            <div className="artisan-message-wrapper assistant">
                                <div className="artisan-message assistant artisan-loading">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}

                        {/* Suggestions spécialités */}
                        {showSuggestions && (
                            <div className="artisan-suggestions">
                                {SPECIALTY_SUGGESTIONS.map(spec => (
                                    <button
                                        key={spec}
                                        className="artisan-suggestion-chip"
                                        onClick={() => handleSuggestion(spec)}
                                    >
                                        {spec}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="artisan-chat-input">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder='Ex: "plombier à Ariana" ou "sabbak"'
                            autoFocus
                        />
                        <button type="submit" disabled={loading || !input.trim()}>
                            ➤
                        </button>
                    </form>
                </div>
            ) : (
                <button className="artisan-chat-toggle" onClick={() => setIsOpen(true)} title="Trouver un artisan">
                    🔧
                    <span className="artisan-badge-toggle">Artisan</span>
                </button>
            )}
        </div>
    );
};

export default ChatBotArtisan;
