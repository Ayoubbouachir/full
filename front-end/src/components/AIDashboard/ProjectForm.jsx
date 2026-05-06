import React from 'react';
import { PROJECT_TYPES, BUDGET_RANGES } from './projectModel';
import './AIDashboard.css';

const ProjectForm = ({ project, onChange, onSubmit, loading, error }) => {
  const handleChange = (field, value) => {
    onChange({ ...project, [field]: value, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="ai-dash-card ai-dash-step-card">
      <div className="ai-dash-card-header">
        <span className="ai-dash-step-num">1</span>
        <div>
          <h2 className="ai-dash-card-title">Description du projet</h2>
          <p className="ai-dash-card-desc">Décrivez votre projet, type, budget et localisation.</p>
        </div>
      </div>

      {error && (
        <div className="ai-dash-alert ai-dash-alert-error" role="alert">
          {error}
        </div>
      )}

      <form
        className="ai-dash-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="ai-dash-field">
          <label className="ai-dash-label">Description du projet *</label>
          <textarea
            className="ai-dash-input"
            rows={4}
            placeholder="Ex: Villa moderne 150m² avec jardin, terrasse et garage. Je souhaite des matériaux durables."
            value={project.description}
            onChange={(e) => handleChange('description', e.target.value)}
            required
          />
        </div>

        <div className="ai-dash-row">
          <div className="ai-dash-field">
            <label className="ai-dash-label">Type de projet</label>
            <select
              className="ai-dash-input ai-dash-select"
              value={project.projectType}
              onChange={(e) => handleChange('projectType', e.target.value)}
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="ai-dash-field">
            <label className="ai-dash-label">Fourchette de budget</label>
            <select
              className="ai-dash-input ai-dash-select"
              value={project.budgetRange}
              onChange={(e) => handleChange('budgetRange', e.target.value)}
            >
              {BUDGET_RANGES.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="ai-dash-row">
          <div className="ai-dash-field">
            <label className="ai-dash-label">Localisation</label>
            <input
              type="text"
              className="ai-dash-input"
              placeholder="Ex: Tunis, Sousse"
              value={project.location}
              onChange={(e) => handleChange('location', e.target.value)}
            />
          </div>
          <div className="ai-dash-field">
            <label className="ai-dash-label">Nom du projet</label>
            <input
              type="text"
              className="ai-dash-input"
              placeholder="Ex: Villa Les Oliviers"
              value={project.projectName}
              onChange={(e) => handleChange('projectName', e.target.value)}
            />
          </div>
        </div>

        <div className="ai-dash-form-actions">
          <button type="submit" className="ai-dash-btn ai-dash-btn-primary" disabled={loading || !project.description?.trim()}>
            {loading ? (
              <>
                <span className="ai-dash-spinner" aria-hidden />
                Analyse en cours...
              </>
            ) : (
              'Obtenir les recommandations IA'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
