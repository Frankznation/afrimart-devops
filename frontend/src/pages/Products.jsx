import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getProducts, getCategories, addToCart } from '../api/client';

function formatPrice(price) {
  return '₦' + parseFloat(price).toLocaleString();
}

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [adding, setAdding] = useState(null);

  useEffect(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = category
    ? products.filter((p) => p.category === category)
    : products;

  const handleAddToCart = async (productId) => {
    if (!user) {
      toast.info('Please sign in to add to cart');
      return;
    }
    setAdding(productId);
    try {
      await addToCart(productId, 1);
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(null);
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Loading products...</p>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setCategory('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              !category ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                category === cat ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="card hover:shadow-lg transition-shadow">
            <Link to={`/products/${product.id}`} className="block">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg mb-3"
              />
              <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
              <p className="text-primary-600 font-bold">{formatPrice(product.price)}</p>
            </Link>
            <button
              onClick={() => handleAddToCart(product.id)}
              disabled={adding === product.id || !user || product.stock < 1}
              className="btn-primary w-full mt-3"
            >
              {adding === product.id ? 'Adding...' : product.stock < 1 ? 'Out of stock' : 'Add to cart'}
            </button>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <p className="text-center text-gray-500 py-12">No products found.</p>
      )}
    </main>
  );
}
