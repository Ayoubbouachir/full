import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Marketplace.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net';

export default function NegotiationChat() {
  const { requestId } = useParams();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const userId = user?._id;

  useEffect(() => {
    if (!requestId || !userId) return;
    setLoading(true);
    fetch(`${API_BASE}/negotiation/request/${requestId}`, {
      headers: { 'x-user-id': userId },
    })
      .then((r) => r.ok ? r.json() : [])
      .then(setMessages)
      .finally(() => setLoading(false));
  }, [requestId, userId]);

  const send = async () => {
    if (!content.trim() || !userId) return;
    try {
      const res = await fetch(`${API_BASE}/negotiation/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ requestId, content: content.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setContent('');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="mp-detail marketplace-page negotiation-chat">
      <Link to={`/marketplace/requests/${requestId}`} className="mp-back-link">← Retour à la demande</Link>
      <h2>Discussion</h2>
      <div className="chat-messages">
        {messages.map((m) => (
          <div key={m._id} className={m.senderId === userId ? 'mine' : 'theirs'}>
            {m.content}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input value={content} onChange={(e) => setContent(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
        <button type="button" onClick={send}>Envoyer</button>
      </div>
    </div>
  );
}
