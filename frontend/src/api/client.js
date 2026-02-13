const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function getHeaders(withAuth = false) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (withAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function getProducts(params = {}) {
  const search = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/products${search ? '?' + search : ''}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch products');
  return data.data;
}

export async function getProduct(id) {
  const res = await fetch(`${API_URL}/products/${id}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Product not found');
  return data.data;
}

export async function getCategories() {
  const res = await fetch(`${API_URL}/products/categories`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch categories');
  return data.data;
}

export async function getCart() {
  const res = await fetch(`${API_URL}/cart`, { headers: getHeaders(true) });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch cart');
  return data.data;
}

export async function addToCart(productId, quantity = 1) {
  const res = await fetch(`${API_URL}/cart`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ productId, quantity }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to add to cart');
  return data.data;
}

export async function updateCartItem(cartItemId, quantity) {
  const res = await fetch(`${API_URL}/cart/${cartItemId}`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify({ quantity }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to update cart');
  return data.data;
}

export async function removeFromCart(cartItemId) {
  const res = await fetch(`${API_URL}/cart/${cartItemId}`, {
    method: 'DELETE',
    headers: getHeaders(true),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to remove from cart');
  return data;
}

export async function clearCart() {
  const res = await fetch(`${API_URL}/cart`, {
    method: 'DELETE',
    headers: getHeaders(true),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to clear cart');
  return data;
}

export async function getOrders() {
  const res = await fetch(`${API_URL}/orders`, { headers: getHeaders(true) });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch orders');
  return data.data;
}

export async function getOrder(id) {
  const res = await fetch(`${API_URL}/orders/${id}`, { headers: getHeaders(true) });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Order not found');
  return data.data;
}

export async function createOrder(shipping) {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(shipping),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to create order');
  return data.data;
}
