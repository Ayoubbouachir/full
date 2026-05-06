import React, { useEffect, useState } from 'react'
import { useCart } from '../../../context/CartContext'
import { Link } from 'react-router-dom'

function ProductDetail() {
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) {
            fetch(`https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/products/Find/${id}`)
                .then(res => res.json())
                .then(data => {
                    setProduct(data);
                    setLoading(false);
                    // Pre-fill if user has a review
                    if (user && data.reviews) {
                        const existingReview = data.reviews.find(r => r && r.userId && String(r.userId) === String(user._id));
                        if (existingReview) {
                            setRating(existingReview.rating);
                            setComment(existingReview.comment);
                        }
                    }
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Please login to leave a review.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/products/AddReview/${product._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user._id,
                    userName: `${user.prenom} ${user.nom}`,
                    comment: comment
                    // Note: NOT sending rating here, backend will preserve existing
                }),
            });

            if (response.ok) {
                const updatedProduct = await response.json();
                setProduct(updatedProduct);
                setComment('');
                setRating(5);
                alert('Review added successfully!');
            } else {
                alert('Failed to add review.');
            }
        } catch (err) {
            console.error(err);
            alert('Error adding review.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleLike = async (reviewUserId, type) => {
        if (!user) {
            alert('Please login to react to a review.');
            return;
        }

        try {
            const response = await fetch(`https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/products/ToggleLikeReview/${product._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewUserId: reviewUserId,
                    likerId: user._id,
                    type: type
                }),
            });

            if (response.ok) {
                const updatedProduct = await response.json();
                setProduct(updatedProduct);
            }
        } catch (err) {
            console.error('Error toggling reaction:', err);
        }
    };

    return (
        <div>
            <section className="page-banner-section bg-6">
                <div className="container">
                    <div className="page-banner-content">
                        <h2>{loading ? 'Loading...' : product ? product.nomP : 'Product Not Found'}</h2>
                        <ul>
                            <li>
                                <Link to="/">Home</Link>
                            </li>
                            <li>
                                Product Details
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="product-details-area ptb-100">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-6 col-md-12">
                            <div className="product-details-image">
                                <img src={product?.imagePUrl || "/assets/images/products/product-1.jpg"} alt={product?.nomP} style={{ width: '100%', borderRadius: '10px' }} />
                            </div>
                        </div>

                        <div className="col-lg-6 col-md-12">
                            <div className="product-details-desc">
                                {loading ? (
                                    <p>Loading product details...</p>
                                ) : product ? (
                                    <>
                                        <h3>{product.nomP}</h3>
                                        <div className="d-flex align-items-center mb-2">
                                            <div className="stars me-2" style={{ color: '#f55e1a' }}>
                                                {(() => {
                                                    const reviews = product.reviews || [];
                                                    const totalRating = reviews.reduce((acc, rev) => acc + (Number(rev.rating) || 0), 0);
                                                    const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;
                                                    const displayRating = Math.round(avgRating);
                                                    
                                                    return [1, 2, 3, 4, 5].map((s) => (
                                                        <i
                                                            key={s}
                                                            className={s <= displayRating ? "icofont-star" : "icofont-star text-muted"}
                                                            style={{ 
                                                                cursor: user ? 'pointer' : 'default', 
                                                                fontSize: '22px', 
                                                                color: s <= displayRating ? '#f55e1a' : '#ddd',
                                                                padding: '2px'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (user) e.target.style.color = '#f55e1a';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (user) e.target.style.color = s <= displayRating ? '#f55e1a' : '#ddd';
                                                            }}
                                                            onClick={() => {
                                                                if (!user || submitting) return;
                                                                
                                                                // Save/Update rating ONLY
                                                                setSubmitting(true);
                                                                const sRating = Number(s);
                                                                setRating(sRating);

                                                                fetch(`https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/products/AddReview/${product._id}`, {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({
                                                                        userId: user._id,
                                                                        userName: `${user.prenom} ${user.nom}`,
                                                                        rating: sRating
                                                                        // Note: NOT sending comment here, backend will preserve existing
                                                                    }),
                                                                })
                                                                .then(res => res.json())
                                                                .then(data => {
                                                                    if (data && data._id) {
                                                                        setProduct(data);
                                                                    }
                                                                    setSubmitting(false);
                                                                })
                                                                .catch((err) => {
                                                                    console.error(err);
                                                                    setSubmitting(false);
                                                                });
                                                            }}
                                                        ></i>
                                                    ));
                                                })()}
                                            </div>
                                            <div className="d-flex flex-column">
                                                <span style={{ fontSize: '15px', fontWeight: 'bold' }}>
                                                    {(() => {
                                                        const reviews = product.reviews || [];
                                                        const total = reviews.reduce((acc, rev) => acc + (Number(rev.rating) || 0), 0);
                                                        return reviews.length > 0 
                                                            ? `${(total / reviews.length).toFixed(1)} / 5.0 (${reviews.length} reviews)` 
                                                            : "(No reviews yet)";
                                                    })()}
                                                </span>
                                                {user && product.reviews?.find(r => String(r.userId) === String(user._id)) && (
                                                    <span style={{ fontSize: '12px', color: '#f55e1a', fontWeight: 'bold' }}>
                                                        Your rating: {product.reviews.find(r => String(r.userId) === String(user._id)).rating}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="price">
                                            <span className="new-price">${product.prix.toFixed(2)}</span>
                                        </div>
                                        <p>{product.description}</p>
                                        <div className="product-meta">
                                            <span>Category: <b>{product.categorie}</b></span>
                                            <span>Available Quantity: <b>{product.quantite}</b></span>
                                        </div>
                                        {user?.role !== 'Delivery' && (
                                            <div className="product-add-to-cart mt-4">
                                                <button
                                                    type="button"
                                                    className="main-btn border-0"
                                                    onClick={() => {
                                                        addToCart(product);
                                                        alert(`${product.nomP} added to cart!`);
                                                    }}
                                                >
                                                    <span className="btn-style">Add To Cart</span>
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p>Product not found.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <div className="row mt-5">
                        <div className="col-lg-8">
                            <div className="product-reviews">
                                <h4 className="mb-4">Reviews ({product?.reviews?.filter(r => r.comment && r.comment.trim() !== '').length || 0})</h4>
                                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '15px' }}>
                                    <ul className="review-list" style={{ listStyle: 'none', padding: 0 }}>
                                        {product?.reviews && product.reviews.filter(r => r.comment && r.comment.trim() !== '').length > 0 ? (
                                            product.reviews
                                                .filter(r => r.comment && r.comment.trim() !== '')
                                                .slice().reverse().map((rev, index) => (
                                                <li key={index} className="mb-4 pb-3" style={{ borderBottom: '1px solid #eee' }}>
                                                    <div className="d-flex justify-content-between">
                                                        <strong>{rev.userName}</strong>
                                                        <span style={{ fontSize: '12px', color: '#888' }}>
                                                            {new Date(rev.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-dark" style={{ fontStyle: 'italic' }}>"{rev.comment}"</p>
                                                    <div className="mt-2 d-flex align-items-center" style={{ gap: '10px' }}>
                                                        <button 
                                                            onClick={() => handleToggleLike(rev.userId, 'like')}
                                                            title="Like"
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                color: rev.reactions?.find(r => r.userId === String(user?._id) && r.type === 'like') ? '#0866ff' : '#888',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                padding: '4px 8px',
                                                                borderRadius: '20px',
                                                                backgroundColor: rev.reactions?.find(r => r.userId === String(user?._id) && r.type === 'like') ? '#0866ff15' : '#f0f0f0',
                                                                transition: 'all 0.2s',
                                                                fontSize: '13px'
                                                            }}
                                                        >
                                                            <i className={rev.reactions?.find(r => r.userId === String(user?._id) && r.type === 'like') ? "icofont-thumbs-up" : "icofont-like"} style={{ marginRight: '5px', fontSize: '15px' }}></i>
                                                            <span style={{ fontWeight: '600' }}>{rev.reactions?.filter(r => r.type === 'like').length || 0}</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleToggleLike(rev.userId, 'love')}
                                                            title="Love"
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                color: rev.reactions?.find(r => r.userId === String(user?._id) && r.type === 'love') ? '#f55e1a' : '#888',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                padding: '4px 8px',
                                                                borderRadius: '20px',
                                                                backgroundColor: rev.reactions?.find(r => r.userId === String(user?._id) && r.type === 'love') ? '#f55e1a15' : '#f0f0f0',
                                                                transition: 'all 0.2s',
                                                                fontSize: '13px'
                                                            }}
                                                        >
                                                            <i className={rev.reactions?.find(r => r.userId === String(user?._id) && r.type === 'love') ? "icofont-heart-alt" : "icofont-heart"} style={{ marginRight: '5px', fontSize: '15px' }}></i>
                                                            <span style={{ fontWeight: '600' }}>{rev.reactions?.filter(r => r.type === 'love').length || 0}</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleToggleLike(rev.userId, 'haha')}
                                                            title="Haha"
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                color: rev.reactions?.find(r => r.userId === String(user?._id) && r.type === 'haha') ? '#f7b125' : '#888',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                padding: '4px 8px',
                                                                borderRadius: '20px',
                                                                backgroundColor: rev.reactions?.find(r => r.userId === String(user?._id) && r.type === 'haha') ? '#f7b12515' : '#f0f0f0',
                                                                transition: 'all 0.2s',
                                                                fontSize: '13px'
                                                            }}
                                                        >
                                                            <span style={{ marginRight: '5px', fontSize: '15px' }}>{rev.reactions?.find(r => r.userId === String(user?._id) && r.type === 'haha') ? "😆" : "😂"}</span>
                                                            <span style={{ fontWeight: '600' }}>{rev.reactions?.filter(r => r.type === 'haha').length || 0}</span>
                                                        </button>
                                                    </div>
                                                </li>
                                            ))
                                        ) : (
                                            <p>No text reviews yet. Be the first to comment!</p>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-4">
                            <div className="add-review-form p-4" style={{ backgroundColor: '#f9f9f9', borderRadius: '10px' }}>
                                <h4>Add a Review</h4>
                                {user ? (
                                    <form onSubmit={handleReviewSubmit}>
                                        <div className="mb-3">
                                            <label className="form-label">Write your comment</label>
                                            <textarea
                                                className="form-control"
                                                rows="4"
                                                placeholder="What do you think about this product?"
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                required
                                            ></textarea>
                                        </div>
                                        <button type="submit" className="main-btn border-0 w-100" disabled={submitting}>
                                            <span>
                                                {submitting 
                                                    ? 'Submitting...' 
                                                    : (product?.reviews?.some(r => r.userId === user._id) ? 'Update Review' : 'Submit Review')}
                                            </span>
                                        </button>
                                    </form>
                                ) : (
                                    <p className="text-muted mt-3">
                                        Please <Link to="/login" style={{ color: '#f55e1a' }}>Sign In</Link> to leave a review.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default ProductDetail;

