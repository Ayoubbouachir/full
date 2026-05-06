/**
 * ProgressMonitoring.jsx — Plan vs Photo : Flux en 2 étapes
 * Étape 1 : Comparaison et vérification de compatibilité
 * Étape 2 : Affichage du % d'avancement (si compatible)
 */
import React, { useState, useRef, useCallback } from 'react';

const API_BASE =
  (typeof process !== 'undefined' && process.env.REACT_APP_API_URL) ||
  'http://localhost:3100';

const PHASE_COLORS = {
  terrassement: '#8B5E3C',
  fondation: '#64748B',
  structure: '#2563EB',
  second_oeuvre: '#D97706',
  finition: '#16A34A',
};

/* ── inline styles ── */
const S = {
  page: { minHeight: '100vh', background: '#F8F7F4', fontFamily: "'Inter', sans-serif", paddingBottom: '4rem' },
  topBar: { background: '#1C1A17', padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#9CA3AF', borderBottom: '1px solid #333' },
  crumb: { color: '#F97316', fontWeight: 700 },
  wrap: { maxWidth: 960, margin: '0 auto', padding: '2.5rem 1.5rem' },

  /* stepper */
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: '2.5rem' },
  stepDot: (active, done) => ({
    width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 14,
    background: done ? '#10B981' : active ? '#F97316' : '#E5E1D8',
    color: done || active ? '#fff' : '#9CA3AF',
    transition: 'all .3s',
  }),
  stepLine: (done) => ({ flex: 1, height: 3, maxWidth: 80, background: done ? '#10B981' : '#E5E1D8', transition: 'background .4s' }),
  stepLabel: (active) => ({ fontSize: 12, fontWeight: 600, color: active ? '#1C1A17' : '#9CA3AF', textAlign: 'center', marginTop: 6 }),

  /* header */
  header: { textAlign: 'center', marginBottom: '2rem' },
  badge: { display: 'inline-block', background: '#F97316', color: '#fff', borderRadius: 4, padding: '4px 14px', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, marginBottom: 14, textTransform: 'uppercase' },
  h1: { fontSize: 30, fontWeight: 800, color: '#1C1A17', marginBottom: 10, letterSpacing: '-0.5px' },
  sub: { fontSize: 15, color: '#6B6860', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 },

  /* upload grid */
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 28 },
  card: (active) => ({
    background: '#fff', border: `2px solid ${active ? '#F97316' : '#E5E1D8'}`,
    borderRadius: 12, padding: 24, position: 'relative', display: 'flex', flexDirection: 'column',
    boxShadow: active ? '0 8px 24px -4px rgba(249,115,22,.12)' : 'none', transition: 'all .3s',
  }),
  cardTag: (type) => ({
    position: 'absolute', top: -13, left: 18,
    background: type === 'plan' ? '#2563EB' : '#16A34A',
    color: '#fff', padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
  }),
  drop: (drag) => ({
    border: `2px dashed ${drag ? '#F97316' : '#D1CDC4'}`, borderRadius: 8,
    padding: '36px 20px', textAlign: 'center', cursor: 'pointer',
    background: drag ? '#FFF0E6' : '#FAFAFA', transition: 'all .2s',
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  }),
  prevBox: { position: 'relative', height: 200, borderRadius: 8, overflow: 'hidden', background: '#000', marginBottom: 10 },
  prevImg: { width: '100%', height: '100%', objectFit: 'cover', opacity: .88 },
  rmBtn: {
    position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%',
    background: 'rgba(255,255,255,.9)', border: 'none', cursor: 'pointer', color: '#DC2626', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  /* action zone */
  action: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '10px 0 20px' },
  btn: (dis) => ({
    background: dis ? '#9CA3AF' : 'linear-gradient(135deg,#1C1A17 0%,#444 100%)',
    color: '#fff', border: 'none', borderRadius: 8,
    padding: '15px 48px', fontSize: 16, fontWeight: 700, letterSpacing: '1px',
    cursor: dis ? 'not-allowed' : 'pointer',
    boxShadow: dis ? 'none' : '0 8px 20px -4px rgba(0,0,0,.25)',
    display: 'flex', alignItems: 'center', gap: 10,
  }),
  eng: { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#4338CA' },
  err: { color: '#DC2626', fontSize: 14, fontWeight: 500 },
  spinner: { width: 38, height: 38, border: '4px solid #E5E1D8', borderTop: '4px solid #F97316', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' },

  /* ── STEP 1 RESULT: compatibility banner ── */
  compat: (ok) => ({
    display: 'flex', alignItems: 'center', gap: 20, padding: 24, borderRadius: 14, marginBottom: 28,
    background: ok === true ? '#ECFDF5' : ok === false ? '#FEF2F2' : '#FFFBEB',
    border: `1px solid ${ok === true ? '#A7F3D0' : ok === false ? '#FECACA' : '#FCD34D'}`,
  }),
  compatIcon: (ok) => ({
    width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 28, background: ok === true ? '#10B981' : ok === false ? '#EF4444' : '#F59E0B', color: '#fff',
  }),
  compatTitle: { fontSize: 19, fontWeight: 800, color: '#111827', marginBottom: 4 },
  compatMsg: { fontSize: 14, color: '#4B5563', lineHeight: 1.5 },

  /* Phase comparison row */
  vsRow: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 24, marginBottom: 28 },
  phBox: { textAlign: 'center', padding: '20px 16px', background: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB' },
  phLbl: { fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  phVal: { fontSize: 20, fontWeight: 800, color: '#111827' },
  vsCircle: { width: 44, height: 44, borderRadius: '50%', background: '#1C1A17', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, boxShadow: '0 4px 10px rgba(0,0,0,.2)' },

  /* Continue button */
  continueBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    background: 'linear-gradient(135deg,#10B981 0%,#059669 100%)',
    color: '#fff', border: 'none', borderRadius: 8, padding: '15px 40px',
    fontSize: 16, fontWeight: 700, cursor: 'pointer', margin: '0 auto',
    boxShadow: '0 8px 20px -4px rgba(16,185,129,.35)',
  },

  /* ── STEP 2: progress ── */
  progCard: { background: '#fff', borderRadius: 16, padding: 36, border: '1px solid #E5E1D8', boxShadow: '0 16px 40px -10px rgba(0,0,0,.07)', marginTop: 12 },
  bigPct: { fontSize: 72, fontWeight: 900, color: '#F97316', lineHeight: 1, textAlign: 'center', marginBottom: 4 },
  pctNote: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginBottom: 28 },
  track: { height: 16, background: '#F3F4F6', borderRadius: 8, overflow: 'hidden', marginBottom: 8 },
  fill: (pct, color) => ({ height: '100%', width: `${pct}%`, background: color || '#F97316', borderRadius: 8, transition: 'width 1.2s ease' }),
  trackLabels: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', marginBottom: 28 },

  pipeline: { display: 'flex', height: 58, background: '#F3F4F6', borderRadius: 10, overflow: 'hidden', marginBottom: 28 },
  pStep: (a, d, c) => ({
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 700,
    background: a ? c : d ? `${c}30` : 'transparent',
    color: a ? '#fff' : d ? c : '#9CA3AF',
    borderRight: '1px solid rgba(0,0,0,.05)', transition: 'all .3s',
  }),

  detail2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 },
  detBox: (c) => ({ background: '#F9FAFB', borderRadius: 12, padding: 22, borderLeft: `4px solid ${c}` }),
  detTitle: (c) => ({ fontSize: 12, fontWeight: 700, color: c, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }),
  ul: { margin: 0, padding: '0 0 0 18px', fontSize: 13, color: '#374151', lineHeight: 1.7 },

  resetBtn: { background: 'none', border: '1px solid #E5E7EB', borderRadius: 6, padding: '8px 24px', fontSize: 13, fontWeight: 600, color: '#6B7280', cursor: 'pointer', display: 'block', margin: '28px auto 0' },
};

