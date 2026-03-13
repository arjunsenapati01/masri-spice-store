// api/products.js — GET all products / POST new product
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') {
            const { rows } = await sql`SELECT * FROM products ORDER BY created_at ASC`;
            return res.status(200).json(rows);
        }

        if (req.method === 'POST') {
            const { name, description, weight, price, stock, image, badge, benefits } = req.body;
            if (!name || !price) return res.status(400).json({ error: 'name and price are required' });

            const n = name !== undefined ? name : null;
            const d = description !== undefined ? description : '';
            const w = weight !== undefined ? weight : 100;
            const p = price !== undefined ? price : 0;
            const s = stock !== undefined ? stock : 0;
            const img = image !== undefined ? image : '';
            const bnd = badge !== undefined ? badge : '';
            const ben = benefits !== undefined ? benefits : '';

            const id = 'p' + Date.now();
            const { rows } = await sql`
        INSERT INTO products (id, name, description, weight, price, stock, image, badge, benefits)
        VALUES (${id}, ${n}, ${d}, ${w}, ${p}, ${s}, ${img}, ${bnd}, ${ben})
        RETURNING *`;
            return res.status(201).json(rows[0]);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('Products error:', err);
        return res.status(500).json({ error: err.message });
    }
}
