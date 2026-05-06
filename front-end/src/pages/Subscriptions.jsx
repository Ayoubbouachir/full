import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import './AIFeatures.css'; // Reuse some styles

const Subscriptions = () => {
    const [plans, setPlans] = useState([]);
    const [currentSub, setCurrentSub] = useState(null);
    const [loading, setLoading] = useState(false);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        // Redirection si l'utilisateur n'est pas un Artisan (et qu'il est connecté)
        if (user && user.role !== 'Artisan') {
            window.location.href = '/';
            return;
        }
        fetchPlans();
        if (user) fetchStatus();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await fetch('http://127.0.0.1:3001/subscriptions/plans');
            const data = await res.json();
            setPlans(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchStatus = async () => {
        try {
            const res = await fetch(`http://127.0.0.1:3001/subscriptions/status/${user._id}`);
            const data = await res.json();
            setCurrentSub(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubscribe = async (planId) => {
        if (!user) {
            const { value: email } = await Swal.fire({
                title: 'Commencez par votre email',
                input: 'email',
                inputLabel: 'Votre adresse email',
                inputPlaceholder: 'nom@exemple.com',
                showCancelButton: true,
                confirmButtonText: 'Continuer vers le paiement',
                cancelButtonText: 'Annuler',
                confirmButtonColor: '#FF6B35'
            });

            if (!email) return;

            setLoading(true);
            try {
                const res = await fetch('http://127.0.0.1:3001/subscriptions/start-guest-subscription', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ planId, email })
                });
                const data = await res.json();
                if (data.paymentUrl) {
                    window.location.href = data.paymentUrl;
                } else {
                    throw new Error('Erreur lors de la préparation du paiement');
                }
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Erreur', text: error.message });
            } finally {
                setLoading(false);
            }
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('http://127.0.0.1:3001/subscriptions/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id, planId })
            });
            const data = await res.json();
            setCurrentSub(data);
            Swal.fire({
                icon: 'success',
                title: 'Félicitations !',
                text: `Vous êtes maintenant abonné au plan ${planId.toUpperCase()}.`
            });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de finaliser l\'abonnement.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-features-page" style={{ padding: '60px 20px' }}>
            <div className="ai-features-container" style={{ maxWidth: '1000px' }}>
                <header className="ai-hero" style={{ marginBottom: '50px' }}>
                    <span className="ai-hero-badge">Paiement Sécurisé</span>
                    <h1>Choisissez votre Plan Artisan</h1>
                    <p>Débloquez des fonctionnalités avancées pour gérer vos chantiers comme un pro.</p>
                </header>

                <div className="ai-cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                    {plans.map((plan) => (
                        <div key={plan.id} className={`ai-card ${currentSub?.planId === plan.id ? 'active-plan' : ''}`} style={{
                            border: currentSub?.planId === plan.id ? '2px solid #FF6B35' : '1px solid #eee',
                            position: 'relative'
                        }}>
                            {currentSub?.planId === plan.id && (
                                <span style={{
                                    position: 'absolute', top: '-10px', right: '10px',
                                    background: '#FF6B35', color: 'white', padding: '2px 10px',
                                    borderRadius: '10px', fontSize: '12px'
                                }}>Actif</span>
                            )}
                            <div className="ai-card-header">
                                <h2 className="ai-card-title">{plan.name}</h2>
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '20px 0', color: '#FF6B35' }}>
                                {plan.price} DT <span style={{ fontSize: '14px', color: '#666' }}>/ mois</span>
                            </div>
                            <ul style={{ textAlign: 'left', marginBottom: '30px', color: '#444' }}>
                                {plan.features.map((f, i) => (
                                    <li key={i} style={{ marginBottom: '10px' }}>✅ {f}</li>
                                ))}
                            </ul>
                            <button
                                className={`ai-btn ${currentSub?.planId === plan.id ? 'ai-btn-secondary' : 'ai-btn-primary'}`}
                                style={{ width: '100%' }}
                                onClick={() => handleSubscribe(plan.id)}
                                disabled={loading || currentSub?.planId === plan.id}
                            >
                                {currentSub?.planId === plan.id ? 'Plan Actuel' : 'S\'abonner'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Subscriptions;
