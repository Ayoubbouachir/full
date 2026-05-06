import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { io } from 'socket.io-client';

function Notifications() {
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'devis', 'messages'
    const [showQuotationForm, setShowQuotationForm] = useState(false);
    const [formData, setFormData] = useState({
        _id: null,
        clientId: '',
        title: '',
        description: '',
        items: [{ item: '', qty: 1, unitPrice: 0, total: 0 }],
        price: 0,
        estimatedTime: '',
    });
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrCodeData, setQrCodeData] = useState(null);
    const [scanningAi, setScanningAi] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const fileInputRef = React.useRef(null);
    const navigate = useNavigate();

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Initial fetch
        fetchNotifications(parsedUser._id);
        fetchQuotations(parsedUser);

        // Check for URL parameters
        const params = new URLSearchParams(window.location.search);

        const cat = params.get('category');
        if (cat) setActiveCategory(cat);

        const urlClientId = params.get('clientId');
        if (urlClientId) {
            setFormData(prev => ({ ...prev, clientId: urlClientId }));
            setActiveCategory('devis');
            setShowQuotationForm(true);
        }

        // Socket for real-time updates
        const socket = io(`http://${window.location.hostname}:3100`);

        socket.on('connect', () => {

            console.log('Notification socket connected');
            socket.emit('register', parsedUser._id);
        });

        socket.on('newNotification', (newNotif) => {
            console.log('New notification received on Notifications page:', newNotif);
            setNotifications(prev => [newNotif, ...prev]);
            // If it's a quotation notification, refresh the quotations list too
            if (newNotif.type === 'quotation' || newNotif.type === 'quotation_update' || newNotif.title.toLowerCase().includes('devis')) {

                fetchQuotations(parsedUser);
            }
        });

        socket.on('quotationUpdated', () => {
            fetchQuotations(parsedUser);
        });

        return () => socket.disconnect();
    }, [navigate]);

    const fetchNotifications = async (userId) => {
        try {
            const apiBase = `http://${window.location.hostname}:3100`;
            const response = await fetch(`${apiBase}/notifications/user/${userId}`);
            const data = await response.json();
            if (Array.isArray(data)) {
                setNotifications(data);
            } else {
                console.warn('API returned non-array data for notifications:', data);
                setNotifications([]);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
            setLoading(false);
        }
    };

    const fetchQuotations = async (currentUser) => {
        try {

            const role = (currentUser.role === 'Worker' || currentUser.role === 'Artisan' || currentUser.role === 'Engineer') ? 'worker' : 'client';

            const response = await fetch(`http://localhost:3100/quotations/${role}/${currentUser._id}`);
            const data = await response.json();
            setQuotations(data);
        } catch (error) {
            console.error('Error fetching quotations:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await fetch(`http://localhost:3100/notifications/${notificationId}/read`, {
                method: 'PATCH'
            });
            setNotifications(notifications.map(n =>
                n._id === notificationId ? { ...n, read: true } : n
            ));
            // Trigger header refresh
            window.dispatchEvent(new Event('refreshNotifications'));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await fetch(`http://localhost:3100/notifications/${notificationId}`, {
                method: 'DELETE'
            });
            setNotifications(notifications.filter(n => n._id !== notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification._id);
        if (notification.type === 'message' || notification.title.toLowerCase().includes('message')) {
            navigate(`/messages?userId=${notification.senderId}`);
        } else if (notification.type === 'quotation' || notification.title.toLowerCase().includes('devis') || notification.title.toLowerCase().includes('quotation')) {
            setActiveCategory('devis');
        } else if (notification.type === 'task_invitation' || notification.type === 'project_invitation') {
            const ref = notification.referenceId;
            if (ref && ref.includes('|')) {
                const [pid, tid] = ref.split('|');
                navigate(`/artisan/task-response/${pid}/${tid}`);
            } else if (ref) {
                // Fallback for simple project invitation
                navigate(`/project/${ref}/tasks`);
            }
        }
    };

    const handleQuotationSubmit = async (e) => {
        e.preventDefault();
        try {
            const finalPrice = formData.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
            const isEdit = formData._id;
            const url = isEdit ? `http://localhost:3100/quotations/${formData._id}` : 'http://localhost:3100/quotations';
            const method = isEdit ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    workerId: user._id,
                    price: finalPrice,
                    status: 'pending'
                })
            });
            if (response.ok) {
                const savedQuo = await response.json();
                if (isEdit) {
                    setQuotations(quotations.map(q => q._id === savedQuo._id ? savedQuo : q));
                } else {
                    setQuotations([savedQuo, ...quotations]);
                }
                setShowQuotationForm(false);
                setFormData({ _id: null, clientId: '', title: '', description: '', items: [{ item: '', qty: 1, unitPrice: 0, total: 0 }], price: 0, estimatedTime: '' });
                showToast(isEdit ? 'Devis updated successfully!' : 'Devis sent successfully!', 'success');
            }
        } catch (error) {
            console.error('Error saving devis:', error);
        }
    };

    const handleEditQuotation = (q) => {
        setFormData({
            _id: q._id,
            clientId: q.clientId,
            title: q.title,
            description: q.description || '',
            items: q.items && q.items.length > 0 ? q.items : [{ item: q.title, qty: 1, unitPrice: q.price, total: q.price }],
            price: q.price,
            estimatedTime: q.estimatedTime
        });
        setShowQuotationForm(true);
        setActiveCategory('devis');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteQuotation = async (id) => {
        if (!window.confirm('Are you sure you want to delete this quotation?')) return;
        try {
            const response = await fetch(`http://localhost:3100/quotations/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setQuotations(quotations.filter(q => q._id !== id));
                showToast('Devis deleted successfully!', 'success');
            }
        } catch (error) {
            console.error('Error deleting devis:', error);
        }
    };

    const updateQuotationStatus = async (quoId, status) => {
        try {
            const response = await fetch(`http://localhost:3100/quotations/${quoId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                setQuotations(quotations.map(q => q._id === quoId ? { ...q, status } : q));
                showToast(`Quotation ${status} successfully!`, 'success');
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const generatePDF = async (q) => {
        const doc = new jsPDF();

        // Generate QR Code for verification
        const qrContent = `Fullstackers Devis Verification\nID: ${q._id}\nAmount: ${q.price} DT\nStatus: ${q.status}`;
        const qrDataUrl = await QRCode.toDataURL(qrContent);

        // Add company logo or header
        doc.setFontSize(22);
        doc.setTextColor(245, 94, 26); // #f55e1a
        doc.text('FULLSTACKERS', 105, 20, { align: 'center' });

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('QUOTATION / DEVIS', 105, 30, { align: 'center' });

        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);

        // Add QR Code at the top right
        doc.addImage(qrDataUrl, 'PNG', 160, 10, 25, 25);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Scan for verification', 172, 38, { align: 'center' });
        doc.setTextColor(0, 0, 0);

        // Devis Info
        doc.setFontSize(10);
        doc.text(`Reference: #${q._id.substring(0, 8)}`, 20, 45);
        doc.text(`Date: ${new Date(q.createdAt).toLocaleDateString()}`, 20, 50);
        doc.text(`Status: ${q.status.toUpperCase()}`, 20, 55);

        // Billing Details (Mockup - or use actual names if available)
        doc.setFontSize(12);
        doc.text('Quotation Details:', 20, 70);

        autoTable(doc, {
            startY: 75,
            head: [['Description', 'Qty', 'Unit Price', 'Total']],
            body: q.items && q.items.length > 0
                ? q.items.map(item => [item.item, item.qty, item.unitPrice + ' DT', item.total + ' DT'])
                : [[q.title, '-', '-', q.price + ' DT']],
            headStyles: { fillColor: [245, 94, 26] },
            styles: { fontSize: 10, cellPadding: 5 }
        });

        if (q.description) {
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`Notes: ${q.description}`, 20, finalY);
        }

        // Footer
        const finalY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(10);
        doc.text('Terms and Conditions:', 20, finalY);
        doc.setFontSize(8);
        doc.text('1. This quotation is valid for 30 days.', 20, finalY + 5);
        doc.text('2. Work will commence after acceptance of this quotation.', 20, finalY + 10);

        doc.setFontSize(10);
        doc.setTextColor(245, 94, 26);
        doc.text('Thank you for choosing Fullstackers!', 105, finalY + 30, { align: 'center' });

        doc.save(`Quotation_${q.title.replace(/\s+/g, '_')}.pdf`);
    };

    const generateDownloadQR = async (q) => {
        // Automatically use the current network IP
        let hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {

            hostname = '192.168.1.185'; // Use your local WiFi IP for mobile access

        }
        const apiBase = `http://${hostname}:3100`;
        const downloadUrl = `${apiBase}/quotations/${q._id}/download`;
        const qrDataUrl = await QRCode.toDataURL(downloadUrl, {
            width: 300,
            margin: 2,
            color: {
                dark: '#f55e1a',
                light: '#ffffff'
            }
        });
        setQrCodeData({ url: qrDataUrl, title: q.title });
        setShowQRModal(true);
    };

    const handleAiScan = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setScanningAi(true);
        const formDataPayload = new FormData();
        formDataPayload.append('image', file);

        try {
            const apiBase = `http://${window.location.hostname}:3100`;
            const response = await fetch(`${apiBase}/quotations/ai/scan`, {
                method: 'POST',
                body: formDataPayload,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Server error');
            }

            const data = await response.json();

            if (data.items || data.price) {
                setFormData(prev => ({
                    ...prev,
                    title: data.title || prev.title,
                    description: data.description || prev.description,
                    items: data.items || prev.items,
                    price: data.price || prev.price,
                    estimatedTime: data.estimatedTime || prev.estimatedTime
                }));
                showToast('✨ AI successfully extracted Devis details!', 'success');
            }
        } catch (error) {
            console.error('AI Scan Error:', error);

            showToast(error.message || 'Failed to scan image. Please check API Key.', 'error');

        } finally {
            setScanningAi(false);
            fileInputRef.current.value = null; // Correctly reset file input
        }
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { item: '', qty: 1, unitPrice: 0, total: 0 }]
        }));
    };

    const removeItem = (index) => {
        if (formData.items.length === 1) return;
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        let newEstimatedTime = formData.estimatedTime;

        if (field === 'qty' || field === 'unitPrice' || field === 'item') {
            const qty = parseFloat(newItems[index].qty) || 0;
            const up = parseFloat(newItems[index].unitPrice) || 0;
            newItems[index].total = qty * up;

            // Auto-update estimated time if item looks like labor/fees
            const itemName = newItems[index].item.toLowerCase();
            const laborKeywords = ['fees', 'labor', 'worker fees', 'main d\'oeuvre', 'frais'];
            if (laborKeywords.some(kw => itemName.includes(kw)) && qty > 0) {
                newEstimatedTime = `${qty} days`;
            }
        }

        const newTotalPrice = newItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
        setFormData(prev => ({
            ...prev,
            items: newItems,
            price: newTotalPrice,
            estimatedTime: newEstimatedTime
        }));
    };

    if (loading) {
        return <div className="p-5 text-center"><h2>Loading...</h2></div>;
    }

    const safeNotifications = Array.isArray(notifications) ? notifications : [];

    const filteredNotifications = activeCategory === 'all'
        ? safeNotifications
        : activeCategory === 'messages'
            ? safeNotifications.filter(n => n.type === 'message' || (n.title && n.title.toLowerCase().includes('message')))
            : safeNotifications.filter(n => n.type === 'quotation' || (n.title && n.title.toLowerCase().includes('devis')));

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            {/* Sidebar - Notification Categories */}
            <div style={{ width: '300px', borderRight: '1px solid #ddd', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #ddd', backgroundColor: '#f55e1a', color: 'white' }}>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>Notification Center</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                        Manage your alerts & devis
                    </p>
                </div>

                <div style={{ padding: '20px' }}>
                    <div className="list-group">
                        <button
                            className={`list-group-item list-group-item-action border-0 mb-2 rounded ${activeCategory === 'all' ? 'active' : ''}`}
                            style={activeCategory === 'all' ? { backgroundColor: '#f55e1a', borderColor: '#f55e1a' } : {}}
                            onClick={() => setActiveCategory('all')}
                        >
                            <i className="icofont-notification me-2"></i> All Notifications
                        </button>
                        <button
                            className={`list-group-item list-group-item-action border-0 mb-2 rounded ${activeCategory === 'devis' ? 'active' : ''}`}
                            style={activeCategory === 'devis' ? { backgroundColor: '#f55e1a', borderColor: '#f55e1a' } : {}}
                            onClick={() => setActiveCategory('devis')}
                        >
                            <i className="icofont-page me-2"></i> Devis / Quotations
                        </button>
                        <button
                            className={`list-group-item list-group-item-action border-0 mb-2 rounded ${activeCategory === 'messages' ? 'active' : ''}`}
                            style={activeCategory === 'messages' ? { backgroundColor: '#f55e1a', borderColor: '#f55e1a' } : {}}
                            onClick={() => setActiveCategory('messages')}
                        >
                            <i className="icofont-ui-messaging me-2"></i> Messages
                        </button>
                        <button
                            className="list-group-item list-group-item-action border-0 mb-2 rounded text-danger"
                            onClick={() => setNotifications([])}
                        >
                            <i className="icofont-trash me-2"></i> Clear Notifications
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f0f2f5' }}>
                <div style={{ padding: '20px', backgroundColor: 'white', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>

                        {activeCategory === 'all' ? 'Alertes' : activeCategory === 'devis' ? 'Mes Devis' : 'Alertes Messages'}
                    </h3>
                    {activeCategory === 'devis' && (user?.role === 'Worker' || user?.role === 'Artisan' || user?.role === 'Engineer') && (

                        <button className="btn btn-sm text-white" style={{ backgroundColor: '#f55e1a' }} onClick={() => {
                            if (showQuotationForm) {
                                setFormData({ _id: null, clientId: '', title: '', description: '', items: [{ item: '', qty: 1, unitPrice: 0, total: 0 }], price: 0, estimatedTime: '' });
                            }
                            setShowQuotationForm(!showQuotationForm);
                        }}>
                            {showQuotationForm ? 'Cancel Form' : '+ New Devis'}
                        </button>
                    )}
                </div>

                <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                    {/* Quotation Form (Only if active category is devis and worker) */}

                    {activeCategory === 'devis' && showQuotationForm && (user?.role === 'Worker' || user?.role === 'Artisan' || user?.role === 'Engineer') && (

                        <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                            <div className="card-header text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: '#4e73df' }}>
                                <h5 className="mb-0">Create New Quotation</h5>
                                <div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={handleAiScan}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-light btn-sm fw-bold"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={scanningAi}
                                    >
                                        {scanningAi ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>✨ Scan Handwritten Devis</>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="card-body p-4">
                                <form onSubmit={handleQuotationSubmit}>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Client ID</label>
                                            <input type="text" className="form-control" value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })} required placeholder="Paste user ID here" />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Title</label>
                                            <input type="text" className="form-control" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required placeholder="E.g. Full Plumbing Repair" />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-bold">Items / Details</label>
                                            <div className="table-responsive">
                                                <table className="table table-bordered align-middle">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Item Description</th>
                                                            <th style={{ width: '80px' }}>Qty</th>
                                                            <th style={{ width: '120px' }}>Unit Price</th>
                                                            <th style={{ width: '120px' }}>Total</th>
                                                            <th style={{ width: '50px' }}></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {formData.items.map((item, index) => (
                                                            <tr key={index}>
                                                                <td>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control form-control-sm"
                                                                        value={item.item}
                                                                        onChange={e => handleItemChange(index, 'item', e.target.value)}
                                                                        placeholder="e.g. Cement Bag"
                                                                        required
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm"
                                                                        value={item.qty}
                                                                        onChange={e => handleItemChange(index, 'qty', e.target.value)}
                                                                        required
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm"
                                                                        value={item.unitPrice}
                                                                        onChange={e => handleItemChange(index, 'unitPrice', e.target.value)}
                                                                        required
                                                                    />
                                                                </td>
                                                                <td className="fw-bold text-end">
                                                                    {item.total} DT
                                                                </td>
                                                                <td>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-danger btn-sm border-0"
                                                                        onClick={() => removeItem(index)}
                                                                        disabled={formData.items.length === 1}
                                                                    >
                                                                        <i className="icofont-ui-delete"></i>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <button type="button" className="btn btn-outline-primary btn-sm mb-3" onClick={addItem}>
                                                <i className="icofont-plus me-1"></i> Add Another Item
                                            </button>
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label fw-bold">Additional Notes (Optional)</label>
                                            <textarea
                                                className="form-control"
                                                rows="2"
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Any additional notes or terms..."
                                            ></textarea>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Total Price (DT)</label>
                                            <input type="number" className="form-control bg-light" value={formData.price} readOnly />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Estimated Work Duration</label>
                                            <input type="text" className="form-control" value={formData.estimatedTime} onChange={e => setFormData({ ...formData, estimatedTime: e.target.value })} required placeholder="E.g. 5 days" />
                                        </div>
                                        <div className="col-12 mt-4 text-end">
                                            <button type="submit" className="btn btn-primary px-4">Send Devis to Client</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Content List */}
                    {activeCategory === 'devis' ? (
                        <div className="row">
                            {quotations.length === 0 ? (
                                <div className="col-12 text-center p-5">
                                    <i className="icofont-page icofont-4x text-muted mb-3 d-block"></i>
                                    <p className="text-muted">No quotations found.</p>
                                </div>
                            ) : (
                                quotations.map(q => (
                                    <div key={q._id} className="col-md-6 mb-4">
                                        <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '15px' }}>
                                            <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center pt-3 px-3">
                                                <span className={`badge px-3 py-2 ${q.status === 'accepted' ? 'bg-success' : q.status === 'rejected' ? 'bg-danger' : 'bg-warning'}`} style={{ borderRadius: '20px' }}>
                                                    {q.status.toUpperCase()}
                                                </span>
                                                <small className="text-muted">{new Date(q.createdAt).toLocaleDateString()}</small>
                                            </div>
                                            <div className="card-body p-3">
                                                <h5 className="card-title fw-bold">{q.title}</h5>
                                                <div className="card-text mb-3">
                                                    {q.items && q.items.length > 0 ? (
                                                        <div className="table-responsive">
                                                            <table className="table table-sm table-borderless mb-0" style={{ fontSize: '12px' }}>
                                                                <thead className="text-muted border-bottom">
                                                                    <tr>
                                                                        <th>Item</th>
                                                                        <th>Qty</th>
                                                                        <th className="text-end">Total</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {q.items.map((item, idx) => (
                                                                        <tr key={idx}>
                                                                            <td>{item.item}</td>
                                                                            <td>{item.qty}</td>
                                                                            <td className="text-end fw-bold">{item.total} DT</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div style={{
                                                            fontSize: '13px',
                                                            whiteSpace: 'pre-wrap',
                                                            fontFamily: q.description.includes('|') ? 'monospace' : 'inherit',
                                                            backgroundColor: q.description.includes('|') ? '#f8f9fa' : 'transparent',
                                                            padding: q.description.includes('|') ? '10px' : '0',
                                                            borderRadius: '8px'
                                                        }}>
                                                            {q.description}
                                                        </div>
                                                    )}
                                                    {q.items && q.items.length > 0 && q.description && (
                                                        <p className="mt-2 text-muted small" style={{ fontStyle: 'italic' }}>
                                                            Note: {q.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <hr />
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <span className="text-muted d-block" style={{ fontSize: '12px' }}>Amount</span>
                                                        <strong style={{ color: '#f55e1a' }}>{q.price} DT</strong>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="text-muted d-block" style={{ fontSize: '12px' }}>Estimate</span>
                                                        <strong>{q.estimatedTime}</strong>
                                                    </div>
                                                    <div className="text-end d-flex gap-2">

                                                        {(user.role === 'Worker' || user.role === 'Artisan' || user.role === 'Engineer') && (

                                                            <>
                                                                <button
                                                                    className="btn btn-outline-info btn-sm rounded-circle"
                                                                    title="Edit Devis"
                                                                    onClick={() => handleEditQuotation(q)}
                                                                    style={{ width: '35px', height: '35px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                >
                                                                    <i className="icofont-edit"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-danger btn-sm rounded-circle"
                                                                    title="Delete Devis"
                                                                    onClick={() => handleDeleteQuotation(q._id)}
                                                                    style={{ width: '35px', height: '35px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                >
                                                                    <i className="icofont-ui-delete"></i>
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            className="btn btn-outline-secondary btn-sm rounded-circle"
                                                            title="Download via QR Code"
                                                            onClick={() => generateDownloadQR(q)}
                                                            style={{ width: '35px', height: '35px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        >
                                                            <i className="icofont-qr-code"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-outline-primary btn-sm rounded-circle"
                                                            title="Download PDF"
                                                            onClick={() => generatePDF(q)}
                                                            style={{ width: '35px', height: '35px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        >
                                                            <i className="icofont-download"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {(user.role !== 'Worker' && user.role !== 'Artisan' && user.role !== 'Engineer') && q.status === 'pending' && (

                                                <div className="card-footer bg-transparent border-0 d-flex gap-2 pb-3 px-3">
                                                    <button className="btn btn-success btn-sm flex-fill rounded-pill" onClick={() => updateQuotationStatus(q._id, 'accepted')}>Accept</button>
                                                    <button className="btn btn-danger btn-sm flex-fill rounded-pill" onClick={() => updateQuotationStatus(q._id, 'rejected')}>Reject</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                            {filteredNotifications.length === 0 ? (
                                <div className="text-center p-5">
                                    <i className="icofont-notification icofont-4x text-muted mb-3 d-block"></i>
                                    <p className="text-muted">No notifications in this category.</p>
                                </div>
                            ) : (
                                filteredNotifications.map((n) => (
                                    <div
                                        key={n._id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`shadow-sm mb-3 p-3 rounded-3 cursor-pointer ${!n.read ? 'bg-white border-start border-primary border-4' : 'bg-light'}`}
                                        style={{ transition: 'transform 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center">
                                                <div
                                                    className={`rounded-circle d-flex align-items-center justify-content-center me-3`}
                                                    style={{
                                                        width: '45px',
                                                        height: '45px',
                                                        backgroundColor: n.title.includes('Devis') || n.title.includes('Quotation') ? '#4e73df' : '#f55e1a',
                                                        color: 'white'
                                                    }}
                                                >
                                                    <i className={n.title.includes('Devis') || n.title.includes('Quotation') ? 'icofont-page' : 'icofont-ui-messaging'}></i>
                                                </div>
                                                <div>
                                                    <h6 className="mb-0 fw-bold">{n.title}</h6>
                                                    <p className="mb-0 text-secondary" style={{ fontSize: '14px' }}>{n.content}</p>
                                                    {(n.type === 'task_invitation' || n.type === 'project_invitation') && (
                                                        <button 
                                                            className="btn btn-sm text-white mt-2" 
                                                            style={{ backgroundColor: '#f55e1a', borderRadius: '15px', fontSize: '12px' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleNotificationClick(n);
                                                            }}
                                                        >
                                                            Consulter l'invitation
                                                        </button>
                                                    )}
                                                    <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                                                        {new Date(n.createdAt).toLocaleString()}
                                                    </small>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(n._id);
                                                }}
                                                className="btn btn-sm text-danger opacity-50"
                                            >
                                                <i className="icofont-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* QR Code Modal for Download */}
            {showQRModal && qrCodeData && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    padding: '20px'
                }}>
                    <div className="card border-0 shadow-lg text-center" style={{ width: '100%', maxWidth: '400px', borderRadius: '20px', overflow: 'hidden' }}>
                        <div className="card-header border-0 pt-4 bg-white">
                            <h4 className="fw-bold mb-0">Download Devis</h4>
                            <p className="text-secondary small mt-2">{qrCodeData.title}</p>
                        </div>
                        <div className="card-body p-4">
                            <div className="p-3 bg-light rounded-4 mb-3 d-inline-block">
                                <img src={qrCodeData.url} alt="Download QR" style={{ width: '100%', maxWidth: '250px' }} />
                            </div>
                            <div className="alert alert-info py-2" style={{ fontSize: '14px' }}>
                                <i className="icofont-info-circle me-2"></i>
                                Scan this code with your phone to download the PDF instantly.
                            </div>
                            <p className="text-muted small mb-0">Note: Both devices must be on the same network.</p>
                        </div>
                        <div className="card-footer border-0 pb-4 bg-white">
                            <button
                                className="btn btn-primary w-100 rounded-pill py-2 fw-bold"
                                onClick={() => setShowQRModal(false)}
                                style={{ backgroundColor: '#f55e1a', borderColor: '#f55e1a' }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Professional Toast Notification */}
            {toast.show && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    padding: '12px 24px',
                    backgroundColor: toast.type === 'success' ? '#28a745' : '#dc3545',
                    color: 'white',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 20000,
                    animation: 'slideIn 0.3s ease-out',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 'bold'
                }}>
                    <i className={`icofont-${toast.type === 'success' ? 'check-circled' : 'warning'} me-2`}></i>
                    {toast.message}
                </div>
            )}

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

export default Notifications;
