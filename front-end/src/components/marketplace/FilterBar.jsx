import React from 'react';

const PROFESSION_OPTIONS = [
  { value: '', label: 'Toutes les professions' },
  { value: 'plumber', label: 'Plombier' },
  { value: 'electrician', label: 'Électricien' },
  { value: 'mason', label: 'Maçon' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'open', label: 'Ouverte' },
  { value: 'in_negotiation', label: 'En négociation' },
  { value: 'closed', label: 'Clôturée' },
];

export default function FilterBar({ filters, onFilterChange, onReset }) {
  return (
    <div className="mp-filter-bar" role="search" aria-label="Filtrer les demandes">
      <div className="mp-filter-row">
        <label className="mp-filter-label">
          <span className="mp-filter-label-text">Profession</span>
          <select
            value={filters.profession || ''}
            onChange={(e) => onFilterChange({ ...filters, profession: e.target.value })}
            className="mp-filter-select"
            aria-label="Filtrer par profession"
          >
            {PROFESSION_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="mp-filter-label">
          <span className="mp-filter-label-text">Statut</span>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="mp-filter-select"
            aria-label="Filtrer par statut"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="mp-filter-label">
          <span className="mp-filter-label-text">Lieu</span>
          <input
            type="text"
            placeholder="ex: Tunis"
            value={filters.location || ''}
            onChange={(e) => onFilterChange({ ...filters, location: e.target.value })}
            className="mp-filter-input"
            aria-label="Filtrer par lieu"
          />
        </label>
        <label className="mp-filter-label">
          <span className="mp-filter-label-text">Budget</span>
          <input
            type="text"
            placeholder="ex: 500-1000"
            value={filters.budgetRange || ''}
            onChange={(e) => onFilterChange({ ...filters, budgetRange: e.target.value })}
            className="mp-filter-input"
            aria-label="Filtrer par budget"
          />
        </label>
        {(filters.profession || filters.status || filters.location || filters.budgetRange) && (
          <button type="button" className="mp-btn mp-btn-ghost" onClick={onReset}>
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
}
