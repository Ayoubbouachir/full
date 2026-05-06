import React, { useState } from 'react';

const EngineerProjectForm = () => {
    const [formData, setFormData] = useState({
        nom: '',
        dateD: '',
        dateF: '',
        cout: '',
        type: '',
        nbArtisan: '',
        maquettes: []
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            
            let currentMaquettes = [...formData.maquettes];

            if (selectedFiles.length > 0) {
                const uploadFormData = new FormData();
                selectedFiles.forEach(file => {
                    uploadFormData.append('images', file);
                });

                const uploadRes = await fetch('https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/projects/upload', {
                    method: 'POST',
                    body: uploadFormData
                });
                const uploadData = await uploadRes.json();
                if (uploadData.files) {
                    currentMaquettes = [...currentMaquettes, ...uploadData.files.map(f => f.path)];
                }
            }

            const payload = {
                ...formData,
                cout: Number(formData.cout),
                nbArtisan: Number(formData.nbArtisan),
                maquettes: currentMaquettes,
                idUserEng: user ? user._id : null
            };
            const response = await fetch('https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                setMessage('Project created successfully!');
                setFormData({ nom: '', dateD: '', dateF: '', cout: '', type: '', nbArtisan: '', maquettes: [] });
                setSelectedFiles([]);
            } else {
                setMessage('Failed to create project.');
            }
        } catch (error) {
            setMessage('Error connecting to server.');
        } finally {
            setLoading(false);
        }
    };

    const containerStyle = {
        maxWidth: '600px',
        margin: '50px auto',
        padding: '30px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    };

    const inputStyle = {
        width: '100%',
        padding: '10px',
        marginBottom: '15px',
        border: '1px solid #ddd',
        borderRadius: '5px'
    };

    return (
        <div style={{ backgroundColor: '#f4f6f9', minHeight: '100vh', padding: '20px' }}>
            <div style={containerStyle}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#f6c23e' }}>Create New Project</h2>
                {message && <div style={{ color: message.includes('success') ? 'green' : 'red', marginBottom: '15px', textAlign: 'center' }}>{message}</div>}
                <form onSubmit={handleSubmit}>
                    <input type="text" name="nom" placeholder="Project Name" value={formData.nom} onChange={handleChange} style={inputStyle} required />
                    <label style={{ display: 'block', marginBottom: '5px' }}>Start Date</label>
                    <input type="date" name="dateD" value={formData.dateD} onChange={handleChange} style={inputStyle} required />
                    <label style={{ display: 'block', marginBottom: '5px' }}>End Date</label>
                    <input type="date" name="dateF" value={formData.dateF} onChange={handleChange} style={inputStyle} required />
                    <input type="number" name="cout" placeholder="Cost" value={formData.cout} onChange={handleChange} style={inputStyle} required />
                    <input type="text" name="type" placeholder="Type" value={formData.type} onChange={handleChange} style={inputStyle} required />
                    <input type="number" name="nbArtisan" placeholder="Number of Workers" value={formData.nbArtisan} onChange={handleChange} style={inputStyle} required />
                    <label style={{ display: 'block', marginBottom: '5px' }}>Project Images</label>
                    <input type="file" multiple onChange={(e) => setSelectedFiles([...e.target.files])} style={inputStyle} accept="image/*" />
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '15px', flexWrap: 'wrap' }}>
                        {formData.maquettes.map((url, idx) => (
                            <div key={idx} style={{ position: 'relative' }}>
                                <img src={url} alt="Project" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                                <button type="button" onClick={() => setFormData({ ...formData, maquettes: formData.maquettes.filter((_, i) => i !== idx) })} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px' }}>&times;</button>
                            </div>
                        ))}
                    </div>
                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#f6c23e', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                        {loading ? 'Creating...' : 'Create Project'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EngineerProjectForm;
