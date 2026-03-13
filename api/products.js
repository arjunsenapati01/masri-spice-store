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
            const parsedRows = rows.map(p => {
                try {
                    p.image = JSON.parse(p.image);
                    if (!Array.isArray(p.image)) p.image = [p.image];
                } catch(e) {
                    p.image = p.image ? [p.image] : [];
                }
                return p;
            });
            return res.status(200).json(parsedRows);
        }

        if (req.method === 'POST') {
            const { name, description, weight, price, stock, image, badge, benefits } = req.body;
            if (!name || !price) return res.status(400).json({ error: 'name and price are required' });

            const n = name !== undefined ? name : null;
            const d = description !== undefined ? description : '';
            const w = weight !== undefined ? weight : 100;
            const p = price !== undefined ? price : 0;
            const s = stock !== undefined ? stock : 0;
            const img = image !== undefined ? JSON.stringify(Array.isArray(image) ? image : [image]) : '[]';
            const bnd = badge !== undefined ? badge : '';
            const ben = benefits !== undefined ? benefits : '';

            const id = 'p' + Date.now();
            const { rows } = await sql`
        INSERT INTO products (id, name, description, weight, price, stock, image, badge, benefits)
        VALUES (${id}, ${n}, ${d}, ${w}, ${p}, ${s}, ${img}, ${bnd}, ${ben})
        RETURNING *`;
            
            let p_ret = rows[0];
            try {
                p_ret.image = JSON.parse(p_ret.image);
                if (!Array.isArray(p_ret.image)) p_ret.image = [p_ret.image];
            } catch(e) {
                p_ret.image = p_ret.image ? [p_ret.image] : [];
            }
            return res.status(201).json(p_ret);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('Products error:', err);
        return res.status(500).json({ error: err.message });
    }
}
