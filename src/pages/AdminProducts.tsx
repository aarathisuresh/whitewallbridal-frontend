import React, { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

interface Variant {
  size: string;
  color: string;
  stock: number;
  sku: string;
}

const AdminProducts: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [category, setCategory] = useState<string>(''); // Valid MongoDB Category ID string
  const [fabric, setFabric] = useState<string>('');
  const [care, setCare] = useState<string>('');
  
  const [variants] = useState<Variant[]>([
    { size: 'M', color: 'ivory', stock: 5, sku: '' }
  ]);
  
  const [imageString, setImageString] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string>('');

  // Converts selected image file into a base64 string
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageString(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatusMsg('Publishing product details...');
    
    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        name,
        description,
        price: Number(price),
        category,
        fabric,
        care,
        images: [{ url: imageString, isMain: true }],
        variants
      };

      const response = await axios.post('https://whitewallbridal-backend.onrender.com/api/products', payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setStatusMsg('🎉 Product successfully added to live catalogue!');
      }
    } catch (err: any) {
      setStatusMsg(`❌ Error: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      <h2>White Wall Admin - Add New Product</h2>
      {statusMsg && <p><strong>{statusMsg}</strong></p>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input type="text" placeholder="Product Name" required value={name} onChange={e => setName(e.target.value)} />
        <textarea placeholder="Description" required value={description} onChange={e => setDescription(e.target.value)} />
        <input type="number" placeholder="Price ($)" required value={price} onChange={e => setPrice(e.target.value)} />
        <input type="text" placeholder="Category ID (MongoDB ObjectId)" required value={category} onChange={e => setCategory(e.target.value)} />
        <input type="text" placeholder="Fabric Material" value={fabric} onChange={e => setFabric(e.target.value)} />
        <input type="text" placeholder="Care Instructions" value={care} onChange={e => setCare(e.target.value)} />
        
        <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Product Image:</label>
        <input type="file" accept="image/*" required onChange={handleImageUpload} />
        
        <button type="submit" style={{ padding: '10px', background: '#000', color: '#fff', cursor: 'pointer', border: 'none', fontWeight: 'bold' }}>
          Publish Product to Database
        </button>
      </form>
    </div>
  );
};

export default AdminProducts;