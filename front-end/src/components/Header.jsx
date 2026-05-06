import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../../context/CartContext'

function Header() {
	const [user, setUser] = useState(null);
	const { getCartCount } = useCart();

	useEffect(() => {
		const storedUser = localStorage.getItem('user');
		if (storedUser) {
			setUser(JSON.parse(storedUser));
		}
	}, []);
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
										BMP Construction ÔÇö Expert en B+ótiment depuis 1987
									</li>
									<li>
										<i className="icofont-envelope"></i>
										<a href="mailto:salim@gmail.com">
											salim@gmail.com
										</a>
									</li>
									<li>
										<i className="icofont-clock-time"></i>
										Dim - Ven-á: 8h00 - 22h00
									</li>
								</ul>
							</div>

							<div className="col-lg-4">
								<ul className="header-social-content">
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

				<nav className="navbar navbar-expand-lg navbar-light">
					<div className="container">
						<Link className="navbar-brand" to="/">
							<img src="/assets/images/bmp.png" alt="Company Logo" />
						</Link>

						<div className="for-mobile-options">
							<div className="menu-right-options d-flex align-items-center">
								<Link to="/cart" className="cart-option">
									<i className="icofont-cart"></i>
									<span>{getCartCount()}</span>
								</Link>
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
									<Link to="/" className="nav-link ">Accueil</Link>
								</li>

								<li className="nav-item">
									<Link to="/estimate" className="nav-link">Estimation PRO</Link>
								</li>

								<li className="nav-item">
									<Link to="/about" className="nav-link">+Ç Propos</Link>
								</li>

								<li className="nav-item">
									<Link to="#!" className="nav-link dropdown-toggles">Pages</Link>

									<ul className="sub-menu">

										<li className="nav-item">
											<Link to="/team" className="nav-link ">Notre +ëquipe</Link>
										</li>
										<li className="nav-item">
											<Link to="/produit" className="nav-link ">Produits</Link>
										</li>

										<li className="nav-item">
											<Link to="/project" className="nav-link">Projets</Link>
										</li>




									</ul>
								</li>

								<li className="nav-item">
									<Link to="/blog" className="nav-link ">Blog</Link>
								</li>

								<li className="nav-item">
									<Link to="/contact" className="nav-link">Contact</Link>
								</li>

								{user ? (
									<>
										{user.role === 'Engineer' && (
											<li className="nav-item">
												<Link to="/engineer/create-project" className="nav-link">Cr+®er un Projet</Link>
											</li>
										)}
										{user.role === 'Delivery' && (
											<li className="nav-item">
												<Link to="/delivery/orders" className="nav-link">Voir les Commandes</Link>
											</li>
										)}
										{user.role === 'Supplier' && (
											<>
												<li className="nav-item">
													<Link to="/supplier/add-product" className="nav-link">Ajouter Produit</Link>
												</li>
												<li className="nav-item">
													<Link to="/supplier/manage-products" className="nav-link">G+®rer les Produits</Link>
												</li>
											</>
										)}
										<li className="nav-item">
											<Link to="/messages" className="nav-link">Messages</Link>
										</li>
									</>
								) : (
									<li className="nav-item">
										<Link to="/login" className="nav-link">Connexion</Link>
									</li>
								)}
							</ul>

							<div className="menu-right-options d-flex align-items-center">
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
								<Link to="/cart" className="cart-option">
									<i className="icofont-cart"></i>
									<span>{getCartCount()}</span>
								</Link>
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
							<img src="/assets/images/bmp.png" alt="Company Logo" />
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
							<Link to="/" className="nav-link">Accueil</Link>
						</li>

						<li className="nav-item">
							<Link to="/estimate" className="nav-link">Estimation PRO</Link>
						</li>

						<li className="nav-item">
							<Link to="/about" className="nav-link">About</Link>
						</li>


						<li className="nav-item has-children">
							<Link to="#!" className="nav-link dropdown-toggles">Pages</Link>

							<ul className="sub-menu">


								<li className="nav-item has-children">
									<Link to="/team" className="nav-link ">Team</Link>
								</li>

								<li className="nav-item has-children">
									<Link to="/produit" className="nav-link ">products</Link>
								</li>


								<li className="nav-item">
									<Link to="/project" className="nav-link">Project</Link>
								</li>

							</ul>
						</li>


						<li className="nav-item">
							<Link to="/blog" className="nav-link">Blog</Link>
						</li>



						<li className="nav-item">
							<Link to="/contact" className="nav-link">Contact</Link>
						</li>


						{user ? (
							<>
								{user.role === 'Engineer' && (
									<li className="nav-item">
										<Link to="/engineer/create-project" className="nav-link">Create Project</Link>
									</li>
								)}
								{user.role === 'Delivery' && (
									<li className="nav-item">
										<Link to="/delivery/orders" className="nav-link">View Orders</Link>
									</li>
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
									<Link to="/profile" className="nav-link">Mon Profil</Link>
								</li>
							</>
						) : (
							<li className="nav-item">
								<Link to="/login" className="nav-link">Connexion</Link>
							</li>
						)}
					</ul>
				</nav>
			</aside>
			<div className="body-overlay"></div>


		</div >
	)
}

export default Header;
