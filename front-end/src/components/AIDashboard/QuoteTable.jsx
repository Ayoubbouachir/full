import React, { useMemo } from 'react';
import './AIDashboard.css';

const generateId = () => `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const QuoteTable = ({
  items,
  vatRate = 0.19,
  onItemsChange,
  onExportPDF,
  onSaveToProject,
  loading = false,
  clientName,
  clientEmail,
  onClientChange,
}) => {
  const { subtotal, vat, total } = useMemo(() => {
    const sub = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
    const v = sub * vatRate;
    return { subtotal: sub, vat: v, total: sub + v };
  }, [items, vatRate]);

  const updateRow = (id, field, value) => {
    const next = items.map((row) =>
      row.id === id ? { ...row, [field]: field === 'quantity' || field === 'unitPrice' ? (parseFloat(value) || 0) : value } : row
    );
    onItemsChange(next);
  };

  const addRow = () => {
    onItemsChange([...items, { id: generateId(), product: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  };

  const removeRow = (id) => {
    if (items.length <= 1) return;
    onItemsChange(items.filter((r) => r.id !== id));
  };

  if (items.length === 0) {
    return (
      <div className="ai-dash-card ai-dash-step-card">
        <div className="ai-dash-card-header">
          <span className="ai-dash-step-num">4</span>
          <div>
            <h2 className="ai-dash-card-title">Devis éditable</h2>
            <p className="ai-dash-card-desc">Aucune ligne. Ajoutez des lignes ou complétez l’étape Matériaux.</p>
          </div>
        </div>
        <button type="button" className="ai-dash-btn ai-dash-btn-primary" onClick={addRow}>
          + Ajouter une ligne
        </button>
      </div>
    );
  }

  return (
    <div className="ai-dash-card ai-dash-step-card">
      <div className="ai-dash-card-header">
        <span className="ai-dash-step-num">4</span>
        <div>
          <h2 className="ai-dash-card-title">Devis éditable</h2>
          <p className="ai-dash-card-desc">Modifiez les lignes, TVA et exportez en PDF ou enregistrez au projet.</p>
        </div>
      </div>

      {(onClientChange && (clientName !== undefined || clientEmail !== undefined)) && (
        <div className="ai-dash-row" style={{ marginBottom: '1rem' }}>
          <div className="ai-dash-field">
            <label className="ai-dash-label">Nom client</label>
            <input
              className="ai-dash-input"
              value={clientName || ''}
              onChange={(e) => onClientChange({ clientName: e.target.value, clientEmail })}
              placeholder="Nom du client"
            />
          </div>
          <div className="ai-dash-field">
            <label className="ai-dash-label">Email client</label>
            <input
              type="email"
              className="ai-dash-input"
              value={clientEmail || ''}
              onChange={(e) => onClientChange({ clientName, clientEmail: e.target.value })}
              placeholder="email@exemple.com"
            />
          </div>
        </div>
      )}

      <div className="ai-dash-table-wrap">
        <table className="ai-dash-table">
          <thead>
            <tr>
              <th>Désignation</th>
              <th style={{ width: '100px' }}>Qté</th>
              <th style={{ width: '120px' }}>Prix unit. (DT)</th>
              <th style={{ width: '120px' }}>Total (DT)</th>
              <th style={{ width: '48px' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const q = Number(row.quantity) || 0;
              const u = Number(row.unitPrice) || 0;
              const lineTotal = q * u;
              return (
                <tr key={row.id}>
                  <td>
                    <input
                      value={row.product}
                      onChange={(e) => updateRow(row.id, 'product', e.target.value)}
                      placeholder="Désignation"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={row.quantity}
                      onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={row.unitPrice}
                      onChange={(e) => updateRow(row.id, 'unitPrice', e.target.value)}
                    />
                  </td>
                  <td>{lineTotal.toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      className="ai-dash-btn ai-dash-btn-ghost"
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      onClick={() => removeRow(row.id)}
                      disabled={items.length <= 1}
                      aria-label="Supprimer la ligne"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button type="button" className="ai-dash-btn ai-dash-btn-ghost" style={{ marginBottom: '1rem' }} onClick={addRow}>
        + Ajouter une ligne
      </button>

      <div className="ai-dash-quote-totals">
        <div className="ai-dash-quote-totals-row">
          <span>HT</span>
          <span>{subtotal.toFixed(2)} DT</span>
        </div>
        <div className="ai-dash-quote-totals-row">
          <span>TVA ({(vatRate * 100).toFixed(0)}%)</span>
          <span>{vat.toFixed(2)} DT</span>
        </div>
        <div className="ai-dash-quote-totals-row grand-total">
          <span>TTC</span>
          <span>{total.toFixed(2)} DT</span>
        </div>
      </div>

      <div className="ai-dash-form-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
        {onExportPDF && (
          <button type="button" className="ai-dash-btn ai-dash-btn-primary" onClick={onExportPDF} disabled={loading}>
            {loading ? (
              <>
                <span className="ai-dash-spinner" aria-hidden />
                Génération PDF...
              </>
            ) : (
              'Télécharger le PDF'
            )}
          </button>
        )}
        {onSaveToProject && (
          <button type="button" className="ai-dash-btn ai-dash-btn-ghost" onClick={onSaveToProject}>
            Enregistrer au projet
          </button>
        )}
      </div>
    </div>
  );
};

export default QuoteTable;
