import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

const Factures = () => {
    const [factures, setFactures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        const userId = parsedUser._id || parsedUser.id;
        const params = new URLSearchParams(location.search);
        const orderId = params.get('orderId');

        if (orderId) {
            fetchFactureByOrder(orderId);
        } else {
            fetchAllFactures(userId);
        }
    }, [navigate, location]);

    const fetchAllFactures = async (userId) => {
        setLoading(true);
        try {
            const apiBase = `http://${window.location.hostname}:3100`;
            
            // Fetch Order Invoices
            const resFactures = await fetch(`${apiBase}/orders/factures/user/${userId}`);
            const facturesData = resFactures.ok ? await resFactures.json() : [];

            // Fetch Accepted Quotations
            const resQuotations = await fetch(`${apiBase}/quotations/client/${userId}`);
            const quotationsData = resQuotations.ok ? await resQuotations.json() : [];
            const acceptedQuots = (Array.isArray(quotationsData) ? quotationsData : [])
                .filter(q => q.status === 'accepted')
                .map(q => ({
                    _id: q._id,
                    isQuotation: true, // Marker to distinguish
                    idOrder: q._id, // Use its own ID as ref
                    idUser1: q.clientId,
                    idUser2: q.workerId,
                    order: {
                        _id: q._id,
                        dateArrivage: q.createdAt || new Date(),
                        totalPrice: q.price,
                        lines: q.items ? q.items.map(it => ({
                            nomLine: it.item,
                            qnt: it.qty,
                            unitPrice: it.unitPrice,
                            total: it.total
                        })) : [{ nomLine: q.title, qnt: 1, unitPrice: q.price, total: q.price }]
                    },
                    quotationSource: q // Keep the original for PDF download
                }));

            // Merge both
            const combined = [
                ...(Array.isArray(facturesData) ? facturesData : []),
                ...acceptedQuots
            ].sort((a, b) => {
                const dateA = new Date(a.order?.dateArrivage || 0);
                const dateB = new Date(b.order?.dateArrivage || 0);
                return dateB - dateA;
            });

            setFactures(combined);
        } catch (error) {
            console.error('Error fetching billing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFactureByOrder = async (orderId) => {
        setLoading(true);
        try {
            console.log(`Fetching facture for order ID: ${orderId}`);
            const apiBase = `http://${window.location.hostname}:3100`;
            const response = await fetch(`${apiBase}/orders/factures/order/${orderId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Fetched specific facture:', data);
            if (data && data._id) {
                setFactures([data]);
            } else {
                setFactures([]);
            }
        } catch (error) {
            console.error('Error fetching specific facture:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async (f) => {
        if (!f.order) {
            alert("No order data found for this invoice. Cannot generate PDF.");
            console.error("Attempted to download PDF for an invoice without order data:", f);
            return;
        }
        const isQuotation = !!f.isQuotation;
        const doc = new jsPDF();
        const order = f.order;

        // Header
        doc.setFontSize(22);
        doc.setTextColor(245, 94, 26);
        doc.text('FULLSTACKERS', 105, 20, { align: 'center' });

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('FACTURE', 105, 30, { align: 'center' });

        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);

        // QR Code Generation (For devis, maybe a payment link, or just the same)
        const qrData = isQuotation ? `DEVIS_PAYMENT:${f._id}` : `CONFIRM_DELIVERY:${f.idOrder}:${f.idUser1}`;
        const qrCodeOptions = {
            errorCorrectionLevel: 'H',
            margin: 2,
            scale: 10,
            width: 300
        };
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, qrCodeOptions);

        // QR Code on PDF (Top Right Corner)
        doc.addImage(qrCodeDataUrl, 'PNG', 160, 5, 35, 35);
        doc.setFontSize(7);
        doc.text(isQuotation ? 'Payment Ref' : 'Scan to Confirm', 177, 42, { align: 'center' });

        // Info
        doc.setFontSize(10);
        doc.text(`Doc ID: ${f._id}`, 20, 45);
        doc.text(`Ref: #${(String(f.idOrder)).substring(String(f.idOrder).length - 8).toUpperCase()}`, 20, 50);
        doc.text(`Date: ${new Date(order.dateArrivage || Date.now()).toLocaleDateString()}`, 20, 55);

         doc.setFontSize(12);
         doc.text('Entity:', 20, 70);
         doc.setFontSize(10);
         doc.text(isQuotation ? `Pro ID: ${f.idUser2}` : 'Fullstackers Delivery Network', 20, 75);
         if (!isQuotation) {
             doc.text(`Driver ID: ${f.idUser2}`, 20, 80);
             doc.text(`Driver Name: ${order.driverName || 'N/A'}`, 20, 85);
         }

         doc.setFontSize(12);
         doc.text('Bill To:', 120, 70);
         doc.setFontSize(10);
         doc.text(`Client ID: ${f.idUser1}`, 120, 75);

        // Table
        const tableBody = (order.lines || []).map(line => [
            line.nomLine || 'Product',
            line.qnt || 0,
            `${line.unitPrice || 0} DT`,
            `${line.total || 0} DT`
        ]);

        autoTable(doc, {
            startY: 95,
            head: [['Item Description', 'Qty', 'Unit Price', 'Total']],
            body: tableBody,
            headStyles: { fillColor: [245, 94, 26] },
            foot: [['', '', 'Grand Total', `${order.totalPrice || 0} DT`]],
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
        });

        const finalY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(10);
        doc.text(isQuotation ? 'Type: Facture Pro (Acceptée)' : 'Payment Status: CASH ON DELIVERY', 105, finalY, { align: 'center' });
        doc.setTextColor(245, 94, 26);
        doc.text('Thank you for trusting Fullstackers!', 105, finalY + 10, { align: 'center' });

        doc.save(`Facture_${(String(f.idOrder)).substring(String(f.idOrder).length - 8)}.pdf`);
    };

    const containerStyle = {
        maxWidth: '1200px',
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
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-0">📄 Mes Factures</h2>
                        <p className="text-secondary">Consultez toutes vos factures de livraison et vos devis acceptés.</p>
                    </div>
                    <button onClick={() => navigate(-1)} className="btn btn-outline-secondary rounded-pill px-4">
                        <i className="icofont-arrow-left me-2"></i> Back
                    </button>
                </div>

                {loading ? (
                    <div className="text-center p-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <p className="mt-2">Loading...</p>
                    </div>
                ) : factures.length === 0 ? (
                    <div className="text-center p-5 border rounded bg-light">
                        <i className="icofont-bill icofont-4x text-muted mb-3 d-block"></i>
                        <h5>No documents found</h5>
                        <p className="text-muted mx-auto" style={{ maxWidth: '500px' }}>
                            You don't have any invoices from deliveries or accepted quotations yet.
                        </p>
                        <button onClick={() => fetchAllFactures(user._id || user.id)} className="btn btn-sm btn-outline-primary rounded-pill mt-3">
                            <i className="icofont-refresh"></i> Refresh List
                        </button>
                    </div>
                ) : (
                    <div className="row">
                        {factures.map(f => (
                            <div key={f._id} className="col-12 mb-4">
                                <div className="card shadow-sm border-0 p-4" style={{ borderRadius: '15px', position: 'relative' }}>
                                    {f.isQuotation && (
                                        <span className="badge bg-success text-white position-absolute top-0 end-0 m-3" style={{ fontSize: '10px' }}>
                                            FACTURE ACTIVÉE
                                        </span>
                                    )}
                                    <div className="row align-items-center">
                                        <div className="col-md-8">
                                            <h5 className="fw-bold">
                                                Facture #{ (String(f.idOrder)).substring(String(f.idOrder).length - 8).toUpperCase() }
                                            </h5>
                                            <p className="mb-1 text-muted">Date: {new Date(f.order?.dateArrivage || Date.now()).toLocaleDateString()}</p>
                                            <p className="mb-1 text-muted">
                                                <i className="icofont-truck-alt me-1"></i>
                                                Chauffeur: <span className="fw-bold">{f.order?.driverName || 'En attente...'}</span>
                                            </p>
                                            <p className="mb-3 text-success fw-bold">Total Payable: {f.order?.totalPrice || 0} DT</p>
                                            <div className="d-flex gap-2">
                                                <button onClick={() => downloadPDF(f)} className="btn btn-primary px-4 rounded-pill" style={{ backgroundColor: '#f55e1a', borderColor: '#f55e1a' }}>
                                                    <i className="icofont-download me-2"></i> Download Document (PDF)
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-md-4 text-center border-start">
                                            <QRCodeDisplay value={f.isQuotation ? `DEVIS_PAYMENT:${f._id}` : `CONFIRM_DELIVERY:${f.idOrder}:${f.idUser1}`} />
                                            <p className="small text-secondary mt-2">
                                                {f.isQuotation ? 'Show this for payment/work proof' : 'Driver must scan this code to confirm delivery'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const QRCodeDisplay = ({ value }) => {
    const [src, setSrc] = useState('');
    useEffect(() => {
        QRCode.toDataURL(value, {
            width: 200,
            margin: 2,
            errorCorrectionLevel: 'H'
        }).then(setSrc);
    }, [value]);
    return src ? <img src={src} alt="Delivery QR Code" style={{ width: '150px', border: '1px solid #eee', borderRadius: '8px' }} /> : null;
};

export default Factures;
