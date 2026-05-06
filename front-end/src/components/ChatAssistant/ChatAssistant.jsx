import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ChatAssistant.css';
import API_BASE_URL from '../../apiConfig';

const API_BASE = process.env.REACT_APP_API_URL || API_BASE_URL;
const SESSION_KEY = 'fullstakers_assistant_session';

const WELCOME_MESSAGE =
  "👋 **Bienvenue sur l'Assistant IA Premium de Fullstakers !**\n\nJe suis Maram, votre experte en construction. Je peux vous aider à :\n- 🛒 **Trouver des produits** dans notre catalogue ou sur le web.\n- 📄 **Analyser vos documents** (PDF/TXT) via RAG.\n- 💰 **Optimiser votre budget** de chantier.\n- 📑 **Générer des devis PDF** instantanément.\n\n*Comment puis-je faciliter votre projet aujourd'hui ?*";

const initialMessages = [{ role: 'assistant', content: WELCOME_MESSAGE }];

// ─── ProductCard ─────────────────────────────────────────────────────────────

function ProductCard({ p }) {
  const isExternal = !!p.isExternal;
  return (
    <div className={`chat-product-card ${isExternal ? 'external' : 'internal'}`}>
      {/* Badge */}
      <span className={`product-badge ${isExternal ? 'badge-web' : 'badge-stock'}`}>
        {isExternal ? `🌐 ${p.source || 'Web'}` : '✅ En stock'}
      </span>

      {/* Image */}
      {(p.imagePUrl || p.image) && (
        <img className="chat-product-thumb" src={p.imagePUrl || p.image} alt="" />
      )}

      {/* Info */}
      <div className="product-info">
        <span className="product-name">{p.nomP}</span>
        <span className="product-price">
          {p.prix != null && p.prix !== '' ? `${p.prix} DT` : 'Prix N/D'}
        </span>
        {!isExternal && p.quantite != null && (
          <span className="product-stock-qty">📦 Stock: {p.quantite}</span>
        )}
      </div>

      {/* CTA */}
      {p.link ? (
        <a className="product-link external-link" href={p.link} target="_blank" rel="noopener noreferrer">
          Voir le produit ↗
        </a>
      ) : (
        <span className="product-link internal-link">Catalogue Fullstakers</span>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatAssistant({
  userId,
  projectId,
  projectContextName,
  apiBase = API_BASE,
  sessionKey = SESSION_KEY,
}) {
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [sessionId, setSessionId] = useState(() => localStorage.getItem(sessionKey) || '');
  const [chatMessages, setChatMessages] = useState(initialMessages);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [ingestBusy, setIngestBusy] = useState(false);
  const [ingestError, setIngestError] = useState(null);
  const [ragFiles, setRagFiles] = useState([]);    // list of indexed filenames

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // ── Send message ────────────────────────────────────────────────────────

  const handleChatSend = useCallback(async (override) => {
    const msg = (typeof override === 'string' ? override : chatInput).trim();
    if (!msg || chatLoading) return;

    setIngestError(null);
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);

    try {
      const history = chatMessages.map((m) => ({ role: m.role, content: String(m.content) }));

      const res = await fetch(`${apiBase}/ai-assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: [...history, { role: 'user', content: msg }],
          sessionId: sessionId || undefined,
          userId: userId ?? undefined,
          projectId: projectId ?? undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || `Erreur ${res.status}`);

      // Merge internal + external products into one display array
      const allProducts = [
        ...(data.products || []),
        ...(data.externalProducts || []),
      ];

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message ?? 'Pas de réponse.',
          intent: data.intent,
          products: allProducts,
          pdfUrl: data.pdfUrl,
          sources: data.sources,
          budgetLines: data.budgetLines,
          quotePayload: data.quotePayload,
          budget: data.budget,
          hasInternalProducts: (data.products || []).length > 0,
          hasExternalProducts: (data.externalProducts || []).length > 0,
        },
      ]);

      if (data.sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem(sessionKey, data.sessionId);
      }
    } catch (e) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Erreur: ${e.message}`, error: true },
      ]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, chatMessages, sessionId, userId, projectId, apiBase, sessionKey]);

  // ── RAG file ingest ──────────────────────────────────────────────────────

  const handleIngestFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIngestBusy(true);
    setIngestError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${apiBase}/ai-assistant/ingest`, { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);

      const added = data.added ?? data.total_chunks ?? 0;
      const name = data.filename || file.name;
      setRagFiles((prev) => [...prev, name]);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `📎 Document **${name}** indexé : **${added}** segments. Posez maintenant des questions sur ce fichier.`,
        },
      ]);
    } catch (err) {
      setIngestError(err.message || String(err));
    } finally {
      setIngestBusy(false);
      e.target.value = '';
    }
  };

  // ── Generate quote from message products ─────────────────────────────────

  const handleDownloadQuote = async (m) => {
    try {
      const items = (m.products || [])
        .filter((p) => p.prix != null && Number(p.prix) > 0 && !p.isExternal)
        .map((p) => ({
          product: p.nomP,
          quantity: 1,
          unit: 'pièce',
          unitPrice: Number(p.prix),
          totalPrice: Number(p.prix),
        }));

      const body = {
        projectTitle: 'Devis Assistant Fullstakers',
        projectDescription: String(m.content).slice(0, 200),
        items,
        totalEstimate: items.reduce((s, x) => s + x.totalPrice, 0),
      };

      const response = await fetch(`${apiBase}/ai-assistant/generate-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'devis-fullstakers.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setIngestError(err.message || String(err));
    }
  };

  // ── Reset chat & RAG ─────────────────────────────────────────────────────

  const handleReset = async () => {
    if (!window.confirm('Voulez-vous vraiment réinitialiser la discussion et vider la mémoire des documents ?')) return;
    
    setChatLoading(true);
    try {
      await fetch(`${apiBase}/ai-assistant/clear`, { method: 'POST' });
      setChatMessages(initialMessages);
      setRagFiles([]);
      localStorage.removeItem(sessionKey);
      setSessionId('');
    } catch (err) {
      setIngestError("Erreur lors de la réinitialisation");
    } finally {
      setChatLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="chat-assistant">
      {/* Header */}
      <div className="chat-assistant-header">
        <h2 className="chat-assistant-title">✨ Fullstakers AI Assistant</h2>
        <div className="chat-header-meta">
          {projectContextName && (
            <span className="chat-assistant-badge">Projet: {projectContextName}</span>
          )}
          {ragFiles.length > 0 && (
            <span className="chat-assistant-badge rag-badge" title={ragFiles.join(', ')}>
              📄 {ragFiles.length} doc{ragFiles.length > 1 ? 's' : ''} RAG
            </span>
          )}
          <button 
            className="chat-reset-btn" 
            onClick={handleReset} 
            title="Réinitialiser la discussion et vider la mémoire"
            disabled={chatLoading || ingestBusy}
          >
            🗑️ Nouveau Chat
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="chat-assistant-desc">
        Posez vos questions sur les matériaux, devis ou projets. Les produits Fullstakers sont prioritaires.
      </p>

      {/* Messages */}
      <div className="chat-messages" role="log" aria-live="polite">
        {/* Quick suggestions shown only at start */}
        {chatMessages.length === 1 && (
          <div className="chat-suggestions-wrapper">
            <p className="chat-welcome-hint">Essayez par exemple :</p>
            <div className="chat-suggestions">
              {[
                ['🔧', 'Recommande des matériaux pour une villa 150m²', 'Matériaux villa'],
                ['🔍', 'Recherche perceuse sans fil', 'Perceuse sans fil'],
                ['📃', 'Génère un devis PDF pour les matériaux recommandés', 'Devis PDF'],
                ['📊', 'Prédiction prix Cement Mixer', 'Prédiction prix'],
              ].map(([icon, prompt, label]) => (
                <button
                  key={label}
                  type="button"
                  className="chat-suggestion-chip"
                  onClick={() => handleChatSend(prompt)}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {chatMessages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role} ${m.error ? 'error' : ''}`}>
            <span className="bubble-role">{m.role === 'user' ? 'Vous' : 'Maram'}</span>

            {/* Text content */}
            <div className="bubble-content">
              {String(m.content || '')}
            </div>

            {/* Source notice */}
            {m.role === 'assistant' && (m.hasInternalProducts || m.hasExternalProducts) && (
              <div className="chat-source-notice">
                {m.hasInternalProducts && <span className="badge-internal">✅ Produits Fullstakers</span>}
                {m.hasExternalProducts && <span className="badge-external">🌐 Résultats web</span>}
              </div>
            )}

            {/* Products grid */}
            {m.products && m.products.length > 0 && (
              <div className="chat-products-grid">
                {m.products.map((p, idx) => (
                  <ProductCard key={idx} p={p} />
                ))}
              </div>
            )}

            {/* RAG sources */}
            {m.sources && m.sources.length > 0 && (
              <details className="chat-sources-block">
                <summary>📄 Sources documentaires utilisées</summary>
                <ul className="chat-sources-list">
                  {m.sources.map((s, si) => (
                    <li key={si}>
                      <strong>{s.filename}</strong>
                      {s.snippet ? ` — ${s.snippet}` : ''}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {/* Budget table */}
            {m.budgetLines && m.budgetLines.length > 0 && (
              <div className="chat-budget-wrap">
                <table className="chat-budget-table">
                  <thead>
                    <tr><th>Élément</th><th>Qté</th><th>Prix u.</th><th>Sous-total</th></tr>
                  </thead>
                  <tbody>
                    {m.budgetLines.map((row, ri) => (
                      <tr key={ri}>
                        <td>{row.label}</td>
                        <td>{row.quantity}</td>
                        <td>{row.unitPrice != null ? `${Number(row.unitPrice).toFixed(2)} DT` : '—'}</td>
                        <td>{row.subtotal != null ? `${Number(row.subtotal).toFixed(2)} DT` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PDF download */}
            {m.pdfUrl && (
              <div className="chat-pdf-action">
                <button
                  type="button"
                  className="chat-assistant-btn chat-assistant-btn-primary"
                  onClick={() => handleDownloadQuote(m)}
                >
                  📄 Télécharger le devis PDF
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {chatLoading && (
          <div className="chat-bubble assistant">
            <span className="bubble-role">Maram</span>
            <div className="bubble-content typing">
              <span className="chat-loading-spinner" aria-hidden="true" />
              Recherche dans le catalogue et le web…
            </div>
          </div>
        )}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* File upload toolbar */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,application/pdf,text/plain"
        style={{ display: 'none' }}
        onChange={handleIngestFile}
      />
      <div className="chat-upload-toolbar">
        <button
          type="button"
          className="chat-attach-btn"
          disabled={ingestBusy || chatLoading}
          onClick={() => fileInputRef.current?.click()}
          title="Joindre un PDF ou TXT pour réponses contextuelles (RAG)"
        >
          📎
        </button>
        <p className="chat-ingest-hint">
          {ingestBusy ? '⏳ Indexation en cours…' : 'Ajoutez un PDF/TXT pour enrichir les réponses (RAG).'}
        </p>
      </div>
      {ingestError && <p className="chat-ingest-error">⚠️ {ingestError}</p>}

      {/* Input row */}
      <div className="chat-input-row">
        <input
          type="text"
          className="chat-input"
          placeholder="Ex: recommande des matériaux pour une villa…"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleChatSend();
            }
          }}
          aria-label="Message"
        />
        <button
          type="button"
          className="chat-assistant-btn chat-assistant-btn-primary"
          onClick={() => handleChatSend()}
          disabled={chatLoading || ingestBusy}
        >
          {chatLoading ? '⏳' : 'Envoyer'}
        </button>
      </div>
    </div>
  );
}
