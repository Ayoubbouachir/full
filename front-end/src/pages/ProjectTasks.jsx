import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProjectTasks.css';

const API_BASE = 'https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net';

const CONSTRUCTION_SPECIALITIES = [
    "Maçonnerie", "Plomberie", "Électricité", "Menuiserie", "Peinture", 
    "Climatisation", "Ferronnerie", "Carrelage", "Étanchéité", "Staff/Plâtre"
];

const ProjectTasks = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [artisans, setArtisans] = useState([]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({ category: CONSTRUCTION_SPECIALITIES[0], description: '', budget: '' });
    const [assigningTaskId, setAssigningTaskId] = useState(null);
    const [filterByProximity, setFilterByProximity] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false); // Debounce assignment
    const [artisanOccupancy, setArtisanOccupancy] = useState({}); // { artisanId: count }
    const [counterState, setCounterState] = useState({}); // { taskId: price }
    const [selectedImg, setSelectedImg] = useState(null); // Fullscreen image modal

    const user = JSON.parse(localStorage.getItem('user'));
    const isEngineer = user?.role === 'Engineer';

    useEffect(() => {
        if (!isEngineer) {
            navigate('/login');
            return;
        }
        fetchProject();
        fetchArtisans();
    }, [projectId]);

    const fetchProject = async () => {
        try {
            const res = await fetch(`${API_BASE}/projects/Find/${projectId}`);
            const data = await res.json();
            setProject(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleFinalizePrice = async (taskId, price) => {
        try {
            const res = await fetch(`${API_BASE}/projects/${projectId}/tasks/${taskId}/finalize`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price })
            });
            if (res.ok) {
                fetchProject();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCounterPrice = async (taskId, counterPrice) => {
        if (!counterPrice || isNaN(counterPrice)) return;
        try {
            const res = await fetch(`${API_BASE}/projects/${projectId}/tasks/${taskId}/counter`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: parseFloat(counterPrice) })
            });
            if (res.ok) {
                fetchProject();
                setCounterState({}); // Reset
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchArtisans = async () => {
        try {
            const res = await fetch(`${API_BASE}/users/FindAll`);
            const data = await res.json();
            // Filter only artisans
            const filtered = data.filter(u => u.role?.toLowerCase() === 'artisan' || u.role?.toLowerCase() === 'worker');
            setArtisans(filtered);

            // Fetch occupancy for each
            const occupancyData = {};
            for (const art of filtered) {
                try {
                    const artId = art._id?.toString() || art._id;
                    const occRes = await fetch(`${API_BASE}/projects/artisans/occupancy/${artId}`);
                    const data = await occRes.json();
                    
                    // If the response is an object with an error message, fallback to 0
                    const count = typeof data === 'number' ? data : 0;
                    occupancyData[art._id] = count;
                } catch (e) {
                    console.error(`Error fetching occupancy for ${art._id}:`, e);
                    occupancyData[art._id] = 0;
                }
            }
            setArtisanOccupancy(occupancyData);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/projects/${projectId}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTask)
            });
            if (res.ok) {
                setShowTaskModal(false);
                setNewTask({ category: CONSTRUCTION_SPECIALITIES[0], description: '', budget: '' });
                fetchProject();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAssignArtisan = async (taskId, artisanId) => {
        if (isAssigning) return; // Prevent double submit
        setIsAssigning(true);
        try {
            const res = await fetch(`${API_BASE}/projects/${projectId}/tasks/${taskId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artisanId })
            });
            if (res.ok) {
                setAssigningTaskId(null);
                fetchProject();
                fetchArtisans(); // Refresh occupancy counts
            } else {
                const errorData = await res.json();
                alert(`Erreur d'assignation : ${errorData.message || "L'artisan n'a pas pu être assigné."}`);
            }
        } catch (err) {
            console.error(err);
            alert("Une erreur de connexion est survenue lors de l'assignation.");
        } finally {
            setIsAssigning(false);
        }
    };

    if (loading) return <div className="pt-loading">Chargement du projet...</div>;
    if (!project) return <div className="pt-error">Projet non trouvé.</div>;

    const totalTasks = project.tasks?.length || 0;
    const progress = totalTasks > 0 
        ? project.tasks.reduce((sum, task) => sum + (task.currentPercentage || 0), 0) / totalTasks 
        : 0;

    const availableSpecialities = CONSTRUCTION_SPECIALITIES.filter(
        spec => !project.tasks?.some(t => t.category === spec)
    );

    return (
        <div className="project-tasks-page">
            <section className="page-banner-section bg-1">
                <div className="container">
                    <div className="page-banner-content">
                        <h2>{project?.nom || 'Chargement...'}</h2>
                        <ul>
                            <li><a href="/">Home</a></li>
                            <li>Détails du Projet & Tâches</li>
                        </ul>
                    </div>
                </div>
            </section>

            <div className="pt-container">
            <header className="pt-header">
                <div>
                    <button className="pt-btn-back" onClick={() => navigate('/engineer/calendar')}>
                        ← Retour au Calendrier
                    </button>
                    <h1>Gestion des Tâches : {project.nom}</h1>
                    <p>Découpez votre projet et invitez des artisans qualifiés.</p>
                </div>
                <button 
                    className="pt-btn-add" 
                    onClick={() => {
                        if (availableSpecialities.length > 0) {
                            setNewTask(prev => ({ ...prev, category: availableSpecialities[0] }));
                            setShowTaskModal(true);
                        } else {
                            alert("Toutes les spécialités ont déjà été ajoutées à ce projet.");
                        }
                    }}
                    disabled={availableSpecialities.length === 0}
                    style={availableSpecialities.length === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                    + Ajouter une tâche
                </button>
            </header>

            <div className="pt-stats">
                <div className="pt-stat-card">
                    <span className="pt-stat-label">Progression Globale</span>
                    <div className="pt-progress-bar">
                        <div className="pt-progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="pt-stat-value">{Math.round(progress)}%</span>
                </div>
                <div className="pt-stat-card">
                    <span className="pt-stat-label">Tâches totales</span>
                    <span className="pt-stat-value">{totalTasks}</span>
                </div>
                <div className="pt-stat-card">
                    <span className="pt-stat-label">Artisans assignés</span>
                    <span className="pt-stat-value">{project.tasks?.filter(t => t.assignedArtisanId).length || 0}</span>
                </div>
            </div>

            <div className="pt-tasks-list">
                {project.tasks?.length === 0 && (
                    <div className="pt-empty">Aucune tâche créée. Commencez par en ajouter une !</div>
                )}
                {project.tasks?.map((task) => (
                    <div key={task.id} className={`pt-task-card status-${task.status}`}>
                        <div className="pt-task-main">
                            <h3>🏷️ {task.category}</h3>
                            <p>{task.description}</p>
                            <div className="pt-task-meta">
                                <span>💵 {task.budget || 'N/A'} TND</span>
                                <span className={`pt-badge badge-${task.status}`}>
                                    {task.status === 'pending' ? '🕒 En attente' : 
                                     task.status === 'accepted' ? '✅ Acceptée' : 
                                     task.status === 'negotiating' ? '🤝 En négociation' :
                                     task.status === 'counter_offered' ? '⚖️ Contre-offre' :
                                     task.status === 'refused' ? '❌ Refusée' : task.status}
                                </span>
                                {task.negotiatedPrice && (
                                    <span className="pt-negotiated-price">🤝 Confirmé : {task.negotiatedPrice} TND</span>
                                )}
                            </div>
                        </div>

                        <div className="pt-task-assignment">
                            {task.assignedArtisanId && task.status !== 'refused' ? (
                                <div className="pt-assigned-info">
                                    <span>👤 Artisan assigné</span>
                                    {(() => {
                                        const art = artisans.find(a => a._id === task.assignedArtisanId);
                                        return (
                                            <>
                                                <strong>{art ? `${art.prenom} ${art.nom}` : `ID: ${task.assignedArtisanId}`}</strong>
                                                {task.status === 'negotiating' ? (
                                                    <div className="pt-negotiation-alert">
                                                        <p>💰 Propose : <strong>{task.artisanProposedPrice} TND</strong></p>
                                                        <div className="pt-negotiation-actions">
                                                            <button 
                                                                className="pt-btn-accept-price" 
                                                                onClick={() => handleFinalizePrice(task.id, task.artisanProposedPrice)}
                                                            >
                                                                Accepter
                                                            </button>
                                                            <div className="pt-counter-input">
                                                                <input 
                                                                    type="number" 
                                                                    placeholder="Contre-prix" 
                                                                    value={counterState[task.id] || ''}
                                                                    onChange={(e) => setCounterState({...counterState, [task.id]: e.target.value})}
                                                                />
                                                                <button onClick={() => handleCounterPrice(task.id, counterState[task.id])}>Contrer</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : task.status === 'counter_offered' ? (
                                                    <div className="pt-negotiation-waiting">
                                                        <span>⏳ En attente de l'artisan (votre offre: {task.budget} DT)</span>
                                                    </div>
                                                ) : (
                                                    <div className="pt-email-sent" style={{ fontSize: '11px', color: '#2c7a7b', marginTop: '4px' }}>
                                                        📧 {task.status === 'accepted' ? 'Collaboration active' : 'Invitation envoyée par email'}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            ) : (
                                <button className="pt-btn-assign" onClick={() => setAssigningTaskId(task.id)}>
                                    {task.status === 'refused' ? '🔄 Assigner un nouvel artisan' : 'Assigner un artisan'}
                                </button>
                            )}
                        </div>


                        {/* --- Progress Section --- */}
                        {(task.currentPercentage !== undefined || (task.progressUpdates && task.progressUpdates.length > 0)) && (
                            <div className="pt-progress-section" style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', textTransform: 'uppercase' }}>🚀 Progression de l'artisan</span>
                                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#f55e1a' }}>{task.currentPercentage || 0}%</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '15px' }}>
                                    <div style={{ width: `${task.currentPercentage || 0}%`, height: '100%', backgroundColor: '#f55e1a', transition: 'width 0.3s ease' }}></div>
                                </div>
                                
                                {task.progressUpdates && task.progressUpdates.length > 0 && (
                                    <details style={{ cursor: 'pointer' }}>
                                        <summary style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>📜 Voir l'historique complet</summary>
                                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {[...task.progressUpdates].reverse().map((update, idx) => (
                                                <div key={idx} style={{ paddingLeft: '12px', borderLeft: '2px solid #cbd5e1', position: 'relative' }}>
                                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(update.date).toLocaleString()} &bull; {update.percentage}%</div>
                                                    <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0' }}>{update.description || 'Mis à jour'}</p>
                                                    {update.images && update.images.length > 0 && (
                                                        <div style={{ display: 'flex', gap: '5px', marginTop: '5px', flexWrap: 'wrap' }}>
                                                            {update.images.map((img, i) => (
                                                                <img 
                                                                    key={i} 
                                                                    src={img} 
                                                                    alt="progress" 
                                                                    style={{ 
                                                                        width: '60px', 
                                                                        height: '60px', 
                                                                        objectFit: 'cover', 
                                                                        borderRadius: '6px', 
                                                                        border: '1px solid #e2e8f0',
                                                                        cursor: 'pointer',
                                                                        transition: 'transform 0.2s'
                                                                    }} 
                                                                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                                                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                                                    onClick={() => setSelectedImg(img)}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    {update.hasSafetyCheck && (
                                                        <div style={{ 
                                                            marginTop: '8px', 
                                                            padding: '8px', 
                                                            backgroundColor: update.safetyStatus === 'danger' ? '#fef2f2' : (update.safetyStatus === 'warning' ? '#fffbeb' : (update.safetyStatus === 'ok' ? '#f0fdf4' : '#f8fafc')), 
                                                            border: `1px solid ${update.safetyStatus === 'danger' ? '#fecaca' : (update.safetyStatus === 'warning' ? '#fef3c7' : (update.safetyStatus === 'ok' ? '#bbf7d0' : '#e2e8f0'))}`, 
                                                            borderRadius: '6px' 
                                                        }}>
                                                            <strong style={{ 
                                                                color: update.safetyStatus === 'danger' ? '#dc2626' : (update.safetyStatus === 'warning' ? '#d97706' : (update.safetyStatus === 'ok' ? '#16a34a' : '#64748b')), 
                                                                fontSize: '12px', 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                gap: '4px' 
                                                            }}>
                                                                <span>
                                                                    {update.safetyStatus === 'danger' ? '🔴' : (update.safetyStatus === 'warning' ? '🟠' : (update.safetyStatus === 'ok' ? '✅' : 'ℹ️'))}
                                                                </span> 
                                                                {update.safetyStatus === 'danger' ? 'DANGER : Infraction Critique' : 
                                                                 (update.safetyStatus === 'warning' ? 'AVERTISSEMENT : Conformité Partielle' : 
                                                                  (update.safetyStatus === 'ok' ? 'SÉCURITÉ : Conformité Totale' : 'INFO : Aucune personne détectée'))}
                                                            </strong>
                                                            <p style={{ 
                                                                margin: '2px 0 0 0', 
                                                                fontSize: '11px', 
                                                                color: update.safetyStatus === 'danger' ? '#991b1b' : (update.safetyStatus === 'warning' ? '#92400e' : (update.safetyStatus === 'ok' ? '#15803d' : '#64748b')) 
                                                            }}>
                                                                {update.safetyDetails}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                )}
                            </div>
                        )}
                        
                    </div>
                ))}
            </div>

            {/* Add Task Modal */}
            {showTaskModal && (
                <div className="pt-modal-overlay">
                    <div className="pt-modal">
                        <h2>Nouvelle Tâche</h2>
                        <form onSubmit={handleAddTask}>
                            <div className="pt-form-group">
                                <label>Spécialité requise</label>
                                <select 
                                    className="pt-select"
                                    value={newTask.category} 
                                    onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd' }}
                                >
                                    {availableSpecialities.map(spec => <option key={spec} value={spec}>{spec}</option>)}
                                </select>
                            </div>
                            <div className="pt-form-group">
                                <label>Description du travail</label>
                                <textarea 
                                    value={newTask.description} 
                                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                                />
                            </div>
                            <div className="pt-form-group">
                                <label>Budget Estimé (TND)</label>
                                <input 
                                    type="number" 
                                    value={newTask.budget} 
                                    onChange={(e) => setNewTask({...newTask, budget: e.target.value})}
                                />
                            </div>
                            <div className="pt-modal-actions">
                                <button type="button" onClick={() => setShowTaskModal(false)}>Annuler</button>
                                <button type="submit" className="pt-btn-primary">Créer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Artisan Modal */}
            {assigningTaskId && (
                <div className="pt-modal-overlay">
                    <div className="pt-modal">
                        <h2>Assigner un Artisan</h2>
                        <p>Sélectionnez un artisan pour cette tâche :</p>
                        <div className="pt-filters" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input 
                                type="checkbox" 
                                id="proximity" 
                                checked={filterByProximity} 
                                onChange={(e) => setFilterByProximity(e.target.checked)} 
                            />
                            <label htmlFor="proximity" style={{ margin: 0, fontSize: '14px', cursor: 'pointer' }}>
                                📍 Afficher uniquement les artisans de <strong>{project.location || "Tunis"}</strong>
                            </label>
                        </div>

                        <div className="pt-artisan-list">
                            {artisans
                                .filter(art => {
                                    const normalizeForMatch = (str) => {
                                        if (!str) return "";
                                        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                                    };
                                    
                                    // 1. Filter by specialty of the task
                                    const task = project.tasks?.find(t => t.id === assigningTaskId);
                                    if (!task) return true;
                                    
                                    const matchesSpec = normalizeForMatch(art.speciality) === normalizeForMatch(task.category);
                                    
                                    // 2. Filter by location if enabled
                                    const matchesLoc = !filterByProximity || art.position === project.location;
                                    
                                    return matchesSpec && matchesLoc;
                                })
                                .map(artisan => {
                                    const projectsCount = artisanOccupancy[artisan._id] || 0;
                                    const isOccupied = projectsCount >= 3;

                                    return (
                                        <div 
                                            key={artisan._id} 
                                            className={`pt-artisan-item ${isOccupied || isAssigning ? 'occupied' : ''}`} 
                                            onClick={() => !isOccupied && !isAssigning && handleAssignArtisan(assigningTaskId, artisan._id)}
                                            style={(isOccupied || isAssigning) ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                                        >
                                            <div className="pt-artisan-avatar">{artisan.prenom?.[0] || 'A'}</div>
                                            <div className="pt-artisan-info">
                                                <strong>{artisan.prenom} {artisan.nom}</strong>
                                                <span>🏗️ {artisan.speciality} | 📍 {artisan.position || 'N/A'}</span>
                                                <div className="pt-artisan-status-count">
                                                    {isOccupied ? (
                                                        <span className="pt-badge-occupied">⚠️ Occupé (Maximum 3 projets)</span>
                                                    ) : (
                                                        <span className="pt-badge-free">✅ Disponible ({projectsCount}/3 projets)</span>
                                                    )}
                                                </div>
                                            </div>
                                            {!isOccupied && (
                                                <button className="pt-btn-invite" disabled={isAssigning}>
                                                    {isAssigning ? "Envoi..." : "Inviter"}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            {artisans.filter(art => {
                                const task = project.tasks?.find(t => t.id === assigningTaskId);
                                return task && art.speciality === task.category && (!filterByProximity || art.position === project.location);
                            }).length === 0 && (
                                <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                                    Aucun artisan trouvé pour cette spécialité {filterByProximity ? `à ${project.location}` : ""}.
                                </p>
                            )}
                        </div>
                        <button className="pt-btn-close-modal" onClick={() => setAssigningTaskId(null)}>Fermer</button>
                    </div>
                </div>
            )}
        </div>
    {/* Fullscreen Image Modal Overlay */}
    {selectedImg && (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.92)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                cursor: 'zoom-out'
            }}
            onClick={() => setSelectedImg(null)}
        >
            <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                <button 
                    style={{
                        position: 'absolute',
                        top: '-40px',
                        right: '-40px',
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        cursor: 'pointer',
                        fontSize: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    onClick={() => setSelectedImg(null)}
                >
                    &times;
                </button>
                <img 
                    src={selectedImg} 
                    alt="Zoomed" 
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain',
                        boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                        borderRadius: '4px'
                    }}
                    onClick={e => e.stopPropagation()} 
                />
            </div>
        </div>
    )}
    </div>
    );
};

export default ProjectTasks;
