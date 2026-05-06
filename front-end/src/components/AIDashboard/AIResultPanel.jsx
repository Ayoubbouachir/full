import React from 'react';
import './AIDashboard.css';

const DEFAULT_BUDGET_ALLOCATION = { materials: 65, labor: 25, equipment: 7, contingency: 3 };
const DEFAULT_RISK_NOTES = ['Prévoir un délai de livraison pour les matériaux lourds.', 'Vérifier les disponibilités en stock avant engagement.'];

const AIResultPanel = ({ recommendation, selectedProducts, onSelectProduct }) => {
  if (!recommendation || !recommendation.recommendations?.length) return null;

  const budgetAlloc = recommendation.budgetAllocation || DEFAULT_BUDGET_ALLOCATION;
  const riskNotes = recommendation.riskNotes || DEFAULT_RISK_NOTES;

  return (
    <div className="ai-dash-card ai-dash-step-card">
      <div className="ai-dash-card-header">
        <span className="ai-dash-step-num">2</span>
        <div>
          <h2 className="ai-dash-card-title">Recommandations IA — Matériaux</h2>
          <p className="ai-dash-card-desc">
            Type: {recommendation.projectType} · Surface: {recommendation.projectSize} · Durée: {recommendation.estimatedDuration} · Ouvriers: {recommendation.workersNeeded}
          </p>
        </div>
      </div>

      <div className="ai-dash-materials-grid">
        {recommendation.recommendations.map((cat, idx) => (
          <div key={idx} className="ai-dash-material-card">
            <div className="ai-dash-material-cat">
              {cat.category || 'Matériau'} × {cat.requiredQuantity || 1}
            </div>
            <div className="ai-dash-material-reason">{cat.reason}</div>
            <select
              className="ai-dash-material-select"
              value={selectedProducts[cat.category]?._id || ''}
              onChange={(e) => {
                const opt = cat.options?.find((o) => o._id === e.target.value);
                if (opt) onSelectProduct(cat.category, opt);
              }}
            >
              <option value="">Choisir un produit</option>
              {cat.options?.map((opt, oIdx) => (
                <option key={oIdx} value={opt._id}>
                  {opt.nomP} — {Number(opt.prix).toFixed(2)} DT {opt.inStock ? '✅' : '⚠️'}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="ai-dash-budget-alloc">
        {Object.entries(budgetAlloc).map(([key, percent]) => (
          <div key={key} className="ai-dash-budget-bar-wrap">
            <div className="ai-dash-budget-bar-label">
              {key === 'materials' && 'Matériaux'}
              {key === 'labor' && 'Main d\'œuvre'}
              {key === 'equipment' && 'Équipement'}
              {key === 'contingency' && 'Contingence'}
            </div>
            <div className="ai-dash-budget-bar">
              <div className="ai-dash-budget-bar-fill" style={{ width: `${percent}%` }} />
            </div>
          </div>
        ))}
      </div>

      {Array.isArray(riskNotes) && riskNotes.length > 0 && (
        <div className="ai-dash-risks">
          <div className="ai-dash-risks-title">Points d'attention</div>
          <ul className="ai-dash-risks-list">
            {riskNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AIResultPanel;
