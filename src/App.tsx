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
  // View state
  const [view, setView] = useState<'home' | 'catalog' | 'bespoke' | 'auth' | 'user-portal' | 'admin'>('home');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [userSubView, setUserSubView] = useState<'cart' | 'wishlist' | 'orders'>('cart');
  const [adminSubView, setAdminSubView] = useState<'fittings' | 'orders' | 'purchases' | 'products' | 'customers' | 'uploader'>('fittings');
  
  // Products
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Cart & Wishlist
  const [cart, setCart] = useState<Array<{product: Product, count: number}>>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>(MOCK_ORDERS);
  const [checkoutStep, setCheckoutStep] = useState<'idle' | 'processing' | 'success'>('idle');

  // Auth
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState('');

  // Bespoke
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [bust, setBust] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [bespokeProductName, setBespokeProductName] = useState('');

  // Product upload
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdFabric, setNewProdFabric] = useState('');
  const [newProdMaterial, setNewProdMaterial] = useState('');
  const [newProdCare, setNewProdCare] = useState('');
  const [imageString, setImageString] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

  // Modals
  const [activeInvoice, setActiveInvoice] = useState<Order | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    fetchProductsFromDatabase();
  }, []);

  const fetchProductsFromDatabase = async () => {
    setLoadingProducts(true);
    try {
      const response = await API.get('/products');
      if (response.data.success && Array.isArray(response.data.data)) {
        const dbProducts = response.data.data.map((p: any) => ({
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
      console.log('Using default products', error);
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
      const key = product._id || product.id;
      const existing = prev.find(item => (item.product._id || item.product.id) === key);
      if (existing) {
        return prev.map(item => (item.product._id || item.product.id) === key ? {...item, count: item.count + 1} : item);
      }
      return [...prev, { product, count: 1 }];
    });
    alert(`Added ${product.name} to Cart!`);
  };

  const removeFromCart = (productId: string | number | undefined) => {
    setCart(prev => prev.filter(item => (item.product._id || item.product.id) !== productId));
  };

  const updateCartQuantity = (productId: string | number | undefined, newCount: number) => {
    if (newCount <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prev => prev.map(item => (item.product._id || item.product.id) === productId ? {...item, count: newCount} : item));
    }
  };

  const addToWishlist = (product: Product) => {
    const key = product._id || product.id;
    if (!wishlist.find(p => (p._id || p.id) === key)) {
      setWishlist([...wishlist, product]);
      alert(`Saved ${product.name} to Wishlist!`);
    }
  };

  const runCheckout = () => {
    setCheckoutStep('processing');
    setTimeout(() => {
      const newOrder: Order = {
        id: `WWB-${Math.floor(1000 + Math.random() * 9000)}`,
        clientName: currentUser?.name || 'Guest',
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
    setOrdersList(prev => prev.map(o => o.id === orderId ? {...o, status: nextStatus} : o));
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
    setUploadStatus('Uploading...');
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
        setUploadStatus('🎉 Product published successfully!');
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
      setUploadStatus(`❌ Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteProduct = async (productId: string | undefined) => {
    if (!productId) return;
    try {
      const token = localStorage.getItem('token');
      await API.delete(`/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(prev => prev.filter(p => p._id !== productId));
      setDeleteConfirm(null);
      alert('Product deleted!');
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleLoginSubmit = async (e: FormEvent) => {
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
      setAuthError(err.response?.data?.message || 'Invalid credentials');
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
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
      setAuthError(err.response?.data?.message || 'Registration failed');
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
    alert('Fitting request submitted! We will contact you with a quote.');
    setView('home');
  };

  const openBespokeForProduct = (productName: string) => {
    setBespokeProductName(productName);
    setView('bespoke');
  };

  const getPurchasedItems = () => ordersList.filter(o => !o.isCustom);

  const adminStyles = {
    tab: { padding: '8px 12px', border: 'none', cursor: 'pointer', borderRadius: '4px', background: 'transparent', marginRight: '5px' },
    activeTab: { background: '#000', color: '#fff' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    tableHead: { background: '#eee', textAlign: 'left' as const },
    tableCell: { padding: '10px', borderBottom: '1px solid #eee' },
    btn: { padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer' },
    input: { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', marginBottom: '12px' }
  };

  return (
    <div className="app-container">
      <header className="navbar">
        <h1 onClick={() => setView('home')} style={{cursor: 'pointer'}}>White Wall Bridal</h1>
        <nav className="nav-links">
          <button onClick={() => setView('home')}>Home</button>
          <button onClick={() => setView('catalog')}>Collections</button>
          <button onClick={() => setView('bespoke')}>Bespoke Fitting</button>
          
          {currentUser && currentUser.role !== 'admin' && (
            <button onClick={() => {setView('user-portal'); setUserSubView('cart');}}>
              My Shopping ({cart.reduce((a,c)=>a+c.count,0)})
            </button>
          )}
          {currentUser && currentUser.role === 'admin' && (
            <button onClick={() => setView('admin')} style={{color: '#d9534f', fontWeight: 'bold'}}>Admin</button>
          )}
          
          {currentUser ? (
            <>
              <span>Hello, {currentUser.name}</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button onClick={() => {setAuthError(''); setIsLoginMode(true); setView('auth');}}>Login</button>
          )}
        </nav>
      </header>

      <main className="main-content">
        {view === 'home' && (
          <section className="hero-section">
            <h2>Bespoke Bridal Styling & Luxury Collections</h2>
            <p>Discover clean silhouettes, handcrafted premium fabrics, tailored just for you.</p>
            <button onClick={() => setView('catalog')}>View Catalog</button>
            <button onClick={() => setView('bespoke')}>Book Fitting</button>
          </section>
        )}

        {view === 'catalog' && (
          <div className="catalog-container">
            <h3>The Master Collections</h3>
            {loadingProducts && <p>Loading...</p>}
            <div className="filter-pills">
              {['All', 'Sarees', 'Kurtis', 'Dresses'].map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} 
                  style={{fontWeight: selectedCategory === cat ? 'bold' : 'normal'}}>
                  {cat}
                </button>
              ))}
            </div>

            <div className="products-grid">
              {filteredProducts.length === 0 ? (
                <p>No products</p>
              ) : (
                filteredProducts.map(p => (
                  <div key={p._id || p.id} className="product-card">
                    <img src={p.image} alt={p.name} />
                    <h4>{p.name}</h4>
                    <p>₹{p.price.toLocaleString('en-IN')}</p>
                    {p.materialType && <p style={{fontSize: '12px', color: '#666'}}>Material: {p.materialType}</p>}
                    
                    {currentUser?.role !== 'admin' && (
                      <div style={{marginTop: '10px'}}>
                        <button onClick={() => addToCart(p)} style={{marginRight: '5px'}}>Add to Cart</button>
                        <button onClick={() => addToWishlist(p)} style={{marginRight: '5px'}}>Wishlist</button>
                        <button onClick={() => openBespokeForProduct(p.name)}>Get Fitted</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {view === 'bespoke' && (
          <div style={{maxWidth: '600px', margin: '40px auto', padding: '30px', background: '#fff', border: '1px solid #eee', borderRadius: '8px'}}>
            <h3>Book a Bespoke Fitting</h3>
            <p>Share your measurements and we'll craft a piece tailored for you.</p>
            {bespokeProductName && <p style={{background: '#f0f0f0', padding: '10px', marginBottom: '20px'}}>Selected: {bespokeProductName}</p>}
            
            <form onSubmit={handleBespokeSubmit}>
              <input required type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Full Name" style={adminStyles.input} />
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={adminStyles.input} />
              
              <p style={{fontWeight: 'bold', marginBottom: '10px'}}>Measurements (inches)</p>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px'}}>
                <input required type="number" value={bust} onChange={e => setBust(e.target.value)} placeholder="Bust" style={{padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}} />
                <input required type="number" value={waist} onChange={e => setWaist(e.target.value)} placeholder="Waist" style={{padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}} />
                <input required type="number" value={hips} onChange={e => setHips(e.target.value)} placeholder="Hips" style={{padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}} />
              </div>
              
              <button type="submit" style={{width: '100%', padding: '12px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>
                SUBMIT REQUEST
              </button>
            </form>
          </div>
        )}

        {view === 'user-portal' && (
          <div style={{maxWidth: '1000px', margin: '20px auto'}}>
            <div style={{marginBottom: '20px'}}>
              <button onClick={() => setUserSubView('cart')} style={{marginRight: '10px', fontWeight: userSubView === 'cart' ? 'bold' : 'normal'}}>Cart</button>
              <button onClick={() => setUserSubView('wishlist')} style={{marginRight: '10px', fontWeight: userSubView === 'wishlist' ? 'bold' : 'normal'}}>Wishlist</button>
              <button onClick={() => setUserSubView('orders')} style={{marginRight: '10px', fontWeight: userSubView === 'orders' ? 'bold' : 'normal'}}>Orders</button>
            </div>

            {userSubView === 'cart' && (
              <div>
                <h3>Your Cart</h3>
                {cart.length === 0 ? <p>Empty</p> : (
                  <div>
                    {cart.map(item => (
                      <div key={item.product._id} style={{borderBottom: '1px solid #eee', padding: '10px 0'}}>
                        <b>{item.product.name}</b><br/>
                        <input type="number" value={item.count} onChange={e => updateCartQuantity(item.product._id, parseInt(e.target.value) || 1)} style={{width: '50px', padding: '5px'}} />
                        <button onClick={() => removeFromCart(item.product._id)} style={{marginLeft: '10px'}}>Remove</button>
                        <p>₹{(item.product.price * item.count).toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                    <h4>Total: ₹{cart.reduce((acc, c) => acc + (c.product.price * c.count), 0).toLocaleString('en-IN')}</h4>
                    <button onClick={runCheckout} style={{padding: '10px 20px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer'}}>Checkout</button>
                    {checkoutStep === 'success' && <p style={{color: 'green'}}>Order placed!</p>}
                  </div>
                )}
              </div>
            )}

            {userSubView === 'wishlist' && (
              <div>
                <h3>Wishlist</h3>
                {wishlist.length === 0 ? <p>Empty</p> : (
                  wishlist.map(p => (
                    <div key={p._id} style={{border: '1px solid #eee', padding: '10px', marginBottom: '10px'}}>
                      <b>{p.name}</b><br/>
                      <button onClick={() => addToCart(p)}>Move to Cart</button>
                    </div>
                  ))
                )}
              </div>
            )}

            {userSubView === 'orders' && (
              <div>
                <h3>Order History</h3>
                <table style={adminStyles.table}>
                  <thead><tr style={adminStyles.tableHead}>
                    <th style={adminStyles.tableCell}>Order ID</th>
                    <th style={adminStyles.tableCell}>Items</th>
                    <th style={adminStyles.tableCell}>Total</th>
                    <th style={adminStyles.tableCell}>Status</th>
                  </tr></thead>
                  <tbody>
                    {ordersList.filter(o => o.email === currentUser?.email).map(o => (
                      <tr key={o.id}>
                        <td style={adminStyles.tableCell}>{o.id}</td>
                        <td style={adminStyles.tableCell}>{o.items}</td>
                        <td style={adminStyles.tableCell}>₹{o.total.toLocaleString('en-IN')}</td>
                        <td style={adminStyles.tableCell}>{o.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {view === 'admin' && (
          <div style={{maxWidth: '1100px', margin: '20px auto'}}>
            <div style={{marginBottom: '20px', display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
              <button onClick={() => setAdminSubView('fittings')} style={{...adminStyles.tab, ...(adminSubView === 'fittings' ? adminStyles.activeTab : {})}}>Fittings</button>
              <button onClick={() => setAdminSubView('orders')} style={{...adminStyles.tab, ...(adminSubView === 'orders' ? adminStyles.activeTab : {})}}>Orders</button>
              <button onClick={() => setAdminSubView('purchases')} style={{...adminStyles.tab, ...(adminSubView === 'purchases' ? adminStyles.activeTab : {})}}>Purchases</button>
              <button onClick={() => setAdminSubView('products')} style={{...adminStyles.tab, ...(adminSubView === 'products' ? adminStyles.activeTab : {})}}>Products</button>
              <button onClick={() => setAdminSubView('customers')} style={{...adminStyles.tab, ...(adminSubView === 'customers' ? adminStyles.activeTab : {})}}>Customers</button>
              <button onClick={() => setAdminSubView('uploader')} style={{...adminStyles.tab, ...(adminSubView === 'uploader' ? adminStyles.activeTab : {})}}>Upload</button>
            </div>

            {adminSubView === 'products' && (
              <div>
                <h3>Manage Products</h3>
                <table style={adminStyles.table}>
                  <thead><tr style={adminStyles.tableHead}>
                    <th style={adminStyles.tableCell}>Name</th>
                    <th style={adminStyles.tableCell}>Category</th>
                    <th style={adminStyles.tableCell}>Price</th>
                    <th style={adminStyles.tableCell}>Fabric</th>
                    <th style={adminStyles.tableCell}>Action</th>
                  </tr></thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p._id}>
                        <td style={adminStyles.tableCell}>{p.name}</td>
                        <td style={adminStyles.tableCell}>{p.category}</td>
                        <td style={adminStyles.tableCell}>₹{p.price.toLocaleString('en-IN')}</td>
                        <td style={adminStyles.tableCell}>{p.fabric}</td>
                        <td style={adminStyles.tableCell}><button onClick={() => setDeleteConfirm(p._id ?? null)} style={{...adminStyles.btn, background: '#d9534f', color: '#fff'}}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {deleteConfirm && (
              <div style={{position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <div style={{background: '#fff', padding: '30px', borderRadius: '8px', width: '400px'}}>
                  <h3>Delete Product?</h3>
                  <p>This cannot be undone.</p>
                  <button onClick={() => setDeleteConfirm(null)} style={{marginRight: '10px', padding: '8px 16px'}}>Cancel</button>
                  <button onClick={() => handleDeleteProduct(deleteConfirm)} style={{padding: '8px 16px', background: '#d9534f', color: '#fff', border: 'none', cursor: 'pointer'}}>Delete</button>
                </div>
              </div>
            )}

            {adminSubView === 'fittings' && (
              <div>
                <h3>Bespoke Fittings</h3>
                <table style={adminStyles.table}>
                  <thead><tr style={adminStyles.tableHead}>
                    <th style={adminStyles.tableCell}>Client</th>
                    <th style={adminStyles.tableCell}>Measurements</th>
                    <th style={adminStyles.tableCell}>Status</th>
                  </tr></thead>
                  <tbody>
                    {ordersList.filter(o => o.isCustom).map(o => (
                      <tr key={o.id}>
                        <td style={adminStyles.tableCell}>{o.clientName}</td>
                        <td style={adminStyles.tableCell}>{o.metrics}</td>
                        <td style={adminStyles.tableCell}>
                          <select value={o.status} onChange={e => updateStatus(o.id, e.target.value as any)}>
                            <option>Pending</option>
                            <option>Pattern Cutting</option>
                            <option>In Tailoring</option>
                            <option>Shipped</option>
                            <option>Delivered</option>
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
                <h3>All Orders</h3>
                <table style={adminStyles.table}>
                  <thead><tr style={adminStyles.tableHead}>
                    <th style={adminStyles.tableCell}>Order ID</th>
                    <th style={adminStyles.tableCell}>Items</th>
                    <th style={adminStyles.tableCell}>Total</th>
                    <th style={adminStyles.tableCell}>Status</th>
                  </tr></thead>
                  <tbody>
                    {ordersList.map(o => (
                      <tr key={o.id}>
                        <td style={adminStyles.tableCell}>{o.id}</td>
                        <td style={adminStyles.tableCell}>{o.items}</td>
                        <td style={adminStyles.tableCell}>₹{o.total.toLocaleString('en-IN')}</td>
                        <td style={adminStyles.tableCell}>
                          <select value={o.status} onChange={e => updateStatus(o.id, e.target.value as any)}>
                            <option>Pending</option>
                            <option>Pattern Cutting</option>
                            <option>In Tailoring</option>
                            <option>Shipped</option>
                            <option>Delivered</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminSubView === 'purchases' && (
              <div>
                <h3>Customer Purchases</h3>
                <table style={adminStyles.table}>
                  <thead><tr style={adminStyles.tableHead}>
                    <th style={adminStyles.tableCell}>Order ID</th>
                    <th style={adminStyles.tableCell}>Customer</th>
                    <th style={adminStyles.tableCell}>Item</th>
                    <th style={adminStyles.tableCell}>Amount</th>
                    <th style={adminStyles.tableCell}>Date</th>
                  </tr></thead>
                  <tbody>
                    {getPurchasedItems().map(o => (
                      <tr key={o.id}>
                        <td style={adminStyles.tableCell}>{o.id}</td>
                        <td style={adminStyles.tableCell}>{o.clientName}</td>
                        <td style={adminStyles.tableCell}>{o.items}</td>
                        <td style={adminStyles.tableCell}>₹{o.total.toLocaleString('en-IN')}</td>
                        <td style={adminStyles.tableCell}>{o.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminSubView === 'customers' && (
              <div>
                <h3>Customers</h3>
                <table style={adminStyles.table}>
                  <thead><tr style={adminStyles.tableHead}>
                    <th style={adminStyles.tableCell}>Name</th>
                    <th style={adminStyles.tableCell}>Email</th>
                    <th style={adminStyles.tableCell}>Orders</th>
                  </tr></thead>
                  <tbody>
                    <tr><td style={adminStyles.tableCell}>Aarathi Suresh</td><td style={adminStyles.tableCell}>aarathisuresh93@gmail.com</td><td style={adminStyles.tableCell}>{ordersList.filter(o => o.email === 'aarathisuresh93@gmail.com').length}</td></tr>
                    <tr><td style={adminStyles.tableCell}>Anjali Sharma</td><td style={adminStyles.tableCell}>anjali@example.com</td><td style={adminStyles.tableCell}>{ordersList.filter(o => o.email === 'anjali@example.com').length}</td></tr>
                    <tr><td style={adminStyles.tableCell}>Meera Nair</td><td style={adminStyles.tableCell}>meera@nair.com</td><td style={adminStyles.tableCell}>{ordersList.filter(o => o.email === 'meera@nair.com').length}</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            {adminSubView === 'uploader' && (
              <div style={{background: '#f9f9f9', padding: '20px', borderRadius: '8px'}}>
                <h3>Upload Product</h3>
                <form onSubmit={handleProductSubmit} style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                  <input required type="text" value={newProdName} onChange={e => setNewProdName(e.target.value)} placeholder="Product Name" style={adminStyles.input} />
                  <input required type="number" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} placeholder="Price" style={adminStyles.input} />
                  <input required type="text" value={newProdFabric} onChange={e => setNewProdFabric(e.target.value)} placeholder="Fabric" style={adminStyles.input} />
                  <input required type="text" value={newProdMaterial} onChange={e => setNewProdMaterial(e.target.value)} placeholder="Material" style={adminStyles.input} />
                  <input required type="text" value={newProdCategory} onChange={e => setNewProdCategory(e.target.value)} placeholder="Category (Sarees/Kurtis/Dresses)" style={{...adminStyles.input, gridColumn: 'span 2'}} />
                  <textarea required value={newProdDesc} onChange={e => setNewProdDesc(e.target.value)} placeholder="Description" style={{...adminStyles.input, gridColumn: 'span 2', height: '80px'}} />
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{gridColumn: 'span 2'}} />
                  <button type="submit" style={{gridColumn: 'span 2', padding: '10px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>Publish</button>
                </form>
                {uploadStatus && <p style={{marginTop: '10px'}}>{uploadStatus}</p>}
              </div>
            )}
          </div>
        )}

        {view === 'auth' && (
          <div style={{maxWidth: '400px', margin: '50px auto', padding: '30px', background: '#fff', border: '1px solid #eee', borderRadius: '8px'}}>
            <h3>{isLoginMode ? 'Login' : 'Register'}</h3>
            {authError && <p style={{color: 'red'}}>{authError}</p>}
            <form onSubmit={isLoginMode ? handleLoginSubmit : handleRegisterSubmit}>
              {!isLoginMode && (
                <input required type="text" value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Full Name" style={adminStyles.input} />
              )}
              <input required type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email" style={adminStyles.input} />
              {!isLoginMode && (
                <input required type="text" value={authPhone} onChange={e => setAuthPhone(e.target.value)} placeholder="Phone" style={adminStyles.input} />
              )}
              <input required type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Password" style={adminStyles.input} />
              <button type="submit" style={{width: '100%', padding: '10px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>
                {isLoginMode ? 'Login' : 'Register'}
              </button>
            </form>
            <p style={{textAlign: 'center', marginTop: '15px'}}>
              {isLoginMode ? "Don't have an account? " : "Already registered? "}
              <span onClick={() => {setIsLoginMode(!isLoginMode); setAuthError('');}} style={{color: '#d9534f', cursor: 'pointer', fontWeight: 'bold'}}>
                {isLoginMode ? 'Register' : 'Login'}
              </span>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}