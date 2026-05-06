import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Chart from 'react-apexcharts'

function Home() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalOrders: 0,
        latestOrders: [],
        newOrdersToday: 0,
        quotationData: [],
        userRoleData: {
            labels: [],
            series: []
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, ordersRes] = await Promise.all([
                    fetch('https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/users/FindAll').then(res => res.json()),
                    fetch('https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/orders/FindAll').then(res => res.json())
                ]);

                const today = new Date().toDateString();
                const newToday = ordersRes.filter(o => new Date(o.dateArrivage).toDateString() === today).length;

                // Process Quotation Statistics (Orders per Month)
                const monthCounts = Array(12).fill(0);
                ordersRes.forEach(o => {
                    const month = new Date(o.dateArrivage).getMonth();
                    monthCounts[month]++;
                });

                // Process User Roles Distribution
                const roles = ['Worker', 'Engineer', 'Delivery', 'Supplier', 'Admin'];
                const roleCounts = roles.map(role => usersRes.filter(u => u.role === role).length);

                setStats({
                    totalUsers: usersRes.length,
                    totalOrders: ordersRes.length,
                    latestOrders: ordersRes.slice(-6).reverse(),
                    newOrdersToday: newToday,
                    quotationData: monthCounts,
                    userRoleData: {
                        labels: roles,
                        series: roleCounts
                    }
                });
            } catch (err) {
                console.error("Error fetching dashboard stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    return (
        <div>

            <section className="home-section">

                <div className="dashbord-body">
                    <div className="row visitor-row">
                        <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6">
                            <div className="visitors-box" id="visitors-box1">
                                <p className="total-vis-text" id="total-vis-text1">Total Visitors</p>
                                <div className="visitors-box-sub">
                                    <div className="profile-user-main" id="profile-user-main1">
                                        <img src="/assets/images/svg/profile-2user.svg" alt="profile-2user" />
                                    </div>
                                    <div>
                                        <p className="visitor-total">{stats.totalUsers}</p>
                                        <p className="increase">Total registered users</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6">
                            <div className="visitors-box" id="visitors-box2">
                                <p className="total-vis-text" id="total-vis-text2">New Orders Today</p>
                                <div className="visitors-box-sub">
                                    <div className="profile-user-main" id="profile-user-main2">
                                        <img src="/assets/images/svg/receipt-2.svg" alt="receipt" />
                                    </div>
                                    <div>
                                        <p className="visitor-total">{stats.newOrdersToday}</p>
                                        <p className="increase">Orders placed today</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6">
                            <div className="visitors-box" id="visitors-box3">
                                <p className="total-vis-text" id="total-vis-text3">Total QUOTATION</p>
                                <div className="visitors-box-sub">
                                    <div className="profile-user-main" id="profile-user-main3">
                                        <img src="/assets/images/svg/receipt-2.svg" alt="profile-2user" />
                                    </div>
                                    <div>
                                        <p className="visitor-total">{stats.totalOrders}</p>
                                        <p className="increase">Total orders received</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6">
                            <div className="visitors-box" id="visitors-box4">
                                <p className="total-vis-text" id="total-vis-text4">new QUOTATION</p>
                                <div className="visitors-box-sub">
                                    <div className="profile-user-main" id="profile-user-main4">
                                        <img src="/assets/images/svg/receipt-2.svg" alt="profile-2user" />
                                    </div>
                                    <div>
                                        <p className="visitor-total">{stats.newOrdersToday}</p>
                                        <p className="increase">New orders today</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row Quotation-row">
                        <div className="col-xxl-8 col-xl-8 col-lg-8">
                            <div className="Quotation-chart-box">
                                <div className="yer-quot-main">
                                    <p className="quot-text">Quotation Statistics</p>
                                    <select className="select">
                                        <option>MONTHLY</option>
                                        <option>YEARLY</option>
                                        <option>WEEKLY</option>
                                    </select>
                                </div>
                                <div id="lineChart">
                                    {!loading && stats.quotationData && stats.quotationData.length > 0 ? (
                                        <Chart
                                            options={{
                                                chart: { id: 'quotation-stats', toolbar: { show: false } },
                                                xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
                                                stroke: { curve: 'smooth' },
                                                colors: ['#008FFB']
                                            }}
                                            series={[{ name: 'Quotations', data: stats.quotationData }]}
                                            type="line"
                                            height={350}
                                        />
                                    ) : (
                                        <div style={{ padding: '50px', textAlign: 'center' }}>
                                            {loading ? 'Loading...' : 'No quotation data available'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="col-xxl-4 col-xl-4 col-lg-4">
                            <div className="Quotation-chart-box position-relative">
                                <div className="yer-quot-main">
                                    <p className="quot-text">User Roles Statistics</p>
                                    <select className="select">
                                        <option>ALL ROLES</option>
                                    </select>
                                </div>
                                <div id="chart">
                                    {!loading && stats.userRoleData && stats.userRoleData.series && stats.userRoleData.series.length > 0 ? (
                                        <Chart
                                            options={{
                                                labels: stats.userRoleData.labels,
                                                colors: ['#6A4CF3', '#FF9F43', '#1cc88a', '#36b9cc', '#f6c23e'],
                                                legend: { position: 'bottom' },
                                                plotOptions: { pie: { donut: { size: '65%' } } }
                                            }}
                                            series={stats.userRoleData.series}
                                            type="donut"
                                            height={350}
                                        />
                                    ) : (
                                        <div style={{ padding: '50px', textAlign: 'center' }}>
                                            {loading ? 'Loading...' : 'No user data available'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row Quotation-row">
                        <div className="col-xxl-8 col-xl-8">
                            <div className="Quotation-chart-box">
                                <div className="yer-quot-main">
                                    <p className="quot-text">Latest Quotation</p>
                                    <div className="viewAll-btn">
                                        <Link to="/admin/quotations">View All
                                            <img className="viewArrow" src="/assets/images/svg/arrow-right.svg" alt="arrow-right" />
                                        </Link>
                                    </div>
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
                                                    <td colSpan="6" className="text-center">Loading...</td>
                                                </tr>
                                            ) : stats.latestOrders.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="text-center">No recent orders.</td>
                                                </tr>
                                            ) : (
                                                stats.latestOrders.map((order) => (
                                                    <tr key={order._id}>
                                                        <td className="customer-id"><a href={`/admin/quotationDetail?id=${order._id}`}>#{order._id.substring(0, 8).toUpperCase()}</a></td>
                                                        <td className="table-data">Customer</td>
                                                        <td className="table-data">{new Date(order.dateArrivage).toLocaleDateString()}</td>
                                                        <td className="table-data">{new Date(order.dateLivraison).toLocaleDateString()}</td>
                                                        <td className="table-data">-</td>
                                                        <td>
                                                            <div className={`status-btn ${order.status === 'Delivered' ? 'status-approved' : 'status-new'}`}>{order.status}</div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="col-xxl-4 col-xl-4">
                            <div className="Quotation-chart-box">
                                <div className="yer-quot-main">
                                    <p className="quot-text">Recent Projects</p>
                                </div>
                                <div className="table-container">
                                    <table className="table2">
                                        <thead>
                                            <tr>
                                                <th>Project Name</th>
                                                <th>Type</th>
                                                <th>Workers</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan="3" className="text-center">Loading...</td>
                                                </tr>
                                            ) : (
                                                <tr>
                                                    <td colSpan="3" className="text-center">Project data coming soon</td>
                                                </tr>
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

export default Home