/* ══════════════════════════════════════════════════════════ */
export default function ProgressMonitoring() {
  const [planFile, setPlanFile] = useState(null);
  const [planPrev, setPlanPrev] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPrev, setPhotoPrev] = useState(null);
  const [draggingPlan, setDraggingPlan] = useState(false);
  const [draggingPhoto, setDraggingPhoto] = useState(false);
  const planRef = useRef(null);
  const photoRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* step = 'upload' | 'compat' | 'progress' */
  const [step, setStep] = useState('upload');
  const [result, setResult] = useState(null);

  const pickFile = useCallback((f, type) => {
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      setError('Format non supporté : JPG, PNG ou WEBP.');
      return;
    }
    const rd = new FileReader();
    rd.onload = (e) => {
      if (type === 'plan') { setPlanFile(f); setPlanPrev(e.target.result); }
      else { setPhotoFile(f); setPhotoPrev(e.target.result); }
      setError(null);
    };
    rd.readAsDataURL(f);
  }, []);

  const runCompare = async () => {
    if (!planFile || !photoFile) return;
    setLoading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append('plan', planFile);
      fd.append('photo', photoFile);
      // Note: Calling backend at port 3000 to use its proxy logic
      const res = await fetch(`${API_BASE}/ai-assistant/analyze-progress-vision`, { method: 'POST', body: fd });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(e.detail || `Erreur ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
      setStep('compat');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const goProgress = () => setStep('progress');

  const reset = () => {
    setPlanFile(null); setPlanPrev(null);
    setPhotoFile(null); setPhotoPrev(null);
    setResult(null); setError(null); setStep('upload');
  };

  const stepDone = (s) => ({ upload: [], compat: ['upload'], progress: ['upload', 'compat'] }[step]?.includes(s) ?? false);
  const stepActive = (s) => step === s;

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={S.topBar}>
        <span style={S.crumb}>AI Lab</span>
        <span>›</span>
        <span style={{ fontWeight: 500 }}>Plan vs Réalité</span>
      </div>

      <div style={S.wrap}>

        {/* ── STEPPER ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div style={S.stepper}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={S.stepDot(stepActive('upload'), stepDone('upload'))}>
                {stepDone('upload') ? '✓' : '1'}
              </div>
              <div style={S.stepLabel(stepActive('upload') || stepDone('upload'))}>Upload</div>
            </div>
            <div style={S.stepLine(stepDone('compat'))} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={S.stepDot(stepActive('compat'), stepDone('compat'))}>
                {stepDone('compat') ? '✓' : '2'}
              </div>
              <div style={S.stepLabel(stepActive('compat') || stepDone('compat'))}>Compatibilité</div>
            </div>
            <div style={S.stepLine(stepDone('progress'))} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={S.stepDot(stepActive('progress'), stepDone('progress'))}>
                {stepDone('progress') ? '✓' : '3'}
              </div>
              <div style={S.stepLabel(stepActive('progress'))}>Avancement</div>
            </div>
          </div>
        </div>

        {/* ══════════════ STEP 1 : UPLOAD ══════════════ */}
        {step === 'upload' && (
          <>
            <header style={S.header}>
              <span style={S.badge}>Étape 1 — Comparaison</span>
              <h1 style={S.h1}>Vérifiez la Conformité du Chantier</h1>
              <p style={S.sub}>
                Chargez votre plan architectural et une photo du chantier. L'IA compare
                les deux et détermine si le chantier est conforme au plan avant d'afficher l'avancement.
              </p>
            </header>

            <div style={S.grid}>
              {/* Plan */}
              <div style={S.card(!!planPrev)}>
                <div style={S.cardTag('plan')}>Plan Architectural</div>
                {planPrev ? (
                  <div style={S.prevBox}>
                    <img src={planPrev} alt="Plan" style={S.prevImg} />
                    <button style={S.rmBtn} onClick={() => { setPlanFile(null); setPlanPrev(null); }}>✕</button>
                  </div>
                ) : (
                  <div
                    style={S.drop(draggingPlan)}
                    onDragOver={(e) => { e.preventDefault(); setDraggingPlan(true); }}
                    onDragLeave={() => setDraggingPlan(false)}
                    onDrop={(e) => { e.preventDefault(); setDraggingPlan(false); pickFile(e.dataTransfer.files[0], 'plan'); }}
                    onClick={() => planRef.current?.click()}
                  >
                    <input ref={planRef} type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={(e) => pickFile(e.target.files[0], 'plan')} />
                    <span style={{ fontSize: 38, marginBottom: 10 }}>📐</span>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Charger le Plan</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Glissez-déposez ici</div>
                  </div>
                )}
                <div style={{ marginTop: 10, fontSize: 11, color: '#6B7280', textAlign: 'center' }}>
                  {planFile ? planFile.name : 'JPG · PNG · WEBP'}
                </div>
              </div>

              {/* Photo */}
              <div style={S.card(!!photoPrev)}>
                <div style={S.cardTag('photo')}>Photo du Chantier</div>
                {photoPrev ? (
                  <div style={S.prevBox}>
                    <img src={photoPrev} alt="Chantier" style={S.prevImg} />
                    <button style={S.rmBtn} onClick={() => { setPhotoFile(null); setPhotoPrev(null); }}>✕</button>
                  </div>
                ) : (
                  <div
                    style={S.drop(draggingPhoto)}
                    onDragOver={(e) => { e.preventDefault(); setDraggingPhoto(true); }}
                    onDragLeave={() => setDraggingPhoto(false)}
                    onDrop={(e) => { e.preventDefault(); setDraggingPhoto(false); pickFile(e.dataTransfer.files[0], 'photo'); }}
                    onClick={() => photoRef.current?.click()}
                  >
                    <input ref={photoRef} type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={(e) => pickFile(e.target.files[0], 'photo')} />
                    <span style={{ fontSize: 38, marginBottom: 10 }}>📸</span>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Charger la Photo</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Glissez-déposez ici</div>
                  </div>
                )}
                <div style={{ marginTop: 10, fontSize: 11, color: '#6B7280', textAlign: 'center' }}>
                  {photoFile ? photoFile.name : 'Photo réelle du terrain'}
                </div>
              </div>
            </div>

            <div style={S.action}>
              {error && <div style={S.err}>⚠️ {error}</div>}
              {loading ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={S.spinner} />
                  <div style={{ fontSize: 14, color: '#6B7280' }}>Analyse en cours…</div>
                </div>
              ) : (
                <button style={S.btn(!planFile || !photoFile)} disabled={!planFile || !photoFile} onClick={runCompare}>
                  🔍 COMPARER PLAN &amp; PHOTO
                </button>
              )}
              <div style={S.eng}>⚡ ResNet18 · Vision locale · 100% gratuit</div>
            </div>
          </>
        )}

        {/* ══════════════ STEP 2 : COMPAT RESULT ══════════════ */}
        {step === 'compat' && result && (
          <>
            <header style={{ ...S.header, marginBottom: '1.5rem' }}>
              <span style={S.badge}>Étape 2 — Résultat de Conformité</span>
              <h1 style={{ ...S.h1, fontSize: 26 }}>Plan vs Réalité : Résultat</h1>
            </header>

            {/* Status banner */}
            <div style={S.compat(result.compatible)}>
              <div style={S.compatIcon(result.compatible)}>
                {result.compatible === true ? '✓' : result.compatible === false ? '✕' : '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={S.compatTitle}>
                  {result.compatible === true
                    ? '✅ Chantier Conforme au Plan'
                    : result.compatible === false
                      ? '❌ Écart Détecté — Non Conforme'
                      : '⚠️ Analyse Partielle'}
                </div>
                <div style={S.compatMsg}>{result.message}</div>
              </div>
            </div>

            {/* Plan phase vs Photo phase */}
            <div style={S.vsRow}>
              <div style={S.phBox}>
                <div style={S.phLbl}>Phase du Plan</div>
                <div style={S.phVal}>{result.plan_phase_label || 'Inconnue'}</div>
              </div>
              <div style={S.vsCircle}>VS</div>
              <div style={S.phBox}>
                <div style={S.phLbl}>Phase Réelle</div>
                <div style={S.phVal}>{result.photo_phase_label}</div>
                <div style={{ fontSize: 11, color: '#10B981', marginTop: 6, fontWeight: 600 }}>
                  Confiance : {Math.round(result.photo_confidence * 100)}%
                </div>
              </div>
            </div>

            {/* CTA */}
            {result.compatible !== false ? (
              <div style={{ textAlign: 'center' }}>
                <button style={S.continueBtn} onClick={goProgress}>
                  📊 Voir le % d'Avancement →
                </button>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 10 }}>
                  Le chantier est conforme. Cliquez pour consulter la progression.
                </div>
              </div>
            ) : (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#991B1B', marginBottom: 8 }}>
                  Revue manuelle requise
                </div>
                <div style={{ fontSize: 14, color: '#B91C1C', marginBottom: 16 }}>
                  L'écart entre le plan et la réalité est trop important. Aucun pourcentage d'avancement ne peut être validé automatiquement.
                </div>
                <button style={S.resetBtn} onClick={reset}>← Recommencer</button>
              </div>
            )}

            <button style={{ ...S.resetBtn, marginTop: 20 }} onClick={reset}>← Nouvelle comparaison</button>
          </>
        )}

        {/* ══════════════ STEP 3 : PROGRESS ══════════════ */}
        {step === 'progress' && result && (
          <>
            <header style={{ ...S.header, marginBottom: '1.5rem' }}>
              <span style={S.badge}>Étape 3 — Avancement</span>
              <h1 style={{ ...S.h1, fontSize: 26 }}>Progression du Chantier</h1>
              <p style={{ ...S.sub, fontSize: 14 }}>
                Le chantier a été validé comme conforme au plan. Voici l'avancement estimé.
              </p>
            </header>

            <div style={S.progCard}>
              {/* Big % */}
              <div style={S.bigPct}>~{result.photo_progress}%</div>
              <div style={S.pctNote}>Estimation approximative basée sur la phase visuelle détectée</div>

              {/* Progress bar */}
              <div style={S.track}>
                <div style={S.fill(result.photo_progress, PHASE_COLORS[result.photo_phase] || '#F97316')} />
              </div>
              <div style={S.trackLabels}>
                <span>0% — Début</span>
                <span style={{ fontWeight: 600, color: '#F97316' }}>{result.photo_phase_label}</span>
                <span>100% — Livraison</span>
              </div>

              {/* Phase timeline */}
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 10 }}>
                Timeline du Projet
              </div>
              <div style={S.pipeline}>
                {result.pipeline.map((st) => (
                  <div key={st.id} style={S.pStep(st.active, st.done, PHASE_COLORS[st.id] || '#F97316')}>
                    <span style={{ fontSize: 18 }}>{st.icon}</span>
                    <span style={{ marginTop: 2 }}>{st.label}</span>
                    <span style={{ fontSize: 9, opacity: .7 }}>~{st.pct}%</span>
                  </div>
                ))}
              </div>

              {/* Details */}
              <div style={S.detail2}>
                <div style={S.detBox('#3B82F6')}>
                  <div style={S.detTitle('#3B82F6')}>Observations IA</div>
                  <ul style={S.ul}>
                    {result.observations.map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
                <div style={S.detBox('#10B981')}>
                  <div style={S.detTitle('#10B981')}>Recommandations</div>
                  <ul style={S.ul}>
                    {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              </div>

              {/* Meta */}
              <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 24 }}>
                ID : {result.analysis_id} · {result.elapsed_ms}ms
              </div>
            </div>

            <button style={S.resetBtn} onClick={reset}>← Nouvelle analyse</button>
          </>
        )}
      </div>
    </div>
  );
}
