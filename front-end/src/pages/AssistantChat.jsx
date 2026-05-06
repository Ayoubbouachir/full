import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChatAssistant from '../components/ChatAssistant/ChatAssistant';
import './AIFeatures.css';
import './AssistantChat.css';

const AssistantChat = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(stored));
  }, [navigate]);

  return (
    <div className="ai-features-page assistant-chat-page">
      <div className="ai-features-container assistant-chat-container">
        <header className="ai-hero">
          <span className="ai-hero-badge">Assistant avec mémoire</span>
          <h1>Assistant IA Fullstakers</h1>
          <p>Posez vos questions : recommandations, devis, optimisation budget. La conversation est enregistrée. Utilisez le micro et la lecture vocale.</p>
          <Link to="/ai-features" className="ai-btn ai-btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            ← Retour aux fonctionnalités AI
          </Link>
        </header>

        <div className="ai-card assistant-chat-card">
          <div className="ai-card-header">
            <div className="ai-card-icon green">💬</div>
          </div>
          <ChatAssistant
            userId={user?.id ?? user?._id}
            projectId={undefined}
            projectContextName={undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default AssistantChat;
