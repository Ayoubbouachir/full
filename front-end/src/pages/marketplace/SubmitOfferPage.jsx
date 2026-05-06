import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './Marketplace.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:3100';

export default function SubmitOfferPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const userId = user?._id;

  const [request, setRequest] = useState(null);
  const [proposedPrice, setProposedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!requestId) return;
    fetch(`${API_BASE}/service-requests/${requestId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setRequest)
      .finally(() => setPageLoading(false));
  }, [requestId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !requestId) return;
    const price = parseFloat(proposedPrice);
    if (Number.isNaN(price) || price <= 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ requestId, proposedPrice: price, message: message.trim() || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      navigate(`/marketplace/requests/${requestId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <div className="mp-detail"><div className="mp-detail-skeleton" /></div>;
  if (!request) return <div className="mp-detail"><p>Demande introuvable.</p><Link to="/marketplace/available">Retour</Link></div>;

  return (
    <div className="mp-detail mp-offer-form-wrap">
      <Link to={`/marketplace/requests/${requestId}`} className="mp-back-link">← Retour</Link>
      <h1 className="mp-page-title">Proposer une offre</h1>
      <p className="mp-offer-context">Demande : {request.title}</p>
      <form onSubmit={handleSubmit} className="mp-form">
        <label className="mp-form-label">
          <span>Prix proposé (DT) *</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={proposedPrice}
            onChange={(e) => setProposedPrice(e.target.value)}
            required
            className="mp-form-input"
          />
        </label>
        <label className="mp-form-label">
          <span>Message (optionnel)</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mp-form-input mp-form-textarea"
            placeholder="Présentez votre proposition..."
          />
        </label>
        <button type="submit" className="mp-btn mp-btn-primary" disabled={loading}>
          {loading ? 'Envoi...' : 'Envoyer l\'offre'}
        </button>
      </form>
    </div>
  );
}
