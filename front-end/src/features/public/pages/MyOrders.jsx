import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function MyOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = () => {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            setOrders([]);
            setLoading(false);
            return;
        }
        
        const user = JSON.parse(userStr);
        const userEmail = user.email || user.userEmail;

        setLoading(true);
        fetch(`https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/orders/FindAll?userEmail=${userEmail}`)
            .then(res => res.json())
            .then(data => {
                const sorted = Array.isArray(data) ? data.sort((a, b) => new Date(b.dateArrivage) - new Date(a.dateArrivage)) : [];
                setOrders(sorted);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleCancel = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;

        try {
            const response = await fetch(`https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/orders/Delete/${orderId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                fetchOrders();
            } else {
                alert('Failed to cancel order');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while canceling the order');
        }
    };

    return (
        <div>
            <section className="page-banner-section bg-6">
                <div className="container">
                    <div className="page-banner-content">
                        <h2>My Orders</h2>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li>My Orders</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="orders-area ptb-100">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="orders-table table-responsive">
                                <table className="table table-bordered">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Deliverer Name</th>
                                            <th>Estimated Delivery</th>
                                            <th>Total Items</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="7" className="text-center">Loading your orders...</td></tr>
                                        ) : orders.length === 0 ? (
                                            <tr><td colSpan="7" className="text-center">You haven't placed any orders yet.</td></tr>
                                        ) : (
                                            orders.map((order) => (
                                                <tr key={order._id}>
                                                    <td>
                                                        <strong>#{order._id.substring(order._id.length - 8).toUpperCase()}</strong>
                                                    </td>
                                                    <td>{new Date(order.dateArrivage).toLocaleDateString()}</td>
                                                    <td>
                                                        <span className={`badge ${order.status === 'Paid' ? 'bg-success' : order.status?.toLowerCase() === 'delivered' ? 'bg-info' : 'bg-warning'}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="text-primary fw-bold">{order.driverName || 'Not Assigned'}</td>
                                                    <td>{new Date(order.dateLivraison).toLocaleDateString()}</td>
                                                    <td>
                                                        <div className="fw-bold">{order.lines ? order.lines.length : 0} items</div>
                                                        <small className="text-muted">
                                                            {order.lines && order.lines.map((line, idx) => (
                                                                <div key={idx} style={{ fontSize: '11px' }}>
                                                                    • {line.productName || line.nomP || 'Produit'} (x{line.qnt || line.quantity})
                                                                </div>
                                                            ))}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        {order.status?.toLowerCase() !== 'delivered' && (
                                                            <button
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => handleCancel(order._id)}
                                                                title="Cancel Order"
                                                            >
                                                                <i className="icofont-ui-delete"></i> Cancel
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default MyOrders;
