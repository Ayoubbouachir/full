import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/marketplace/EmptyState';
import { LoadingCards } from '../../components/marketplace/LoadingCard';
import './Marketplace.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net';

export default function MyOffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const userId = user?._id;

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE}/offers/my`, { headers: { 'x-user-id': userId } })
      .then((r) => (r.ok ? r.json() : []))
      .then(setOffers)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="mp-dashboard">
        <h1 className="mp-page-title">Mes offres</h1>
        <div className="mp-cards-grid">
          <LoadingCards count={3} />
        </div>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="mp-dashboard">
        <h1 className="mp-page-title">Mes offres</h1>
        <EmptyState variant="no_my_offers" />
      </div>
    );
  }

  const statusLabel = (s) => (s === 'pending' ? 'En attente' : s === 'accepted' ? 'Acceptée' : 'Refusée');

  return (
    <div className="mp-dashboard">
      <h1 className="mp-page-title">Mes offres</h1>
      <ul className="mp-offers-list mp-offers-list-page">
        {offers.map((o) => (
          <li key={o._id} className="mp-offer-item" data-status={o.status}>
            <div className="mp-offer-main">
              <span className="mp-offer-price">{o.proposedPrice} DT</span>
              {o.message && <p className="mp-offer-message">{o.message}</p>}
              <span className="mp-offer-status">{statusLabel(o.status)}</span>
            </div>
            <Link to={`/marketplace/requests/${o.requestId}`} className="mp-btn mp-btn-ghost">
              Voir la demande
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
