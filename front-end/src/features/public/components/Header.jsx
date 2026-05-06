import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import LanguageSwitcher from '../../../components/LanguageSwitcher/LanguageSwitcher';
import CurrencySwitcher from '../../../components/CurrencySwitcher/CurrencySwitcher';
import { io } from 'socket.io-client';

function Header() {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const { getCartCount } = useCart();
	const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');

	// Notifications state
	const [notifications, setNotifications] = useState([]);
	const [unreadNotifications, setUnreadNotifications] = useState(0);
	const [showNotifications, setShowNotifications] = useState(false);
	const [toast, setToast] = useState(null);

		useEffect(() => {
		const storedUser = localStorage.getItem('user');
		if (storedUser) {
			const parsedUser = JSON.parse(storedUser);
			setUser(parsedUser);
			fetchNotifications(parsedUser._id);

			// Socket for real-time notifications
			const socket = io(`http://${window.location.hostname}:3100`);
			socket.on('connect', () => {
				socket.emit('register', parsedUser._id);
			});

			socket.on('newNotification', (newNotif) => {
				setNotifications(prev => [newNotif, ...prev]);
				setUnreadNotifications(prev => prev + 1);
				setToast(newNotif);
				setTimeout(() => setToast(null), 5000);
			});

			return () => socket.disconnect();
		}
	}, []);

	useEffect(() => {
		document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
	}, [darkMode]);

	const fetchNotifications = async (userId) => {
		try {
			const response = await fetch(`http://${window.location.hostname}:3100/notifications/user/${userId}`);
			const data = await response.json();
			if (Array.isArray(data)) {
				setNotifications(data);
				setUnreadNotifications(data.filter(n => !n.read).length);
			}
		} catch (error) {
			console.error('Error fetching notifications:', error);
		}
	};

	const handleNotificationClick = async (notif) => {
		try {
			await fetch(`http://${window.location.hostname}:3100/notifications/${notif._id}/read`, { method: 'POST' });
			setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
			setUnreadNotifications(prev => Math.max(0, prev - 1));
			setShowNotifications(false);
			
			// Redirect based on type
			if (notif.type === 'quotation' || notif.type === 'quotation_update' || notif.title.toLowerCase().includes('devis')) {
				navigate('/notifications?category=devis');
			} else if (notif.type === 'message') {
				navigate('/messages');
			} else if (notif.type === 'task_invitation' || notif.type === 'project_invitation') {
				const ref = notif.referenceId;
				if (ref && ref.includes('|')) {
					const [pid, tid] = ref.split('|');
					navigate(`/artisan/task-response/${pid}/${tid}`);
				} else {
					navigate('/notifications');
				}
			} else {
				navigate('/notifications');
			}
		} catch (error) {
			console.error('Error marking as read:', error);
		}
	};

	const toggleDarkMode = () => {
		const newMode = !darkMode;
		setDarkMode(newMode);
		const theme = newMode ? 'dark' : 'light';
		localStorage.setItem('theme', theme);
		document.documentElement.setAttribute('data-theme', theme);
	};
	const openMobileMenu = () => {
		document.querySelector(".menu-slide-bar")?.classList.add("show");
		document.querySelector(".body-overlay")?.classList.add("active");
		document.body.classList.add("on-side");
		document.querySelector(".mobile-menu")?.classList.add("open");
	};

	const closeMobileMenu = () => {
		document.querySelector(".menu-slide-bar")?.classList.remove("show");
		document.querySelector(".body-overlay")?.classList.remove("active");
		document.body.classList.remove("on-side");
		document.querySelector(".mobile-menu")?.classList.remove("open");
	};

	return (
		<div>
			<header className="header-section">
				<div className="up-header-content bg-color-150f03">
					<div className="container">
						<div className="row align-items-center">
							<div className="col-lg-8">
								<ul className="header-info-content bg-color-f55e1a">
									<li className="ps-0">
										Leading Innovation in Modern Construction
									</li>
									<li>
										<i className="icofont-envelope"></i>
										<a href="mailto:salim@gmail.com">
											salim@gmail.com
										</a>
									</li>
									<li>
										<i className="icofont-clock-time"></i>
										Sun - Fri: 8.00am - 10.00pm
									</li>
								</ul>
							</div>

							<div className="col-lg-4">
								<div className="header-right-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '15px' }}>
									<LanguageSwitcher />
									<CurrencySwitcher />
									<ul className="header-social-content" style={{ marginBottom: 0 }}>
										<li>
											<a href="#!" target="_blank" rel="noreferrer">
												<i className="icofont-facebook"></i>
											</a>
										</li>
										<li>
											<a href="#!" target="_blank" rel="noreferrer">
												<i className="icofont-youtube-play"></i>
											</a>
										</li>
										<li>
											<a href="#!" target="_blank" rel="noreferrer">
												<i className="icofont-linkedin"></i>
											</a>
										</li>
										<li>
											<a href="#!" target="_blank" rel="noreferrer">
												<i className="icofont-pinterest"></i>
											</a>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>

				<nav className="navbar navbar-expand-lg navbar-light">
					<div className="container">
						<Link className="navbar-brand" to="/">
							<img 
								src="/assets/images/bmp.png" 
								alt="Company Logo" 
								style={{ 
									maxHeight: '60px', 
									width: 'auto', 
									backgroundColor: darkMode ? 'white' : 'transparent',
									padding: darkMode ? '5px' : '0',
									borderRadius: '8px'
								}} 
							/>
						</Link>

						<div className="for-mobile-options">
							<div className="menu-right-options d-flex align-items-center">
								<button 
									onClick={toggleDarkMode}
									style={{
										background: 'none',
										border: 'none',
										cursor: 'pointer',
										fontSize: '18px',
										color: darkMode ? '#f1c40f' : '#2c3e50',
										margin: '0 5px'
									}}
									title={darkMode ? "Mode Clair" : "Mode Sombre"}
								>
									<i className={darkMode ? "icofont-sun" : "icofont-moon"}></i>
								</button>
								<button 
									onClick={() => window.dispatchEvent(new CustomEvent('toggle-magnifier'))} 
									style={{ 
										background: 'rgba(0,0,0,0.05)', 
										border: 'none', 
										cursor: 'pointer', 
										fontSize: '16px',
										display: 'flex',
										alignItems: 'center',
										margin: '0 5px',
										padding: '3px 8px',
										borderRadius: '12px',
										color: '#333'
									}}
									title="Loupe"
								>
									<i className="icofont-search"></i>
								</button>
																{user && (
									<div className="notification-option" style={{ position: 'relative', marginRight: '15px', display: 'flex', alignItems: 'center' }}>
										<div 
											onClick={() => setShowNotifications(!showNotifications)} 
											style={{ cursor: 'pointer', position: 'relative' }}
										>
											<i className="icofont-notification" style={{ fontSize: '22px' }}></i>
											{unreadNotifications > 0 && (
												<span style={{
													position: 'absolute',
													top: '-8px',
													right: '-8px',
													backgroundColor: '#dc3545',
													color: 'white',
													borderRadius: '50%',
													width: '18px',
													height: '18px',
													fontSize: '10px',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													fontWeight: 'bold'
												}}>
													{unreadNotifications}
												</span>
											)}
										</div>

										{showNotifications && (
											<div className="shadow shadow-lg border" style={{
												position: 'absolute',
												top: '40px',
												right: '0',
												width: '300px',
												backgroundColor: 'white',
												borderRadius: '12px',
												zIndex: 1000,
												overflow: 'hidden'
											}}>
												<div style={{ padding: '15px', borderBottom: '1px solid #eee', fontWeight: 'bold', backgroundColor: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
													<span>Notifications</span>
													<Link to="/notifications" onClick={() => setShowNotifications(false)} style={{ fontSize: '12px', color: '#f55e1a' }}>View All</Link>
												</div>
												<div style={{ maxHeight: '350px', overflowY: 'auto' }}>
													{notifications.length === 0 ? (
														<div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No new notifications</div>
													) : (
														notifications.slice(0, 10).map((n, idx) => (
															<div
																key={idx}
																style={{
																	padding: '12px 15px',
																	borderBottom: '1px solid #f0f0f0',
																	cursor: 'pointer',
																	backgroundColor: n.read ? 'white' : '#f0f7ff',
																	transition: 'background-color 0.2s'
																}}
																onClick={() => handleNotificationClick(n)}
															>
																<div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '2px', color: '#333' }}>{n.title}</div>
																<div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>{n.content}</div>
																<div style={{ fontSize: '10px', color: '#999', marginTop: '5px' }}>
																	{new Date(n.createdAt).toLocaleString()}
																</div>
															</div>
														))
													)}
												</div>
											</div>
										)}
									</div>
								)}
								{user?.role !== 'Delivery' && (
									<Link to="/cart" className="cart-option">
										<i className="icofont-cart"></i>
										<span>{getCartCount()}</span>
									</Link>
								)}
								<Link to="/contact" className="main-btn">
									<span>
										Contact Now
										<i className="icofont-arrow-right"></i>
									</span>
								</Link>
							</div>
						</div>

						<button
							type="button"
							className="mobile-menu"
							onClick={openMobileMenu}
						>
							<div className="mobile-menu-btn">
								<div className="mobile-menu-bar"></div>
							</div>
						</button>


						<div className="collapse navbar-collapse" id="navbarSupportedContent">
							<ul className="navbar-nav m-auto">
								<li className="nav-item">
									<Link to="/" className="nav-link ">Home</Link>
								</li>

								{(user?.role === 'Engineer' || user?.role === 'User') && (
									<li className="nav-item">
										<Link to="/estimate" className="nav-link">Estimation PRO</Link>
									</li>
								)}

								<li className="nav-item">
									<Link to="#!" className="nav-link dropdown-toggles">Pages +</Link>

									<ul className="sub-menu">
										{(user?.role === 'Engineer' || user?.role === 'User') && (
											<li className="nav-item">
												<Link to="/ai-features" className="nav-link">AI Features</Link>
											</li>
										)}
										<li className="nav-item">
											<Link to="/team" className="nav-link ">Team</Link>
										</li>
										<li className="nav-item">
											<Link to="/produit" className="nav-link ">Products</Link>
										</li>

										<li className="nav-item">
											<Link to="/project" className="nav-link">Project</Link>
										</li>
										<li className="nav-item">
											<Link to="/about" className="nav-link">About</Link>
										</li>
										<li className="nav-item">
											<Link to="/blog" className="nav-link">Blog</Link>
										</li>

										{user?.role === 'Engineer' && (
											<>
												<li className="nav-item">
													<Link to="/engineer/calendar" className="nav-link">Project Calendar</Link>
												</li>
											</>
										)}
									</ul>
								</li>

								<li className="nav-item">
									<Link to="/contact" className="nav-link">Contact</Link>
								</li>

								{user?.role !== 'Delivery' && (
									<li className="nav-item">
										<Link to="/my-orders" className="nav-link">My Orders</Link>
									</li>
								)}

								{user && (
									<li className="nav-item">
										<Link to="/messages" className="nav-link">Messages</Link>
									</li>
								)}

								{user ? (
									<>
										{user.role === 'Delivery' && (
											<>
												<li className="nav-item">
													<Link to="/delivery/orders" className="nav-link">View Orders</Link>
												</li>
												<li className="nav-item">
													<Link to="/delivery/ai-predict" className="nav-link">AI Delivery Predictor</Link>
												</li>
											</>
										)}
										{user.role === 'Supplier' && (
											<>
												<li className="nav-item">
													<Link to="/supplier/add-product" className="nav-link">Add Product</Link>
												</li>
												<li className="nav-item">
													<Link to="/supplier/manage-products" className="nav-link">Manage Products</Link>
												</li>
											</>
										)}
										<li className="nav-item">
											<Link to="/notifications" className="nav-link">
												Notifications {unreadNotifications > 0 && <span style={{ backgroundColor: '#dc3545', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', marginLeft: '10px', fontWeight: 'bold' }}>{unreadNotifications}</span>}
											</Link>
										</li>
										{(user.role === 'User' || user.role === 'Worker') && (
											<li className="nav-item">
												<Link to="/notifications?category=devis" className="nav-link">Devis</Link>
											</li>
										)}
										{user.role === 'User' && (
											<li className="nav-item">
												<Link to="/factures" className="nav-link">Invoices</Link>
											</li>
										)}
									</>
								) : (
									<li className="nav-item">
										<Link to="/login" className="nav-link">Sign In</Link>
									</li>
								)}
							</ul>

							<div className="menu-right-options d-flex align-items-center">
								<button 
									onClick={toggleDarkMode}
									style={{
										background: 'none',
										border: 'none',
										cursor: 'pointer',
										fontSize: '20px',
										color: darkMode ? '#f1c40f' : '#2c3e50',
										marginRight: '15px',
										display: 'flex',
										alignItems: 'center'
									}}
									title={darkMode ? "Mode Clair" : "Mode Sombre"}
								>
									<i className={darkMode ? "icofont-sun" : "icofont-moon"}></i>
								</button>
								{user && (
									<Link to="/profile" style={{ display: 'flex', alignItems: 'center', marginRight: '20px', textDecoration: 'none' }}>
										<div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #ddd', marginRight: '5px' }}>
											{user.imageUrl ? (
												<img src={user.imageUrl} alt="User Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
											) : (
												<div style={{ width: '100%', height: '100%', backgroundColor: '#4e73df', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
													{user.prenom ? user.prenom.charAt(0) : 'U'}
												</div>
											)}
										</div>
									</Link>
								)}
								<button 
									onClick={() => window.dispatchEvent(new CustomEvent('toggle-magnifier'))} 
									style={{ 
										background: 'rgba(0,0,0,0.05)', 
										border: 'none', 
										cursor: 'pointer', 
										fontSize: '18px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										marginRight: '15px',
										padding: '4px 12px',
										borderRadius: '20px',
										color: '#333',
										gap: '5px'
									}}
									title="Loupe d'accessibilité (Alt + Q)"
								>
									<i className="icofont-search"></i>
									<span style={{ fontSize: '11px', fontWeight: 'bold' }}>Loupe</span>
								</button>
								{user?.role !== 'Delivery' && (
									<Link to="/cart" className="cart-option">
										<i className="icofont-cart"></i>
										<span>{getCartCount()}</span>
									</Link>
								)}
								<Link to="/contact" className="main-btn">
									<span>
										Contact Now
										<i className="icofont-arrow-right"></i>
									</span>
								</Link>
							</div>
						</div>
					</div>
				</nav>
			</header>

			<aside className="menu-slide-bar">
				<div className="close-mobile-menu">
					<div className="mobile-logo">
						<Link to="/" className="mobile-logo">
							<img 
								src="/assets/images/bmp.png" 
								alt="Company Logo" 
								style={{ 
									maxHeight: '50px', 
									width: 'auto', 
									backgroundColor: darkMode ? 'white' : 'transparent',
									padding: darkMode ? '5px' : '0',
									borderRadius: '8px'
								}} 
							/>
						</Link>
					</div>

					<button
						type="button"
						className="close-btn"
						onClick={closeMobileMenu}
					>
						<i className="icofont-close-line"></i>
					</button>


				</div>

				<nav className="side-mobile-menu">
					<ul id="mobile-menu-active">
						<li className="nav-item has-children">
							<Link to="/" className="nav-link">Home</Link>
						</li>

						{user?.role !== 'Delivery' && user?.role !== 'User' && (
							<li className="nav-item">
								<Link to="/estimate" className="nav-link">Estimation PRO</Link>
							</li>
						)}



						<li className="nav-item has-children">
							<Link to="#!" className="nav-link dropdown-toggles">Pages</Link>

							<ul className="sub-menu">


								<li className="nav-item has-children">
									<Link to="/team" className="nav-link ">Team</Link>
								</li>

								<li className="nav-item has-children">
									<Link to="/produit" className="nav-link ">Products</Link>
								</li>


								<li className="nav-item">
									<Link to="/project" className="nav-link">Project</Link>
								</li>
								<li className="nav-item">
									<Link to="/about" className="nav-link">About</Link>
								</li>
								<li className="nav-item">
									<Link to="/blog" className="nav-link">Blog</Link>
								</li>

								{user?.role === 'Engineer' && (
									<>


										<li className="nav-item">
											<Link to="/engineer/calendar" className="nav-link">Project Calendar</Link>
										</li>
										<li className="nav-item">
											<Link to="/ai-features" className="nav-link">AI Features</Link>
										</li>
										<li className="nav-item">
											<Link to="/ai-features/assistant" className="nav-link">AI Assistant</Link>
										</li>
										<li className="nav-item">
											<Link to="/ai-features/reports" className="nav-link">Auto Reports</Link>
										</li>
										<li className="nav-item">
											<Link to="/ai-features/clustering" className="nav-link">Project Clustering</Link>
										</li>
										<li className="nav-item">
											<Link to="/ai-features/recommend-materials-bmp" className="nav-link">Recommandations BMP</Link>
										</li>
									</>
								)}
							</ul>
						</li>





						<li className="nav-item">
							<Link to="/contact" className="nav-link">Contact Page</Link>
						</li>


						{user ? (
							<>

								{user.role === 'Delivery' && (
									<>
										<li className="nav-item">
											<Link to="/delivery/orders" className="nav-link">View Orders</Link>
										</li>
										<li className="nav-item">
											<Link to="/delivery/ai-predict" className="nav-link">AI Delivery Predictor</Link>
										</li>
									</>
								)}
								{user.role === 'Supplier' && (
									<>
										<li className="nav-item">
											<Link to="/supplier/add-product" className="nav-link">Add Product</Link>
										</li>
										<li className="nav-item">
											<Link to="/supplier/manage-products" className="nav-link">Manage Products</Link>
										</li>
									</>
								)}
								<li className="nav-item">
									<Link to="/messages" className="nav-link">Messages</Link>
								</li>
								<li className="nav-item">
									<Link to="/notifications" className="nav-link">
										Notifications {unreadNotifications > 0 && <span style={{ backgroundColor: '#dc3545', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', marginLeft: '10px', fontWeight: 'bold' }}>{unreadNotifications}</span>}
									</Link>
								</li>
								{(user.role === 'User' || user.role === 'Worker') && (
									<li className="nav-item">
										<Link to="/notifications?category=devis" className="nav-link">Devis</Link>
									</li>
								)}
								{user.role === 'User' && (
									<li className="nav-item">
										<Link to="/factures" className="nav-link">Invoices</Link>
									</li>
								)}
								<li className="nav-item">
									<Link to="/profile" className="nav-link">Profile</Link>
								</li>
							</>
						) : (
							<li className="nav-item">
								<Link to="/login" className="nav-link">sign in</Link>
							</li>
						)}
					</ul>
				</nav>
			</aside>
						<div className="body-overlay"></div>
			{toast && (
				<div
					className="shadow-lg border-start border-4 border-primary cursor-pointer"
					onClick={() => {
						handleNotificationClick(toast);
						setToast(null);
					}}
					style={{
						position: 'fixed',
						bottom: '30px',
						right: '30px',
						backgroundColor: 'white',
						padding: '20px',
						borderRadius: '10px',
						zIndex: 9999,
						width: '320px',
						animation: 'slideIn 0.3s ease-out',
						cursor: 'pointer'
					}}
				>
					<div className="d-flex justify-content-between align-items-start">
						<div>
							<h6 className="mb-1" style={{ color: '#f55e1a' }}>{toast.title}</h6>
							<p className="mb-0 text-secondary" style={{ fontSize: '14px' }}>{toast.content}</p>
						</div>
						<button onClick={() => setToast(null)} className="btn-close" style={{ fontSize: '10px' }}></button>
					</div>
					<style>{`
						@keyframes slideIn {
							from { transform: translateX(100%); opacity: 0; }
							to { transform: translateX(0); opacity: 1; }
						}
					`}</style>
				</div>
			)}


		</div >
	)
}

export default Header;
