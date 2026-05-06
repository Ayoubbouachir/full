import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import RequestCard from '../../components/marketplace/RequestCard';
import EmptyState from '../../components/marketplace/EmptyState';
import { LoadingCards } from '../../components/marketplace/LoadingCard';
import { useMarketplaceNotifications } from '../../hooks/useMarketplaceNotifications';
import './Marketplace.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:3100';

export default function MarketplaceDashboard() {
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const userId = user?._id;
  const isEngineer = user?.role === 'Engineer';
  const isArtisan = user?.role === 'Artisan';

  const { unreadCount } = useMarketplaceNotifications(userId);
  const [requests, setRequests] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const promises = [];
    if (isEngineer) {
      promises.push(
        fetch(`${API_BASE}/service-requests/my`, { headers: { 'x-user-id': userId } })
          .then((r) => (r.ok ? r.json() : [])),
      );
    }
    if (isArtisan) {
      promises.push(
        fetch(`${API_BASE}/service-requests/available`, {
          headers: { 'x-user-id': userId, 'x-profession': user?.profession || user?.speciality || '' },
        }).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE}/offers/my`, { headers: { 'x-user-id': userId } }).then((r) => (r.ok ? r.json() : [])),
      );
    }
    if (promises.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all(promises).then((results) => {
      if (isEngineer) {
        setRequests(results[0] || []);
      } else if (isArtisan) {
        setRequests(results[0] || []);
        setOffers(results[1] || []);
      }
    }).finally(() => setLoading(false));
  }, [userId, isEngineer, isArtisan, user?.profession, user?.speciality]);

  const activeRequests = requests.filter((r) => r.status === 'open' || r.status === 'in_negotiation');
  const pendingOffers = isArtisan ? offers.filter((o) => o.status === 'pending') : [];

  const getOffersCount = async (requestId) => {
    const r = await fetch(`${API_BASE}/offers/request/${requestId}`);
    if (!r.ok) return 0;
    const data = await r.json();
    return Array.isArray(data) ? data.length : 0;
  };

  const [offersCounts, setOffersCounts] = useState({});
  useEffect(() => {
    if (!isEngineer || requests.length === 0) return;
    requests.slice(0, 10).forEach((req) => {
      getOffersCount(req._id).then((c) => setOffersCounts((prev) => ({ ...prev, [req._id]: c })));
    });
  }, [isEngineer, requests]);

  if (loading) {
    return (
      <div className="mp-dashboard">
        <h1 className="mp-page-title">Tableau de bord</h1>
        <div className="mp-kpi-grid">
          <div className="mp-kpi-card mp-kpi-skeleton" />
          <div className="mp-kpi-card mp-kpi-skeleton" />
          <div className="mp-kpi-card mp-kpi-skeleton" />
          <div className="mp-kpi-card mp-kpi-skeleton" />
        </div>
        <section className="mp-section">
          <h2 className="mp-section-title">Récapitulatif</h2>
          <div className="mp-cards-grid">
            <LoadingCards count={3} />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mp-dashboard">
      <h1 className="mp-page-title">Tableau de bord</h1>

      <div className="mp-kpi-grid" role="group" aria-label="Indicateurs clés">
        <div className="mp-kpi-card">
          <span className="mp-kpi-value">{activeRequests.length}</span>
          <span className="mp-kpi-label">{isEngineer ? 'Demandes actives' : 'Demandes correspondantes'}</span>
        </div>
        {isEngineer && (
          <div className="mp-kpi-card">
            <span className="mp-kpi-value">{requests.filter((r) => r.status === 'in_negotiation').length}</span>
            <span className="mp-kpi-label">En négociation</span>
          </div>
        )}
        {isArtisan && (
          <div className="mp-kpi-card">
            <span className="mp-kpi-value">{pendingOffers.length}</span>
            <span className="mp-kpi-label">Offres en attente</span>
          </div>
        )}
        <div className="mp-kpi-card">
          <span className="mp-kpi-value">{unreadCount}</span>
          <span className="mp-kpi-label">Notifications</span>
        </div>
      </div>

      <section className="mp-section" aria-labelledby="section-requests">
        <h2 id="section-requests" className="mp-section-title">
          {isEngineer ? 'Mes demandes récentes' : 'Demandes correspondant à mon profil'}
        </h2>
        <div className="mp-cards-grid">
          {requests.length === 0 && (
            <EmptyState variant={isEngineer ? 'no_requests' : 'no_matching'} onAction={() => window.location.reload()} />
          )}
          {requests.slice(0, 6).map((req) => (
            <RequestCard
              key={req._id}
              request={req}
              offersCount={offersCounts[req._id] ?? 0}
              mode={isEngineer ? 'engineer' : 'artisan'}
            />
          ))}
        </div>
        {requests.length > 0 && (
          <Link to={isEngineer ? '/marketplace/requests' : '/marketplace/available'} className="mp-link-more">
            Voir tout →
          </Link>
        )}
      </section>
    </div>
  );
}
