import React, { useEffect, useState, useCallback } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';

import { Html5QrcodeScanner } from 'html5-qrcode';

const DeliveryOrders = () => {
    const [pendingOrders, setPendingOrders] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [scanning, setScanning] = useState(false);
    const navigate = useNavigate();


    const { search } = useLocation();
    const queryParams = new URLSearchParams(search);
    const tabParam = queryParams.get('tab');

    useEffect(() => {
        if (tabParam === 'pending' || tabParam === 'mine') {
            setActiveTab(tabParam);
        }
    }, [tabParam]);


    const fetchOrders = useCallback(async (userId) => {
        setLoading(true);
        try {
            const apiBase = `http://${window.location.hostname}:3100`;
            const response = await fetch(`${apiBase}/orders/FindAll`);
            const data = await response.json();

            if (Array.isArray(data)) {

                setPendingOrders(data.filter(o => {
                    const s = (o.status || '').toLowerCase();
                    return s === 'pending' || s === 'cash on delivery';
                }));
                const mine = data.filter(o => o.idUser2 === userId || o.driverId === userId);
                setMyOrders(mine);

            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchOrders(parsedUser._id);
    }, [navigate, fetchOrders]);

    const handleAcceptOrder = async (orderId) => {
        if (!window.confirm('Accept this delivery?')) return;
        try {
            const apiBase = `http://${window.location.hostname}:3100`;
            const response = await fetch(`${apiBase}/orders/${orderId}/accept`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({ 
                    driverId: user._id,
                    driverName: (user.prenom && user.nom) ? `${user.prenom} ${user.nom}` : user.name || user.fullName || user.email || 'Chauffeur'
                })

            });

            if (response.ok) {
                fetchOrders(user._id);
                setActiveTab('mine');
            }
        } catch (error) {
            console.error('Accept error:', error);
        }
    };

    const confirmDelivery = useCallback(async (orderId) => {
        try {
            const apiBase = `http://${window.location.hostname}:3100`;
            const response = await fetch(`${apiBase}/orders/${orderId}/complete`, {
                method: 'PATCH'
            });

            if (response.ok) {
                alert('Delivery Confirmed! Status updated to Delivered.');
                fetchOrders(user._id);
            } else {
                alert('Failed to confirm delivery.');
            }
        } catch (error) {
            console.error('Confirm error:', error);
        }
    }, [user, fetchOrders]);

    const onScanSuccess = useCallback(async (decodedText) => {
        // Expected format: CONFIRM_DELIVERY:orderId:clientId
        if (decodedText.startsWith('CONFIRM_DELIVERY:')) {

            const parts = decodedText.split(':');
            const orderId = parts[1];

            setScanning(false);
            confirmDelivery(orderId);
        }
    }, [confirmDelivery]);

    const onScanError = (err) => {
        // console.warn(err);
    };

    useEffect(() => {
        if (scanning) {
            const scanner = new Html5QrcodeScanner("reader", {
                fps: 20,
                qrbox: { width: 280, height: 280 },
                aspectRatio: 1.0,
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true
                }
            });

            scanner.render(onScanSuccess, onScanError);

            return () => {
                scanner.clear().catch(err => console.error("Failed to clear scanner", err));
            };
        }
    }, [scanning, onScanSuccess]);

    const containerStyle = {
        maxWidth: '900px',
        margin: '40px auto',
        padding: '30px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
    };

    if (!user) return null;

    return (
        <div style={{ backgroundColor: '#f4f6f9', minHeight: '100vh', padding: '20px' }}>
            <div style={containerStyle}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 style={{ color: '#2c3e50', fontWeight: 'bold' }}>🚚 Delivery Management</h2>
                </div>

                <div className="d-flex justify-content-center gap-3 mb-4">
                    <button onClick={() => setActiveTab('pending')} className={`btn px-4 py-2 rounded-pill fw-bold ${activeTab === 'pending' ? 'btn-primary' : 'btn-light'}`} style={activeTab === 'pending' ? { backgroundColor: '#f55e1a', borderColor: '#f55e1a' } : {}}>Marketplace</button>
                    <button onClick={() => setActiveTab('mine')} className={`btn px-4 py-2 rounded-pill fw-bold ${activeTab === 'mine' ? 'btn-primary' : 'btn-light'}`} style={activeTab === 'mine' ? { backgroundColor: '#4e73df', borderColor: '#4e73df' } : {}}>My Deliveries</button>

                    <button onClick={() => navigate('/delivery/ai-predict')} className="btn btn-dark px-4 py-2 rounded-pill fw-bold">
                        <i className="icofont-magic-alt me-2"></i> AI Traffic Predictor
                    </button>

                </div>

                {scanning && (
                    <div className="mb-4 text-center p-3 border rounded bg-white shadow-sm">
                        <div id="reader" style={{ maxWidth: '400px', margin: '0 auto' }}></div>
                        <div className="mt-3 pt-3 border-top">
                            <p className="text-muted small mb-2">QR Scan failing? Try manual confirmation:</p>
                            <button
                                onClick={() => {
                                    const id = window.prompt("Please enter the Order ID (e.g. 5A23D7):");
                                    if (id && id.length >= 4) {

                                        const order = myOrders.find(o => 
                                            o._id.toString().substring(o._id.length - 8).toUpperCase() === id.toUpperCase() ||
                                            o._id.toString().toUpperCase().includes(id.toUpperCase())
                                        );

                                        if (order) confirmDelivery(order._id);
                                        else alert("Invalid Order ID");
                                    }
                                }}
                                className="btn btn-outline-secondary btn-sm rounded-pill px-4"
                            >
                                <i className="icofont-keyboard me-2"></i> Enter ID Manually
                            </button>
                        </div>
                        <button onClick={() => setScanning(false)} className="btn btn-danger mt-3 rounded-pill px-4">Cancel Scan</button>
                    </div>
                )}

                {loading ? (
                    <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                ) : (
                    <div>
                        {activeTab === 'pending' ? (
                            <div>

                                {pendingOrders.length === 0 ? (
                                    <div className="text-center p-5 text-muted">No pending orders in marketplace.</div>
                                ) : (
                                    pendingOrders.map(order => (
                                        <div key={order._id} className="card border-0 shadow-sm p-3 mb-3" style={{ borderLeft: '5px solid #f55e1a' }}>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <div className="fw-bold">Order #{order._id.substring(order._id.length - 8).toUpperCase()}</div>
                                                    <div className="small text-secondary">{order.totalPrice} DT</div>
                                                </div>
                                                <button onClick={() => handleAcceptOrder(order._id)} className="btn btn-sm text-white px-3 py-2 rounded-pill fw-bold" style={{ backgroundColor: '#f55e1a' }}>Accept Delivery</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div>
                                {myOrders.length === 0 ? (
                                    <div className="text-center p-5 text-muted">You haven't accepted any deliveries yet.</div>
                                ) : (
                                    myOrders.map(order => {
                                        const status = (order.status || '').toLowerCase();
                                        return (
                                            <div key={order._id} className="card border-0 shadow-sm p-3 mb-3" style={{ borderLeft: `5px solid ${status === 'delivered' ? '#1cc88a' : '#4e73df'}` }}>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <div className="fw-bold">Order #{order._id.substring(order._id.length - 8).toUpperCase()}</div>
                                                        <div className="small text-secondary">Status: <span className="badge bg-info">{order.status}</span></div>
                                                    </div>
                                                    <div className="text-end">
                                                        {(status === 'assigned' || status === 'in transit' || status === 'accepted') && (
                                                            <button onClick={() => setScanning(true)} className="btn btn-success btn-sm rounded-pill px-3">
                                                                <i className="icofont-qr-code me-1"></i> Confirm Delivery (Scan QR)
                                                            </button>
                                                        )}
                                                        {status === 'delivered' && (
                                                            <span className="text-success fw-bold"><i className="icofont-check-circled"></i> Delivered</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryOrders;
