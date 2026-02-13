import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getOrders } from '../api/client';

function formatPrice(price) {
  return '₦' + parseFloat(price).toLocaleString();
}

function formatDate(str) {
  return new Date(str).toLocaleDateString();
}

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    getOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((err) => {
        toast.error(err.message);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (!user) return null;

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Loading orders...</p>
      </main>
    );
  }

  const orderList = Array.isArray(orders) ? orders : orders?.data || [];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      {orderList.length === 0 ? (
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold mb-4">No orders yet</h2>
          <Link to="/products" className="btn-primary inline-block">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orderList.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="card block hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                  <p className="text-primary-600 font-bold mt-1">{formatPrice(order.totalAmount)}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
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
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
