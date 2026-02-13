import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';

function Nav() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary-600 hover:text-primary-700">
            AfriMart
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/products" className="text-gray-600 hover:text-primary-600 font-medium">
              Products
            </Link>
            {user && (
              <>
                <Link to="/cart" className="text-gray-600 hover:text-primary-600 font-medium">
                  Cart
                </Link>
                <Link to="/orders" className="text-gray-600 hover:text-primary-600 font-medium">
                  Orders
                </Link>
              </>
            )}
            {loading ? (
              <span className="text-gray-500 text-sm">Loading...</span>
            ) : user ? (
              <>
                <span className="text-gray-600 text-sm">
                  {user.firstName} {user.lastName}
                </span>
                <button
                  onClick={logout}
                  className="btn-secondary text-sm py-1.5 px-3"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm py-1.5 px-3">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-sm py-1.5 px-3">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

function Home() {
  const { user } = useAuth();

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="card text-center">
        <h2 className="text-2xl font-semibold mb-4">
          {user ? `Welcome back, ${user.firstName}!` : 'Welcome to AfriMart'}
        </h2>
        <p className="text-gray-600 mb-6">
          {user
            ? 'Browse products, add to cart, and place orders.'
            : 'Sign in or create an account to start shopping.'}
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/products" className="btn-primary">
            Browse Products
          </Link>
          {!user && (
            <>
              <Link to="/login" className="btn-secondary">
                Sign In
              </Link>
              <Link to="/register" className="btn-secondary">
                Register
              </Link>
            </>
          )}
        </div>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="card bg-primary-50">
            <h3 className="font-semibold text-lg mb-2">Backend API</h3>
            <p className="text-sm text-gray-600">
              RESTful API with authentication, products, cart, and orders
            </p>
          </div>
          <div className="card bg-blue-50">
            <h3 className="font-semibold text-lg mb-2">Database</h3>
            <p className="text-sm text-gray-600">
              PostgreSQL with Redis caching and Bull job queue
            </p>
          </div>
          <div className="card bg-purple-50">
            <h3 className="font-semibold text-lg mb-2">DevOps Ready</h3>
            <p className="text-sm text-gray-600">
              Docker, monitoring, health checks, and metrics included
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Nav />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
          </Routes>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
