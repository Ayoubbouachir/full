import React from 'react'
import { useCart } from '../../../context/CartContext'
import { Link } from 'react-router-dom'

function Cart() {
	const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();

	const subtotal = getCartTotal();
	const discount = subtotal * 0.1;
	const shipping = cartItems.length > 0 ? 10 : 0;
	const grandTotal = subtotal - discount + shipping;

	return (
		<div>
			<section className="page-banner-section bg-6">
				<div className="container">
					<div className="page-banner-content">
						<h2>Cart</h2>
						<ul>
							<li>
								<Link to="/">Home</Link>
							</li>
							<li>
								Cart
							</li>
						</ul>
					</div>
				</div>
			</section>

			<section className="shopping-cart-area ptb-100">
				<div className="container">
					<div className="row">
						<div className="col-lg-8">
							<form className="shopping-cart">
								<div className="text-center table-responsive">
									<table className="table table-bordered">
										<thead>
											<tr>
												<th className="text-start" scope="col">Product</th>
												<th scope="col">Price</th>
												<th scope="col">Quantity</th>
												<th scope="col">Total</th>
												<th scope="col">Remove</th>
											</tr>
										</thead>

										<tbody>
											{cartItems.length === 0 ? (
												<tr>
													<td colSpan="5" className="text-center py-5">
														<h4>Your cart is empty</h4>
														<Link to="/produit" className="main-btn mt-3">
															<span>Continue Shopping</span>
														</Link>
													</td>
												</tr>
											) : (
												cartItems.map((item) => (
													<tr key={item._id}>
														<td className="cart-thumbnail d-flex flex-row align-items-center text-start">
															<Link to={`/productDetail?id=${item._id}`}>
																<img src={item.imagePUrl || "assets/images/products/product-1.jpg"} alt={item.nomP} style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
															</Link>
															<div className="ms-4">
																<Link to={`/productDetail?id=${item._id}`}>{item.nomP}</Link>
																<span>Category: {item.categorie}</span>
															</div>
														</td>

														<td className="cart-price">
															<span className="amount">${item.prix.toFixed(2)}</span>
														</td>

														<td className="cart-quantity">
															<div className="quantity-input">
																<div className="minus" onClick={() => updateQuantity(item._id, item.quantity - 1)} style={{ cursor: 'pointer' }}>
																	<i className="icofont-minus"></i>
																</div>

																<input className="form-control box" type="text" readOnly value={item.quantity} />

																<div className="plus" onClick={() => updateQuantity(item._id, item.quantity + 1)} style={{ cursor: 'pointer' }}>
																	<i className="icofont-plus"></i>
																</div>
															</div>
														</td>

														<td className="cart-total-price">
															<span className="total-price">${(item.prix * item.quantity).toFixed(2)}</span>
														</td>

														<td className="product-delete">
															<button type="button" className="delete border-0 bg-transparent" onClick={() => removeFromCart(item._id)}>
																<i className="icofont-ui-delete" style={{ color: '#ff0000', fontSize: '18px' }}></i>
															</button>
														</td>
													</tr>
												))
											)}
										</tbody>
									</table>
								</div>
							</form>

							<form className="coupon-form">
								<div className="row">
									<div className="col-lg-8 col-md-7">
										<div className="form-floating input-group">
											<input type="text" className="form-control" placeholder="Enter promo code" id="seo-check" />
											<label htmlFor="seo-check">Enter promo code</label>
											<button className="main-btn" type="button">
												<span>Apply</span>
											</button>
										</div>
									</div>

									<div className="col-lg-4 col-md-5 text-end">
										<Link to="/produit" className="main-btn update">
											<span>Continue Shopping</span>
										</Link>
									</div>
								</div>
							</form>
						</div>

						<div className="col-lg-4">
							<div className="your-order">
								<h3>Order Summary</h3>
								<ul>
									<li>Subtotal <span>${subtotal.toFixed(2)}</span></li>
									<li>Discount (10%) <span className="discount">-${discount.toFixed(2)}</span></li>
									<li>Shipping <span>${shipping.toFixed(2)}</span></li>
									<li className="total-amount">Grand Total <span className="ms-auto">${grandTotal.toFixed(2)}</span></li>
								</ul>
								<Link to="/checkout" className={`main-btn active ${cartItems.length === 0 ? 'disabled' : ''}`} onClick={(e) => cartItems.length === 0 && e.preventDefault()}>
									<span>Proceed To Checkout</span>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	)
}

export default Cart;
