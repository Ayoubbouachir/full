import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ArtisanTaskResponse.css';

const API_BASE = 'http://localhost:3100';

const ArtisanTaskResponse = () => {
    const { projectId, taskId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('idle');
    const [selectedProducts, setSelectedProducts] = useState([]);

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!user || user.role?.toLowerCase() !== 'artisan') {
            navigate('/login');
            return;
        }
        // Reset states for new project/task
        setLoading(true);
        setStatus('idle');
        setTask(null);
        setSelectedProducts([]);
        fetchDetails();
    }, [projectId, taskId]);

    const fetchDetails = async () => {
        try {
            const res = await fetch(`${API_BASE}/projects/Find/${projectId}`);
            const data = await res.json();
            console.log("[ATR] Project Data:", data);
            console.log("[ATR] Searching for taskId:", taskId);
            setProject(data);
            const foundTask = data.tasks?.find(t => String(t.id) === String(taskId));
            console.log("[ATR] Found Task:", foundTask);
            setTask(foundTask);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const toggleProduct = (productId) => {
        setSelectedProducts(prev => 
            prev.includes(productId) 
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handleResponse = async (response) => {
        setStatus('loading');
        try {
            const res = await fetch(`${API_BASE}/projects/${projectId}/tasks/${taskId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    artisanId: user._id, 
                    status: response === 'accept' ? 'accepted' : 'refused' 
                })
            });

            if (res.ok && response === 'accept' && selectedProducts.length > 0) {
                // Also save product selection
                await fetch(`${API_BASE}/projects/${projectId}/tasks/${taskId}/select-products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productIds: selectedProducts })
                });
            }

            if (res.ok) {
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className="atr-container success">
                <div className="atr-card animate-in">
                    <div className="atr-icon">✨</div>
                    <h1>Mission Acceptée !</h1>
                    <p>Félicitations ! Votre réponse a été enregistrée avec succès. Préparez-vous à commencer !</p>
                    
                    <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                        <button 
                            className="atr-btn atr-btn-accept" 
                            style={{ flex: 1 }} 
                            onClick={() => navigate(`/artisan/projects/${projectId}/tasks/${taskId}/manage`)}
                        >
                            Gérer l'avancement du projet
                        </button>
                        <button 
                            className="atr-btn atr-btn-refuse" 
                            style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }} 
                            onClick={() => {
                                const targetCategory = (user.speciality || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                navigate(`/produit?category=${encodeURIComponent(targetCategory)}`);
                            }}
                        >
                            Voir les produits (Marketplace)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) return <div className="atr-loading">Chargement de la mission...</div>;
    
    // Check if task already responded
    if (task && task.status !== 'pending' && status !== 'success') {
        return (
            <div className="atr-container">
                <div className="atr-card animate-in">
                    <div className="atr-icon" style={{ fontSize: '40px' }}>{task.status === 'accepted' ? '✅' : '📋'}</div>
                    <h1>{task.status === 'accepted' ? 'Mission en cours' : 'Déjà répondu'}</h1>
                    <p>Vous avez déjà {task.status === 'accepted' ? 'accepté' : 'refusé'} cette mission.</p>
                    
                    {task.status === 'accepted' ? (
                        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                            <button className="atr-btn atr-btn-accept" style={{ flex: 1 }} onClick={() => navigate(`/artisan/projects/${projectId}/tasks/${taskId}/manage`)}>
                                Gérer l'avancement
                            </button>
                            <button className="atr-btn atr-btn-refuse" style={{ flex: 1 }} onClick={() => navigate('/produit')}>
                                Aller au Marketplace
                            </button>
                        </div>
                    ) : (
                        <button className="atr-btn atr-btn-accept" style={{ marginTop: '20px' }} onClick={() => navigate('/produit')}>
                            Aller au Marketplace
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (!task) return <div className="atr-error">Mission non trouvée ou déjà expirée.</div>;

    return (
        <div className="atr-container">
            <div className="atr-card animate-in">
                <div className="atr-label">🤝 Nouvelle Opportunité</div>
                <h1>{task.category}</h1>
                <p className="atr-description">{task.description || "Vous avez été sélectionné pour cette mission spécifique sur la base de votre expertise."}</p>
                
                <div className="atr-details">
                    <div className="atr-detail">
                        <small>📂 Projet Global</small>
                        <strong>{project.nom}</strong>
                    </div>
                    <div className="atr-detail">
                        <small>💰 Budget Proposé</small>
                        <strong className="atr-price">{task.budget || 'Non défini'} TND</strong>
                    </div>
                </div>



                <div className="atr-actions">
                    <button 
                        className="atr-btn atr-btn-refuse" 
                        onClick={() => handleResponse('refuse')}
                        disabled={status === 'loading'}
                    >
                        Désolé, je passe
                    </button>
                    <button 
                        className="atr-btn atr-btn-accept" 
                        onClick={() => handleResponse('accept')}
                        disabled={status === 'loading'}
                    >
                        {status === 'loading' ? '⏳ Confirmation...' : 'Accepter et valider mes choix'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArtisanTaskResponse;
