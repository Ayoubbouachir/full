import React from 'react';
import './AIDashboard.css';

const DEFAULT_PHASES = [
  { id: 'f1', name: 'Fondations', start: 0, duration: 14, percent: 18 },
  { id: 'f2', name: 'Structure', start: 14, duration: 35, percent: 47 },
  { id: 'f3', name: 'Second œuvre / Finitions', start: 49, duration: 26, percent: 35 },
];

const PlanningTimeline = ({ planning, projectName, startDate, deadline }) => {
  const durationDays = planning?.suggestedDurationDays ?? 75;

  const effectivePhases = planning?.phases?.length
    ? planning.phases
    : DEFAULT_PHASES.map((p, i) => {
        const prev = i === 0 ? { start: 0, duration: 0 } : DEFAULT_PHASES[i - 1];
        const start = prev.start + prev.duration;
        const duration = Math.round((p.percent / 100) * durationDays);
        return { ...p, start, duration, percent: Math.round((duration / durationDays) * 100) };
      });

  const startStr = planning?.suggestedStart || startDate || '—';
  const endStr = planning?.suggestedEnd || deadline || '—';

  return (
    <div className="ai-dash-card ai-dash-step-card">
      <div className="ai-dash-card-header">
        <span className="ai-dash-step-num">5</span>
        <div>
          <h2 className="ai-dash-card-title">Planning intelligent</h2>
          <p className="ai-dash-card-desc">
            Durée estimée et phases (Fondations, Structure, Finitions).
          </p>
        </div>
      </div>

      {(planning?.suggestedWorkers != null || planning?.suggestedDurationDays != null) && (
        <div className="ai-dash-planning-meta">
          {projectName && (
            <div className="ai-dash-planning-meta-item">
              <div className="ai-dash-planning-meta-label">Projet</div>
              <div className="ai-dash-planning-meta-value">{projectName}</div>
            </div>
          )}
          <div className="ai-dash-planning-meta-item">
            <div className="ai-dash-planning-meta-label">Ouvriers suggérés</div>
            <div className="ai-dash-planning-meta-value">{planning.suggestedWorkers}</div>
          </div>
          <div className="ai-dash-planning-meta-item">
            <div className="ai-dash-planning-meta-label">Durée</div>
            <div className="ai-dash-planning-meta-value">{planning.suggestedDurationDays} jours</div>
          </div>
          <div className="ai-dash-planning-meta-item">
            <div className="ai-dash-planning-meta-label">Début → Fin</div>
            <div className="ai-dash-planning-meta-value">{startStr} → {endStr}</div>
          </div>
          {planning?.recommendedDeliveryBy && (
            <div className="ai-dash-planning-meta-item">
              <div className="ai-dash-planning-meta-label">Commander matériaux avant</div>
              <div className="ai-dash-planning-meta-value">{planning.recommendedDeliveryBy}</div>
            </div>
          )}
        </div>
      )}

      <div className="ai-dash-timeline">
        {effectivePhases.map((phase) => (
          <div key={phase.id} className="ai-dash-timeline-phase">
            <div className="ai-dash-timeline-phase-name">{phase.name}</div>
            <div className="ai-dash-timeline-phase-bar-wrap">
              <div className="ai-dash-timeline-bar">
                <div
                  className="ai-dash-timeline-bar-fill"
                  style={{ width: `${Math.min(100, (phase.duration / durationDays) * 100)}%` }}
                />
              </div>
              <div className="ai-dash-timeline-dates">
                J{phase.start + 1} → J{phase.start + phase.duration} ({phase.duration} jours)
              </div>
            </div>
          </div>
        ))}
      </div>

      {planning?.message && (
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'rgba(232,230,227,0.8)' }}>
          {planning.message}
        </p>
      )}
    </div>
  );
};

export default PlanningTimeline;
