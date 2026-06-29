import React, { useState, useEffect } from 'react';
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

export default function App() {
  // FIXED: Default state reset back to 'home' so guests and regular users land on the homepage
  const [view, setView] = useState<'home' | 'catalog' | 'bespoke' | 'login' | 'register' | 'admin'>('home');
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

 
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

 
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setCurrentUser(parsedUser);
      
      // If an admin rehard-refreshes the page, keep them on the admin panel workspace
      if (parsedUser.role === 'admin') {
        setView('admin');
      } else {
        setView('home');
      }
    } else {
      setView('home');
    }
  }, []);

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);



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
        
       
        if (response.data.user.role === 'admin') {
          setView('admin');
        } else {
          setView('home');
        }
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

  const handleBespokeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Thank you ${clientName}! Dimensions logged.`);
    setClientName(''); setEmail(''); setBust(''); setWaist(''); setHips('');
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
          
          {/* FIXED SECURE SHORTCUT: Tab only mounts in navbar if an active user with the admin role exists */}
          {currentUser && currentUser.role === 'admin' && (
            <button onClick={() => setView('admin')} className={`nav-btn ${view === 'admin' ? 'active' : ''}`} style={{ color: '#d9534f', fontWeight: 'bold' }}>
              Admin Dashboard ⚙️
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
          <div>
            <section className="hero-section">
              <span className="hero-subtitle">Haute Couture Atelier</span>
              <h2 className="hero-title">Bespoke Bridal Styling & Luxury Collections</h2>
              <p className="hero-desc">
                Discover clean silhouettes, handcrafted premium fabrics, and customizable sizing tailored just for you.
              </p>
              <div className="hero-actions">
                <button onClick={() => setView('catalog')} className="btn-primary">View Catalog</button>
                <button onClick={() => setView('bespoke')} className="btn-secondary">Book Fitting</button>
              </div>
            </section>

            <section className="features-grid">
              <div className="feature-card">
                <h4>Premium Fabrics</h4>
                <p>Handpicked pure silk, delicate tulle, and heritage Banarasi weaves.</p>
              </div>
              <div className="feature-card">
                <h4>Custom Alterations</h4>
                <p>Provide your unique parameters for an anatomical flawless fit.</p>
              </div>
              <div className="feature-card">
                <h4>Atelier Care</h4>
                <p>Direct updates on your specifications through your design process.</p>
              </div>
            </section>
          </div>
        )}

        {view === 'catalog' && (
          <div className="catalog-container">
            <div className="catalog-header">
              <div>
                <h3>The Master Collections</h3>
                <p>Filter through our luxury styles and fabrics.</p>
              </div>
              <div className="filter-pills">
                {['All', 'Sarees', 'Kurtis', 'Dresses'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`pill ${selectedCategory === cat ? 'active' : ''}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="products-grid">
              {filteredProducts.map(p => (
                <div key={p.id} className="product-card">
                  <div className="product-img-wrapper">
                    <img src={p.image} alt={p.name} />
                    <span className="product-badge">{p.fabric}</span>
                  </div>
                  <div className="product-info">
                    <div>
                      <span className="product-cat">{p.category}</span>
                      <h4 className="product-title">{p.name}</h4>
                      <p className="product-desc">{p.description}</p>
                    </div>
                    <div className="product-footer">
                      <span className="product-price">₹{p.price.toLocaleString('en-IN')}</span>
                      <button onClick={() => setView('bespoke')} className="product-link">
                        Order Custom Fit &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'bespoke' && (
          <div className="form-container">
            <div className="form-header">
              <span>Tailoring Protocol</span>
              <h3>Bespoke Design Input</h3>
              <p>Log your raw fitting dimensions below to queue production files.</p>
            </div>

            <form onSubmit={handleBespokeSubmit} className="bespoke-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Full Name</label>
                  <input required type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g., Anjali Sharma" />
                </div>
                <div className="form-group">
                  <label>Contact Email</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g., anjali@example.com" />
                </div>
              </div>

              <div className="metrics-section">
                <div className="metrics-title">Anatomical Metrics (Inches)</div>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label style={{ textAlign: 'center' }}>Bust</label>
                    <input className="text-center-input" required type="number" value={bust} onChange={e => setBust(e.target.value)} placeholder="34" />
                  </div>
                  <div className="form-group">
                    <label style={{ textAlign: 'center' }}>Waist Line</label>
                    <input className="text-center-input" required type="number" value={waist} onChange={e => setWaist(e.target.value)} placeholder="28" />
                  </div>
                  <div className="form-group">
                    <label style={{ textAlign: 'center' }}>Hips Span</label>
                    <input className="text-center-input" required type="number" value={hips} onChange={e => setHips(e.target.value)} placeholder="38" />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-submit">
                Submit Atelier Specifications
              </button>
            </form>
          </div>
        )}

        
        {view === 'admin' && currentUser && currentUser.role === 'admin' && (
          <div className="form-container" style={{ maxWidth: '1000px' }}>
            <div className="form-header" style={{ borderBottom: '20px solid #f9f9f9', paddingBottom: '15px' }}>
              <span style={{ background: '#d9534f', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>Atelier Executive Rights</span>
              <h3>Bespoke Orders & Fitting Management</h3>
              <p>Review customer parameters, metrics submissions, and update processing statuses.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', margin: '20px 0' }}>
              <div style={{ background: '#fcf8fb', padding: '15px', borderRadius: '6px', borderLeft: '4px solid #b392ac' }}>
                <h5 style={{ margin: 0, color: '#666' }}>Pending Fittings</h5>
                <h2 style={{ margin: '5px 0 0 0' }}>12 Orders</h2>
              </div>
              <div style={{ background: '#fcf8fb', padding: '15px', borderRadius: '6px', borderLeft: '4px solid #5cb85c' }}>
                <h5 style={{ margin: 0, color: '#666' }}>Completed Appts</h5>
                <h2 style={{ margin: '5px 0 0 0' }}>48 Checked</h2>
              </div>
              <div style={{ background: '#fcf8fb', padding: '15px', borderRadius: '6px', borderLeft: '4px solid #f0ad4e' }}>
                <h5 style={{ margin: 0, color: '#666' }}>In Tailoring Phase</h5>
                <h2 style={{ margin: '5px 0 0 0' }}>6 Designs</h2>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '25px', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Client</th>
                  <th style={{ padding: '10px' }}>Fabric & Style Request</th>
                  <th style={{ padding: '10px' }}>Bust / Waist / Hips</th>
                  <th style={{ padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 10px' }}><b>Aarathi Suresh</b><br/><span style={{fontSize:'12px', color:'#777'}}>aarathisuresh93@gmail.com</span></td>
                  <td>Amara Crimson Silk Saree</td>
                  <td>34" / 28" / 38"</td>
                  <td><span style={{ color: '#f0ad4e', fontWeight: 'bold' }}>Pending Queue</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 10px' }}><b>Anjali Sharma</b><br/><span style={{fontSize:'12px', color:'#777'}}>anjali@example.com</span></td>
                  <td>Elysian Rose Wedding Gown</td>
                  <td>36" / 30" / 40"</td>
                  <td><span style={{ color: '#5cb85c', fontWeight: 'bold' }}>Pattern Cut Complete</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

       
        {view === 'login' && (
          <div className="form-container">
            <div className="form-header">
              <span>Secure Access</span>
              <h3>Atelier Login</h3>
              <p>Sign in to review custom parameters and track design progress.</p>
            </div>
            <form onSubmit={handleLoginSubmit} className="bespoke-form" style={{ maxWidth: '450px', margin: '0 auto' }}>
              {authError && <div className="error-message" style={{ color: '#d9534f', marginBottom: '15px', fontWeight: 'bold' }}>{authError}</div>}
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Email Address</label>
                <input required type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="yourname@example.com" />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Password</label>
                <input required type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <button type="submit" className="btn-submit">Log In</button>
              <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                New to the Atelier? <span onClick={() => { setAuthError(''); setView('register'); }} style={{ color: '#b392ac', cursor: 'pointer', textDecoration: 'underline' }}>Create an Account</span>
              </p>
            </form>
          </div>
        )}

        
        {view === 'register' && (
          <div className="form-container">
            <div className="form-header">
              <span>Registration Protocol</span>
              <h3>Create Atelier Profile</h3>
              <p>Join the boutique platform to queue orders and log fittings.</p>
            </div>
            <form onSubmit={handleRegisterSubmit} className="bespoke-form" style={{ maxWidth: '450px', margin: '0 auto' }}>
              {authError && <div className="error-message" style={{ color: '#d9534f', marginBottom: '15px', fontWeight: 'bold' }}>{authError}</div>}
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Full Name</label>
                <input required type="text" value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Anjali Sharma" />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Email Address</label>
                <input required type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="anjali@example.com" />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Phone Number (Optional)</label>
                <input type="text" value={authPhone} onChange={e => setAuthPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Password</label>
                <input required type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Min 6 characters" />
              </div>
              <button type="submit" className="btn-submit">Register Profile</button>
              <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                Already registered? <span onClick={() => { setAuthError(''); setView('login'); }} style={{ color: '#b392ac', cursor: 'pointer', textDecoration: 'underline' }}>Login here</span>
              </p>
            </form>
          </div>
        )}
      </main>

      <footer className="footer">
        &copy; 2026 White Wall Bridal Management Console. All Rights Reserved.
      </footer>
    </div>
  );
}