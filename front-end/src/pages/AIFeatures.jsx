import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import './AIFeatures.css';

import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://127.0.0.1:3100';

const AIFeatures = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null)

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, [navigate]);
    const [projectDescription, setProjectDescription] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [recommendation, setRecommendation] = useState(null);
    const [pricePrediction, setPricePrediction] = useState(null);
    const [loading, setLoading] = useState(false);

    const [selectedProducts, setSelectedProducts] = useState({});

    // Compare quotes
    const [quoteCompareResult, setQuoteCompareResult] = useState(null);
    const [quote1, setQuote1] = useState({ label: 'Devis A', total: 1500, itemCount: 3 });
    const [quote2, setQuote2] = useState({ label: 'Devis B', total: 1200, itemCount: 2 });

    // Smart schedule
    const [scheduleResult, setScheduleResult] = useState(null);
    const [scheduleProjectType, setScheduleProjectType] = useState('villa');
    const [scheduleDeadline, setScheduleDeadline] = useState('');
    const [scheduleProjectName, setScheduleProjectName] = useState('');

    // Suggest category
    const [categoryResult, setCategoryResult] = useState(null);
    const [productNameInput, setProductNameInput] = useState('');
    const [productDescInput, setProductDescInput] = useState('');

    // 🏗️ Recommandation de matériaux
    const handleRecommendMaterials = async () => {
        if (!projectDescription.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Description manquante',
                text: 'Veuillez décrire votre projet'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/ai-assistant/recommend-materials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectDescription })
            });

            const data = await response.json();

            if (data && data.recommendations) {
                setRecommendation(data);

                // Initialiser les produits sélectionnés (prendre le moins cher par défaut)
                const initialSelection = {};
                data.recommendations.forEach(cat => {
                    const categoryName = cat.category || 'Matériau';
                    if (cat.options && cat.options.length > 0) {
                        const cheapest = [...cat.options].sort((a, b) => a.prix - b.prix)[0];
                        initialSelection[categoryName] = cheapest;
                    }
                });
                setSelectedProducts(initialSelection);

                Swal.fire({
                    icon: 'success',
                    title: '✅ Recommandations générées!',
                    text: 'Vous pouvez maintenant choisir vos produits préférés.',
                    draggable: true
                });
            } else {
                throw new Error('Données malformées reçues du serveur');
            }
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Impossible de générer les recommandations'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProduct = (category, product) => {
        setSelectedProducts(prev => ({
            ...prev,
            [category]: product
        }));
    };

    const calculateTotal = () => {
        let total = 0;
        if (!recommendation || !recommendation.recommendations) return 0;
        recommendation.recommendations.forEach(cat => {
            const selected = selectedProducts[cat.category];
            if (selected) {
                total += selected.prix * cat.requiredQuantity;
            }
        });
        return total.toFixed(2);
    };

    // 🔮 Prédiction de prix
    const handlePricePrediction = async (productName) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/ai-assistant/predict-price/${encodeURIComponent(productName)}`);
            const data = await response.json();
            setPricePrediction(data);

            Swal.fire({
                icon: 'info',
                title: `📊 ${data.product}`,
                html: `
                    <div style="text-align: left; padding: 10px;">
                        <p><strong>Prix actuel:</strong> ${data.currentPrice} DT</p>
                        <p><strong>Prix prédit:</strong> ${data.predictedPrice} DT</p>
                        <p><strong>Tendance:</strong> ${data.trend}</p>
                        <hr/>
                        <p style="color: #FF6B35;"><strong>${data.recommendation}</strong></p>
                    </div>
                `,
                draggable: true,
                width: 500
            });
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Impossible de prédire le prix'
            });
        } finally {
            setLoading(false);
        }
    };

    // 📄 Génération de devis PDF
    const handleGenerateQuote = async () => {
        if (!clientName || !clientEmail || !projectDescription || Object.keys(selectedProducts).length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Informations manquantes',
                text: 'Veuillez remplir vos infos et choisir au moins un produit'
            });
            return;
        }

        setLoading(true);
        try {
            // Transformer les produits sélectionnés pour le format PDF
            const items = (recommendation?.recommendations || []).map(cat => {
                const selected = selectedProducts[cat.category];
                return {
                    product: selected?.nomP || cat.category || 'Produit',
                    quantity: cat.requiredQuantity || 1,
                    unitPrice: selected?.prix || 0,
                    totalPrice: (selected?.prix || 0) * (cat.requiredQuantity || 1),
                    reason: cat.reason || ''
                };
            }).filter(item => item.unitPrice > 0);

            console.log('Sending items to PDF generator:', items);

            const response = await fetch(`${API_BASE}/ai-assistant/generate-quote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName,
                    clientEmail,
                    projectDescription,
                    items,
                    totalEstimate: calculateTotal(),
                    projectDetails: {
                        projectType: recommendation.projectType,
                        projectSize: recommendation.projectSize,
                        estimatedDuration: recommendation.estimatedDuration,
                        workersNeeded: recommendation.workersNeeded
                    }
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `devis-fullstakers-${Date.now()}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                Swal.fire({
                    icon: 'success',
                    title: '📄 Devis généré!',
                    text: 'Le PDF a été téléchargé avec vos choix personnalisés',
                    draggable: true
                });
            } else {
                throw new Error('Erreur lors de la génération');
            }
        } catch (error) {
            console.error('PDF Generation Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erreur',
                text: 'Impossible de générer le devis PDF: ' + error.message
            });
        } finally {
            setLoading(false);
        }
    };

    // Compare quotes
    const handleCompareQuotes = async () => {
        setLoading(true);
        setQuoteCompareResult(null);
        try {
            const quotes = [
                { id: '1', label: quote1.label, items: [], total: Number(quote1.total) || 0 },
                { id: '2', label: quote2.label, items: [], total: Number(quote2.total) || 0 }
            ];
            const res = await fetch(`${API_BASE}/ai-assistant/compare-quotes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quotes })
            });
            const data = await res.json();
            setQuoteCompareResult(data);
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Erreur', text: e.message });
        } finally {
            setLoading(false);
        }
    };

    // Smart schedule
    const handleSmartSchedule = async () => {
        setLoading(true);
        setScheduleResult(null);
        try {
            const res = await fetch(`${API_BASE}/ai-assistant/smart-schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectType: scheduleProjectType || 'villa',
                    deadline: scheduleDeadline || undefined
                })
            });
            const data = await res.json();
            setScheduleResult(data);
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Erreur', text: e.message });
        } finally {
            setLoading(false);
        }
    };

    // Suggest category
    const handleSuggestCategory = async () => {
        if (!productNameInput.trim() && !productDescInput.trim()) {
            Swal.fire({ icon: 'warning', title: 'Information requise', text: 'Entrez une description du projet ou un nom de produit' });
            return;
        }
        setLoading(true);
        setCategoryResult(null);
        try {
            const res = await fetch(`${API_BASE}/ai-assistant/suggest-category`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productName: productNameInput.trim() || productDescInput.trim().slice(0, 80) || 'Produit',
                    description: productDescInput.trim() || undefined
                })
            });
            const data = await res.json();
            setCategoryResult(data);
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Erreur', text: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-features-page">
            <div className="ai-features-container">
                <header className="ai-hero">
                    <span className="ai-hero-badge">Fullstakers AI Enterprise</span>
                    <h1>Fullstakers AI Features</h1>
                    <p>Material recommendations, price prediction, PDF quotation generation, smart planning, and AI-driven suggestions.</p>
                    <nav className="ai-nav-links" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1.25rem' }}>
                        <Link to="/ai-features/clustering" className="ai-btn" style={{ background: 'rgba(255,154,108,0.2)', color: '#ff9a6c' }}>📊 Clustering de projets</Link>
                        <Link to="/ai-features/assistant" className="ai-btn" style={{ background: 'rgba(255,154,108,0.2)', color: '#ff9a6c' }}>💬 Assistant avec mémoire</Link>
                        <Link to="/ai-features/reports" className="ai-btn" style={{ background: 'rgba(255,154,108,0.2)', color: '#ff9a6c' }}>📑 Rapports auto (PDF/Excel)</Link>
                    </nav>
                </header>

                <div className="ai-cards-grid">
                    <div className="ai-card">
                        <div className="ai-card-header">
                            <div className="ai-card-icon orange">🏗️</div>
                            <h2 className="ai-card-title">Recommandation de Matériaux</h2>
                        </div>
                        <p className="ai-card-desc">Recommandation de matériaux en fonction de vos besoins et de votre budget.</p>
                        <textarea
                            className="ai-input"
                            style={{ minHeight: '100px', resize: 'vertical' }}
                            placeholder="Entrez vos besoins et votre budget ici..."
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                        />
                        <button className="ai-btn ai-btn-primary" onClick={handleRecommendMaterials} disabled={loading}>
                            {loading ? '⏳ Chargement...' : '🔍 Obtenir les recommandations'}
                        </button>

                        {recommendation && recommendation.recommendations && (
                            <>
                                <div className="ai-result" style={{ marginTop: '1.25rem' }}>
                                    <div className="ai-result-title">📋 Personnalisez votre devis</div>
                                    <p><strong>Type:</strong> {recommendation.projectType} ({recommendation.projectSize})</p>
                                    {recommendation.recommendations.map((cat, idx) => (
                                        <div key={idx} className="ai-product-row">
                                            <h5>{cat.category || 'Matériau'} (×{cat.requiredQuantity || 1})</h5>
                                            <p className="ai-card-desc" style={{ marginBottom: '0.75rem' }}>{cat.reason}</p>
                                            <select
                                                className="ai-input"
                                                style={{ marginBottom: 0 }}
                                                value={selectedProducts[cat.category]?._id || ''}
                                                onChange={(e) => {
                                                    const selected = cat.options?.find(opt => opt._id === e.target.value);
                                                    if (selected) handleSelectProduct(cat.category, selected);
                                                }}
                                            >
                                                {cat.options?.map((opt, oIdx) => (
                                                    <option key={oIdx} value={opt._id}>
                                                        {opt.nomP} — {opt.prix?.toFixed(2)} DT {opt.inStock ? '✅' : '⚠️'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                    <div className="ai-total-box">
                                        <h3>Total: {calculateTotal()} DT</h3>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="ai-card">
                        <div className="ai-card-header">
                            <div className="ai-card-icon green">🔮</div>
                            <h2 className="ai-card-title">Prédiction de Prix</h2>
                        </div>
                        <p className="ai-card-desc">Analyse des matériaux pour estimer le coût total.</p>
                        <div className="ai-price-btns">
                            <button type="button" className="ai-price-btn" onClick={() => handlePricePrediction('Power Drill')} disabled={loading}>📊 Power Drill (Perceuse)</button>
                            <button type="button" className="ai-price-btn" onClick={() => handlePricePrediction('Safety Helmet')} disabled={loading}>📊 Safety Helmet (Casque)</button>
                            <button type="button" className="ai-price-btn" onClick={() => handlePricePrediction('Measuring Tape')} disabled={loading}>📊 Measuring Tape (Mètre)</button>
                            <button type="button" className="ai-price-btn" onClick={() => handlePricePrediction('Cement Mixer')} disabled={loading}>📊 Cement Mixer (Bétonnière)</button>
                        </div>
                    </div>
                </div>

                <div className="ai-section">
                    <div className="ai-card">
                        <div className="ai-card-header">
                            <div className="ai-card-icon blue">📄</div>
                            <h2 className="ai-card-title">Génération de Devis PDF</h2>
                        </div>
                        <p className="ai-card-desc">Générez un devis PDF personnalisable et téléchargeable.</p>
                        <div className="ai-row">
                            <div><label className="ai-label">Nom du projet</label><input className="ai-input" type="text" placeholder="www.nom.com" value={clientName} onChange={(e) => setClientName(e.target.value)} /></div>
                            <div><label className="ai-label">Email</label><input className="ai-input" type="email" placeholder="nom@gmail.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} /></div>
                            <div><label className="ai-label">&nbsp;</label><button className="ai-btn ai-btn-primary ai-btn-block" onClick={handleGenerateQuote} disabled={loading}>{loading ? '⏳ Génération...' : 'Télécharger le PDF'}</button></div>
                        </div>
                    </div>
                </div>

                <div className="ai-cards-grid">
                    <div className="ai-card">
                        <div className="ai-card-header">
                            <div className="ai-card-icon purple">📊</div>
                            <h2 className="ai-card-title">Comparer des devis</h2>
                        </div>
                        <p className="ai-card-desc">Comparez plusieurs devis pour trouver la meilleure offre.</p>
                        <div className="ai-row">
                            <div><label className="ai-label">Devis 1</label><input className="ai-input" placeholder="Nom" value={quote1.label} onChange={(e) => setQuote1(prev => ({ ...prev, label: e.target.value }))} /><input className="ai-input" type="number" placeholder="Prix (DT)" value={quote1.total} onChange={(e) => setQuote1(prev => ({ ...prev, total: e.target.value }))} /></div>
                            <div><label className="ai-label">Devis 2</label><input className="ai-input" placeholder="Nom" value={quote2.label} onChange={(e) => setQuote2(prev => ({ ...prev, label: e.target.value }))} /><input className="ai-input" type="number" placeholder="Prix (DT)" value={quote2.total} onChange={(e) => setQuote2(prev => ({ ...prev, total: e.target.value }))} /></div>
                            <div><label className="ai-label">&nbsp;</label><button className="ai-btn ai-btn-primary ai-btn-block" onClick={handleCompareQuotes} disabled={loading}>{loading ? '⏳' : 'Comparer'}</button></div>
                        </div>
                        {quoteCompareResult && (
                            <div className="ai-result">
                                <p><strong>Meilleur prix:</strong> {quoteCompareResult.bestForPrice?.label} ({quoteCompareResult.bestForPrice?.total} DT)</p>
                                <p>{quoteCompareResult.recommendation}</p>
                            </div>
                        )}
                    </div>

                    <div className="ai-card">
                        <div className="ai-card-header">
                            <div className="ai-card-icon amber">📅</div>
                            <h2 className="ai-card-title">Planning intelligent</h2>
                        </div>
                        <p className="ai-card-desc">Optimisez votre projet avec une planification intelligente.</p>
                        <div className="ai-row">
                            <div><label className="ai-label">Type de projet</label><select className="ai-input" value={scheduleProjectType} onChange={(e) => setScheduleProjectType(e.target.value)}><option value="villa">Villa</option><option value="renovation">Rénovation</option><option value="office">Bureau</option></select></div>
                            <div><label className="ai-label">Date de début</label><input className="ai-input" type="date" value={scheduleDeadline} onChange={(e) => setScheduleDeadline(e.target.value)} /></div>
                            <div><label className="ai-label">Nom du projet</label><input className="ai-input" type="text" placeholder="Nom du projet" value={scheduleProjectName} onChange={(e) => setScheduleProjectName(e.target.value)} /></div>
                            <div><label className="ai-label">&nbsp;</label><button className="ai-btn ai-btn-primary ai-btn-block" onClick={handleSmartSchedule} disabled={loading}>{loading ? '⏳' : 'Obtenir le planning'}</button></div>
                        </div>
                        {scheduleResult && (
                            <div className="ai-result">
                                <p><strong>Ouvriers suggérés:</strong> {scheduleResult.suggestedWorkers}</p>
                                <p><strong>Durée:</strong> {scheduleResult.suggestedDurationDays} jours</p>
                                <p><strong>Période:</strong> {scheduleResult.suggestedStart} → {scheduleResult.suggestedEnd}</p>
                                <p><strong>Commander les matériaux avant:</strong> {scheduleResult.recommendedDeliveryBy}</p>
                                <p style={{ color: '#ff9a6c', marginTop: '0.5rem' }}>{scheduleResult.message}</p>
                            </div>
                        )}
                    </div>

                    <div className="ai-card">
                        <div className="ai-card-header">
                            <div className="ai-card-icon orange">🏷️</div>
                            <h2 className="ai-card-title">Suggestion de catégorie</h2>
                        </div>
                        <p className="ai-card-desc">Recevez des suggestions de catégories de produits pour votre projet. de l’ajout de produits.</p>
                        <div className="ai-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <label className="ai-label">Description du projet</label>
                            <textarea className="ai-input" style={{ minHeight: '80px', resize: 'vertical', marginBottom: '0.75rem' }} placeholder="Décrivez votre projet ou le produit..." value={productDescInput} onChange={(e) => setProductDescInput(e.target.value)} />
                            <label className="ai-label">Nom du produit (optionnel)</label>
                            <input className="ai-input" placeholder="Ex: Perceuse sans fil 18V" value={productNameInput} onChange={(e) => setProductNameInput(e.target.value)} style={{ marginBottom: '0.75rem' }} />
                            <button className="ai-btn ai-btn-primary ai-btn-block" onClick={handleSuggestCategory} disabled={loading}>{loading ? '⏳' : 'Obtenir les suggestions'}</button>
                        </div>
                        {categoryResult && (
                            <div className="ai-result">
                                <p><strong>Catégorie suggérée:</strong> {categoryResult.suggestedCategory}</p>
                                <p style={{ fontSize: '0.85rem', color: 'rgba(232,230,227,0.7)' }}>Confiance: {categoryResult.confidence} · Méthode: {categoryResult.method}</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="ai-how">
                    <h4>💡 Comment ça marche ?</h4>
                    <ol>
                        <li><strong>Recommandation:</strong> Obtenez des suggestions de matériaux en fonction de vos besoins.</li>
                        <li><strong>Prédiction:</strong> Obtenez une estimation de prix pour les matériaux sélectionnés</li>
                        <li><strong>Devis PDF:</strong> Générez et téléchargez des devis PDF personnalisés</li>
                        <li><strong>Comparer devis:</strong> Comparez deux devis pour trouver la meilleure offre</li>
                        <li><strong>Planning:</strong> Optimisez votre projet avec une planification intelligente d’effectifs et de livraison</li>
                        <li><strong>Catégories:</strong> Recevez des suggestions de catégories de produits pour votre projet.</li>
                        <li><strong>Clustering, Assistant, Rapports:</strong> Accessibles via les liens ci‑dessus (pages dédiées).</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default AIFeatures;
