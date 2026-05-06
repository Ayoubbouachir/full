import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Marketplace.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:3100';
const PROFESSION_LABELS = { plumber: 'Plombier', electrician: 'Électricien', mason: 'Maçon' };

export default function RequestDetailPage() {
  const { requestId } = useParams();
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const userId = user?._id;
  const isEngineer = user?.role === 'Engineer';

  const [request, setRequest] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!requestId || !userId) return;
    Promise.all([
      fetch(`${API_BASE}/service-requests/${requestId}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API_BASE}/offers/request/${requestId}`).then((r) => (r.ok ? r.json() : [])),
    ]).then(([req, offs]) => {
      setRequest(req);
      setOffers(Array.isArray(offs) ? offs : []);
    }).finally(() => setLoading(false));
  }, [requestId, userId]);

  const handleAccept = async (offerId) => {
    setActionLoading(offerId);
    try {
      const res = await fetch(`${API_BASE}/offers/${offerId}/accept`, {
        method: 'POST',
        headers: { 'x-user-id': userId, 'x-user-role': user?.role || 'Engineer' },
      });
      if (res.ok) {
        const updated = await res.json();
        setOffers((prev) => prev.map((o) => (o._id === offerId ? { ...o, status: 'accepted' } : o)));
        setRequest((r) => (r ? { ...r, status: 'closed' } : null));
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (offerId) => {
    setActionLoading(offerId);
    try {
      const res = await fetch(`${API_BASE}/offers/${offerId}/reject`, {
        method: 'POST',
        headers: { 'x-user-id': userId, 'x-user-role': user?.role || 'Engineer' },
      });
      if (res.ok) {
        setOffers((prev) => prev.map((o) => (o._id === offerId ? { ...o, status: 'rejected' } : o)));
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="mp-detail">
        <div className="mp-detail-skeleton" />
      </div>
    );
  }
  if (!request) {
    return (
      <div className="mp-detail">
        <p>Demande introuvable.</p>
        <Link to="/marketplace/requests">Retour aux demandes</Link>
      </div>
    );
  }

  const canNegotiate = request.status !== 'closed' && (request.engineerId === userId || offers.some((o) => o.artisanId === userId));
  const pendingOffers = offers.filter((o) => o.status === 'pending');

  return (
    <div className="mp-detail">
      <div className="mp-detail-header">
        <Link to={isEngineer ? '/marketplace/requests' : '/marketplace/available'} className="mp-back-link">
          ← Retour
        </Link>
        <h1 className="mp-detail-title">{request.title}</h1>
        <span className="mp-detail-badge" data-status={request.status}>
          {request.status === 'open' ? 'Ouverte' : request.status === 'in_negotiation' ? 'En négociation' : 'Clôturée'}
        </span>
      </div>

      <div className="mp-detail-meta">
        <span>{PROFESSION_LABELS[request.requiredProfession] || request.requiredProfession}</span>
        {request.location && <span>📍 {request.location}</span>}
        {request.budgetRange && <span>💰 {request.budgetRange}</span>}
      </div>
      {request.description && <p className="mp-detail-desc">{request.description}</p>}

      {canNegotiate && (
        <div className="mp-detail-actions">
          <Link to={`/marketplace/requests/${requestId}/chat`} className="mp-btn mp-btn-primary">
            Ouvrir la discussion
          </Link>
        </div>
      )}

      {isEngineer && (
        <section className="mp-detail-offers" aria-labelledby="offers-title">
          <h2 id="offers-title">Offres reçues ({offers.length})</h2>
          {offers.length === 0 && (
            <p className="mp-empty-inline">Aucune offre pour l&apos;instant. Les artisans correspondants ont été notifiés.</p>
          )}
          <ul className="mp-offers-list">
            {offers.map((offer) => (
              <li key={offer._id} className="mp-offer-item" data-status={offer.status}>
                <div className="mp-offer-main">
                  <span className="mp-offer-price">{offer.proposedPrice} DT</span>
                  {offer.message && <p className="mp-offer-message">{offer.message}</p>}
                  <span className="mp-offer-status">{offer.status}</span>
                </div>
                {offer.status === 'pending' && request.engineerId === userId && (
                  <div className="mp-offer-actions">
                    <button
                      type="button"
                      className="mp-btn mp-btn-success"
                      disabled={!!actionLoading}
                      onClick={() => handleAccept(offer._id)}
                    >
                      {actionLoading === offer._id ? '…' : 'Accepter'}
                    </button>
                    <button
                      type="button"
                      className="mp-btn mp-btn-ghost"
                      disabled={!!actionLoading}
                      onClick={() => handleReject(offer._id)}
                    >
                      Refuser
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
