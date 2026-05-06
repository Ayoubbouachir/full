import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Quotations() {
    const [user, setUser] = useState(null);
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        _id: null,
        clientId: '',
        title: '',
        description: '',
        items: [{ item: '', qty: 1, unitPrice: 0, total: 0 }],
        price: 0,
        estimatedTime: '',
    });
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchQuotations(parsedUser);

        // Check for clientId in URL (from Messages page)
        const params = new URLSearchParams(window.location.search);
        const urlClientId = params.get('clientId');
        if (urlClientId) {
            setFormData(prev => ({ ...prev, clientId: urlClientId }));
            setShowForm(true);
        }
    }, [navigate]);

    const fetchQuotations = async (currentUser) => {
        try {

            const role = (currentUser.role === 'Worker' || currentUser.role === 'Artisan' || currentUser.role === 'Engineer') ? 'worker' : 'client';

            const response = await fetch(`http://localhost:3100/quotations/${role}/${currentUser._id}`);
            const data = await response.json();
            setQuotations(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching quotations:', error);
            setLoading(false);
        }
    };

    const handleInviteSubmit = async (e) => {
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
                setShowForm(false);
                setFormData({ _id: null, clientId: '', title: '', description: '', items: [{ item: '', qty: 1, unitPrice: 0, total: 0 }], price: 0, estimatedTime: '' });
                alert(isEdit ? 'Devis updated successfully!' : 'Devis sent successfully!');
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
        setShowForm(true);
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
            }
        } catch (error) {
            console.error('Error deleting devis:', error);
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

    const updateStatus = async (quoId, status) => {
        try {
            const response = await fetch(`http://localhost:3100/quotations/${quoId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                setQuotations(quotations.map(q => q._id === quoId ? { ...q, status } : q));
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    if (loading) return <div className="p-5 text-center"><h2>Loading devis...</h2></div>;

    return (
        <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>{user.role === 'Worker' ? 'My Sent Devis' : 'My Received Devis'}</h2>
                {user.role === 'Worker' && (
                    <button className="btn btn-primary" onClick={() => {
                        if (showForm) {
                            setFormData({ _id: null, clientId: '', title: '', description: '', items: [{ item: '', qty: 1, unitPrice: 0, total: 0 }], price: 0, estimatedTime: '' });
                        }
                        setShowForm(!showForm);
                    }}>
                        {showForm ? 'Cancel' : 'Send New Devis'}
                    </button>
                )}
            </div>

            {showForm && (
                <div className="card shadow-sm mb-4 p-4">
                    <h3>Send New Devis</h3>
                    <form onSubmit={handleInviteSubmit}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label">Client ID</label>
                                <input type="text" className="form-control" value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })} required />
                                <small className="text-muted">Enter the client's ID (this can be automated later)</small>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Title</label>
                                <input type="text" className="form-control" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
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
                            <div className="col-12">
                                <button type="submit" className="btn btn-success">Send Devis</button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <div className="row">
                {quotations.length === 0 ? (
                    <div className="col-12 text-center p-5 text-muted">
                        <p>No devis found.</p>
                    </div>
                ) : (
                    quotations.map(q => (
                        <div key={q._id} className="col-md-6 mb-4">
                            <div className="card shadow-sm h-100">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <span className={`badge ${q.status === 'accepted' ? 'bg-success' : q.status === 'rejected' ? 'bg-danger' : 'bg-warning'}`}>
                                        {q.status.toUpperCase()}
                                    </span>
                                    <small className="text-muted">{new Date(q.createdAt).toLocaleDateString()}</small>
                                </div>
                                <div className="card-body">
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
                                            <p className="text-secondary">{q.description}</p>
                                        )}
                                        {q.items && q.items.length > 0 && q.description && (
                                            <p className="mt-2 text-muted small" style={{ fontStyle: 'italic' }}>
                                                Note: {q.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <strong>Price: {q.price} DT</strong>
                                        <div className="d-flex gap-2">
                                            {user.role === 'Worker' && (
                                                <>
                                                    <button className="btn btn-outline-info btn-sm" onClick={() => handleEditQuotation(q)}>
                                                        <i className="icofont-edit"></i>
                                                    </button>
                                                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteQuotation(q._id)}>
                                                        <i className="icofont-ui-delete"></i>
                                                    </button>
                                                </>
                                            )}
                                            <strong>Time: {q.estimatedTime}</strong>
                                        </div>
                                    </div>
                                </div>
                                {user.role !== 'Worker' && q.status === 'pending' && (
                                    <div className="card-footer d-flex gap-2">
                                        <button className="btn btn-success btn-sm flex-fill" onClick={() => updateStatus(q._id, 'accepted')}>Accept</button>
                                        <button className="btn btn-danger btn-sm flex-fill" onClick={() => updateStatus(q._id, 'rejected')}>Reject</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Quotations;
