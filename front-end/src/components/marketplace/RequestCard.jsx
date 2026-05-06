import React from 'react';
import { Link } from 'react-router-dom';

const STATUS_LABELS = {
  open: 'Ouverte',
  in_negotiation: 'En négociation',
  closed: 'Cloturée',
};

const PROFESSION_LABELS = {
  plumber: 'Plombier',
  electrician: 'Électricien',
  mason: 'Maçon',
};

export default function RequestCard({ request, offersCount = 0, showActions = true, mode = 'engineer' }) {
  const professionLabel = PROFESSION_LABELS[request.requiredProfession] || request.requiredProfession;
  const statusLabel = STATUS_LABELS[request.status] || request.status;
  const createdAt = request.createdAt ? new Date(request.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <article className="mp-request-card" data-status={request.status}>
      <div className="mp-request-card-header">
        <h3 className="mp-request-card-title">
          <Link to={`/marketplace/requests/${request._id}`}>{request.title}</Link>
        </h3>
        <span className="mp-request-card-badge" aria-label={`Statut: ${statusLabel}`}>
          {statusLabel}
        </span>
      </div>
      {request.description && (
        <p className="mp-request-card-desc">{request.description}</p>
      )}
      <div className="mp-request-card-meta">
        <span className="mp-request-card-meta-item" title="Profession requise">
          <span className="mp-meta-icon">🔧</span> {professionLabel}
        </span>
        {request.budgetRange && (
          <span className="mp-request-card-meta-item" title="Budget">
            <span className="mp-meta-icon">💰</span> {request.budgetRange}
          </span>
        )}
        {request.location && (
          <span className="mp-request-card-meta-item" title="Lieu">
            <span className="mp-meta-icon">📍</span> {request.location}
          </span>
        )}
        {mode === 'engineer' && (
          <span className="mp-request-card-meta-item" title="Nombre d'offres">
            <span className="mp-meta-icon">📩</span> {offersCount} offre{offersCount !== 1 ? 's' : ''}
          </span>
        )}
        <span className="mp-request-card-meta-item mp-request-card-date">
          {createdAt}
        </span>
      </div>
      {showActions && request.status !== 'closed' && (
        <div className="mp-request-card-actions">
          <Link to={`/marketplace/requests/${request._id}`} className="mp-btn mp-btn-ghost">
            Voir
          </Link>
          {mode === 'engineer' && offersCount > 0 && (
            <Link to={`/marketplace/requests/${request._id}/chat`} className="mp-btn mp-btn-primary">
              Négocier
            </Link>
          )}
          {mode === 'artisan' && (
            <Link to={`/marketplace/requests/${request._id}/offer`} className="mp-btn mp-btn-primary">
              Proposer une offre
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
