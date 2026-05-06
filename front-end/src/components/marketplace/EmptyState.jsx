import React from 'react';
import { Link } from 'react-router-dom';

const PRESETS = {
  no_requests: {
    icon: '📋',
    title: 'Aucune demande',
    description: 'Créez votre première demande pour recevoir des offres des artisans.',
    actionLabel: 'Créer une demande',
    actionTo: '/marketplace/create',
  },
  no_offers: {
    icon: '📩',
    title: 'Aucune offre pour l\'instant',
    description: 'Les artisans correspondant à votre demande seront notifiés. Revenez plus tard.',
    actionLabel: 'Mes demandes',
    actionTo: '/marketplace/requests',
  },
  no_matching: {
    icon: '🔍',
    title: 'Aucune demande correspondante',
    description: 'Aucune demande ne correspond à votre profession pour le moment. Vérifiez les filtres.',
    actionLabel: 'Rafraîchir',
    actionTo: null,
  },
  no_my_offers: {
    icon: '📤',
    title: 'Aucune offre envoyée',
    description: 'Parcourez les demandes correspondant à votre profil et proposez une offre.',
    actionLabel: 'Voir les demandes',
    actionTo: '/marketplace/available',
  },
  no_notifications: {
    icon: '🔔',
    title: 'Aucune notification',
    description: 'Vous serez notifié des nouvelles demandes, offres et messages.',
  },
};

export default function EmptyState({ variant = 'no_requests', onAction }) {
  const preset = PRESETS[variant] || PRESETS.no_requests;

  return (
    <div className="mp-empty-state" role="status" aria-label={preset.title}>
      <span className="mp-empty-icon" aria-hidden="true">{preset.icon}</span>
      <h3 className="mp-empty-title">{preset.title}</h3>
      <p className="mp-empty-desc">{preset.description}</p>
      {preset.actionLabel && (
        preset.actionTo ? (
          <Link to={preset.actionTo} className="mp-btn mp-btn-primary">
            {preset.actionLabel}
          </Link>
        ) : (
          <button type="button" className="mp-btn mp-btn-primary" onClick={onAction}>
            {preset.actionLabel}
          </button>
        )
      )}
    </div>
  );
}
