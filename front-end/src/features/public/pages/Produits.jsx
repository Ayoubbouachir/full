import React, { useEffect, useState } from 'react'
import { useCart } from '../../../context/CartContext'
import { Link } from 'react-router-dom'

function Produits() {
	const { addToCart } = useCart();
	const [products, setProducts] = useState([]);
	const [filteredProducts, setFilteredProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [sortType, setSortType] = useState('default');
	const [user, setUser] = useState(null);
	const [submittingRating, setSubmittingRating] = useState({});

	useEffect(() => {
		const storedUser = localStorage.getItem('user');
		if (storedUser) {
			setUser(JSON.parse(storedUser));
		}
	}, []);

	useEffect(() => {
		fetch('http://localhost:3100/products/FindAll')
			.then(res => res.json())
			.then(data => {
				setProducts(data);
				setFilteredProducts(data);
				setLoading(false);
			})
			.catch(err => {
				console.error(err);
				setLoading(false);
			});
	}, []);

	useEffect(() => {
		let result = products.filter(p =>
			p.nomP.toLowerCase().includes(searchTerm.toLowerCase()) ||
			p.categorie.toLowerCase().includes(searchTerm.toLowerCase())
		);

		if (sortType === 'priceLow') {
			result.sort((a, b) => a.prix - b.prix);
		} else if (sortType === 'priceHigh') {
			result.sort((a, b) => b.prix - a.prix);
		} else if (sortType === 'name') {
			result.sort((a, b) => a.nomP.localeCompare(b.nomP));
		}

		setFilteredProducts(result);
	}, [searchTerm, sortType, products]);

	return (
		<div>
			<section className="page-banner-section bg-6">
				<div className="container">
					<div className="page-banner-content">
						<h2>Products</h2>
						<ul>
							<li>
								<Link to="/">Home</Link>
							</li>
							<li>
								Products
							</li>
						</ul>
					</div>
				</div>
			</section>


			<section className="products-section ptb-100">
				<div className="container">
					<div className="product-result">
						<div className="row align-items-center">
							<div className="col-lg-4 col-md-4">
								<p>Showing <span>{filteredProducts.length}</span> results</p>
							</div>

							<div className="col-lg-8 col-md-8">
								<div className="row">
									<div className="col-lg-6">
										<form onSubmit={(e) => e.preventDefault()}>
											<div className="form-floating">
												<input
													type="text"
													className="form-control"
													id="searchHere"
													placeholder="Search Here"
													value={searchTerm}
													onChange={(e) => setSearchTerm(e.target.value)}
												/>
												<label htmlFor="searchHere" className="form-label">Search Here</label>
											</div>
										</form>
									</div>

									<div className="col-lg-6">
										<select
											className="form-select form-control"
											aria-label="Default select example"
											value={sortType}
											onChange={(e) => setSortType(e.target.value)}
										>
											<option value="default">Default Sorting</option>
											<option value="priceLow">Price: Low to High</option>
											<option value="priceHigh">Price: High to Low</option>
											<option value="name">Name: A-Z</option>
										</select>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="row justify-content-center">
						{loading ? (
							<div className="col-12 text-center mt-5">
								<p>Loading products...</p>
							</div>
						) : filteredProducts.length === 0 ? (
							<div className="col-12 text-center mt-5">
								<p>No products match your search.</p>
							</div>
						) : (
							filteredProducts.map((product) => (
								<div key={product._id} className="col-lg-4 col-sm-6">
									<div className="main-product-item">
										<div className="product-img">
											<Link to={`/productDetail?id=${product._id}`}>
												<img src={product.imagePUrl || "assets/images/products/product-1.jpg"} alt={product.nomP} />
											</Link>

											<ul className="product-action">
												<li>
													<a href="#!">
														<i className="icofont-heart"></i>
													</a>
												</li>
												<li>
													<Link to={`/productDetail?id=${product._id}`}>
														<i className="icofont-eye"></i>
													</Link>
												</li>
											</ul>

											{user?.role !== 'Delivery' && (
												<button
													type="button"
													className="main-btn border-0 w-100"
													onClick={(e) => {
														e.preventDefault();
														addToCart(product);
														alert(`${product.nomP} added to cart!`);
													}}
												>
													<span className="btn-style">Add To Cart</span>
												</button>
											)}
										</div>

										<div className="main-product-content d-flex">
											<div>
												<span className="tag">{product.categorie.toUpperCase()}</span>
												<h3>
													<Link to={`/productDetail?id=${product._id}`}>
														{product.nomP}
													</Link>
												</h3>
												<span className="price">${product.prix.toFixed(2)}</span>
											</div>
											<div className="ms-auto d-flex align-items-center" onClick={(e) => e.stopPropagation()}>
												<div className="d-flex flex-column align-items-end">
													<ul style={{ display: 'flex', listStyle: 'none', padding: 0, margin: 0, marginRight: '8px', color: '#f55e1a' }}>
														{(() => {
															const reviews = product.reviews || [];
															const totalRating = reviews.reduce((acc, rev) => acc + (Number(rev.rating) || 0), 0);
															const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;
															const displayRating = Math.round(avgRating);

															return [1, 2, 3, 4, 5].map((star) => (
																<li key={star} style={{ lineHeight: 1 }}>
																	<i
																		className={star <= displayRating ? "icofont-star" : "icofont-star text-muted"}
																		style={{
																			color: star <= displayRating ? '#f55e1a' : '#ddd',
																			cursor: user ? 'pointer' : 'default',
																			fontSize: '18px',
																			padding: '2px'
																		}}
																		onMouseEnter={(e) => {
																			if (user) e.target.style.color = '#f55e1a';
																		}}
																		onMouseLeave={(e) => {
																			if (user) e.target.style.color = star <= displayRating ? '#f55e1a' : '#ddd';
																		}}
																		onClick={(e) => {
																			e.preventDefault();
																			e.stopPropagation();
																			if (!user || submittingRating[product._id]) {
																				if (!user) alert('Please login to rate products.');
																				return;
																			}
																			// Save/Update rating ONLY
																			setSubmittingRating(prev => ({ ...prev, [product._id]: true }));

																			fetch(`http://localhost:3100/products/AddReview/${product._id}`, {
																				method: 'POST',
																				headers: { 'Content-Type': 'application/json' },
																				body: JSON.stringify({
																					userId: user._id,
																					userName: `${user.prenom} ${user.nom}`,
																					rating: Number(star)
																					// Note: NOT sending comment here, backend will preserve existing
																				}),
																			})
																				.then(res => res.json())
																				.then(updatedProd => {
																					if (updatedProd && updatedProd._id) {
																						setProducts(prev => prev.map(p => String(p._id) === String(updatedProd._id) ? updatedProd : p));
																					}
																					setSubmittingRating(prev => ({ ...prev, [product._id]: false }));
																				});
																		}}
																	></i>
																</li>
															));
														})()}
													</ul>
													<div className="d-flex align-items-center">
														{user && product.reviews?.find(r => String(r.userId) === String(user._id)) && (
															<span style={{ fontSize: '10px', color: '#f55e1a', marginRight: '5px', fontWeight: 'bold' }}>
																My rating: {product.reviews.find(r => String(r.userId) === String(user._id)).rating}
															</span>
														)}
														<span style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', whiteSpace: 'nowrap' }}>
															{(() => {
																const reviews = product.reviews || [];
																const total = reviews.reduce((acc, rev) => acc + (Number(rev.rating) || 0), 0);
																return reviews.length > 0 ? (total / reviews.length).toFixed(1) : '0.0';
															})()}
														</span>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							))
						)}

						<nav>
							<ul className="pagination">
								<li className="page-item">
									<a href="#!" className="page-link">
										<i className="icofont-simple-left"></i>
									</a>
								</li>
								<li className="page-item">
									<a href="#!" className="page-link">1</a>
								</li>
								<li className="page-item">
									<a href="#!" className="page-link active">2</a>
								</li>
								<li className="page-item">
									<a href="#!" className="page-link">3</a>
								</li>
								<li className="page-item">
									<a href="#!" className="page-link">4</a>
								</li>
								<li className="page-item">
									<a href="#!" className="page-link">
										<i className="icofont-simple-right"></i>
									</a>
								</li>
							</ul>
						</nav>
					</div>
				</div>
			</section>
		</div>
	)
}

export default Produits;
