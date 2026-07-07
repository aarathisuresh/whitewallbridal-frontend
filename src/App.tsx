import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import API from './api/axios';

interface Product {
  id?: number;
  _id?: string;
  name: string;
  category: string;
  price: number;
  fabric: string;
  image: string;
  description: string;
  materialType?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Order {
  id: string;
  clientName: string;
  email: string;
  items: string;
  total: number;
  status: 'Pending' | 'Pattern Cutting' | 'In Tailoring' | 'Shipped' | 'Delivered';
  isCustom: boolean;
  metrics?: string;
  date: string;
}

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Amara Crimson Silk Bridal Saree',
    category: 'Sarees',
    price: 45000,
    fabric: 'Pure Kanchipuram Silk',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80',
    description: 'A breathtaking Banarasi silk masterpiece adorned with intricate golden zari work.'
  },
  {
    id: 2,
    name: 'Ivory Blossom Anarkali Kurti',
    category: 'Kurtis',
    price: 8500,
    fabric: 'Premium Georgette',
    image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&q=80',
    description: 'An elegant hand-embroidered silhouette radiating modern minimalism.'
  },
  {
    id: 3,
    name: 'Elysian Rose Wedding Gown',
    category: 'Dresses',
    price: 120000,
    fabric: 'Tulle & Premium Satin',
    image: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=600&q=80',
    description: 'A magnificent multi-layered tulle overlay bridal gown featuring structural corset boning.'
  }
];

const MOCK_ORDERS: Order[] = [
  { id: 'WWB-9821', clientName: 'Aarathi Suresh', email: 'aarathisuresh93@gmail.com', items: 'Amara Crimson Silk Saree', total: 45000, status: 'Pending', isCustom: true, metrics: 'B:34 W:28 H:38', date: '2026-07-02' },
  { id: 'WWB-9754', clientName: 'Anjali Sharma', email: 'anjali@example.com', items: 'Elysian Rose Wedding Gown', total: 120000, status: 'In Tailoring', isCustom: true, metrics: 'B:36 W:30 H:40', date: '2026-06-28' },
  { id: 'WWB-9610', clientName: 'Meera Nair', email: 'meera@nair.com', items: 'Ivory Blossom Anarkali Kurti', total: 8500, status: 'Shipped', isCustom: false, date: '2026-06-15' }
];

