// api/products.js — GET all products / POST new product
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') {
            const { rows } = await sql`SELECT * FROM products ORDER BY created_at ASC`;
            return res.status(200).json(rows);
        }

        if (req.method === 'POST') {
            const { name, description, weight, price, stock, image, badge, benefits } = req.body;
            if (!name || !price) return res.status(400).json({ error: 'name and price are required' });

            const id = 'p' + Date.now();
            const { rows } = await sql`
        INSERT INTO products (id, name, description, weight, price, stock, image, badge, benefits)
        VALUES (${id}, ${name}, ${description || ''}, ${weight || 100}, ${price}, ${stock || 0}, ${image || ''}, ${badge || ''}, ${benefits || ''})
        RETURNING *`;
            return res.status(201).json(rows[0]);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('Products error:', err);
        return res.status(500).json({ error: err.message });
    }
}
