// api/init.js — Initialize database tables and seed default products
import { sql } from '@vercel/postgres';

const DEFAULT_PRODUCTS = [
  { id: 'p1', name: 'Red Chili Powder', description: 'Intensely vibrant and fiery, our Red Chili Powder adds authentic heat and rich colour to curries, marinades, and spice blends. Sourced from premium sun-dried red chilies.', weight: 100, price: 149, stock: 50, image: '["/images/products/chili.png"]', badge: 'Best Seller' },
  { id: 'p2', name: 'Turmeric Powder', description: 'Golden, earthy, and deeply aromatic. Our pure Turmeric Powder is rich in natural curcumin — the cornerstone of every Indian kitchen and Ayurvedic tradition.', weight: 100, price: 129, stock: 60, image: '["/images/products/turmeric.png"]', badge: '' },
  { id: 'p3', name: 'Cumin Powder', description: 'Warm, nutty, and slightly smoky — our Cumin Powder brings depth and complexity to dals, biryanis, and raitas. Made from freshly ground roasted cumin seeds.', weight: 100, price: 139, stock: 45, image: '["/images/products/cumin.png"]', badge: '' },
  { id: 'p4', name: 'Coriander Powder', description: 'Mild, citrusy, and fragrant. Our Coriander Powder is the foundation of most spice blends — adding a gentle warmth and depth to every dish it touches.', weight: 100, price: 119, stock: 55, image: '["/images/products/coriander.png"]', badge: '' },
  { id: 'p5', name: 'Garam Masala', description: 'The crown jewel of Indian spices. Our signature Garam Masala is a perfectly balanced blend of 12 aromatic whole spices — adding extraordinary warmth and complexity.', weight: 100, price: 189, stock: 40, image: '["/images/products/garam-masala.png"]', badge: 'Premium' },
  { id: 'p6', name: 'Black Pepper Powder', description: 'Bold, sharp, and intensely pungent. Our freshly ground Black Pepper Powder adds a classic heat and sophisticated spice to every dish — from soups to steaks.', weight: 100, price: 169, stock: 35, image: '["/images/products/black-pepper.png"]', badge: '' },
  { id: 'p7', name: 'Cardamom Powder', description: 'Delicate, sweet, and intensely floral. Maa श्री Cardamom Powder elevates desserts, chai, and biryanis with its exotic, mystical aroma — a true luxury ingredient.', weight: 50, price: 249, stock: 25, image: '["/images/products/cardamom.png"]', badge: 'Luxury' },
];

const DEFAULT_CONFIG = [
  { key: 'razorpay_key_id', value: '' },
  { key: 'cod_delivery_charge', value: '50' },
  { key: 'prepaid_delivery_charge', value: '50' },
  { key: 'free_shipping_above', value: '800' },
];

export default async function handler(req, res) {
  // 1. Check if database is linked
  if (!process.env.POSTGRES_URL) {
    return res.status(400).json({
      ok: false,
      error: 'Database connection string missing.',
      hint: 'Please go to Vercel Storage tab and click "Connect" on your Neon database, then redeploy.'
    });
  }

  // Protect with a secret to avoid accidental re-init in production
  const { secret } = req.query;
  if (secret && secret !== process.env.INIT_SECRET && process.env.INIT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Create tables
    await sql`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          weight INTEGER DEFAULT 100,
          price INTEGER DEFAULT 0,
          stock INTEGER DEFAULT 0,
          image TEXT DEFAULT '',
          badge TEXT DEFAULT '',
          benefits TEXT DEFAULT '',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )`;

    // Migration: Add benefits column if it doesn't exist
    try {
      await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS benefits TEXT DEFAULT ''`;
    } catch (colErr) {
      console.log('Benefits column check/add:', colErr.message);
    }

    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer JSONB NOT NULL,
        subtotal INTEGER DEFAULT 0,
        delivery_charge INTEGER DEFAULT 0,
        total INTEGER DEFAULT 0,
        payment_method TEXT DEFAULT 'cod',
        payment_status TEXT DEFAULT 'pending',
        order_status TEXT DEFAULT 'Pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`;

    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
        product_id TEXT,
        name TEXT,
        weight INTEGER,
        price INTEGER,
        qty INTEGER,
        image TEXT
      )`;

    await sql`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT DEFAULT ''
      )`;

    // Seed products only if table is empty
    const { rowCount } = await sql`SELECT id FROM products LIMIT 1`;
    if (rowCount === 0) {
      for (const p of DEFAULT_PRODUCTS) {
        await sql`
          INSERT INTO products (id, name, description, weight, price, stock, image, badge)
          VALUES (${p.id}, ${p.name}, ${p.description}, ${p.weight}, ${p.price}, ${p.stock}, ${p.image}, ${p.badge})
          ON CONFLICT (id) DO NOTHING`;
      }
    }

    // Seed config only if empty
    const { rowCount: cfgCount } = await sql`SELECT key FROM config LIMIT 1`;
    if (cfgCount === 0) {
      for (const c of DEFAULT_CONFIG) {
        await sql`
          INSERT INTO config (key, value) VALUES (${c.key}, ${c.value})
          ON CONFLICT (key) DO NOTHING`;
      }
    }

    return res.status(200).json({
      ok: true,
      message: 'Database initialized successfully. Products and config seeded.'
    });
  } catch (err) {
    console.error('Init error:', err);
    return res.status(200).json({
      ok: false,
      error: err.message,
      stack: err.stack,
      env_check: {
        has_url: !!process.env.POSTGRES_URL,
        url_prefix: process.env.POSTGRES_URL ? process.env.POSTGRES_URL.split(':')[0] : 'none'
      }
    });
  }
}
