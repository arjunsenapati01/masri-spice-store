/**
 * Maa श्री Spice Store — API Client
 * Uses Vercel Postgres via serverless API routes when deployed.
 * Falls back to localStorage with seeded defaults when running locally.
 */

// ── Embedded defaults (used as fallback when API is unavailable) ──────────────
const DEFAULT_PRODUCTS = [
  { id: 'p1', name: 'Red Chili Powder', description: 'Intensely vibrant and fiery, our Red Chili Powder adds authentic heat and rich colour to curries, marinades, and spice blends. Sourced from premium sun-dried red chilies.', weight: 100, price: 149, stock: 50, image: 'images/products/chili.png', badge: 'Best Seller', benefits: '• Boosts metabolism\n• Rich in Vitamin C\n• Helps clear congestion\n• Natural pain reliever' },
  { id: 'p2', name: 'Turmeric Powder', description: 'Golden, earthy, and deeply aromatic. Our pure Turmeric Powder is rich in natural curcumin — the cornerstone of every Indian kitchen and Ayurvedic tradition.', weight: 100, price: 129, stock: 60, image: 'images/products/turmeric.png', badge: '', benefits: '• Powerful anti-inflammatory\n• Strong antioxidant\n• Improves brain function\n• Boosts immunity' },
  { id: 'p3', name: 'Cumin Powder', description: 'Warm, nutty, and slightly smoky — our Cumin Powder brings depth and complexity to dals, biryanis, and raitas. Made from freshly ground roasted cumin seeds.', weight: 100, price: 139, stock: 45, image: 'images/products/cumin.png', badge: '', benefits: '• Aids digestion\n• Rich source of iron\n• May help with diabetes\n• Improves blood cholesterol' },
  { id: 'p4', name: 'Coriander Powder', description: 'Mild, citrusy, and fragrant. Our Coriander Powder is the foundation of most spice blends — adding a gentle warmth and depth to every dish it touches.', weight: 100, price: 119, stock: 55, image: 'images/products/coriander.png', badge: '', benefits: '• Promotes heart health\n• Good for skin and hair\n• Improves kidney function\n• Regulates blood sugar' },
  { id: 'p5', name: 'Garam Masala', description: 'The crown jewel of Indian spices. Our signature Garam Masala is a perfectly balanced blend of 12 aromatic whole spices — adding extraordinary warmth and complexity.', weight: 100, price: 189, stock: 40, image: 'images/products/garam-masala.png', badge: 'Premium', benefits: '• Rich in antioxidants\n• Enhances digestive health\n• Boosts thermogenesis/metabolism\n• Fights bloating and gas' },
  { id: 'p6', name: 'Black Pepper Powder', description: 'Bold, sharp, and intensely pungent. Our freshly ground Black Pepper Powder adds a classic heat and sophisticated spice to every dish.', weight: 100, price: 169, stock: 35, image: 'images/products/black-pepper.png', badge: '', benefits: '• High in anti-inflammatory properties\n• Promotes nutrient absorption\n• May help with weight loss\n• Supports gut health' },
  { id: 'p7', name: 'Cardamom Powder', description: 'Delicate, sweet, and intensely floral. Maa श्री Cardamom Powder elevates desserts, chai, and biryanis with its exotic, mystical aroma — a true luxury ingredient.', weight: 50, price: 249, stock: 25, image: 'images/products/cardamom.png', badge: 'Luxury', benefits: '• Natural breath freshener\n• Lowers blood pressure\n• Anti-bacterial properties\n• Aids in relaxation and stress relief' },
];

const DEFAULT_CONFIG = { razorpayKeyId: '', codDeliveryCharge: 50, prepaidDeliveryCharge: 50, freeShippingAbove: 800 };

// Seed localStorage with defaults if empty (for local dev)
function seedLocalIfEmpty() {
  // Clear old "masri" data to force a fresh start with "maa_shree"
  if (localStorage.getItem('masri_products') || localStorage.getItem('masri_config')) {
    console.log('Detected legacy Masri data. Migrating to Maa श्री...');
    localStorage.removeItem('masri_products');
    localStorage.removeItem('masri_cart');
    localStorage.removeItem('masri_config');
    localStorage.removeItem('masri_orders');
    sessionStorage.removeItem('masri_admin');
  }

  if (!localStorage.getItem('maa_shree_products')) {
    localStorage.setItem('maa_shree_products', JSON.stringify(DEFAULT_PRODUCTS));
  }
  if (!localStorage.getItem('maa_shree_config')) {
    localStorage.setItem('maa_shree_config', JSON.stringify(DEFAULT_CONFIG));
  }
}
seedLocalIfEmpty();

