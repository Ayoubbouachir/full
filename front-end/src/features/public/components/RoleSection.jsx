import React, { useEffect, useState } from 'react';

const RoleSection = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    if (!user) return null;

    const roleColors = {
        'Artisan': '#4e73df',
        'Supplier': '#1cc88a',
        'Delivery': '#36b9cc',
        'Engineer': '#f6c23e',
        'User': '#858796',
        'Admin': '#e74a3b'
    };

    const color = roleColors[user.role] || '#5a5c69';

    // if (user.role === 'User') return null; // Removed to show profile for everyone

    return (
        <section style={{ backgroundColor: '#f8f9fc', padding: '20px 0', textAlign: 'center', borderBottom: `4px solid ${color}` }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div style={{ padding: '20px', borderRadius: '8px', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ color: color, marginBottom: '10px' }}>Welcome back, {user.role}!</h3>
                            <p style={{ fontSize: '1.1rem', color: '#555' }}>
                                You are signed in as <strong>{user.nom} {user.prenom}</strong>.
                            </p>
                            <div style={{ marginTop: '15px' }}>
                                <span className="badge" style={{ backgroundColor: color, color: 'white', padding: '8px 15px', borderRadius: '20px', fontSize: '0.9rem', marginRight: '10px' }}>
                                    {user.role} Dashboard Capabilities Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default RoleSection;
