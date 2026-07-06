import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import API from './api/axios'; // Make sure this path correctly points to your axios.js file

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  fabric: string;
  image: string;
  description: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Interface for expanded management records
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
  // Navigation View State
  const [view, setView] = useState<'home' | 'catalog' | 'bespoke' | 'login' | 'register' | 'user-portal' | 'admin'>('home');
  const [userSubView, setUserSubView] = useState<'cart' | 'wishlist' | 'orders'>('cart');
  const [adminSubView, setAdminSubView] = useState<'fittings' | 'orders' | 'customers' | 'uploader'>('fittings');
  
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Interactive Global Shopping States (Cart & Wishlist)
  const [cart, setCart] = useState<{product: Product, count: number}[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>(MOCK_ORDERS);
  const [checkoutStep, setCheckoutStep] = useState<'idle' | 'processing' | 'success'>('idle');

  // Authentication States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState('');

  // Bespoke Fitting States
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [bust, setBust] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');

  // New States for Product Creation panel
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState(''); 
  const [newProdFabric, setNewProdFabric] = useState('');
  const [newProdCare, setNewProdCare] = useState('');
  const [imageString, setImageString] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  // Invoice view handler state
  const [activeInvoice, setActiveInvoice] = useState<Order | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setCurrentUser(parsedUser);
    }
  }, []);

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  // Cart & Wishlist Mutators
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) return prev.map(item => item.product.id === product.id ? {...item, count: item.count + 1} : item);
      return [...prev, { product, count: 1 }];
    });
    alert(`Added ${product.name} to Cart!`);
  };

  const addToWishlist = (product: Product) => {
    if (!wishlist.find(p => p.id === product.id)) {
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
    }, 1500);
  };

  // Admin Status Update Actions
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
        care: newProdCare,
        images: [{ url: imageString, isMain: true }],
        variants: [{ size: 'M', color: 'ivory', stock: 5, sku: `WWB-${Date.now()}` }]
      };

      const response = await API.post('/products', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUploadStatus('🎉 Product uploaded live and successfully committed to Atlas database!');
        setNewProdName(''); setNewProdDesc(''); setNewProdPrice(''); setNewProdCategory(''); setNewProdFabric(''); setNewProdCare(''); setImageString('');
      }
    } catch (err: any) {
      setUploadStatus(`❌ Server Rejected Upload: ${err.response?.data?.message || err.message}`);
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
        setAuthEmail(''); setAuthPassword('');
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
        name: authName, email: authEmail, password: authPassword, phone: authPhone
      });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setCurrentUser(response.data.user);
        setAuthName(''); setAuthEmail(''); setAuthPassword(''); setAuthPhone('');
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
          
          {currentUser && (
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
            <button onClick={() => { setAuthError(''); setView('login'); }} className={`nav-btn ${view === 'login' ? 'active' : ''}`}>Login</button>
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
              <div className="filter-pills">
                {['All', 'Sarees', 'Kurtis', 'Dresses'].map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`pill ${selectedCategory === cat ? 'active' : ''}`}>{cat}</button>
                ))}
              </div>
            </div>

            <div className="products-grid">
              {filteredProducts.map(p => (
                <div key={p.id} className="product-card">
                  <div className="product-img-wrapper">
                    <img src={p.image} alt={p.name} />
                  </div>
                  <div className="product-info">
                    <h4 className="product-title">{p.name}</h4>
                    <span className="product-price">₹{p.price.toLocaleString('en-IN')}</span>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button onClick={() => addToCart(p)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Add to Cart</button>
                      <button onClick={() => addToWishlist(p)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>❤️ Wishlist</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- CUSTOMER SHOPPING CONSOLE PORTAL --- */}
        {view === 'user-portal' && (
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
                        <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                          <div style={{ flex: 1 }}><b>{item.product.name}</b> <br/> Quantities: {item.count}</div>
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
                        <div key={p.id} style={{ border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
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
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: '#f5f5f5', padding: '10px', borderRadius: '6px' }}>
              <button onClick={() => setAdminSubView('fittings')} style={{ padding: '8px 12px', border: 'none', background: adminSubView === 'fittings' ? '#000' : 'transparent', color: adminSubView === 'fittings' ? '#fff' : '#000', cursor: 'pointer', borderRadius: '4px' }}>Bespoke Custom Fits</button>
              <button onClick={() => setAdminSubView('orders')} style={{ padding: '8px 12px', border: 'none', background: adminSubView === 'orders' ? '#000' : 'transparent', color: adminSubView === 'orders' ? '#fff' : '#000', cursor: 'pointer', borderRadius: '4px' }}>Order Management</button>
              <button onClick={() => setAdminSubView('customers')} style={{ padding: '8px 12px', border: 'none', background: adminSubView === 'customers' ? '#000' : 'transparent', color: adminSubView === 'customers' ? '#fff' : '#000', cursor: 'pointer', borderRadius: '4px' }}>Customer Profiles</button>
              <button onClick={() => setAdminSubView('uploader')} style={{ padding: '8px 12px', border: 'none', background: adminSubView === 'uploader' ? '#000' : 'transparent', color: adminSubView === 'uploader' ? '#fff' : '#000', cursor: 'pointer', borderRadius: '4px' }}>Product Asset Uploader</button>
            </div>

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
                        <td style={{ padding: '10px' }}><b>{o.clientName}</b></td>
                        <td>{o.metrics}</td>
                        <td><span style={{ color: 'purple' }}>Bespoke Project</span></td>
                        <td>
                          <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value as any)}>
                            <option value="Pending">Pending Queue</option>
                            <option value="Pattern Cutting">Pattern Cutting</option>
                            <option value="In Tailoring">In Tailoring</option>
                            <option value="Shipped">Shipped</option>
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
                          <button onClick={() => setActiveInvoice(o)} style={{ padding: '4px 8px', background: '#5bc0de', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>📄 Generate Invoice</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      <th style={{ padding: '10px' }}>System Clearance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>Aarathi Suresh</td>
                      <td>aarathisuresh93@gmail.com</td>
                      <td><span style={{ color: 'green' }}>Verified Client</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>Anjali Sharma</td>
                      <td>anjali@example.com</td>
                      <td><span style={{ color: 'green' }}>Verified Client</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {adminSubView === 'uploader' && (
              <div style={{ background: '#fafafa', padding: '20px', borderRadius: '8px' }}>
                <h3>Add Live Product Asset</h3>
                <form onSubmit={handleProductSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <input required type="text" value={newProdName} onChange={e => setNewProdName(e.target.value)} placeholder="Product Name" style={{ padding: '8px' }} />
                  <input required type="number" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} placeholder="Price (INR)" style={{ padding: '8px' }} />
                  <input required type="text" value={newProdCategory} onChange={e => setNewProdCategory(e.target.value)} placeholder="Category MongoDB ObjectId String" style={{ padding: '8px', gridColumn: 'span 2' }} />
                  <textarea required value={newProdDesc} onChange={e => setNewProdDesc(e.target.value)} placeholder="Design Description..." style={{ padding: '8px', gridColumn: 'span 2', height: '60px' }} />
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ gridColumn: 'span 2' }} />
                  <button type="submit" className="btn-submit" style={{ gridColumn: 'span 2', background: '#000', color: '#fff', padding: '10px' }}>Publish To MongoDB Atlas</button>
                </form>
                {uploadStatus && <p>{uploadStatus}</p>}
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

        {view === 'login' && (
          <div className="form-container">
            <form onSubmit={handleLoginSubmit} className="bespoke-form" style={{ maxWidth: '450px', margin: '0 auto' }}>
              <h3>Atelier Login</h3>
              <input required type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email Address" style={{ display:'block', width:'100%', padding:'8px', marginBottom:'10px' }} />
              <input required type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Password" style={{ display:'block', width:'100%', padding:'8px', marginBottom:'15px' }} />
              <button type="submit" className="btn-submit">Log In</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}