import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import API from './api/axios';
import './App.css';

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

interface CartItem {
  product: Product;
  count: number;
  size?: string;
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
  notes?: string;
  phone?: string;
  address?: string;
  source?: string;
  instagramHandle?: string;
  interactionNotes?: string;
  paymentStatus?: 'Unpaid' | 'Partial' | 'Paid';
  amountPaid?: number;
  paymentMethod?: string;
  trackingId?: string;
  courier?: string;
  referenceImages?: string[];
  date: string;
}

// Categories that need a size selection in the customer catalog
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const needsSize = (category: string) => category === 'Kurtis' || category === 'Dresses';
// Stable string key for a product (works for DB items with _id and demo items with id)
const pid = (p: Product): string => p._id || String(p.id ?? '');

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
  const [view, setView] = useState<'home' | 'catalog' | 'gallery' | 'bespoke' | 'auth' | 'user-portal' | 'admin'>('home');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [userSubView, setUserSubView] = useState<'cart' | 'wishlist' | 'orders'>('cart');
  const [adminSubView, setAdminSubView] = useState<'fittings' | 'orders' | 'purchases' | 'products' | 'customers' | 'uploader' | 'social' | 'media'>('fittings');

  // Products
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  // Cart & Wishlist
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>(MOCK_ORDERS);
  const [checkoutStep, setCheckoutStep] = useState<'idle' | 'processing' | 'success'>('idle');
  const [shippingAddress, setShippingAddress] = useState('');
  const [checkoutSource, setCheckoutSource] = useState('Website');

  // Auth
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState('');

  // Bespoke / Custom Design Request
  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [bust, setBust] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [bespokeProductName, setBespokeProductName] = useState('');
  const [bespokePhone, setBespokePhone] = useState('');
  const [bespokeAddress, setBespokeAddress] = useState('');
  const [bespokeSource, setBespokeSource] = useState('Website');
  const [bespokeNotes, setBespokeNotes] = useState('');
  const [bespokeRefImages, setBespokeRefImages] = useState<string[]>([]);

  // Social Commerce (manual order desk)
  const [scChannel, setScChannel] = useState('Instagram');
  const [scName, setScName] = useState('');
  const [scPhone, setScPhone] = useState('');
  const [scHandle, setScHandle] = useState('');
  const [scAddress, setScAddress] = useState('');
  const [scItems, setScItems] = useState('');
  const [scAmount, setScAmount] = useState('');
  const [scAmountPaid, setScAmountPaid] = useState('');
  const [scPaymentStatus, setScPaymentStatus] = useState<'Unpaid' | 'Partial' | 'Paid'>('Unpaid');
  const [scPaymentMethod, setScPaymentMethod] = useState('Cash');
  const [scDeliveryStatus, setScDeliveryStatus] = useState<Order['status']>('Pending');
  const [scTrackingId, setScTrackingId] = useState('');
  const [scCourier, setScCourier] = useState('');
  const [scNotes, setScNotes] = useState('');
  const [scInteraction, setScInteraction] = useState('');
  const [scRefImages, setScRefImages] = useState<string[]>([]);
  const [scFilter, setScFilter] = useState<'All' | 'Instagram' | 'WhatsApp' | 'Boutique'>('All');

  // Media management
  const [mediaTab, setMediaTab] = useState<'uploads' | 'library'>('uploads');
  const [designLibrary, setDesignLibrary] = useState<Array<{ id: string; url: string; label: string }>>([]);
  const [libLabel, setLibLabel] = useState('');

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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Edit product
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editFabric, setEditFabric] = useState('');
  const [editMaterial, setEditMaterial] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    fetchProductsFromDatabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const socialOrders = ordersList.filter(o =>
    !o.isCustom &&
    ['Instagram', 'WhatsApp', 'Boutique'].includes(o.source || '') &&
    (scFilter === 'All' || o.source === scFilter)
  );

  const customerUploads = ordersList.flatMap(o =>
    (o.referenceImages || []).map(img => ({
      img,
      name: o.clientName,
      orderId: o.id,
      source: o.isCustom ? 'Custom Design' : (o.source || 'Order'),
    }))
  );

  const cartKey = (productId: string | number | undefined, size?: string) => `${productId}__${size || ''}`;

  const addToCart = (product: Product, size?: string) => {
    const key = cartKey(product._id || product.id, size);
    setCart(prev => {
      const existing = prev.find(item => cartKey(item.product._id || item.product.id, item.size) === key);
      if (existing) {
        return prev.map(item => cartKey(item.product._id || item.product.id, item.size) === key ? { ...item, count: item.count + 1 } : item);
      }
      return [...prev, { product, count: 1, size }];
    });
    alert(`Added ${product.name}${size ? ` (Size ${size})` : ''} to Cart!`);
  };

  const removeFromCart = (productId: string | number | undefined, size?: string) => {
    setCart(prev => prev.filter(item => cartKey(item.product._id || item.product.id, item.size) !== cartKey(productId, size)));
  };

  const updateCartQuantity = (productId: string | number | undefined, size: string | undefined, newCount: number) => {
    if (newCount <= 0) {
      removeFromCart(productId, size);
    } else {
      setCart(prev => prev.map(item => cartKey(item.product._id || item.product.id, item.size) === cartKey(productId, size) ? { ...item, count: newCount } : item));
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
    if (!shippingAddress.trim()) {
      alert('Please enter a delivery address before checking out.');
      return;
    }
    setCheckoutStep('processing');
    setTimeout(() => {
      const newOrder: Order = {
        id: `WWB-${Math.floor(1000 + Math.random() * 9000)}`,
        clientName: currentUser?.name || 'Guest',
        email: currentUser?.email || 'guest@retail.com',
        items: cart.map(c => `${c.product.name}${c.size ? ` (Size ${c.size})` : ''} (x${c.count})`).join(', '),
        total: cart.reduce((acc, c) => acc + (c.product.price * c.count), 0),
        status: 'Pending',
        isCustom: false,
        address: shippingAddress,
        source: checkoutSource,
        date: new Date().toISOString().split('T')[0]
      };
      setOrdersList([newOrder, ...ordersList]);
      setCart([]);
      setShippingAddress('');
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

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditPrice(String(p.price));
    setEditFabric(p.fabric);
    setEditMaterial(p.materialType || '');
    setEditCategory(p.category);
    setEditDesc(p.description);
  };

  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault();
    const id = editingProduct?._id;
    if (!id) {
      alert('This item has no database ID, so it cannot be edited. (It is a built-in demo product.)');
      setEditingProduct(null);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await API.put(`/products/${id}`, {
        name: editName,
        price: Number(editPrice),
        fabric: editFabric,
        materialType: editMaterial,
        category: editCategory,
        description: editDesc
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        await fetchProductsFromDatabase();
        setEditingProduct(null);
        alert('Product updated!');
      }
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
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

  const handleBespokeImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setBespokeRefImages(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const handleBespokeSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newOrder: Order = {
      id: `WWB-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName,
      email,
      phone: bespokePhone,
      address: bespokeAddress,
      source: bespokeSource,
      items: bespokeProductName || 'Custom Design Request',
      total: 0,
      status: 'Pending',
      isCustom: true,
      metrics: `B:${bust} W:${waist} H:${hips}`,
      notes: bespokeNotes,
      referenceImages: bespokeRefImages,
      date: new Date().toISOString().split('T')[0],
    };
    setOrdersList([newOrder, ...ordersList]);
    setClientName('');
    setEmail('');
    setBespokePhone('');
    setBespokeAddress('');
    setBespokeSource('Website');
    setBust('');
    setWaist('');
    setHips('');
    setBespokeProductName('');
    setBespokeNotes('');
    setBespokeRefImages([]);
    alert('Custom design request submitted! We will contact you with a quote.');
    setView('home');
  };

  const openBespokeForProduct = (productName: string) => {
    setBespokeProductName(productName);
    setView('bespoke');
  };

  const getPurchasedItems = () => ordersList.filter(o => !o.isCustom);

  const updateOrderField = (orderId: string, patch: Partial<Order>) => {
    setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, ...patch } : o));
  };

  const handleSocialImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setScRefImages(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const handleCreateSocialOrder = (e: FormEvent) => {
    e.preventDefault();
    const newOrder: Order = {
      id: `WWB-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: scName,
      email: '',
      phone: scPhone,
      address: scAddress,
      source: scChannel,
      instagramHandle: scHandle,
      items: scItems,
      total: Number(scAmount) || 0,
      amountPaid: Number(scAmountPaid) || 0,
      paymentStatus: scPaymentStatus,
      paymentMethod: scPaymentMethod,
      status: scDeliveryStatus,
      trackingId: scTrackingId,
      courier: scCourier,
      notes: scNotes,
      interactionNotes: scInteraction,
      referenceImages: scRefImages,
      isCustom: false,
      date: new Date().toISOString().split('T')[0],
    };
    setOrdersList([newOrder, ...ordersList]);
    setScName(''); setScPhone(''); setScHandle(''); setScAddress('');
    setScItems(''); setScAmount(''); setScAmountPaid('');
    setScPaymentStatus('Unpaid'); setScPaymentMethod('Cash');
    setScDeliveryStatus('Pending'); setScTrackingId(''); setScCourier('');
    setScNotes(''); setScInteraction(''); setScRefImages([]);
    alert('Order recorded!');
  };

  const handleLibraryUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const label = libLabel;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setDesignLibrary(prev => [...prev, { id: `LIB-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, url: reader.result as string, label }]);
      reader.readAsDataURL(file);
    });
    setLibLabel('');
  };

  const deleteLibraryItem = (id: string) => {
    setDesignLibrary(prev => prev.filter(item => item.id !== id));
  };

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
        <h1 onClick={() => setView('home')} style={{ cursor: 'pointer' }}>White Wall Bridal</h1>
        <nav className="nav-links">
          <button onClick={() => setView('home')}>Home</button>
          <button onClick={() => setView('catalog')}>Collections</button>
          <button onClick={() => setView('gallery')}>Gallery</button>
          <button onClick={() => setView('bespoke')}>Custom Design</button>

          {currentUser && currentUser.role !== 'admin' && (
            <button onClick={() => { setView('user-portal'); setUserSubView('cart'); }}>
              My Shopping ({cart.reduce((a, c) => a + c.count, 0)})
            </button>
          )}
          {currentUser && currentUser.role === 'admin' && (
            <button onClick={() => setView('admin')} style={{ color: '#d9534f', fontWeight: 'bold' }}>Admin</button>
          )}

          {currentUser ? (
            <>
              <span>Hello, {currentUser.name}</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button onClick={() => { setAuthError(''); setIsLoginMode(true); setView('auth'); }}>Login</button>
          )}
        </nav>
      </header>

      <main className="main-content">
        {view === 'home' && (
          <>
            <section className="hero">
              <div className="hero-inner">
                <span className="eyebrow">Bridal Atelier — Chennai</span>
                <h2>Couture bridal, made to your measure</h2>
                <p>Hand-finished sarees, kurtis and gowns — or commission a design that is entirely your own.</p>
                <div className="hero-cta">
                  <button className="btn btn-primary" onClick={() => setView('catalog')}>Explore the collection</button>
                  <button className="btn btn-outline" onClick={() => setView('bespoke')}>Start a custom design</button>
                </div>
              </div>
            </section>

            <section className="home-section">
              <div className="section-head">
                <span className="eyebrow">The Collections</span>
                <h3>Browse by silhouette</h3>
              </div>
              <div className="cat-grid">
                {[
                  { name: 'Sarees', img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80', blurb: 'Kanchipuram & Banarasi silks' },
                  { name: 'Kurtis', img: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&q=80', blurb: 'Everyday elegance, hand-embroidered' },
                  { name: 'Dresses', img: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=800&q=80', blurb: 'Gowns for the modern bride' },
                ].map(cat => (
                  <div key={cat.name} className="cat-tile" onClick={() => { setSelectedCategory(cat.name); setView('catalog'); }}>
                    <img src={cat.img} alt={cat.name} />
                    <div className="cat-label">
                      <h4>{cat.name}</h4>
                      <p>{cat.blurb}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="promise">
              <div className="promise-inner">
                <div className="promise-item">
                  <h4>Made to measure</h4>
                  <p>Share your measurements and we tailor each piece to fit you precisely.</p>
                </div>
                <div className="promise-item">
                  <h4>Hand-finished</h4>
                  <p>Premium silks and fabrics, finished by hand in our Chennai studio.</p>
                </div>
                <div className="promise-item">
                  <h4>Personal fittings</h4>
                  <p>Book a bespoke fitting and design a garment that is entirely your own.</p>
                </div>
              </div>
            </section>
          </>
        )}

        {view === 'catalog' && (
          <div className="catalog-container">
            <h3>The Master Collections</h3>
            {loadingProducts && <p>Loading...</p>}
            <div className="filter-pills">
              {['All', 'Sarees', 'Kurtis', 'Dresses'].map(cat => (
                <button key={cat} className={selectedCategory === cat ? 'pill active' : 'pill'} onClick={() => setSelectedCategory(cat)}>
                  {cat}
                </button>
              ))}
            </div>

            <div className="products-grid">
              {filteredProducts.length === 0 ? (
                <p>No products</p>
              ) : (
                filteredProducts.map(p => {
                  const key = pid(p);
                  const sizeable = needsSize(p.category);
                  return (
                    <div key={p._id || p.id} className="product-card">
                      <img src={p.image} alt={p.name} />
                      <h4>{p.name}</h4>
                      <p>₹{p.price.toLocaleString('en-IN')}</p>
                      {p.materialType && <p style={{ fontSize: '12px', color: '#666' }}>Material: {p.materialType}</p>}

                      {sizeable ? (
                        <div style={{ margin: '8px 0' }}>
                          <label style={{ fontSize: '13px', marginRight: '6px' }}>Size:</label>
                          <select
                            value={selectedSizes[key] || 'M'}
                            onChange={e => setSelectedSizes(prev => ({ ...prev, [key]: e.target.value }))}
                            style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
                          >
                            {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      ) : (
                        <p style={{ fontSize: '12px', color: '#999', margin: '8px 0' }}>Free size / draped</p>
                      )}

                      {currentUser?.role !== 'admin' && (
                        <div className="card-actions">
                          <button onClick={() => addToCart(p, sizeable ? (selectedSizes[key] || 'M') : undefined)}>Add to Cart</button>
                          <button onClick={() => addToWishlist(p)}>Wishlist</button>
                          <button onClick={() => openBespokeForProduct(p.name)}>Get Fitted</button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {view === 'gallery' && (
          <div className="lookbook">
            <div className="section-head">
              <span className="eyebrow">Lookbook</span>
              <h3>Design Gallery</h3>
            </div>
            {designLibrary.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#8a7f86' }}>Our gallery is being curated — please check back soon.</p>
            ) : (
              <div className="lookbook-grid">
                {designLibrary.map(item => (
                  <figure className="lookbook-item" key={item.id}>
                    <img src={item.url} alt={item.label || 'Design'} />
                    {item.label && <figcaption>{item.label}</figcaption>}
                  </figure>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'bespoke' && (
          <div style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', background: '#fff', border: '1px solid #eee', borderRadius: '8px' }}>
            <h3>Custom Design Request</h3>
            <p>Submit a custom order — upload reference images, share your measurements, and add any notes or special requirements. We'll get back to you with a quote.</p>
            {bespokeProductName && <p style={{ background: '#f0f0f0', padding: '10px', marginBottom: '20px' }}>Selected: {bespokeProductName}</p>}

            <form onSubmit={handleBespokeSubmit}>
              <input required type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Full Name" style={adminStyles.input} />
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={adminStyles.input} />
              <input required type="tel" value={bespokePhone} onChange={e => setBespokePhone(e.target.value)} placeholder="Mobile Number" style={adminStyles.input} />
              <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Address</p>
              <textarea required value={bespokeAddress} onChange={e => setBespokeAddress(e.target.value)} placeholder="House / flat no, street, area, city, PIN code" style={{ ...adminStyles.input, height: '70px' }} />

              <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>How are you reaching us?</p>
              <select value={bespokeSource} onChange={e => setBespokeSource(e.target.value)} style={adminStyles.input}>
                <option>Website</option>
                <option>Boutique</option>
                <option>Social Media</option>
              </select>

              <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Measurements (inches)</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <input required type="number" value={bust} onChange={e => setBust(e.target.value)} placeholder="Bust" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <input required type="number" value={waist} onChange={e => setWaist(e.target.value)} placeholder="Waist" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <input required type="number" value={hips} onChange={e => setHips(e.target.value)} placeholder="Hips" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>

              <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Reference Images</p>
              <input type="file" accept="image/*" multiple onChange={handleBespokeImageUpload} style={{ marginBottom: '10px' }} />
              {bespokeRefImages.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '15px' }}>
                  {bespokeRefImages.map((img, i) => (
                    <img key={i} src={img} alt={`Reference ${i + 1}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                  ))}
                  <button type="button" onClick={() => setBespokeRefImages([])} style={{ fontSize: '12px', padding: '4px 8px' }}>Clear images</button>
                </div>
              )}

              <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Notes & Special Requirements</p>
              <textarea value={bespokeNotes} onChange={e => setBespokeNotes(e.target.value)} placeholder="Fabric preferences, colours, deadlines, embellishments, occasion, etc." style={{ ...adminStyles.input, height: '100px' }} />

              <button type="submit" style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                SUBMIT REQUEST
              </button>
            </form>
          </div>
        )}

        {view === 'user-portal' && (
          <div className="portal">
            <div className="portal-tabs">
              <button className={userSubView === 'cart' ? 'active' : ''} onClick={() => setUserSubView('cart')}>Cart</button>
              <button className={userSubView === 'wishlist' ? 'active' : ''} onClick={() => setUserSubView('wishlist')}>Wishlist</button>
              <button className={userSubView === 'orders' ? 'active' : ''} onClick={() => setUserSubView('orders')}>Orders</button>
            </div>

            {userSubView === 'cart' && (
              <div>
                <h3 className="portal-title">Your Cart</h3>
                {cart.length === 0 ? (
                  <div className="empty-note">
                    <p>Your cart is empty.</p>
                    <button className="btn btn-primary" onClick={() => setView('catalog')}>Browse the collection</button>
                  </div>
                ) : (
                  <>
                    <div className="cart-list">
                      {cart.map(item => (
                        <div key={cartKey(item.product._id || item.product.id, item.size)} className="cart-item">
                          <img src={item.product.image} alt={item.product.name} />
                          <div className="ci-info">
                            <div className="ci-name">{item.product.name}</div>
                            {item.size && <div className="ci-size">Size {item.size}</div>}
                            <div className="ci-controls">
                              <input className="cart-qty" type="number" min="1" value={item.count} onChange={e => updateCartQuantity(item.product._id || item.product.id, item.size, parseInt(e.target.value) || 1)} />
                              <button className="ci-remove" onClick={() => removeFromCart(item.product._id || item.product.id, item.size)}>Remove</button>
                            </div>
                          </div>
                          <div className="ci-price">₹{(item.product.price * item.count).toLocaleString('en-IN')}</div>
                        </div>
                      ))}
                    </div>
                    <div className="checkout-fields">
                      <label htmlFor="ship-addr">Delivery Address</label>
                      <textarea id="ship-addr" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} placeholder="Flat / house no, street, area, city, PIN code" />
                      <label htmlFor="ship-src">Purchasing via</label>
                      <select id="ship-src" value={checkoutSource} onChange={e => setCheckoutSource(e.target.value)}>
                        <option>Website</option>
                        <option>Boutique</option>
                        <option>Social Media</option>
                      </select>
                    </div>
                    <div className="cart-summary">
                      <div className="cart-total"><span>Total</span>₹{cart.reduce((acc, c) => acc + (c.product.price * c.count), 0).toLocaleString('en-IN')}</div>
                      <button className="btn btn-primary" onClick={runCheckout}>Checkout</button>
                    </div>
                    {checkoutStep === 'success' && <p className="success-note">Order placed successfully.</p>}
                  </>
                )}
              </div>
            )}

            {userSubView === 'wishlist' && (
              <div>
                <h3 className="portal-title">Wishlist</h3>
                {wishlist.length === 0 ? (
                  <div className="empty-note">
                    <p>Your wishlist is empty.</p>
                    <button className="btn btn-primary" onClick={() => setView('catalog')}>Browse the collection</button>
                  </div>
                ) : (
                  <div className="wishlist-grid">
                    {wishlist.map(p => (
                      <div key={p._id || p.id} className="wish-card">
                        <img src={p.image} alt={p.name} />
                        <h4>{p.name}</h4>
                        <p className="wprice">₹{p.price.toLocaleString('en-IN')}</p>
                        <button className="btn btn-primary" onClick={() => addToCart(p, needsSize(p.category) ? 'M' : undefined)}>Move to Cart</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {userSubView === 'orders' && (
              <div>
                <h3 className="portal-title">Order History</h3>
                {ordersList.filter(o => o.email === currentUser?.email).length === 0 ? (
                  <div className="empty-note"><p>You have no orders yet.</p></div>
                ) : (
                  <table className="data-table">
                    <thead><tr>
                      <th>Order ID</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr></thead>
                    <tbody>
                      {ordersList.filter(o => o.email === currentUser?.email).map(o => (
                        <tr key={o.id}>
                          <td>{o.id}</td>
                          <td>{o.items}</td>
                          <td>₹{o.total.toLocaleString('en-IN')}</td>
                          <td><span className="status-badge">{o.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {view === 'admin' && (
          <div style={{ maxWidth: '1100px', margin: '20px auto' }}>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              <button onClick={() => setAdminSubView('fittings')} style={{ ...adminStyles.tab, ...(adminSubView === 'fittings' ? adminStyles.activeTab : {}) }}>Fittings</button>
              <button onClick={() => setAdminSubView('orders')} style={{ ...adminStyles.tab, ...(adminSubView === 'orders' ? adminStyles.activeTab : {}) }}>Orders</button>
              <button onClick={() => setAdminSubView('purchases')} style={{ ...adminStyles.tab, ...(adminSubView === 'purchases' ? adminStyles.activeTab : {}) }}>Purchases</button>
              <button onClick={() => setAdminSubView('products')} style={{ ...adminStyles.tab, ...(adminSubView === 'products' ? adminStyles.activeTab : {}) }}>Products</button>
              <button onClick={() => setAdminSubView('customers')} style={{ ...adminStyles.tab, ...(adminSubView === 'customers' ? adminStyles.activeTab : {}) }}>Customers</button>
              <button onClick={() => setAdminSubView('uploader')} style={{ ...adminStyles.tab, ...(adminSubView === 'uploader' ? adminStyles.activeTab : {}) }}>Upload</button>
              <button onClick={() => setAdminSubView('social')} style={{ ...adminStyles.tab, ...(adminSubView === 'social' ? adminStyles.activeTab : {}) }}>Social Commerce</button>
              <button onClick={() => setAdminSubView('media')} style={{ ...adminStyles.tab, ...(adminSubView === 'media' ? adminStyles.activeTab : {}) }}>Media</button>
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
                    <th style={adminStyles.tableCell}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p._id || p.id}>
                        <td style={adminStyles.tableCell}>{p.name}</td>
                        <td style={adminStyles.tableCell}>{p.category}</td>
                        <td style={adminStyles.tableCell}>₹{p.price.toLocaleString('en-IN')}</td>
                        <td style={adminStyles.tableCell}>{p.fabric}</td>
                        <td style={adminStyles.tableCell}>
                          <button onClick={() => openEditProduct(p)} style={{ ...adminStyles.btn, background: '#0275d8', color: '#fff', marginRight: '6px' }}>Edit</button>
                          <button onClick={() => setDeleteConfirm(p._id ?? null)} style={{ ...adminStyles.btn, background: '#d9534f', color: '#fff' }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {deleteConfirm && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', width: '400px' }}>
                  <h3>Delete Product?</h3>
                  <p>This cannot be undone.</p>
                  <button onClick={() => setDeleteConfirm(null)} style={{ marginRight: '10px', padding: '8px 16px' }}>Cancel</button>
                  <button onClick={() => handleDeleteProduct(deleteConfirm)} style={{ padding: '8px 16px', background: '#d9534f', color: '#fff', border: 'none', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            )}

            {editingProduct && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', width: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
                  <h3>Edit Product</h3>
                  <form onSubmit={handleUpdateProduct}>
                    <input required type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Product Name" style={adminStyles.input} />
                    <input required type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} placeholder="Price" style={adminStyles.input} />
                    <input required type="text" value={editFabric} onChange={e => setEditFabric(e.target.value)} placeholder="Fabric" style={adminStyles.input} />
                    <input type="text" value={editMaterial} onChange={e => setEditMaterial(e.target.value)} placeholder="Material" style={adminStyles.input} />
                    <input required type="text" value={editCategory} onChange={e => setEditCategory(e.target.value)} placeholder="Category (Sarees/Kurtis/Dresses)" style={adminStyles.input} />
                    <textarea required value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" style={{ ...adminStyles.input, height: '80px' }} />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                      <button type="button" onClick={() => setEditingProduct(null)} style={{ padding: '10px 16px', flex: 1 }}>Cancel</button>
                      <button type="submit" style={{ padding: '10px 16px', flex: 1, background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Save Changes</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {adminSubView === 'fittings' && (
              <div>
                <h3>Custom Design Requests</h3>
                <table style={adminStyles.table}>
                  <thead><tr style={adminStyles.tableHead}>
                    <th style={adminStyles.tableCell}>Client</th>
                    <th style={adminStyles.tableCell}>Design</th>
                    <th style={adminStyles.tableCell}>Measurements</th>
                    <th style={adminStyles.tableCell}>Notes</th>
                    <th style={adminStyles.tableCell}>Refs</th>
                    <th style={adminStyles.tableCell}>Status</th>
                  </tr></thead>
                  <tbody>
                    {ordersList.filter(o => o.isCustom).map(o => (
                      <tr key={o.id}>
                        <td style={adminStyles.tableCell}>
                          {o.clientName}
                          {o.phone && <div style={{ fontSize: '12px', color: '#666' }}>{o.phone}</div>}
                          {o.email && <div style={{ fontSize: '12px', color: '#666' }}>{o.email}</div>}
                          {o.address && <div style={{ fontSize: '12px', color: '#666' }}>{o.address}</div>}
                          {o.source && <div style={{ fontSize: '12px', color: '#0275d8' }}>via {o.source}</div>}
                        </td>
                        <td style={adminStyles.tableCell}>{o.items}</td>
                        <td style={adminStyles.tableCell}>{o.metrics}</td>
                        <td style={adminStyles.tableCell}>{o.notes || '—'}</td>
                        <td style={adminStyles.tableCell}>
                          {o.referenceImages && o.referenceImages.length > 0 ? (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {o.referenceImages.slice(0, 3).map((img, i) => (
                                <img key={i} src={img} alt={`Ref ${i + 1}`} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '3px', border: '1px solid #ddd' }} />
                              ))}
                            </div>
                          ) : '—'}
                        </td>
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
                    <th style={adminStyles.tableCell}>Address</th>
                    <th style={adminStyles.tableCell}>Amount</th>
                    <th style={adminStyles.tableCell}>Date</th>
                  </tr></thead>
                  <tbody>
                    {getPurchasedItems().map(o => (
                      <tr key={o.id}>
                        <td style={adminStyles.tableCell}>{o.id}</td>
                        <td style={adminStyles.tableCell}>
                          {o.clientName}
                          {o.source && <div style={{ fontSize: '12px', color: '#0275d8' }}>via {o.source}</div>}
                        </td>
                        <td style={adminStyles.tableCell}>{o.items}</td>
                        <td style={adminStyles.tableCell}>{o.address || '—'}</td>
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
              <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
                <h3>Upload Product</h3>
                <form onSubmit={handleProductSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input required type="text" value={newProdName} onChange={e => setNewProdName(e.target.value)} placeholder="Product Name" style={adminStyles.input} />
                  <input required type="number" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} placeholder="Price" style={adminStyles.input} />
                  <input required type="text" value={newProdFabric} onChange={e => setNewProdFabric(e.target.value)} placeholder="Fabric" style={adminStyles.input} />
                  <input required type="text" value={newProdMaterial} onChange={e => setNewProdMaterial(e.target.value)} placeholder="Material" style={adminStyles.input} />
                  <input required type="text" value={newProdCategory} onChange={e => setNewProdCategory(e.target.value)} placeholder="Category (Sarees/Kurtis/Dresses)" style={{ ...adminStyles.input, gridColumn: 'span 2' }} />
                  <textarea required value={newProdDesc} onChange={e => setNewProdDesc(e.target.value)} placeholder="Description" style={{ ...adminStyles.input, gridColumn: 'span 2', height: '80px' }} />
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ gridColumn: 'span 2' }} />
                  <button type="submit" style={{ gridColumn: 'span 2', padding: '10px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Publish</button>
                </form>
                {uploadStatus && <p style={{ marginTop: '10px' }}>{uploadStatus}</p>}
              </div>
            )}

            {adminSubView === 'social' && (
              <div className="social-commerce">
                <h3>Social Commerce — Order Desk</h3>
                <p style={{ color: '#666', marginTop: '-6px', marginBottom: '20px', fontSize: '14px' }}>Record orders from Instagram, WhatsApp and walk-in customers, and track payment and delivery.</p>

                <div className="sc-form-wrap">
                  <h4 style={{ marginTop: 0 }}>Record a New Order</h4>
                  <form onSubmit={handleCreateSocialOrder} className="sc-form">
                    <select value={scChannel} onChange={e => setScChannel(e.target.value)} style={adminStyles.input}>
                      <option>Instagram</option>
                      <option>WhatsApp</option>
                      <option>Boutique</option>
                    </select>
                    <input required type="text" value={scName} onChange={e => setScName(e.target.value)} placeholder="Customer name" style={adminStyles.input} />
                    <input type="tel" value={scPhone} onChange={e => setScPhone(e.target.value)} placeholder="Phone" style={adminStyles.input} />
                    <input type="text" value={scHandle} onChange={e => setScHandle(e.target.value)} placeholder="Instagram / social handle" style={adminStyles.input} />
                    <input type="text" value={scAddress} onChange={e => setScAddress(e.target.value)} placeholder="Delivery address" style={{ ...adminStyles.input, gridColumn: 'span 2' }} />
                    <textarea required value={scItems} onChange={e => setScItems(e.target.value)} placeholder="Items / order description (e.g. Crimson silk saree with stitched blouse)" style={{ ...adminStyles.input, gridColumn: 'span 2', height: '60px' }} />
                    <input type="number" value={scAmount} onChange={e => setScAmount(e.target.value)} placeholder="Total amount (Rs)" style={adminStyles.input} />
                    <input type="number" value={scAmountPaid} onChange={e => setScAmountPaid(e.target.value)} placeholder="Amount paid (Rs)" style={adminStyles.input} />
                    <select value={scPaymentStatus} onChange={e => setScPaymentStatus(e.target.value as 'Unpaid' | 'Partial' | 'Paid')} style={adminStyles.input}>
                      <option>Unpaid</option>
                      <option>Partial</option>
                      <option>Paid</option>
                    </select>
                    <select value={scPaymentMethod} onChange={e => setScPaymentMethod(e.target.value)} style={adminStyles.input}>
                      <option>Cash</option>
                      <option>UPI</option>
                      <option>Card</option>
                      <option>Bank Transfer</option>
                    </select>
                    <select value={scDeliveryStatus} onChange={e => setScDeliveryStatus(e.target.value as Order['status'])} style={adminStyles.input}>
                      <option>Pending</option>
                      <option>Pattern Cutting</option>
                      <option>In Tailoring</option>
                      <option>Shipped</option>
                      <option>Delivered</option>
                    </select>
                    <input type="text" value={scTrackingId} onChange={e => setScTrackingId(e.target.value)} placeholder="Tracking ID (optional)" style={adminStyles.input} />
                    <input type="text" value={scCourier} onChange={e => setScCourier(e.target.value)} placeholder="Courier (optional)" style={{ ...adminStyles.input, gridColumn: 'span 2' }} />
                    <textarea value={scNotes} onChange={e => setScNotes(e.target.value)} placeholder="Reference info / item details" style={{ ...adminStyles.input, gridColumn: 'span 2', height: '55px' }} />
                    <textarea value={scInteraction} onChange={e => setScInteraction(e.target.value)} placeholder="Customer interaction notes (chats, requests, follow-ups)" style={{ ...adminStyles.input, gridColumn: 'span 2', height: '55px' }} />
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '6px' }}>Reference images (screenshots, inspiration)</label>
                      <input type="file" accept="image/*" multiple onChange={handleSocialImageUpload} />
                      {scRefImages.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
                          {scRefImages.map((img, i) => <img key={i} src={img} alt={`Ref ${i + 1}`} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />)}
                          <button type="button" onClick={() => setScRefImages([])} style={{ fontSize: '12px' }}>Clear</button>
                        </div>
                      )}
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2' }}>Record Order</button>
                  </form>
                </div>

                <div className="sc-filter">
                  {(['All', 'Instagram', 'WhatsApp', 'Boutique'] as const).map(ch => (
                    <button key={ch} className={scFilter === ch ? 'pill active' : 'pill'} onClick={() => setScFilter(ch)}>
                      {ch === 'Boutique' ? 'Walk-In' : ch}
                    </button>
                  ))}
                </div>

                {socialOrders.length === 0 ? (
                  <p style={{ color: '#888' }}>No orders recorded for this channel yet. Use the form above to add one.</p>
                ) : (
                  <div className="sc-orders">
                    {socialOrders.map(o => {
                      const balance = (o.total || 0) - (o.amountPaid || 0);
                      return (
                        <div key={o.id} className="sc-order-card">
                          <div className="sc-order-head">
                            <div>
                              <span className="sc-channel-tag">{o.source === 'Boutique' ? 'Walk-In' : o.source}</span>
                              <strong style={{ marginLeft: '8px' }}>{o.clientName}</strong>
                              {o.instagramHandle && <span style={{ color: '#666', marginLeft: '6px' }}>{o.instagramHandle}</span>}
                            </div>
                            <span style={{ color: '#888', fontSize: '13px' }}>{o.id} · {o.date}</span>
                          </div>
                          {o.phone && <div className="sc-line">Phone: {o.phone}</div>}
                          {o.address && <div className="sc-line">Address: {o.address}</div>}
                          <div className="sc-items">{o.items}</div>

                          <div className="sc-money">
                            <span>Total <strong>₹{(o.total || 0).toLocaleString('en-IN')}</strong></span>
                            <span>Paid <strong>₹{(o.amountPaid || 0).toLocaleString('en-IN')}</strong></span>
                            <span style={{ color: balance > 0 ? '#b02a37' : '#1a7f37' }}>Balance <strong>₹{balance.toLocaleString('en-IN')}</strong></span>
                            {o.paymentMethod && <span>Method <strong>{o.paymentMethod}</strong></span>}
                          </div>

                          <div className="sc-controls">
                            <label>Payment
                              <select value={o.paymentStatus || 'Unpaid'} onChange={e => updateOrderField(o.id, { paymentStatus: e.target.value as 'Unpaid' | 'Partial' | 'Paid' })}>
                                <option>Unpaid</option><option>Partial</option><option>Paid</option>
                              </select>
                            </label>
                            <label>Paid (Rs)
                              <input type="number" value={o.amountPaid || 0} onChange={e => updateOrderField(o.id, { amountPaid: Number(e.target.value) || 0 })} style={{ width: '90px' }} />
                            </label>
                            <label>Delivery
                              <select value={o.status} onChange={e => updateOrderField(o.id, { status: e.target.value as Order['status'] })}>
                                <option>Pending</option><option>Pattern Cutting</option><option>In Tailoring</option><option>Shipped</option><option>Delivered</option>
                              </select>
                            </label>
                            <label>Tracking
                              <input type="text" value={o.trackingId || ''} onChange={e => updateOrderField(o.id, { trackingId: e.target.value })} placeholder="ID" style={{ width: '110px' }} />
                            </label>
                          </div>

                          {(o.notes || o.interactionNotes) && (
                            <div className="sc-notes">
                              {o.notes && <div><strong>Reference:</strong> {o.notes}</div>}
                              {o.interactionNotes && <div><strong>Interaction:</strong> {o.interactionNotes}</div>}
                            </div>
                          )}
                          {o.referenceImages && o.referenceImages.length > 0 && (
                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                              {o.referenceImages.slice(0, 5).map((img, i) => <img key={i} src={img} alt={`Ref ${i + 1}`} style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {adminSubView === 'media' && (
              <div className="media-mgmt">
                <h3>Media Management</h3>
                <p style={{ color: '#666', marginTop: '-6px', marginBottom: '20px', fontSize: '14px' }}>Review images customers have sent, and keep a library of your own design references.</p>

                <div className="sc-filter">
                  <button className={mediaTab === 'uploads' ? 'pill active' : 'pill'} onClick={() => setMediaTab('uploads')}>Customer Uploads</button>
                  <button className={mediaTab === 'library' ? 'pill active' : 'pill'} onClick={() => setMediaTab('library')}>Design Library</button>
                </div>

                {mediaTab === 'uploads' && (
                  customerUploads.length === 0 ? (
                    <p style={{ color: '#888' }}>No customer uploads yet. Reference images from Custom Design requests and Social Commerce orders will appear here.</p>
                  ) : (
                    <div className="media-grid">
                      {customerUploads.map((u, i) => (
                        <figure className="media-item" key={i}>
                          <img src={u.img} alt={`Upload from ${u.name}`} />
                          <figcaption>
                            <strong>{u.name || 'Customer'}</strong>
                            <span>{u.orderId} · {u.source}</span>
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  )
                )}

                {mediaTab === 'library' && (
                  <div>
                    <div className="lib-upload">
                      <input type="text" value={libLabel} onChange={e => setLibLabel(e.target.value)} placeholder="Label / tag (optional) — e.g. Zari work, Blush palette" style={{ ...adminStyles.input, maxWidth: '340px', marginBottom: 0 }} />
                      <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                        Upload Images
                        <input type="file" accept="image/*" multiple onChange={handleLibraryUpload} style={{ display: 'none' }} />
                      </label>
                    </div>
                    {designLibrary.length === 0 ? (
                      <p style={{ color: '#888' }}>Your reference library is empty. Add a label if you like, then upload design images to build it up.</p>
                    ) : (
                      <div className="media-grid">
                        {designLibrary.map(item => (
                          <figure className="media-item" key={item.id}>
                            <img src={item.url} alt={item.label || 'Design reference'} />
                            <figcaption>
                              <strong>{item.label || 'Untitled'}</strong>
                              <button className="media-remove" onClick={() => deleteLibraryItem(item.id)}>Remove</button>
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {view === 'auth' && (
          <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', background: '#fff', border: '1px solid #eee', borderRadius: '8px' }}>
            <h3>{isLoginMode ? 'Login' : 'Register'}</h3>
            {authError && <p style={{ color: 'red' }}>{authError}</p>}
            <form onSubmit={isLoginMode ? handleLoginSubmit : handleRegisterSubmit}>
              {!isLoginMode && (
                <input required type="text" value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Full Name" style={adminStyles.input} />
              )}
              <input required type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email" style={adminStyles.input} />
              {!isLoginMode && (
                <input required type="text" value={authPhone} onChange={e => setAuthPhone(e.target.value)} placeholder="Phone" style={adminStyles.input} />
              )}
              <input required type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Password" style={adminStyles.input} />
              <button type="submit" style={{ width: '100%', padding: '10px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                {isLoginMode ? 'Login' : 'Register'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '15px' }}>
              {isLoginMode ? "Don't have an account? " : "Already registered? "}
              <span onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(''); }} style={{ color: '#d9534f', cursor: 'pointer', fontWeight: 'bold' }}>
                {isLoginMode ? 'Register' : 'Login'}
              </span>
            </p>
          </div>
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-col footer-brand">
            <h3>White Wall Bridal</h3>
            <p>A bridal atelier for the modern Indian bride — ready-to-wear collections and fully bespoke commissions, made to measure in Chennai.</p>
            <div className="footer-social">
              <a href="https://instagram.com/whitewallbridal" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" /></svg>
              </a>
              <a href="https://facebook.com/whitewallbridal" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" /></svg>
              </a>
              <a href="https://pinterest.com/whitewallbridal" target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" /></svg>
              </a>
              <a href="https://wa.me/910000000000" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
              </a>
            </div>
          </div>

          <div className="footer-col footer-contact">
            <h4>Contact</h4>
            <span className="label">Email</span>
            <a className="val" href="mailto:hello@whitewallbridal.com">hello@whitewallbridal.com</a>
            <span className="label">Phone</span>
            <a className="val" href="tel:+910000000000">+91 00000 00000</a>
            <span className="label">Studio</span>
            <span className="val">T. Nagar, Chennai, Tamil Nadu</span>
            <span className="label">Hours</span>
            <span className="val">Mon – Sat, 10am – 7pm</span>
          </div>

          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li><button className="linklike" onClick={() => setView('catalog')}>Collections</button></li>
              <li><button className="linklike" onClick={() => setView('bespoke')}>Custom Design</button></li>
              <li><button className="linklike" onClick={() => { setAuthError(''); setIsLoginMode(true); setView('auth'); }}>Login / Register</button></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} White Wall Bridal · Chennai, India
        </div>
      </footer>
    </div>
  );
}