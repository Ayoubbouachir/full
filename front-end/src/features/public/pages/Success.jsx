import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';

function Success() {
    const { clearCart, cartItems } = useCart();
    const location = useLocation();
    const [sendingInvoice, setSendingInvoice] = useState(false);
    const [invoiceSent, setInvoiceSent] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [orderDetails, setOrderDetails] = useState(null);
    const processedRef = useRef(false);

    useEffect(() => {
        // Clear local cart immediately if not empty
        if (cartItems.length > 0) {
            clearCart();
        }

        // Process URL parameters once
        if (processedRef.current) return;
        
        const params = new URLSearchParams(location.search);
        const email = params.get('email');
        const name = params.get('name');
        const itemsToken = params.get('items');
        const method = params.get('method');
        const orderId = params.get('orderId');

        if (email && name && itemsToken) {
            processedRef.current = true;
            try {
                const decodedItems = JSON.parse(atob(itemsToken));
                setOrderDetails({ email, name, items: decodedItems, method, orderId });
                
                const statusLabel = method === 'cod' ? 'Paiement sur place' : 'Payé';
                sendInvoice(email, name, decodedItems, statusLabel);
                generateQRCode(email, name, decodedItems, orderId);
            } catch (e) {
                console.error("Error decoding items:", e);
            }
        }
    }, [location.search, clearCart, cartItems.length]);

    const generateQRCode = async (email, name, items, orderId) => {
        try {
            // Data format: CONFIRM_DELIVERY:orderId
            const qrData = orderId ? `CONFIRM_DELIVERY:${orderId}` : `Order for ${name} (${email})`;
            const url = await QRCode.toDataURL(qrData);
            setQrCodeUrl(url);
        } catch (err) {
            console.error('QR Error:', err);
        }
    };

    const sendInvoice = async (userEmail, userName, items, statusLabel) => {
        setSendingInvoice(true);
        try {
            const response = await fetch('http://localhost:3100/payments/send-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items,
                    userEmail,
                    userName,
                    status: statusLabel
                })
            });

            if (response.ok) {
                setInvoiceSent(true);
            }
        } catch (error) {
            console.error('Error sending invoice:', error);
        } finally {
            setSendingInvoice(false);
        }
    };

    const downloadReceipt = () => {
        if (!orderDetails) return;
        const { name, email, items } = orderDetails;
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(20);
        doc.text('BMP CONSTRUCTION - RECEIPT', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`Customer: ${name}`, 20, 40);
        doc.text(`Email: ${email}`, 20, 50);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);
        
        // Table
        const tableColumn = ["Product", "Quantity", "Unit Price", "Total"];
        const tableRows = items.map(item => [
            item.nomP,
            item.quantity,
            `$${item.prix.toFixed(2)}`,
            `$${(item.prix * item.quantity).toFixed(2)}`
        ]);

        doc.autoTable({
            startY: 70,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid'
        });

        const finalY = doc.lastAutoTable.finalY || 150;
        const subtotal = items.reduce((acc, item) => acc + (item.prix * item.quantity), 0);
        doc.text(`Grand Total: $${subtotal.toFixed(2)}`, 140, finalY + 10);

        // Add QR code to PDF
        if (qrCodeUrl) {
            doc.addImage(qrCodeUrl, 'PNG', 20, finalY + 10, 40, 40);
            doc.text('Scan for Order Verification', 20, finalY + 55);
        }

        doc.save(`receipt_${name.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <div className="ptb-100 text-center" style={{ background: '#f8fafc', minHeight: '80vh' }}>
            <div className="container" style={{ maxWidth: '800px', background: 'white', padding: '50px', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.05)' }}>
                <i className="icofont-check-circled" style={{ fontSize: '100px', color: '#1cc88a' }}></i>
                <h2 className="mt-4" style={{ fontWeight: '800', color: '#1a202c' }}>Payment Successful!</h2>
                <p style={{ color: '#718096', fontSize: '1.1rem' }}>Thank you for your purchase. Your order has been recorded successfully.</p>
                
                {qrCodeUrl && (
                    <div className="qr-section mt-4 mb-4" style={{ padding: '20px', background: '#f8fafc', borderRadius: '15px', display: 'inline-block' }}>
                        <h5 style={{ fontSize: '0.9rem', color: '#2d3748', marginBottom: '10px' }}>Your Order QR Code</h5>
                        <img src={qrCodeUrl} alt="Order QR" style={{ width: '150px', borderRadius: '10px' }} />
                    </div>
                )}

                {sendingInvoice && (
                    <div className="alert alert-info mt-4" style={{ borderRadius: '12px' }}>
                        <p className="mb-0">Preparing and sending your professional PDF invoice...</p>
                    </div>
                )}
                
                {invoiceSent && (
                    <div className="alert alert-success mt-4" style={{ borderRadius: '12px' }}>
                        <p className="mb-0">Your invoice has been sent to your email address.</p>
                    </div>
                )}

                <div className="d-flex justify-content-center gap-3 mt-5 flex-wrap">
                    <button onClick={downloadReceipt} className="main-btn" style={{ background: '#36b9cc' }}>
                        <span><i className="icofont-download me-2"></i>Download Receipt</span>
                    </button>
                    <Link to="/my-orders" className="main-btn" style={{ background: '#1a202c' }}>
                        <span>View My Orders</span>
                    </Link>
                    <Link to="/" className="main-btn">
                        <span>Back to Home</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Success;
