import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ArtisanTaskManage.css';

const API_BASE = 'http://localhost:3100';

const ArtisanTaskManage = () => {
    const { projectId, taskId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Form state
    const [description, setDescription] = useState('');
    const [percentage, setPercentage] = useState(0);
    const [images, setImages] = useState([]); // File objects
    const [imagePreviews, setImagePreviews] = useState([]);
    const [selectedImg, setSelectedImg] = useState(null); // Fullscreen modal
    const fileInputRef = useRef(null);

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!user || user.role?.toLowerCase() !== 'artisan') {
            navigate('/login');
            return;
        }
        fetchDetails();
    }, [projectId, taskId]);

    const fetchDetails = async () => {
        try {
            const res = await fetch(`${API_BASE}/projects/Find/${projectId}`);
            if (!res.ok) throw new Error('Project not found');
            const data = await res.json();
            
            setProject(data);
            const foundTask = data.tasks?.find(t => String(t.id) === String(taskId));
            
            if (foundTask) {
                setTask(foundTask);
                setPercentage(foundTask.currentPercentage || 0);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
            alert("Erreur de chargement");
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Add to state
        setImages(prev => [...prev, ...files]);

        // Create previews
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        if (!description.trim() && images.length === 0 && percentage === task?.currentPercentage) {
            alert('Veuillez ajouter une description, des photos ou modifier l\'avancement.');
            return;
        }

        setSubmitting(true);
        try {
            let uploadedImagePaths = [];

            // 1. Upload images if any
            if (images.length > 0) {
                const formData = new FormData();
                images.forEach(img => formData.append('images', img));

                const uploadRes = await fetch(`${API_BASE}/projects/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    uploadedImagePaths = uploadData.files?.map(f => f.path) || [];
                }
            }

            // 2. Submit progress
            const progressDto = {
                description,
                percentage: Number(percentage),
                images: uploadedImagePaths
            };

            const res = await fetch(`${API_BASE}/projects/${projectId}/tasks/${taskId}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    artisanId: user._id,
                    ...progressDto
                })
            });

            if (res.ok) {
                alert('Mise à jour enregistrée avec succès !');
                // Refresh
                setDescription('');
                setImages([]);
                setImagePreviews([]);
                fetchDetails();
            } else {
                const errData = await res.json();
                alert(`Erreur: ${errData.message || 'Échec de la mise à jour'}`);
            }
        } catch (err) {
            console.error(err);
            alert('Erreur réseau.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="atm-container"><p>Chargement...</p></div>;
    if (!task) return <div className="atm-container"><p>Tâche introuvable.</p></div>;

    const history = task.progressUpdates ? [...task.progressUpdates].reverse() : [];

    return (
        <div className="atm-container">
            <div className="atm-header">
                <h1>Gérer l'Avancement</h1>
                <p>Mission: {task.category} &bull; Projet: {project?.nom}</p>
            </div>

            <div className="atm-grid">
                {/* Main Form Area */}
                <div className="atm-card">
                    <h2 className="atm-card-title">🚀 Nouvelle Mise à Jour</h2>
                    <form onSubmit={handleSubmit}>
                        
                        <div className="atm-form-group">
                            <label className="atm-label">Pourcentage d'avancement (actuel: {task.currentPercentage || 0}%)</label>
                            <div className="atm-range-wrapper">
                                <input 
                                    type="range" 
                                    className="atm-range" 
                                    min="0" max="100" step="5"
                                    value={percentage}
                                    onChange={(e) => setPercentage(e.target.value)}
                                />
                                <span className="atm-range-val">{percentage}%</span>
                            </div>
                        </div>

                        <div className="atm-form-group">
                            <label className="atm-label">Description des travaux réalisés</label>
                            <textarea 
                                className="atm-textarea"
                                placeholder="Qu'avez-vous accompli aujourd'hui ?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="atm-form-group">
                            <label className="atm-label">Photos (Optionnel)</label>
                            <div 
                                className="atm-upload-box" 
                                onClick={() => fileInputRef.current.click()}
                            >
                                <div className="atm-upload-icon">📸</div>
                                <div className="atm-upload-text">
                                    Cliquez pour <strong>ajouter des photos</strong>
                                </div>
                                <input 
                                    type="file" 
                                    multiple 
                                    accept="image/*" 
                                    style={{ display: 'none' }} 
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                            </div>

                            {imagePreviews.length > 0 && (
                                <div className="atm-preview-grid">
                                    {imagePreviews.map((src, idx) => (
                                        <div key={idx} className="atm-preview-item">
                                            <img src={src} alt="preview" />
                                            <button 
                                                type="button" 
                                                className="atm-preview-remove"
                                                onClick={() => removeImage(idx)}
                                            >&times;</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            className="atm-btn-submit"
                            disabled={submitting}
                        >
                            {submitting ? 'Envoi en cours...' : 'Publier la mise à jour'}
                        </button>
                    </form>
                </div>

                {/* Sidebar */}
                <div>
                    <div className="atm-stat-box">
                        <div className="atm-stat-val">{task.currentPercentage || 0}%</div>
                        <div className="atm-stat-label">Progression Totale</div>
                    </div>

                    <div className="atm-card">
                        <h2 className="atm-card-title">📜 Historique</h2>
                        {history.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Aucun historique pour le moment.</p>
                        ) : (
                            <div className="atm-history-list">
                                {history.map((h, i) => (
                                    <div key={i} className="atm-history-item">
                                        <div className="atm-history-date">{new Date(h.date).toLocaleString()}</div>
                                        <div className="atm-history-pct">{h.percentage}%</div>
                                        {h.description && <p className="atm-history-desc">{h.description}</p>}
                                                {h.images && h.images.length > 0 && (
                                                    <div className="atm-preview-grid" style={{ marginTop: '10px' }}>
                                                        {h.images.map((img, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className="atm-preview-item" 
                                                                style={{ 
                                                                    width: '50px', 
                                                                    height: '50px',
                                                                    cursor: 'pointer',
                                                                    transition: 'transform 0.2s'
                                                                }}
                                                                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                                                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                                                onClick={() => setSelectedImg(img)}
                                                            >
                                                                <img src={img} alt="progress" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {h.hasSafetyCheck && (
                                                    <div style={{ 
                                                        marginTop: '8px', 
                                                        padding: '6px 10px', 
                                                        backgroundColor: h.safetyStatus === 'danger' ? '#fef2f2' : (h.safetyStatus === 'warning' ? '#fffbeb' : (h.safetyStatus === 'ok' ? '#f0fdf4' : '#f8fafc')), 
                                                        border: `1px solid ${h.safetyStatus === 'danger' ? '#fecaca' : (h.safetyStatus === 'warning' ? '#fef3c7' : (h.safetyStatus === 'ok' ? '#bbf7d0' : '#e2e8f0'))}`, 
                                                        borderRadius: '8px',
                                                        fontSize: '11px'
                                                    }}>
                                                        <div style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: '5px', 
                                                            color: h.safetyStatus === 'danger' ? '#dc2626' : (h.safetyStatus === 'warning' ? '#d97706' : (h.safetyStatus === 'ok' ? '#16a34a' : '#64748b')), 
                                                            fontWeight: 'bold' 
                                                        }}>
                                                            <span>{h.safetyStatus === 'danger' ? '🔴' : (h.safetyStatus === 'warning' ? '🟠' : (h.safetyStatus === 'ok' ? '✅' : 'ℹ️'))}</span>
                                                            {h.safetyStatus === 'danger' ? 'Danger : Non conforme' : 
                                                             (h.safetyStatus === 'warning' ? 'Avertissement : Partiel' : 
                                                              (h.safetyStatus === 'ok' ? 'Sécurité : Conforme' : 'Info : Aucun ouvrier'))}
                                                        </div>
                                                        <div style={{ color: h.safetyStatus === 'danger' ? '#991b1b' : (h.safetyStatus === 'warning' ? '#92400e' : (h.safetyStatus === 'ok' ? '#15803d' : '#64748b')), marginTop: '2px' }}>
                                                            {h.safetyDetails}
                                                        </div>
                                                    </div>
                                                )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
    {/* Fullscreen Image Modal */}
    {selectedImg && (
        <div 
            style={{
                position: 'fixed', top: 0, left: 0,
                width: '100%', height: '100%',
                backgroundColor: 'rgba(0,0,0,0.92)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 9999, cursor: 'zoom-out'
            }}
            onClick={() => setSelectedImg(null)}
        >
            <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                <button 
                    style={{
                        position: 'absolute', top: '-40px', right: '-40px',
                        background: 'rgba(255,255,255,0.2)', color: 'white',
                        border: 'none', borderRadius: '50%',
                        width: '36px', height: '36px',
                        cursor: 'pointer', fontSize: '22px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    onClick={() => setSelectedImg(null)}
                >
                    &times;
                </button>
                <img 
                    src={selectedImg} 
                    alt="Zoomed" 
                    style={{ 
                        maxWidth: '90vw', maxHeight: '90vh',
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

export default ArtisanTaskManage;
