import React, { useEffect, useState } from 'react'

function AllQuotation() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3100/orders/FindAll')
            .then(res => res.json())
            .then(data => {
                setOrders(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);
    return (
        <div>
            <section className="home-section">
                <div className="dashbord-body">
                    <h2 style={{ marginBottom: '20px', marginLeft: '20px' }}>All Quotations</h2>
                    <div className="row Quotation-row">
                        <div className="col-12">
                            <div className="Quotation-chart-box">
                                <div className="yer-quot-main">
                                    <p className="quot-text">Quotation List</p>
                                </div>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th className="quoteId">Quote ID</th>
                                                <th>Customer Name</th>
                                                <th>Issued Date</th>
                                                <th>Inspection Date</th>
                                                <th>Inspection Time</th>
                                                <th className="status">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan="6" className="text-center">Loading quotations...</td>
                                                </tr>
                                            ) : orders.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="text-center">No quotations found.</td>
                                                </tr>
                                            ) : (
                                                orders.map((order) => (
                                                    <tr key={order._id}>
                                                        <td className="customer-id">
                                                            <a href={`/admin/quotationDetail?id=${order._id}`}>
                                                                #{order._id.substring(0, 8).toUpperCase()}
                                                            </a>
                                                        </td>
                                                        <td className="table-data">{order.idUser1 || 'Unknown'}</td>
                                                        <td className="table-data">{new Date(order.date).toLocaleDateString()}</td>
                                                        <td className="table-data">N/A</td>
                                                        <td className="table-data">N/A</td>
                                                        <td>
                                                            <div className="status-btn status-new">New</div>
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
                </div>
            </section>
        </div>
    )
}

export default AllQuotation



