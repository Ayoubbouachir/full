import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const TUNISIAN_CITIES = [
    "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Sousse", "Monastir", "Mahdia", 
    "Sfax", "Kairouan", "Kasserine", "Sidi Bouzid", "Gabès", "Medenine", "Tataouine", 
    "Gafsa", "Tozeur", "Kebili", "Béja", "Jendouba", "Le Kef", "Siliana", "Bizerte", "Zaghouan"
];

const EngineerCalendar = () => {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showArtisanModal, setShowArtisanModal] = useState(false);
    const [matchingArtisans, setMatchingArtisans] = useState([]);
    const [selectedArtisans, setSelectedArtisans] = useState([]);
    const [createdProjectId, setCreatedProjectId] = useState(null);
    const [pendingPayload, setPendingPayload] = useState(null); // To store details between modals
    const [selectedProject, setSelectedProject] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState({
        nom: '',
        dateD: '',
        dateF: '',
        cout: '',
        type: '',
        nbArtisan: '',
        maquettes: [],
        location: TUNISIAN_CITIES[0]
    });
    const [selectedFiles, setSelectedFiles] = useState([]);

    useEffect(() => {
        fetchProjects();
        fetch('https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/users/FindAll')
            .then(res => res.json())
            .then(data => setAllUsers(data))
            .catch(err => console.error("Error fetching all users:", err));
    }, []);

    const uniqueSpecialties = Array.from(new Set(
        allUsers
            .filter(u => (u.role?.toLowerCase() === 'artisan' || u.role?.toLowerCase() === 'worker') && u.speciality)
            .map(u => u.speciality.trim())
    )).sort();

    const fetchProjects = async () => {
        try {
            const response = await fetch('https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/projects/FindAll');
            const data = await response.json();
            setProjects(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setLoading(false);
        }
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day + 1);
        const dateString = date.toISOString().split('T')[0];
        setSelectedProject(null);
        setFormData({
            nom: '',
            dateD: dateString,
            dateF: dateString,
            cout: '',
            type: '',
            nbArtisan: '',
            maquettes: [],
            location: TUNISIAN_CITIES[0]
        });
        setSelectedFiles([]);
        setShowModal(true);
    };

    const handleProjectClick = (e, project) => {
        e.stopPropagation();
        setSelectedProject(project);
        setFormData({
            nom: project.nom,
            dateD: new Date(project.dateD).toISOString().split('T')[0],
            dateF: new Date(project.dateF).toISOString().split('T')[0],
            cout: project.cout,
            type: project.type,
            nbArtisan: project.nbArtisan,
            maquettes: project.maquettes || [],
            location: project.location || TUNISIAN_CITIES[0]
        });
        setSelectedFiles([]);
        setShowModal(true);
    };

    const handleFileChange = (e) => {
        setSelectedFiles([...e.target.files]);
    };

    const handleDelete = async () => {
        if (!selectedProject || !window.confirm('Are you sure you want to delete this project?')) return;
        try {
            const response = await fetch(`https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/projects/Delete/${selectedProject._id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setShowModal(false);
                fetchProjects();
            }
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem('user'));

        let currentMaquettes = [...formData.maquettes];

        if (selectedFiles.length > 0) {
            const uploadFormData = new FormData();
            selectedFiles.forEach(file => {
                uploadFormData.append('images', file);
            });

            try {
                const uploadRes = await fetch('https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/projects/upload', {
                    method: 'POST',
                    body: uploadFormData
                });
                const uploadData = await uploadRes.json();
                if (uploadData.files) {
                    const newPaths = uploadData.files.map(f => f.path);
                    currentMaquettes = [...currentMaquettes, ...newPaths];
                }
            } catch (error) {
                console.error('Error uploading images:', error);
            }
        }

        const payload = {
            nom: formData.nom,
            dateD: formData.dateD,
            dateF: formData.dateF,
            cout: Number(formData.cout),
            location: formData.location,
            maquettes: currentMaquettes,
            idUserEng: user ? user._id : undefined
        };

        // If EDITING, save immediately
        if (selectedProject) {
            try {
                const response = await fetch(`https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/projects/Update/${selectedProject._id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    setShowModal(false);
                    fetchProjects();
                    alert('Projet mis à jour avec succès !');
                } else {
                    const errInfo = await response.json();
                    alert(`Erreur mise à jour: ${JSON.stringify(errInfo)}`);
                }
                return;
            } catch (error) {
                console.error('Error updating project:', error);
                alert('Erreur réseau lors de la mise à jour.');
                return;
            }
        }

        // If NEW project, create and redirect to tasks
        try {
            const response = await fetch('https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    status: 'pending'
                })
            });
            if (response.ok) {
                const newProj = await response.json();
                setShowModal(false);
                fetchProjects();
                // Direct redirection to task breakdown
                navigate(`/project/${newProj._id}/tasks`);
            } else {
                const errInfo = await response.json();
                alert(`Erreur création: ${JSON.stringify(errInfo)}`);
            }
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Erreur réseau lors de la création.');
        }
    };

    const handleAssignArtisans = async () => {
        const requiredCount = Number(formData.nbArtisan);
        if (selectedArtisans.length !== requiredCount) {
            alert(`You must select exactly ${requiredCount} artisans as specified. Currently: ${selectedArtisans.length}`);
            return;
        }

        try {
            // If NEW project, create it now
            if (!createdProjectId && pendingPayload) {
                const finalPayload = {
                    ...pendingPayload,
                    artisanIds: selectedArtisans,
                    status: 'pending'
                };
                const response = await fetch('https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalPayload)
                });
                if (response.ok) {
                    setShowArtisanModal(false);
                    fetchProjects();
                    alert('Project created and invitations sent to artisans!');
                }
            } else {
                // If EDITING, just update artisanIds
                const response = await fetch(`https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/projects/Update/${createdProjectId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ artisanIds: selectedArtisans })
                });
                if (response.ok) {
                    setShowArtisanModal(false);
                    fetchProjects();
                    alert('Artisans updated successfully!');
                }
            }
        } catch (error) {
            console.error('Error finalizing project:', error);
        }
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();

        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dayDate = new Date(year, month, d);
            const dayProjects = projects.filter(p => {
                const start = new Date(p.dateD);
                const end = new Date(p.dateF);
                // Simple check if the project spans this day
                return dayDate >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
                    dayDate <= new Date(end.getFullYear(), end.getMonth(), end.getDate());
            });

            days.push(
                <div key={d} className="calendar-day" onClick={() => handleDateClick(d - 1)}>
                    <span className="day-number">{d}</span>
                    <div className="day-projects">
                        {dayProjects.map(p => (
                            <div
                                key={p._id}
                                className={`project-tag ${p.status === 'pending' ? 'pending' : 'active'}`}
                                onClick={(e) => handleProjectClick(e, p)}
                                title={p.nom}
                            >
                                {p.nom} {p.status === 'pending' ? '(Pending)' : ''}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="engineer-calendar-page">
            <section className="page-banner-section bg-6">
                <div className="container">
                    <div className="page-banner-content">
                        <h2>Engineer Project Calendar</h2>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li>Project Calendar</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="calendar-container ptb-100">
                <div className="container">
                    <div className="calendar-header">
                        <button onClick={handlePrevMonth} className="nav-btn">&lt;</button>
                        <h3>{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</h3>
                        <button onClick={handleNextMonth} className="nav-btn">&gt;</button>
                    </div>

                    <div className="calendar-grid-wrapper">
                        <div className="calendar-weekdays">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="weekday">{day}</div>
                            ))}
                        </div>
                        <div className="calendar-grid">
                            {loading ? <div className="loading">Loading projects...</div> : renderCalendar()}
                        </div>
                    </div>
                </div>
            </section>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{selectedProject ? 'Edit Project' : 'New Project'}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Project Name</label>
                                <input type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Start Date</label>
                                    <input type="date" min={today} value={formData.dateD} onChange={(e) => setFormData({ ...formData, dateD: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input type="date" min={formData.dateD || today} value={formData.dateF} onChange={(e) => setFormData({ ...formData, dateF: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Budget Global Estimé (TND)</label>
                                    <input type="number" min="0" value={formData.cout} onChange={(e) => setFormData({ ...formData, cout: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>📍 Localisation du projet</label>
                                    <select 
                                        value={formData.location} 
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                                        required
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                    >
                                        {TUNISIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Project Images (Upload multiple)</label>
                                <input type="file" multiple onChange={handleFileChange} accept="image/*" />
                                <div className="current-images">
                                    {formData.maquettes.map((url, idx) => (
                                        <div key={idx} className="image-preview-item" style={{ display: 'inline-block', position: 'relative', margin: '5px' }}>
                                            <img src={url} alt={`Maquette ${idx}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }} />
                                            <button 
                                                type="button" 
                                                onClick={() => setFormData({ ...formData, maquettes: formData.maquettes.filter((_, i) => i !== idx) })}
                                                style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', cursor: 'pointer' }}
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {selectedProject && (
                                        <button type="button" className="delete-btn" onClick={handleDelete} style={{ background: '#ff4d4d' }}>Supprimer</button>
                                    )}
                                    <button type="submit" className="save-btn">{selectedProject ? 'Mettre à jour' : 'Créer le projet'}</button>
                                </div>
                                
                                {selectedProject && (
                                    <button 
                                        type="button" 
                                        className="tasks-btn"
                                        onClick={() => navigate(`/project/${selectedProject._id}/tasks`)}
                                        style={{
                                            background: '#1e3c72',
                                            color: 'white',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 10px rgba(30, 60, 114, 0.2)'
                                        }}
                                    >
                                        ⚙️ Gérer les tâches & Artisans
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showArtisanModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h3>Choose Artisans (Type: {formData.type})</h3>
                            <button className="close-btn" onClick={() => setShowArtisanModal(false)}>&times;</button>
                        </div>
                        <p style={{ color: '#666', marginBottom: '15px' }}>
                            Please select exactly <strong>{formData.nbArtisan}</strong> artisans for this project.
                        </p>
                        <div className="artisans-list">
                            {matchingArtisans.length === 0 ? (
                                <p>No exact matching artisans found for this specialty.</p>
                            ) : (
                                matchingArtisans.map(art => (
                                    <div key={art._id} className="artisan-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
                                        <input
                                            type="checkbox"
                                            id={`art-${art._id}`}
                                            checked={selectedArtisans.includes(art._id)}
                                            onChange={(e) => {
                                                const maxWorkers = Number(formData.nbArtisan);
                                                if (e.target.checked) {
                                                    if (selectedArtisans.length >= maxWorkers) {
                                                        alert(`You can only select up to ${maxWorkers} artisans as per the 'Workers' field.`);
                                                        return;
                                                    }
                                                    setSelectedArtisans([...selectedArtisans, art._id]);
                                                } else {
                                                    setSelectedArtisans(selectedArtisans.filter(id => id !== art._id));
                                                }
                                            }}
                                            style={{ marginRight: '15px' }}
                                        />
                                        <label htmlFor={`art-${art._id}`} style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', margin: 0, width: '100%' }}>
                                            {art.imageUrl && <img src={art.imageUrl} alt={art.nom} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />}
                                            <div>
                                                <h4 style={{ margin: '0 0 5px 0' }}>{art.nom} {art.prenom}</h4>
                                                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                                                    <strong>Speciality:</strong> {art.speciality} <br />
                                                    <strong>Role:</strong> {art.role}
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="delete-btn" onClick={() => setShowArtisanModal(false)} style={{ background: '#6c757d' }}>Skip</button>
                            <button type="button" className="save-btn" onClick={handleAssignArtisans}>Confirm Artisans</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .calendar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    background: #fff;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                }
                .calendar-header h3 {
                    margin: 0;
                    color: #150f03;
                    font-weight: 700;
                }
                .nav-btn {
                    background: #f55e1a;
                    color: white;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    font-size: 20px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .nav-btn:hover {
                    background: #150f03;
                    transform: scale(1.1);
                }
                .calendar-grid-wrapper {
                    background: #fff;
                    border-radius: 10px;
                    padding: 20px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                }
                .calendar-weekdays {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    text-align: center;
                    font-weight: 700;
                    color: #f55e1a;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #eee;
                }
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 1px;
                    background: #eee;
                    border: 1px solid #eee;
                }
                .calendar-day {
                    background: #fff;
                    min-height: 120px;
                    padding: 10px;
                    position: relative;
                    transition: background 0.3s;
                    cursor: pointer;
                }
                .calendar-day:hover {
                    background: #fdf2ee;
                }
                .calendar-day.empty {
                    background: #fafafa;
                    cursor: default;
                }
                .day-number {
                    font-weight: 600;
                    color: #666;
                }
                .day-projects {
                    margin-top: 5px;
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }
                .project-tag {
                    font-size: 11px;
                    padding: 2px 6px;
                    border-radius: 3px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    cursor: pointer;
                    margin-bottom: 2px;
                }
                .project-tag.pending {
                    background: #fdf2ee;
                    color: #f55e1a;
                    border: 1px solid #f55e1a;
                }
                .project-tag.active {
                    background: #f55e1a;
                    color: white;
                }
                .project-tag:hover {
                    opacity: 0.8;
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    backdrop-filter: blur(5px);
                }
                .modal-content {
                    background: #fff;
                    width: 500px;
                    border-radius: 12px;
                    padding: 30px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 15px;
                }
                .modal-header h3 {
                    margin: 0;
                    color: #f55e1a;
                }
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 28px;
                    cursor: pointer;
                    color: #999;
                }
                .form-group {
                    margin-bottom: 15px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 600;
                    color: #444;
                }
                .form-group input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 25px;
                    padding-top: 15px;
                    border-top: 1px solid #eee;
                }
                .save-btn {
                    background: #f55e1a;
                    color: white;
                    border: none;
                    padding: 10px 25px;
                    border-radius: 5px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .delete-btn {
                    background: #dc3545;
                    color: white;
                    border: none;
                    padding: 10px 25px;
                    border-radius: 5px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .loading {
                    grid-column: span 7;
                    text-align: center;
                    padding: 50px;
                    color: #f55e1a;
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
};

export default EngineerCalendar;