const Store = {

  // ── Products ────────────────────────────────────────────────────────────────
  // ── helpers ──
  _lsProducts() { return JSON.parse(localStorage.getItem('maa_shree_products') || '[]'); },
  _lsSaveProducts(p) { localStorage.setItem('maa_shree_products', JSON.stringify(p)); },

  async _apiOk(url, opts = {}) {
    try {
      const options = { ...opts, cache: 'no-store' };
      // Also append cache-busting timestamp to GET requests
      let fetchUrl = url;
      if (!options.method || options.method === 'GET') {
        const char = url.includes('?') ? '&' : '?';
        fetchUrl = `${url}${char}_t=${Date.now()}`;
      }
      const res = await fetch(fetchUrl, options);
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  },

  async getProducts() {
    let products = this._lsProducts();
    const data = await this._apiOk('/api/products');
    if (data && Array.isArray(data)) {
      products = data;
      this._lsSaveProducts(products); // Sync local state
    }
    return products;
  },

  async getProductById(id) {
    const data = await this._apiOk(`/api/product?id=${id}`);
    if (data && !data.error) return data;
    return this._lsProducts().find(p => p.id === id) || null;
  },

  async addProduct(data) {
    let result = null;
    try {
      const res = await fetch('/api/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (res.ok) { result = await res.json(); }
      else { const err = await res.json(); console.warn("DB Add Error:", err); }
    } catch (e) {
      console.warn("API Add Error:", e);
    }

    // Always update local storage so UI reflects instantly
    const newProduct = result || { id: 'p' + Date.now(), ...data, created_at: new Date().toISOString() };
    const products = this._lsProducts();
    products.push(newProduct);
    this._lsSaveProducts(products);

    if (!result) throw new Error('Saved locally. Vercel DB connection may be missing.');
    return result;
  },

  async updateProduct(id, updates) {
    let result = null;
    try {
      const res = await fetch(`/api/product?id=${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates),
      });
      if (res.ok) { result = await res.json(); }
      else { const err = await res.json(); console.warn("DB Update Error:", err); }
    } catch (e) {
      console.warn("API Update Error:", e);
    }

    // Always update local storage so UI reflects instantly
    let products = this._lsProducts();
    products = products.map(p => p.id === id ? { ...p, ...updates } : p);
    this._lsSaveProducts(products);

    if (!result) throw new Error('Updated locally. Vercel DB connection may be missing.');
    return true;
  },

  async deleteProduct(id) {
    try {
      await fetch(`/api/product?id=${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("API Delete Error:", e);
    }
    
    // Always update local storage
    this._lsSaveProducts(this._lsProducts().filter(p => p.id !== id));
    return true;
  },

  // ── Image Upload ─────────────────────────────────────────────────────────────
  async uploadImage(file) {
    // Check file size (Vercel limit is 4.5MB)
    if (file.size > 4.5 * 1024 * 1024) {
      throw new Error('Image too large (max 4.5MB). Please optimize the image.');
    }
    try {
      // Upload raw file to Vercel Blob via our API route
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Image upload failed');
      }
      const { url } = await res.json();
      return url;
    } catch (e) {
      console.warn("Vercel Blob Upload Error:", e);
      throw new Error("Local environment missing connected Storage, or " + e.message);
    }
  },

  // ── Cart (stays in localStorage — session only) ───────────────────────────────
  getCart() {
    return JSON.parse(localStorage.getItem('maa_shree_cart') || '[]');
  },

  saveCart(cart) {
    localStorage.setItem('maa_shree_cart', JSON.stringify(cart));
  },

  addToCart(productId, qty = 1) {
    const cart = this.getCart();
    const existing = cart.find(i => i.productId === productId);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ productId, qty });
    }
    this.saveCart(cart);
    return true;
  },

  updateCartItem(productId, qty) {
    if (qty <= 0) { this.removeFromCart(productId); return; }
    const cart = this.getCart();
    const item = cart.find(i => i.productId === productId);
    if (item) { item.qty = qty; this.saveCart(cart); }
  },

  removeFromCart(productId) {
    this.saveCart(this.getCart().filter(i => i.productId !== productId));
  },

  clearCart() {
    localStorage.setItem('maa_shree_cart', '[]');
  },

  getCartCount() {
    return this.getCart().reduce((s, i) => s + i.qty, 0);
  },

  // ── Config ──────────────────────────────────────────────────────────────────
  async getConfig() {
    const data = await this._apiOk('/api/config');
    if (data) return data;
    // Fallback: localStorage
    return JSON.parse(localStorage.getItem('maa_shree_config') || 'null') || DEFAULT_CONFIG;
  },

  async saveConfig(cfg) {
    const result = await this._apiOk('/api/config', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg),
    });
    if (result) return true;
    // Fallback: localStorage
    localStorage.setItem('maa_shree_config', JSON.stringify(cfg));
    return true;
  },

  // ── Orders ───────────────────────────────────────────────────────────────────
  async getOrders() {
    const data = await this._apiOk('/api/orders');
    if (data) return data;
    // Fallback: localStorage
    return JSON.parse(localStorage.getItem('maa_shree_orders') || '[]');
  },

  async getOrderById(id) {
    const data = await this._apiOk(`/api/order?id=${id}`);
    if (data) return data;
    // Fallback: localStorage
    return JSON.parse(localStorage.getItem('maa_shree_orders') || '[]').find(o => o.id === id) || null;
  },

  async createOrder(customer, cartItems, productMap, paymentMethod, paymentStatus, config) {
    const subtotal = cartItems.reduce((s, i) => s + (productMap[i.productId]?.price || 0) * i.qty, 0);
    const delivery = subtotal >= config.freeShippingAbove ? 0
      : paymentMethod === 'cod' ? config.codDeliveryCharge : config.prepaidDeliveryCharge;
    const total = subtotal + delivery;
    const items = cartItems.map(i => {
      const p = productMap[i.productId] || {};
      return { productId: i.productId, name: p.name, weight: p.weight, price: p.price, qty: i.qty, image: p.image || '' };
    });

    const result = await this._apiOk('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer, items, subtotal, deliveryCharge: delivery, total, paymentMethod, paymentStatus }),
    });
    if (result) { this.clearCart(); return result; }
    // Fallback: localStorage
    const order = { id: 'ORD' + Date.now(), customer, items, subtotal, delivery_charge: delivery, total, payment_method: paymentMethod, payment_status: paymentStatus, order_status: 'Pending', created_at: new Date().toISOString() };
    const orders = JSON.parse(localStorage.getItem('maa_shree_orders') || '[]');
    orders.unshift(order);
    localStorage.setItem('maa_shree_orders', JSON.stringify(orders));
    this.clearCart();
    return order;
  },

  async updateOrderStatus(id, orderStatus) {
    const result = await this._apiOk(`/api/order?id=${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderStatus }),
    });
    if (result) return true;
    // Fallback: localStorage
    const orders = JSON.parse(localStorage.getItem('maa_shree_orders') || '[]');
    const o = orders.find(x => x.id === id);
    if (o) { o.order_status = orderStatus; localStorage.setItem('maa_shree_orders', JSON.stringify(orders)); }
    return true;
  },

  // ── Admin Auth ───────────────────────────────────────────────────────────────
  isAdminLoggedIn() {
    return sessionStorage.getItem('maa_shree_admin') === 'true';
  },

  async adminLogin(pin) {
    const data = await this._apiOk('/api/auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }),
    });
    if (data?.ok) {
      sessionStorage.setItem('maa_shree_admin', 'true');
      return true;
    }
    // Fallback: check against localStorage config or default PIN
    const cfg = JSON.parse(localStorage.getItem('maa_shree_config') || '{}');
    const correctPin = cfg.adminPassword || '987654321';
    if (pin === correctPin) {
      sessionStorage.setItem('maa_shree_admin', 'true');
      return true;
    }
    return false;
  },

  adminLogout() {
    sessionStorage.removeItem('maa_shree_admin');
  },
};

// ─── Utility Helpers ──────────────────────────────────────────────────────────
function formatPrice(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function showToast(msg, icon = '✓') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>${icon}</span> ${msg}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

function updateCartBadge() {
  const count = Store.getCartCount();
  document.querySelectorAll('.cart-count').forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'flex' : 'none';
  });
}
