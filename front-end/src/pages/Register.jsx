import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceInput from '../components/VoiceInput'; // Intégration Saisie Vocale
import FaceAuth from '../components/FaceAuth/FaceAuth'; // Intégration Face ID
import MapPicker from '../components/MapPicker'; // Map pour position
import API_BASE_URL from '../apiConfig';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        role: 'User',
        speciality: '',
        companyName: '',
        companyType: '',
        carPlate: '',
        deplome: '',
        position: '',
        numTele: '',
        faceDescriptor: null // Stockage du descripteur facial
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showFaceCapture, setShowFaceCapture] = useState(false);
    const [showMap, setShowMap] = useState(false);

    // Liste complète des rôles incluant l'Artisan
    const roles = ['Supplier', 'Delivery', 'Engineer', 'User', 'Artisan'];

    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px 0',
        backgroundColor: '#f4f6f9',
        fontFamily: 'Arial, sans-serif'
    };

    const cardStyle = {
        background: 'white',
        padding: '2rem',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '430px',
        width: '100%'
    };

    const inputStyle = {
        width: '100%',
        padding: '12px',
        margin: '10px 0',
        borderRadius: '5px',
        border: '1px solid #ddd',
        fontSize: '16px',
        boxSizing: 'border-box'
    };

    const buttonStyle = {
        width: '100%',
        padding: '12px',
        margin: '10px 0',
        fontSize: '16px',
        cursor: 'pointer',
        border: 'none',
        borderRadius: '5px',
        backgroundColor: '#1cc88a',
        color: 'white',
        fontWeight: 'bold',
        transition: 'background 0.3s'
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleVoiceChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFaceCaptureSuccess = (faceData) => {
        setFormData(prev => ({ ...prev, faceDescriptor: faceData.descriptor || faceData }));
        setShowFaceCapture(false);
        alert("Empreinte faciale enregistrée !");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const contentType = response.headers.get("content-type");
            let data;
            
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(`Le serveur a répondu avec une erreur ${response.status}: ${text.substring(0, 100)}...`);
            }

            if (!response.ok) throw new Error(data.message || 'Registration failed');

            alert('Inscription réussie !');
            navigate('/login');
        } catch (err) {
            setError(Array.isArray(err.message) ? err.message.join(', ') : err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>
                    {showFaceCapture ? 'Enregistrement Visage' : 'Créer un compte'}
                </h2>

                {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

                {showFaceCapture ? (
                    <FaceAuth 
                        mode="register" 
                        onSuccess={handleFaceCaptureSuccess} 
                        onCancel={() => setShowFaceCapture(false)}
                        email={formData.email}
                        password={formData.password}
                        captureOnly={true}
                    />
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* Champs Groupés avec Voice Input - Side by Side */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input type="text" name="prenom" placeholder="Prénom" value={formData.prenom} onChange={handleChange} style={inputStyle} required />
                                <VoiceInput value={formData.prenom} onChange={(v) => handleVoiceChange('prenom', v)} fieldName="prenom" />
                            </div>
                            
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input type="text" name="nom" placeholder="Nom" value={formData.nom} onChange={handleChange} style={inputStyle} required />
                                <VoiceInput value={formData.nom} onChange={(v) => handleVoiceChange('nom', v)} fieldName="nom" />
                            </div>
                        </div>

                        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} style={inputStyle} required />
                        <input type="password" name="password" placeholder="Mot de passe" value={formData.password} onChange={handleChange} style={inputStyle} required />

                        <select name="role" value={formData.role} onChange={handleChange} style={inputStyle}>
                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>

                        {/* Champs spécifiques aux rôles */}
                        {formData.role === 'Supplier' && (
                            <><input type="text" name="companyName" placeholder="Entreprise" value={formData.companyName} onChange={handleChange} style={inputStyle} required />
                              <input type="text" name="companyType" placeholder="Type" value={formData.companyType} onChange={handleChange} style={inputStyle} required /></>
                        )}
                        {formData.role === 'Delivery' && (
                            <input type="text" name="carPlate" placeholder="Matricule Véhicule" value={formData.carPlate} onChange={handleChange} style={inputStyle} required />
                        )}
                        {formData.role === 'Engineer' && (
                            <input type="text" name="deplome" placeholder="Diplôme" value={formData.deplome} onChange={handleChange} style={inputStyle} required />
                        )}
                        {formData.role === 'Artisan' && (
                            <>
                                <input type="text" name="speciality" placeholder="Spécialité" value={formData.speciality} onChange={handleChange} style={inputStyle} required />
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="text" 
                                        name="position" 
                                        placeholder="Position (Lat, Lng)" 
                                        value={formData.position} 
                                        onChange={handleChange} 
                                        style={inputStyle} 
                                        readOnly 
                                        required 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowMap(!showMap)} 
                                        style={{ 
                                            position: 'absolute', 
                                            right: '5px', 
                                            top: '15px', 
                                            padding: '8px 12px', 
                                            fontSize: '12px', 
                                            border: 'none', 
                                            backgroundColor: showMap ? '#e74a3b' : '#36b9cc', 
                                            color: 'white', 
                                            borderRadius: '5px', 
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {showMap ? 'Fermer Carte' : 'Ouvrir Carte 📍'}
                                    </button>
                                </div>
                                {showMap && (
                                    <MapPicker 
                                        onPositionSelect={(val) => handleVoiceChange('position', val)} 
                                        initialValue={formData.position} 
                                    />
                                )}
                                <input type="tel" name="numTele" placeholder="Numéro de téléphone" value={formData.numTele} onChange={handleChange} style={inputStyle} required />
                            </>
                        )}

                        {/* Option Face ID */}
                        <button type="button" onClick={() => setShowFaceCapture(true)} style={{ ...buttonStyle, backgroundColor: '#4e73df', marginTop: '10px' }}>
                            {formData.faceDescriptor ? 'Photo capturée ✓' : 'Enregistrer mon visage pour Face ID'}
                        </button>


                        <button type="submit" style={{ ...buttonStyle, opacity: loading ? 0.7 : 1, marginTop: '20px' }} disabled={loading}>
                            {loading ? 'Inscription...' : "S'inscrire"}
                        </button>
                    </form>
                )}

                <p style={{ marginTop: '1rem', color: '#666', fontSize: '14px' }}>
                    Déjà membre ? <a href="/login" style={{ color: '#4e73df' }}>Se connecter</a>
                </p>
            </div>
        </div>
    );
};

export default Register;
