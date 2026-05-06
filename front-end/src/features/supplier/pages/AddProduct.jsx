import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const SupplierAddProduct = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        nomP: '',
        prix: '',
        quantite: '',
        imagePUrl: '',
        description: '',
        categorie: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            // If no user, redirect to login
            navigate('/login');
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCancel = () => {
        if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
            navigate(-1); // Go back to previous page
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!user || (!user._id && !user.id)) {
            setMessage('User session expired. Please login again.');
            setLoading(false);
            return;
        }

        try {
            let imageUrl = formData.imagePUrl;

            // If user selected a file, upload it first
            if (imageFile) {
                const formDataUpload = new FormData();
                formDataUpload.append('image', imageFile);

                const uploadResponse = await fetch('https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/products/upload', {
                    method: 'POST',
                    body: formDataUpload,
                });

                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    imageUrl = uploadResult.path; // Use the path returned from backend
                } else {
                    setMessage('Failed to upload image. Using URL instead.');
                }
            }

            const payload = {
                ...formData,
                prix: Number(formData.prix),
                quantite: Number(formData.quantite),
                imagePUrl: imageUrl,
                supplierId: user._id || user.id // Send the supplier ID
            };
            const response = await fetch('https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                setMessage('Product added successfully!');
                setTimeout(() => {
                    navigate('/supplier/manage-products'); // Redirect to manage products page
                }, 1500);
            } else {
                setMessage('Failed to add product.');
            }
        } catch (error) {
            setMessage('Error connecting to server.');
        } finally {
            setLoading(false);
        }
    };

    const containerStyle = {
        maxWidth: '700px',
        margin: '50px auto',
        padding: '30px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    };

    const inputStyle = {
        width: '100%',
        padding: '10px',
        marginBottom: '15px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        fontSize: '14px'
    };

    const buttonStyle = {
        padding: '12px 30px',
        border: 'none',
        borderRadius: '5px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '14px',
        marginRight: '10px'
    };

    return (
        <div style={{ backgroundColor: '#f4f6f9', minHeight: '100vh', padding: '20px' }}>
            <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <Link to="/supplier/manage-products" style={{ ...buttonStyle, background: '#4e73df', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    📋 Manage My Products
                </Link>
            </div>
            <div style={containerStyle}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#1cc88a' }}>Add New Product</h2>
                {message && <div style={{ color: message.includes('success') ? 'green' : 'red', marginBottom: '15px', textAlign: 'center', padding: '10px', background: message.includes('success') ? '#d4edda' : '#f8d7da', borderRadius: '5px' }}>{message}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Product Name *</label>
                        <input type="text" name="nomP" placeholder="Enter product name" value={formData.nomP} onChange={handleChange} style={inputStyle} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Price *</label>
                            <input type="number" step="0.01" name="prix" placeholder="0.00" value={formData.prix} onChange={handleChange} style={inputStyle} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Quantity *</label>
                            <input type="number" name="quantite" placeholder="0" value={formData.quantite} onChange={handleChange} style={inputStyle} required />
                        </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Category *</label>
                        <select name="categorie" value={formData.categorie} onChange={handleChange} style={inputStyle} required>
                            <option value="">Select category</option>
                            <option value="Tools">Tools</option>
                            <option value="Safety">Safety</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Materials">Materials</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Product Image</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                                id="imageUpload"
                            />
                            <label
                                htmlFor="imageUpload"
                                style={{
                                    ...buttonStyle,
                                    background: '#36b9cc',
                                    color: 'white',
                                    display: 'inline-block',
                                    marginRight: '10px',
                                    marginBottom: '0'
                                }}
                            >
                                📷 Upload Image
                            </label>
                            <span style={{ fontSize: '12px', color: '#666' }}>
                                {imageFile ? imageFile.name : 'No file chosen'}
                            </span>
                        </div>
                        {imagePreview && (
                            <div style={{ marginTop: '10px' }}>
                                <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '5px', border: '2px solid #ddd' }} />
                            </div>
                        )}
                        <div style={{ marginTop: '10px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>Or enter image URL:</label>
                            <input type="text" name="imagePUrl" placeholder="https://example.com/image.jpg" value={formData.imagePUrl} onChange={handleChange} style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Description *</label>
                        <textarea name="description" placeholder="Enter product description" value={formData.description} onChange={handleChange} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} required />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '25px' }}>
                        <button
                            type="button"
                            onClick={handleCancel}
                            style={{
                                ...buttonStyle,
                                background: '#e74a3b',
                                color: 'white',
                                flex: '1',
                                marginRight: '10px'
                            }}
                        >
                            ✕ Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                ...buttonStyle,
                                background: loading ? '#ccc' : '#1cc88a',
                                color: 'white',
                                flex: '1',
                                marginRight: '0'
                            }}
                        >
                            {loading ? '⏳ Adding...' : '✓ Add Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupplierAddProduct;
