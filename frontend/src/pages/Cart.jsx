import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import {
  getCart,
  updateCartItem,
  removeFromCart,
  createOrder,
} from '../api/client';

function formatPrice(price) {
  return '₦' + parseFloat(price).toLocaleString();
}

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [checkout, setCheckout] = useState(false);
  const [shipping, setShipping] = useState({
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingPhone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadCart = () => {
    if (!user) return setLoading(false);
    getCart()
      .then(setCart)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadCart();
  }, [user, navigate]);

  const handleUpdateQty = async (itemId, quantity) => {
    if (quantity < 1) return;
    setUpdating(itemId);
    try {
      await updateCartItem(itemId, quantity);
      loadCart();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeFromCart(itemId);
      loadCart();
      toast.success('Removed from cart');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const order = await createOrder(shipping);
      toast.success('Order placed successfully!');
      setCart(null);
      setCheckout(false);
      navigate('/orders/' + order.id);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Loading cart...</p>
      </main>
    );
  }

  if (checkout) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        <form onSubmit={handleCheckout} className="max-w-md card">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Shipping Address</label>
              <input
                type="text"
                required
                value={shipping.shippingAddress}
                onChange={(e) => setShipping({ ...shipping, shippingAddress: e.target.value })}
                className="input"
                placeholder="Street address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                required
                value={shipping.shippingCity}
                onChange={(e) => setShipping({ ...shipping, shippingCity: e.target.value })}
                className="input"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <input
                type="text"
                required
                value={shipping.shippingState}
                onChange={(e) => setShipping({ ...shipping, shippingState: e.target.value })}
                className="input"
                placeholder="State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                required
                value={shipping.shippingPhone}
                onChange={(e) => setShipping({ ...shipping, shippingPhone: e.target.value })}
                className="input"
                placeholder="08012345678"
              />
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={() => setCheckout(false)}
              className="btn-secondary flex-1"
            >
              Back to cart
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Placing order...' : `Place order — ${formatPrice(cart?.total || 0)}`}
            </button>
          </div>
        </form>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Your cart is empty</h2>
          <Link to="/products" className="btn-primary inline-block">
            Browse products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Cart ({cart.count} items)</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="card flex gap-4">
              <img
                src={item.product?.imageUrl}
                alt={item.product?.name}
                className="w-24 h-24 object-cover rounded"
              />
              <div className="flex-1">
                <Link to={`/products/${item.productId}`} className="font-semibold hover:underline">
                  {item.product?.name}
                </Link>
                <p className="text-primary-600 font-medium">{formatPrice(item.product?.price)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                    disabled={updating === item.id || item.quantity <= 1}
                    className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100"
                  >
                    −
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                    disabled={updating === item.id || item.quantity >= item.product?.stock}
                    className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100"
                  >
                    +
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-red-600 text-sm ml-4 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="font-bold">{formatPrice(item.product?.price * item.quantity)}</p>
            </div>
          ))}
        </div>
        <div>
          <div className="card sticky top-4">
            <h3 className="font-semibold text-lg mb-4">Order summary</h3>
            <p className="text-2xl font-bold text-primary-600 mb-6">
              {formatPrice(cart.total)}
            </p>
            <div className="flex gap-4">
              <Link to="/products" className="btn-secondary flex-1 text-center">
                Continue shopping
              </Link>
              <button onClick={() => setCheckout(true)} className="btn-primary flex-1">
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
