import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ArtisanMissions.css';

const API_BASE = 'http://localhost:3100';

const ArtisanMissions = () => {
    const navigate = useNavigate();
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!user || user.role?.toLowerCase() !== 'artisan') {
            navigate('/login');
            return;
        }
        fetchMissions();
    }, []);

    const fetchMissions = async () => {
        try {
            const res = await fetch(`${API_BASE}/projects/artisan/${user._id}`);
            const data = await res.json();
            
            // Flatten projects to tasks for the artisan
            const artisanTasks = [];
            data.forEach(project => {
                project.tasks?.forEach(task => {
                    if (String(task.assignedArtisanId) === String(user._id)) {
                        artisanTasks.push({
                            ...task,
                            projectName: project.nom,
                            projectId: project._id,
                            projectLocation: project.lieu
                        });
                    }
                });
            });
            
            setMissions(artisanTasks);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    if (loading) return <div className="am-loading">Chargement de vos missions...</div>;

    return (
        <div className="am-container">
            <header className="am-header">
                <h1>Mes Missions Directes</h1>
                <p>Retrouvez ici les projets auxquels vous avez été invité par des ingénieurs.</p>
            </header>

            {missions.length === 0 ? (
                <div className="am-empty">
                    <div className="am-empty-icon">📂</div>
                    <h2>Aucune mission pour le moment</h2>
                    <p>Dès qu'un ingénieur vous assignera une tâche, elle apparaîtra ici.</p>
                    <button className="am-btn-primary" onClick={() => navigate('/marketplace/available')}>
                        Voir les appels d'offres
                    </button>
                </div>
            ) : (
                <div className="am-grid">
                    {missions.map((mission, idx) => (
                        <div key={idx} className="am-card animate-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                            <div className="am-card-header">
                                <span className={`am-status am-status-${mission.status}`}>
                                    {mission.status === 'pending' ? '⏳ En attente' : 
                                     mission.status === 'accepted' ? '✅ En cours' : 
                                     mission.status === 'refused' ? '❌ Refusée' : mission.status}
                                </span>
                                <span className="am-budget">{mission.budget || 0} TND</span>
                            </div>
                            
                            <div className="am-card-body">
                                <h3>{mission.category}</h3>
                                <div className="am-info">
                                    <span title="Projet">🏢 {mission.projectName}</span>
                                    <span title="Lieu">📍 {mission.projectLocation || 'Lieu non défini'}</span>
                                </div>
                                <p className="am-desc">{mission.description?.substring(0, 100)}{mission.description?.length > 100 ? '...' : ''}</p>
                            </div>

                            <div className="am-card-footer">
                                {mission.status === 'pending' ? (
                                    <button 
                                        className="am-btn-action" 
                                        onClick={() => navigate(`/artisan/task-response/${mission.projectId}/${mission.id}`)}
                                    >
                                        Répondre à l'invitation
                                    </button>
                                ) : mission.status === 'accepted' ? (
                                    <button 
                                        className="am-btn-manage" 
                                        onClick={() => navigate(`/artisan/projects/${mission.projectId}/tasks/${mission.id}/manage`)}
                                    >
                                        Gérer l'avancement
                                    </button>
                                ) : (
                                    <button className="am-btn-disabled" disabled>
                                        Mission {mission.status}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ArtisanMissions;
