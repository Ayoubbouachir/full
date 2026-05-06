import React from 'react';

export function LoadingCard() {
  return (
    <div className="mp-request-card mp-loading-card" aria-busy="true" aria-label="Chargement">
      <div className="mp-loading-line mp-loading-title" />
      <div className="mp-loading-line mp-loading-desc" />
      <div className="mp-loading-meta">
        <span className="mp-loading-line mp-loading-meta-item" />
        <span className="mp-loading-line mp-loading-meta-item" />
        <span className="mp-loading-line mp-loading-meta-item" />
      </div>
    </div>
  );
}

export function LoadingCards({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <LoadingCard key={i} />
      ))}
    </>
  );
}
