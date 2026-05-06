import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const ManageProducts = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [message, setMessage] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            fetchSupplierProducts(parsedUser._id || parsedUser.id);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const fetchSupplierProducts = async (supplierId) => {
        try {
            const response = await fetch(`http://localhost:3100/products/BySupplier/${supplierId}`);
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                const response = await fetch(`http://localhost:3100/products/Delete/${id}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    setProducts(products.filter(p => p._id !== id));
                    setMessage('Product deleted successfully');
                } else {
                    setMessage('Failed to delete product');
                }
            } catch (error) {
                setMessage('Error connecting to server');
            }
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setEditFormData({ ...product });
    };

    const handleUpdateChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:3100/products/Update/${editingProduct._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editFormData,
                    prix: Number(editFormData.prix),
                    quantite: Number(editFormData.quantite)
                }),
            });
            if (response.ok) {
                const updatedProduct = await response.json();
                setProducts(products.map(p => p._id === updatedProduct._id ? updatedProduct : p));
                setEditingProduct(null);
                setMessage('Product updated successfully');
            } else {
                setMessage('Failed to update product');
            }
        } catch (error) {
            setMessage('Error connecting to server');
        }
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '20px',
        background: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    };

    const thStyle = {
        background: '#4e73df',
        color: 'white',
        padding: '12px',
        textAlign: 'left'
    };

    const tdStyle = {
        padding: '12px',
        borderBottom: '1px solid #ddd'
    };

    const actionButtonStyle = {
        padding: '6px 12px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        marginRight: '5px',
        fontWeight: 'bold'
    };

    return (
        <div style={{ padding: '40px', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#333' }}>Manage My Products</h2>
                <Link to="/supplier/add-product" style={{ padding: '10px 20px', background: '#1cc88a', color: 'white', border: 'none', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold' }}>
                    + Add New Product
                </Link>
            </div>

            {message && <div style={{ padding: '10px', background: message.includes('success') ? '#d4edda' : '#f8d7da', color: message.includes('success') ? '#155724' : '#721c24', borderRadius: '5px', marginBottom: '20px' }}>{message}</div>}

            {loading ? (
                <p>Loading your products...</p>
            ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '8px' }}>
                    <p>You haven't added any products yet.</p>
                </div>
            ) : (
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Image</th>
                            <th style={thStyle}>Name</th>
                            <th style={thStyle}>Category</th>
                            <th style={thStyle}>Price</th>
                            <th style={thStyle}>Stock</th>
                            <th style={thStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product._id}>
                                <td style={tdStyle}>
                                    <img src={product.imagePUrl || 'assets/images/placeholder.jpg'} alt={product.nomP} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                                </td>
                                <td style={tdStyle}>{product.nomP}</td>
                                <td style={tdStyle}>{product.categorie}</td>
                                <td style={tdStyle}>${product.prix}</td>
                                <td style={tdStyle}>{product.quantite}</td>
                                <td style={tdStyle}>
                                    <button onClick={() => handleEdit(product)} style={{ ...actionButtonStyle, background: '#f6c23e', color: 'white' }}>Edit</button>
                                    <button onClick={() => handleDelete(product._id)} style={{ ...actionButtonStyle, background: '#e74a3b', color: 'white' }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Edit Modal / Form overlay */}
            {editingProduct && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '20px' }}>Edit Product</h3>
                        <form onSubmit={handleUpdateSubmit}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Product Name</label>
                                <input type="text" name="nomP" value={editFormData.nomP} onChange={handleUpdateChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Price</label>
                                    <input type="number" step="0.01" name="prix" value={editFormData.prix} onChange={handleUpdateChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Stock</label>
                                    <input type="number" name="quantite" value={editFormData.quantite} onChange={handleUpdateChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} required />
                                </div>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category</label>
                                <select name="categorie" value={editFormData.categorie} onChange={handleUpdateChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} required>
                                    <option value="Tools">Tools</option>
                                    <option value="Safety">Safety</option>
                                    <option value="Equipment">Equipment</option>
                                    <option value="Materials">Materials</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
                                <textarea name="description" value={editFormData.description} onChange={handleUpdateChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px' }} required />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setEditingProduct(null)} style={{ padding: '10px 20px', background: '#858796', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ padding: '10px 20px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageProducts;
