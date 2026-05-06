import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import MapPicker from '../components/MapPicker';


const UserProfile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [editData, setEditData] = useState({});
    const [loading, setLoading] = useState(false);

    const [showMap, setShowMap] = useState(false);


    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setEditData(parsedUser);
        }
    }, []);

    const handleChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditData({ ...editData, imageUrl: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3100/users/Update/${user._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUser(updatedUser);
                setEditData(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                alert('Profile updated successfully!');
            } else {
                alert('Failed to update profile.');
            }
        } catch (err) {
            console.error(err);
            alert('Error updating profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    if (!user) return <div style={{ padding: '50px', textAlign: 'center' }}>Please login to view profile.</div>;

    // Styles matching the screenshot
    const labelStyle = { fontWeight: 'bold', color: '#333', marginBottom: '8px', display: 'block' };
    const inputStyle = { width: '100%', padding: '10px 15px', borderRadius: '5px', border: '1px solid #ddd', backgroundColor: '#fff', color: '#555' };
    const sectionTitleStyle = { fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#333' };

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh', padding: '40px' }}>
            <div className="container">
                <h2 style={sectionTitleStyle}>My Profile</h2>

                {/* Profile Photo Section */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', gap: '20px' }}>
                    <div style={{ fontWeight: 'bold', color: '#333', marginRight: '10px' }}>Profile Photo:</div>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #eee' }}>
                        {editData.imageUrl ? (
                            <img src={editData.imageUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                                {user.prenom ? user.prenom.charAt(0) : 'U'}
                            </div>
                        )}
                    </div>
                    <label style={{ cursor: 'pointer', backgroundColor: '#e6fffa', color: '#38b2ac', padding: '8px 16px', borderRadius: '5px', fontWeight: 'bold', border: 'none' }}>
                        + Upload Photo
                        <input type="file" onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                    </label>
                </div>

                {/* Form Grid */}
                <div className="row">
                    <div className="col-lg-6 mb-4">
                        <label style={labelStyle}>First Name*</label>
                        <input type="text" name="prenom" value={editData.prenom || ''} onChange={handleChange} style={inputStyle} placeholder="Enter first name" />
                    </div>
                    <div className="col-lg-6 mb-4">
                        <label style={labelStyle}>Last Name*</label>
                        <input type="text" name="nom" value={editData.nom || ''} onChange={handleChange} style={inputStyle} placeholder="Enter last name" />
                    </div>

                    <div className="col-lg-6 mb-4">
                        <label style={labelStyle}>Email*</label>
                        <input type="email" name="email" value={editData.email || ''} onChange={handleChange} style={inputStyle} placeholder="Enter email address" />
                    </div>
                    <div className="col-lg-6 mb-4">
                        <label style={labelStyle}>Phone*</label>
                        <input type="text" name="numTele" value={editData.numTele || ''} onChange={handleChange} style={inputStyle} placeholder="Enter phone number" />
                    </div>

                    {user.role === 'Supplier' && (
                        <>
                            <div className="col-lg-6 mb-4">
                                <label style={labelStyle}>Company Name*</label>
                                <input type="text" name="companyName" value={editData.companyName || ''} onChange={handleChange} style={inputStyle} placeholder="Company Name" />
                            </div>
                            <div className="col-lg-6 mb-4">
                                <label style={labelStyle}>Company Type*</label>
                                <input type="text" name="companyType" value={editData.companyType || ''} onChange={handleChange} style={inputStyle} placeholder="Company Type" />
                            </div>
                        </>
                    )}


                    {user.role === 'Artisan' && (

                        <div className="col-lg-6 mb-4">
                            <label style={labelStyle}>Speciality*</label>
                            <input type="text" name="speciality" value={editData.speciality || ''} onChange={handleChange} style={inputStyle} placeholder="Speciality" />
                        </div>
                    )}

                    {user.role === 'Artisan' && (
                        <div className="col-lg-6 mb-4">
                            <label style={labelStyle}>Position*</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type="text" 
                                    name="position" 
                                    value={editData.position || ''} 
                                    style={inputStyle} 
                                    readOnly 
                                    placeholder="Position (Lat, Lng)" 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowMap(!showMap)} 
                                    style={{ 
                                        position: 'absolute', 
                                        right: '5px', 
                                        top: '5px', 
                                        padding: '8px 12px', 
                                        fontSize: '11px', 
                                        border: 'none', 
                                        backgroundColor: showMap ? '#e74a3b' : '#36b9cc', 
                                        color: 'white', 
                                        borderRadius: '4px', 
                                        cursor: 'pointer', 
                                        fontWeight: 'bold' 
                                    }}
                                >
                                    {showMap ? 'Masquer' : 'Carte 📍'}
                                </button>
                            </div>
                            {showMap && (
                                <MapPicker 
                                    onPositionSelect={(v) => setEditData(prev => ({ ...prev, position: v }))} 
                                    initialValue={editData.position} 
                                />
                            )}
                        </div>
                    )}


                    <div className="col-12 mb-4">
                        <label style={labelStyle}>Address*</label>
                        <input type="text" name="address" value={editData.address || ''} onChange={handleChange} style={inputStyle} placeholder="Enter your address" />
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                    <button onClick={handleSave} disabled={loading} style={{ backgroundColor: '#ff9800', color: 'white', padding: '10px 30px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => navigate('/')} style={{ backgroundColor: 'white', color: '#dc3545', border: '1px solid #dc3545', padding: '10px 30px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Cancel
                    </button>
                    <button onClick={handleLogout} style={{ backgroundColor: '#333', color: 'white', padding: '10px 30px', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', marginLeft: 'auto' }}>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;