export default function App() {
  const [view, setView] = useState<'home' | 'catalog' | 'bespoke' | 'auth' | 'user-portal' | 'admin'>('home');
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [userSubView, setUserSubView] = useState<'cart' | 'wishlist' | 'orders'>('cart');
  const [adminSubView, setAdminSubView] = useState<'fittings' | 'orders' | 'customers' | 'uploader' | 'purchases' | 'products'>('fittings');
  
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [cart, setCart] = useState<{product: Product, count: number}[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>(MOCK_ORDERS);
  const [checkoutStep, setCheckoutStep] = useState<'idle' | 'processing' | 'success'>('idle');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState('');

  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [bust, setBust] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [bespokeProductName, setBespokeProductName] = useState('');

  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState(''); 
  const [newProdFabric, setNewProdFabric] = useState('');
  const [newProdMaterial, setNewProdMaterial] = useState('');
  const [newProdCare, setNewProdCare] = useState('');
  const [imageString, setImageString] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  const [activeInvoice, setActiveInvoice] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    fetchProductsFromDatabase();
  }, []);

  const fetchProductsFromDatabase = async () => {
    setLoadingProducts(true);
    try {
      const response = await API.get('/products');
      if (response.data.success && response.data.data && Array.isArray(response.data.data)) {
        const dbProducts: Product[] = response.data.data.map((p: any) => ({
          id: undefined,
          _id: p._id,
          name: p.name,
          category: p.category?.name || p.category,
          price: p.price,
          fabric: p.fabric,
          materialType: p.materialType || p.material_type || '',
          image: p.images?.[0]?.url || '',
          description: p.description
        }));
        setProducts(dbProducts.length > 0 ? dbProducts : INITIAL_PRODUCTS);
      }
    } catch (error) {
      console.log('Using default products - Database fetch failed', error);
      setProducts(INITIAL_PRODUCTS);
    } finally {
      setLoadingProducts(false);
    }
  };

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const productKey = product._id || product.id;
      const existing = prev.find(item => (item.product._id || item.product.id) === productKey);
      if (existing) return prev.map(item => (item.product._id || item.product.id) === productKey ? {...item, count: item.count + 1} : item);
      return [...prev, { product, count: 1 }];
    });
    alert(`Added ${product.name} to Cart!`);
  };

  const removeFromCart = (productId: string | number | undefined) => {
    setCart(prev => prev.filter(item => (item.product._id || item.product.id) !== productId));
    alert('Item removed from cart');
  };

  const updateCartQuantity = (productId: string | number | undefined, newCount: number) => {
    if (newCount <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prev => prev.map(item => (item.product._id || item.product.id) === productId ? {...item, count: newCount} : item));
    }
  };

  const addToWishlist = (product: Product) => {
    const productKey = product._id || product.id;
    if (!wishlist.find(p => (p._id || p.id) === productKey)) {
      setWishlist([...wishlist, product]);
      alert(`Saved ${product.name} to Wishlist!`);
    }
  };

  const runCheckout = () => {
    setCheckoutStep('processing');
    setTimeout(() => {
      const newOrder: Order = {
        id: `WWB-${Math.floor(1000 + Math.random() * 9000)}`,
        clientName: currentUser?.name || 'Guest Client',
        email: currentUser?.email || 'guest@retail.com',
        items: cart.map(c => `${c.product.name} (x${c.count})`).join(', '),
        total: cart.reduce((acc, c) => acc + (c.product.price * c.count), 0),
        status: 'Pending',
        isCustom: false,
        date: new Date().toISOString().split('T')[0]
      };
      setOrdersList([newOrder, ...ordersList]);
      setCart([]);
      setCheckoutStep('success');
      setTimeout(() => setCheckoutStep('idle'), 2000);
    }, 1500);
  };

  const updateStatus = (orderId: string, nextStatus: Order['status']) => {
    setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageString(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProductSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setUploadStatus('Uploading new designer asset details...');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: newProdName,
        description: newProdDesc,
        price: Number(newProdPrice),
        category: newProdCategory,
        fabric: newProdFabric,
        materialType: newProdMaterial,
        care: newProdCare,
        images: [{ url: imageString, isMain: true }],
        variants: [{ size: 'M', color: 'ivory', stock: 5, sku: `WWB-${Date.now()}` }]
      };

      const response = await API.post('/products', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUploadStatus('🎉 Product published successfully and added to database!');
        await fetchProductsFromDatabase();
        setNewProdName('');
        setNewProdDesc('');
        setNewProdPrice('');
        setNewProdCategory('');
        setNewProdFabric('');
        setNewProdMaterial('');
        setNewProdCare('');
        setImageString('');
      }
    } catch (err: any) {
      setUploadStatus(`❌ Server Rejected Upload: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteProduct = async (productId: string | undefined) => {
    if (!productId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await API.delete(`/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setProducts(prev => prev.filter(p => p._id !== productId));
        setDeleteConfirm(null);
        alert('Product deleted successfully!');
      }
    } catch (err: any) {
      alert(`Error deleting product: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const response = await API.post('/auth/login', { email: authEmail, password: authPassword });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setCurrentUser(response.data.user);
        setAuthEmail('');
        setAuthPassword('');
        setView(response.data.user.role === 'admin' ? 'admin' : 'home');
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const response = await API.post('/auth/register', {
        name: authName,
        email: authEmail,
        password: authPassword,
        phone: authPhone
      });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setCurrentUser(response.data.user);
        setAuthName('');
        setAuthEmail('');
        setAuthPassword('');
        setAuthPhone('');
        setView('home');
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.message || 'Registration failed. Try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setView('home');
  };

  const handleBespokeSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newOrder: Order = {
      id: `WWB-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName,
      email,
      items: bespokeProductName || 'Custom Bespoke Commission',
      total: 0,
      status: 'Pending',
      isCustom: true,
      metrics: `B:${bust} W:${waist} H:${hips}`,
      date: new Date().toISOString().split('T')[0],
    };
    setOrdersList([newOrder, ...ordersList]);
    setClientName('');
    setEmail('');
    setBust('');
    setWaist('');
    setHips('');
    setBespokeProductName('');
    alert('Your bespoke fitting request has been submitted! Our atelier will reach out with a quote.');
    setView('home');
  };

  const openBespokeForProduct = (productName: string) => {
    setBespokeProductName(productName);
    setView('bespoke');
    window.scrollTo(0, 0);
  };

  const getPurchasedItems = () => {
    return ordersList.filter(o => !o.isCustom);
  };

  return (
    <div className="app-container">
      <header className="navbar">
        <h1 onClick={() => setView('home')} className="nav-logo">
          White Wall <span>Bridal</span>
        </h1>
        <nav className="nav-links">
          <button onClick={() => setView('home')} className={`nav-btn ${view === 'home' ? 'active' : ''}`}>Home</button>
          <button onClick={() => setView('catalog')} className={`nav-btn ${view === 'catalog' ? 'active' : ''}`}>Collections</button>
          <button onClick={() => setView('bespoke')} className={`nav-btn ${view === 'bespoke' ? 'active' : ''}`}>Bespoke Fitting</button>
          
          {currentUser && currentUser.role !== 'admin' && (
            <button onClick={() => { setView('user-portal'); setUserSubView('cart'); }} className={`nav-btn ${view === 'user-portal' ? 'active' : ''}`}>
              My Shopping Suite ({cart.reduce((a,c)=>a+c.count, 0)}) 🛍️
            </button>
          )}

          {currentUser && currentUser.role === 'admin' && (
            <button onClick={() => setView('admin')} className={`nav-btn ${view === 'admin' ? 'active' : ''}`} style={{ color: '#d9534f', fontWeight: 'bold' }}>
              Atelier Management ⚙️
            </button>
          )}
          
          {currentUser ? (
            <div className="user-nav-section" style={{ display: 'inline-block', marginLeft: '10px' }}>
              <span className="welcome-txt" style={{ marginRight: '10px', color: '#666' }}>Hello, {currentUser.name}</span>
              <button onClick={handleLogout} className="nav-btn auth-btn">Logout</button>
            </div>
          ) : (
            <button onClick={() => { setAuthError(''); setIsLoginMode(true); setView('auth'); }} className={`nav-btn ${view === 'auth' ? 'active' : ''}`}>Login / Register</button>
          )}
        </nav>
      </header>

      <main className="main-content">
        {view === 'home' && (
          <section className="hero-section">
            <span className="hero-subtitle">Haute Couture Atelier</span>
            <h2 className="hero-title">Bespoke Bridal Styling & Luxury Collections</h2>
            <p className="hero-desc">Discover clean silhouettes, handcrafted premium fabrics, and customizable sizing tailored just for you.</p>
            <div className="hero-actions">
              <button onClick={() => setView('catalog')} className="btn-primary">View Catalog</button>
              <button onClick={() => setView('bespoke')} className="btn-secondary">Book Fitting</button>
            </div>
          </section>
        )}

        {view === 'catalog' && (
          <div className="catalog-container">
            <div className="catalog-header">
              <h3>The Master Collections</h3>
              {loadingProducts && <p style={{ fontSize: '12px', color: '#666' }}>Loading products...</p>}
              <div className="filter-pills">
                {['All', 'Sarees', 'Kurtis', 'Dresses'].map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`pill ${selectedCategory === cat ? 'active' : ''}`}>{cat}</button>
                ))}
              </div>
            </div>

            <div className="products-grid">
              {filteredProducts.length === 0 ? (
                <p>No products in this category.</p>
              ) : (
                filteredProducts.map(p => (
                  <div key={p._id || p.id} className="product-card">
                    <div className="product-img-wrapper">
                      <img src={p.image} alt={p.name} />
                    </div>
                    <div className="product-info">
                      <h4 className="product-title">{p.name}</h4>
                      <span className="product-price">₹{p.price.toLocaleString('en-IN')}</span>
                      {p.materialType && <span style={{ fontSize: '12px', color: '#666' }}>Material: {p.materialType}</span>}
                      {currentUser?.role !== 'admin' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => addToCart(p)} className="btn-primary" style={{ padding: '6px 10px', fontSize: '12px', flex: 1 }}>Add to Cart</button>
                            <button onClick={() => addToWishlist(p)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '12px', flex: 1 }}>❤️ Wishlist</button>
                          </div>
                          <button onClick={() => openBespokeForProduct(p.name)} style={{ padding: '6px 10px', fontSize: '12px', background: '#f8f8f8', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>📏 Get Fitted</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- BESPOKE FITTING PAGE --- */}
        {view === 'bespoke' && (
          <div className="form-container" style={{ maxWidth: '600px', margin: '40px auto', background: '#fff', padding: '40px', borderRadius: '8px', border: '1px solid #eee' }}>
            <span className="hero-subtitle">Made to Measure</span>
            <h3 style={{ margin: '10px 0 5px 0' }}>Book a Bespoke Fitting</h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '25px' }}>
              Share your measurements and our atelier will craft a piece tailored precisely to you.
            </p>
            {bespokeProductName && (
              <div style={{ background: '#f0f0f0', padding: '12px', borderRadius: '4px', marginBottom: '20px', fontSize: '14px' }}>
                <strong>Selected Design:</strong> {bespokeProductName}
              </div>
            )}
            <form onSubmit={handleBespokeSubmit} className="bespoke-form">
              <input required type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Full Name" style={{ display: 'block', width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }} />
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" style={{ display: 'block', width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }} />
              
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px', fontWeight: '600' }}>Body Measurements (inches)</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '25px' }}>
                <div>
                  <input required type="number" value={bust} onChange={e => setBust(e.target.value)} placeholder="Bust" style={{ padding: '12px', width: '100%', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' }} />
                  <span style={{ fontSize: '11px', color: '#999', marginTop: '4px', display: 'block' }}>Bust</span>
                </div>
                <div>
                  <input required type="number" value={waist} onChange={e => setWaist(e.target.value)} placeholder="Waist" style={{ padding: '12px', width: '100%', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' }} />
                  <span style={{ fontSize: '11px', color: '#999', marginTop: '4px', display: 'block' }}>Waist</span>
                </div>
                <div>
                  <input required type="number" value={hips} onChange={e => setHips(e.target.value)} placeholder="Hips" style={{ padding: '12px', width: '100%', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' }} />
                  <span style={{ fontSize: '11px', color: '#999', marginTop: '4px', display: 'block' }}>Hips</span>
                </div>
              </div>
              
              <button type="submit" className="btn-submit" style={{ width: '100%', padding: '14px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', letterSpacing: '0.5px' }}>
                SUBMIT FITTING REQUEST
              </button>
            </form>
          </div>
        )}

        {/* --- CUSTOMER SHOPPING CONSOLE PORTAL --- */}
        {view === 'user-portal' && currentUser?.role !== 'admin' && (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '30px' }}>
            <aside style={{ background: '#fcf8fb', padding: '20px', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #ddd' }}>Shopping App</h4>
              <button onClick={() => setUserSubView('cart')} style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', border: 'none', background: userSubView === 'cart' ? '#fff' : 'transparent', fontWeight: userSubView === 'cart' ? 'bold' : 'normal', cursor: 'pointer' }}>🛒 Shopping Cart</button>
              <button onClick={() => setUserSubView('wishlist')} style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', border: 'none', background: userSubView === 'wishlist' ? '#fff' : 'transparent', fontWeight: userSubView === 'wishlist' ? 'bold' : 'normal', cursor: 'pointer' }}>💖 My Wishlist</button>
              <button onClick={() => setUserSubView('orders')} style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', border: 'none', background: userSubView === 'orders' ? '#fff' : 'transparent', fontWeight: userSubView === 'orders' ? 'bold' : 'normal', cursor: 'pointer' }}>📦 History & Tracking</button>
            </aside>

            <section style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
              {userSubView === 'cart' && (
                <div>
                  <h3>Your Selected Cart Items</h3>
                  {cart.length === 0 ? <p>Your shopping cart is currently empty.</p> : (
                    <div>
                      {cart.map(item => (
                        <div key={item.product._id || item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                          <div style={{ flex: 1 }}>
                            <b>{item.product.name}</b> <br/> 
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px' }}>
                              <span>Qty:</span>
                              <input type="number" value={item.count} min="1" onChange={(e) => updateCartQuantity(item.product._id || item.product.id, parseInt(e.target.value) || 1)} style={{ width: '50px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }} />
                              <button onClick={() => removeFromCart(item.product._id || item.product.id)} style={{ padding: '4px 8px', background: '#d9534f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>❌ Remove</button>
                            </div>
                          </div>
                          <div><b>₹{(item.product.price * item.count).toLocaleString('en-IN')}</b></div>
                        </div>
                      ))}
                      <div style={{ textAlign: 'right', marginTop: '20px' }}>
                        <h4>Total: ₹{cart.reduce((acc, c) => acc + (c.product.price * c.count), 0).toLocaleString('en-IN')}</h4>
                        {checkoutStep === 'idle' && <button onClick={runCheckout} className="btn-primary">Proceed to Secure Checkout</button>}
                        {checkoutStep === 'processing' && <p>Processing secure card payment pathways...</p>}
                        {checkoutStep === 'success' && <p style={{ color: 'green', fontWeight: 'bold' }}>🎉 Order Placed Successfully! Checked out into tracking queue.</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {userSubView === 'wishlist' && (
                <div>
                  <h3>Your Wishlist Items</h3>
                  {wishlist.length === 0 ? <p>No designs saved to your wishlist yet.</p> : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      {wishlist.map(p => (
                        <div key={p._id || p.id} style={{ border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
                          <h5>{p.name}</h5>
                          <button onClick={() => addToCart(p)} className="btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }}>Move to Cart</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {userSubView === 'orders' && (
                <div>
                  <h3>Order History & Real-Time Tracking</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>Order ID</th>
                        <th style={{ padding: '8px' }}>Items</th>
                        <th style={{ padding: '8px' }}>Total</th>
                        <th style={{ padding: '8px' }}>Tracking Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersList.filter(o => o.email === currentUser?.email).map(o => (
                        <tr key={o.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '8px' }}>{o.id}</td>
                          <td style={{ padding: '8px' }}>{o.items}</td>
                          <td style={{ padding: '8px' }}>₹{o.total.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '8px' }}><span style={{ padding: '2px 6px', background: '#eaeaea', borderRadius: '4px', fontSize: '12px' }}>{o.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* --- EXPANDED MANAGEMENT CONTROL SYSTEM (ADMIN) --- */}
        {view === 'admin' && currentUser && currentUser.role === 'admin' && (
          <div className="form-container" style={{ maxWidth: '1100px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: '#f5f5f5', padding: '10px', borderRadius: '6px', flexWrap: 'wrap' }}>
              <button onClick={() => setAdminSubView('fittings')} style={{ padding: '8px 12px', border: 'none', background: adminSubView === 'fittings' ? '#000' : 'transparent', color: adminSubView === 'fittings' ? '#fff' : '#000', cursor: 'pointer', borderRadius: '4px' }}>Bespoke Custom Fits</button>
              <button onClick={() => setAdminSubView('orders')} style={{ padding: '8px 12px', border: 'none', background: adminSubView === 'orders' ? '#000' : 'transparent', color: adminSubView === 'orders' ? '#fff' : '#000', cursor: 'pointer', borderRadius: '4px' }}>Order Management</button>
              <button onClick={() => setAdminSubView('purchases')} style={{ padding: '8px 12px', border: 'none', background: adminSubView === 'purchases' ? '#000' : 'transparent', color: adminSubView === 'purchases' ? '#fff' : '#000', cursor: 'pointer', borderRadius: '4px' }}>📊 Customer Purchases</button>
              <button onClick={() => setAdminSubView('products')} style={{ padding: '8px 12px', border: 'none', background: adminSubView === 'products' ? '#000' : 'transparent', color: adminSubView === 'products' ? '#fff' : '#000', cursor: 'pointer', borderRadius: '4px' }}>📦 Manage Products</button>
              <button onClick={() => setAdminSubView('customers')} style={{ padding: '8px 12px', border: 'none', background: adminSubView === 'customers' ? '#000' : 'transparent', color: adminSubView === 'customers' ? '#fff' : '#000', cursor: 'pointer', borderRadius: '4px' }}>Customer Profiles</button>
              <button onClick={() => setAdminSubView('uploader')} style={{ padding: '8px 12px', border: 'none', background: adminSubView === 'uploader' ? '#000' : 'transparent', color: adminSubView === 'uploader' ? '#fff' : '#000', cursor: 'pointer', borderRadius: '4px' }}>Product Uploader</button>
            </div>

            {adminSubView === 'products' && (
              <div>
                <h3>Manage Products Inventory</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#eee', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>Product Name</th>
                      <th style={{ padding: '10px' }}>Category</th>
                      <th style={{ padding: '10px' }}>Price (₹)</th>
                      <th style={{ padding: '10px' }}>Fabric</th>
                      <th style={{ padding: '10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p._id || p.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}><b>{p.name}</b></td>
                        <td style={{ padding: '10px' }}>{p.category}</td>
                        <td style={{ padding: '10px' }}>{p.price.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '10px' }}>{p.fabric}</td>
                        <td style={{ padding: '10px' }}>
                          <button onClick={() => setDeleteConfirm(p._id)} style={{ padding: '4px 10px', marginRight: '8px', background: '#d9534f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>🗑️ Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {deleteConfirm && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
                <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', width: '400px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                  <h3>Delete Product?</h3>
                  <p>Are you sure you want to permanently delete this product?</p>
                  <div style={{ textAlign: 'right', gap: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => setDeleteConfirm(null)} style={{ padding: '8px 16px', background: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => handleDeleteProduct(deleteConfirm)} style={{ padding: '8px 16px', background: '#d9534f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              </div>
            )}

            {adminSubView === 'fittings' && (
              <div>
                <h3>Manage Custom Fitting Submissions</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#eee', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>Client</th>
                      <th style={{ padding: '10px' }}>Allocated Dimensions</th>
                      <th style={{ padding: '10px' }}>Type</th>
                      <th style={{ padding: '10px' }}>Status Execution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersList.filter(o => o.isCustom).map(o => (
                      <tr key={o.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}><b>{o.clientName}</b><br/><small>{o.email}</small></td>
                        <td>{o.metrics}</td>
                        <td><span style={{ color: 'purple' }}>Bespoke Project</span></td>
                        <td>
                          <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value as any)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
                            <option value="Pending">Pending Queue</option>
                            <option value="Pattern Cutting">Pattern Cutting</option>
                            <option value="In Tailoring">In Tailoring</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminSubView === 'orders' && (
              <div>
                <h3>Global Shop Order Matrix</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#eee', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>Order ID</th>
                      <th style={{ padding: '10px' }}>Products Purchased</th>
                      <th style={{ padding: '10px' }}>Total Invoice Bill</th>
                      <th style={{ padding: '10px' }}>Status Execution</th>
                      <th style={{ padding: '10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersList.map(o => (
                      <tr key={o.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>{o.id}</td>
                        <td>{o.items}</td>
                        <td>₹{o.total.toLocaleString('en-IN')}</td>
                        <td>
                          <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value as any)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
                            <option value="Pending">Pending Queue</option>
                            <option value="Pattern Cutting">Pattern Cutting</option>
                            <option value="In Tailoring">In Tailoring</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                        <td>
                          <button onClick={() => setActiveInvoice(o)} style={{ padding: '4px 8px', background: '#5bc0de', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>📄 Invoice</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminSubView === 'purchases' && (
              <div>
                <h3>📊 Customer Purchase Analytics</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#eee', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>Order ID</th>
                      <th style={{ padding: '10px' }}>Customer Name</th>
                      <th style={{ padding: '10px' }}>Email</th>
                      <th style={{ padding: '10px' }}>Item Name</th>
                      <th style={{ padding: '10px' }}>Amount (₹)</th>
                      <th style={{ padding: '10px' }}>Date</th>
                      <th style={{ padding: '10px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPurchasedItems().map(o => (
                      <tr key={o.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{o.id}</td>
                        <td style={{ padding: '10px' }}>{o.clientName}</td>
                        <td style={{ padding: '10px' }}>{o.email}</td>
                        <td style={{ padding: '10px' }}>{o.items}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>₹{o.total.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '10px', fontSize: '12px' }}>{o.date}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ padding: '4px 8px', background: '#d4edda', color: '#155724', borderRadius: '4px', fontSize: '12px' }}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {getPurchasedItems().length === 0 && <p>No customer purchases yet.</p>}
              </div>
            )}

            {adminSubView === 'customers' && (
              <div>
                <h3>Customer Directory Management</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#eee', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>Profile Name</th>
                      <th style={{ padding: '10px' }}>Contact Email</th>
                      <th style={{ padding: '10px' }}>Total Orders</th>
                      <th style={{ padding: '10px' }}>System Clearance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>Aarathi Suresh</td>
                      <td>aarathisuresh93@gmail.com</td>
                      <td>{ordersList.filter(o => o.email === 'aarathisuresh93@gmail.com').length}</td>
                      <td><span style={{ color: 'green' }}>Verified Client</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>Anjali Sharma</td>
                      <td>anjali@example.com</td>
                      <td>{ordersList.filter(o => o.email === 'anjali@example.com').length}</td>
                      <td><span style={{ color: 'green' }}>Verified Client</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>Meera Nair</td>
                      <td>meera@nair.com</td>
                      <td>{ordersList.filter(o => o.email === 'meera@nair.com').length}</td>
                      <td><span style={{ color: 'green' }}>Verified Client</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {adminSubView === 'uploader' && (
              <div style={{ background: '#fafafa', padding: '20px', borderRadius: '8px' }}>
                <h3>Product Uploader</h3>
                <form onSubmit={handleProductSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <input required type="text" value={newProdName} onChange={e => setNewProdName(e.target.value)} placeholder="Product Name" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                  <input required type="number" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} placeholder="Price (INR)" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                  <input required type="text" value={newProdFabric} onChange={e => setNewProdFabric(e.target.value)} placeholder="Fabric Details" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                  <input required type="text" value={newProdMaterial} onChange={e => setNewProdMaterial(e.target.value)} placeholder="Material Type (e.g., Silk Blend, Net)" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                  <input required type="text" value={newProdCategory} onChange={e => setNewProdCategory(e.target.value)} placeholder="Category (Sarees/Kurtis/Dresses)" style={{ padding: '8px', gridColumn: 'span 2', borderRadius: '4px', border: '1px solid #ccc' }} />
                  <textarea required value={newProdDesc} onChange={e => setNewProdDesc(e.target.value)} placeholder="Design Description..." style={{ padding: '8px', gridColumn: 'span 2', height: '60px', borderRadius: '4px', border: '1px solid #ccc' }} />
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ gridColumn: 'span 2' }} />
                  <button type="submit" className="btn-submit" style={{ gridColumn: 'span 2', background: '#000', color: '#fff', padding: '10px', cursor: 'pointer', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Publish</button>
                </form>
                {uploadStatus && <p style={{ marginTop: '10px', fontWeight: '500' }}>{uploadStatus}</p>}
              </div>
            )}
          </div>
        )}

        {/* --- DYNAMIC INVOICE MODAL POPUP --- */}
        {activeInvoice && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', width: '500px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
                <h2>WHITE WALL BRIDAL</h2>
                <p>Official Billing Statement</p>
              </div>
              <div style={{ margin: '20px 0' }}>
                <p><b>Invoice Reference:</b> {activeInvoice.id}</p>
                <p><b>Date Issued:</b> {activeInvoice.date}</p>
                <p><b>Billed To:</b> {activeInvoice.clientName} ({activeInvoice.email})</p>
                <hr style={{ border: '0', borderTop: '1px dashed #ccc' }} />
                <p><b>Line Items Summary:</b><br/> {activeInvoice.items}</p>
                {activeInvoice.metrics && <p><b>Anatomical Profile:</b> {activeInvoice.metrics}</p>}
                <hr style={{ border: '0', borderTop: '1px dashed #ccc' }} />
                <h3>Total Amount Due: ₹{activeInvoice.total.toLocaleString('en-IN')}</h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <button onClick={() => window.print()} style={{ padding: '6px 12px', marginRight: '10px', background: '#5cb85c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Print / Save PDF</button>
                <button onClick={() => setActiveInvoice(null)} style={{ padding: '6px 12px', background: '#d9534f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* --- AUTH CONSOLE --- */}
        {view === 'auth' && (
          <div className="form-container" style={{ maxWidth: '450px', margin: '40px auto', background: '#fff', padding: '30px', borderRadius: '8px', border: '1px solid #eee' }}>
            {isLoginMode ? (
              <form onSubmit={handleLoginSubmit} className="bespoke-form">
                <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Atelier Secure Login</h3>
                {authError && <p style={{ color: 'red', fontSize: '14px' }}>{authError}</p>}
                <input required type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email Address" style={{ display:'block', width:'100%', padding:'10px', marginBottom:'12px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <input required type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Password" style={{ display:'block', width:'100%', padding:'10px', marginBottom:'20px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <button type="submit" className="btn-submit" style={{ width: '100%', padding: '10px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Log In</button>
                <p style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>
                  Don't have an account?{' '}
                  <span onClick={() => { setIsLoginMode(false); setAuthError(''); }} style={{ color: '#d9534f', cursor: 'pointer', fontWeight: 'bold' }}>Create account here</span>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="bespoke-form">
                <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Create Client Profile</h3>
                {authError && <p style={{ color: 'red', fontSize: '14px' }}>{authError}</p>}
                <input required type="text" value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Full Name" style={{ display:'block', width:'100%', padding:'10px', marginBottom:'12px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <input required type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email Address" style={{ display:'block', width:'100%', padding:'10px', marginBottom:'12px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <input required type="text" value={authPhone} onChange={e => setAuthPhone(e.target.value)} placeholder="Phone Number" style={{ display:'block', width:'100%', padding:'10px', marginBottom:'12px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <input required type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Password" style={{ display:'block', width:'100%', padding:'10px', marginBottom:'20px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <button type="submit" className="btn-submit" style={{ width: '100%', padding: '10px', background: '#d9534f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Register Account</button>
                <p style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>
                  Already registered?{' '}
                  <span onClick={() => { setIsLoginMode(true); setAuthError(''); }} style={{ color: '#000', cursor: 'pointer', fontWeight: 'bold' }}>Login here</span>
                </p>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}