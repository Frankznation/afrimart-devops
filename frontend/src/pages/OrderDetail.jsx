import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getOrder } from '../api/client';

function formatPrice(price) {
  return '₦' + parseFloat(price).toLocaleString();
}

function formatDate(str) {
  return new Date(str).toLocaleString();
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    getOrder(id)
      .then(setOrder)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [user, id, navigate]);

  if (!user) return null;

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Loading order...</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Order not found.</p>
        <button onClick={() => navigate('/orders')} className="btn-primary mt-4 mx-auto block">
          Back to orders
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/orders')} className="text-primary-600 hover:underline mb-4">
        ← Back to orders
      </button>
      <div className="card">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
            <p className="text-gray-500">{formatDate(order.createdAt)}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full font-medium ${
              order.status === 'delivered'
                ? 'bg-green-100 text-green-800'
                : order.status === 'cancelled'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {order.status}
          </span>
        </div>

        <div className="border-t pt-6 mb-6">
          <h3 className="font-semibold mb-2">Items</h3>
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between py-2 border-b last:border-0">
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-gray-500">
                  {item.quantity} × {formatPrice(item.price)}
                </p>
              </div>
              <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span className="text-primary-600">{formatPrice(order.totalAmount)}</span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Shipping address</h3>
          <p>{order.shippingAddress}</p>
          <p>
            {order.shippingCity}, {order.shippingState}
          </p>
          <p>{order.shippingPhone}</p>
        </div>
      </div>
    </main>
  );
}
