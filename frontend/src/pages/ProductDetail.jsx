import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getProduct, addToCart } from '../api/client';

function formatPrice(price) {
  return '₦' + parseFloat(price).toLocaleString();
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getProduct(id)
      .then(setProduct)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.info('Please sign in to add to cart');
      navigate('/login');
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Product not found.</p>
        <button onClick={() => navigate('/products')} className="btn-primary mt-4 mx-auto block">
          Back to products
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-primary-600 hover:underline mb-4">
        ← Back
      </button>
      <div className="grid md:grid-cols-2 gap-8">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full rounded-lg shadow-lg object-cover max-h-96"
        />
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-primary-600 font-bold text-2xl mb-4">{formatPrice(product.price)}</p>
          <p className="text-gray-600 mb-4">{product.description}</p>
          <p className="text-sm text-gray-500 mb-4">
            Brand: {product.brand} | Category: {product.category} | Stock: {product.stock}
          </p>
          <div className="flex items-center gap-4 mb-6">
            <label className="font-medium">Quantity:</label>
            <input
              type="number"
              min={1}
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="input w-20"
            />
          </div>
          <button
            onClick={handleAddToCart}
            disabled={adding || !user || product.stock < 1}
            className="btn-primary px-8 py-3"
          >
            {adding ? 'Adding...' : product.stock < 1 ? 'Out of stock' : 'Add to cart'}
          </button>
        </div>
      </div>
    </main>
  );
}
