import React, { useState } from 'react';
import { useCart } from '../../../context/CartContext';
import { Link } from 'react-router-dom';

function Checkout() {
    const { cartItems, getCartTotal, clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [sent, setSent] = useState(false);
    const [codLoading, setCodLoading] = useState(false);

    const subtotal = getCartTotal();
    const discount = subtotal * 0.1;
    const shipping = cartItems.length > 0 ? 10 : 0;
    const grandTotal = subtotal - discount + shipping;

    console.log('Checkout component rendering, cartItems:', cartItems);

    const handleCashOnDelivery = async (e) => {
        e.preventDefault();
        if (!email || !name) {
            alert('Please provide your name and email');
            return;
        }

        if (!window.confirm('Voulez-vous confirmer votre commande avec paiement sur place ?')) return;

        setCodLoading(true);
        try {
            const orderData = {
                status: 'Cash on Delivery',
                userEmail: email,
                lines: cartItems.map(item => ({
                    idProduct: item._id,
                    productName: item.nomP,
                    qnt: item.quantity,
                    unitPrice: item.prix
                }))
            };

            const response = await fetch('https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const savedOrder = await response.json();
                const orderId = savedOrder._id || savedOrder.id;
                // Clear cart
                clearCart();
                // Redirect to success with order ID and invoice info
                const itemsToken = btoa(JSON.stringify(cartItems));
                window.location.href = `/success?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&items=${itemsToken}&method=cod&orderId=${orderId}`;
            } else {
                alert('Erreur lors de la création de la commande');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setCodLoading(false);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        console.log('handlePayment called');
        if (!email || !name) {
            alert('Please provide your name and email');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/payments/request-confirmation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    items: cartItems,
                    userEmail: email,
                    userName: name
                }),
            });

            const result = await response.json();
            if (response.ok) {
                setSent(true);
                clearCart();
            } else {
                alert(result.message || 'Failed to send confirmation email');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <section className="page-banner-section bg-6">
                <div className="container">
                    <div className="page-banner-content">
                        <h2>Stripe Checkout</h2>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li>Checkout</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="checkout-area ptb-100">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="your-order">
                                <h3>Your Order</h3>
                                <div className="table-responsive">
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cartItems.map((item) => (
                                                <tr key={item._id}>
                                                    <td>{item.nomP} x {item.quantity}</td>
                                                    <td>${(item.prix * item.quantity).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            <tr>
                                                <td>Subtotal</td>
                                                <td>${subtotal.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td>Discount (10%)</td>
                                                <td>-${discount.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td>Shipping</td>
                                                <td>${shipping.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Grand Total</strong></td>
                                                <td><strong>${grandTotal.toFixed(2)}</strong></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {sent ? (
                                    <div className="alert alert-success mt-3">
                                        Un e-mail de confirmation a été envoyé à <strong>{email}</strong>. 
                                        Veuillez cliquer sur le lien dans l'e-mail pour procéder au paiement.
                                    </div>
                                ) : (
                                    <form onSubmit={handlePayment}>
                                        <div className="form-group mb-3">
                                            <label>Full Name</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                value={name} 
                                                onChange={(e) => setName(e.target.value)} 
                                                required 
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                        <div className="form-group mb-3">
                                            <label>Email Address</label>
                                            <input 
                                                type="email" 
                                                className="form-control" 
                                                value={email} 
                                                onChange={(e) => setEmail(e.target.value)} 
                                                required 
                                                placeholder="Enter your email"
                                            />
                                        </div>
                                        <div className="payment-box">
                                            <div className="d-flex flex-wrap gap-3 mt-4">
                                                <button 
                                                    onClick={handlePayment} 
                                                    className="main-btn" 
                                                    disabled={loading || cartItems.length === 0}
                                                    style={{ backgroundColor: '#ff5e14', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '5px' }}
                                                >
                                                    <span>{loading ? 'Sending...' : 'Pay with Stripe (Email)'}</span>
                                                </button>

                                                <button 
                                                    onClick={handleCashOnDelivery} 
                                                    className="main-btn" 
                                                    disabled={codLoading || cartItems.length === 0}
                                                    style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '5px' }}
                                                >
                                                    <span>{codLoading ? 'Processing...' : 'Paiement sur place'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Checkout;
