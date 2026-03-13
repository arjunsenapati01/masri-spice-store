// api/product.js — GET / PUT / DELETE a single product by ?id=
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id is required' });

    try {
        if (req.method === 'GET') {
            const { rows } = await sql`SELECT * FROM products WHERE id = ${id}`;
            if (!rows.length) return res.status(404).json({ error: 'Product not found' });
            return res.status(200).json(rows[0]);
        }

        if (req.method === 'PUT') {
            const { name, description, weight, price, stock, image, badge, benefits } = req.body;
            // Build dynamic update — only update fields that are provided
            const { rows } = await sql`
        UPDATE products SET
          name        = COALESCE(${name}, name),
          description = COALESCE(${description}, description),
          weight      = COALESCE(${weight}, weight),
          price       = COALESCE(${price}, price),
          stock       = COALESCE(${stock}, stock),
          image       = COALESCE(${image}, image),
          badge       = COALESCE(${badge !== undefined ? badge : null}, badge),
          benefits    = COALESCE(${benefits}, benefits)
        WHERE id = ${id}
        RETURNING *`;
            if (!rows.length) return res.status(404).json({ error: 'Product not found' });
            return res.status(200).json(rows[0]);
        }

        if (req.method === 'DELETE') {
            await sql`DELETE FROM products WHERE id = ${id}`;
            return res.status(200).json({ ok: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('Product error:', err);
        return res.status(500).json({ error: err.message });
    }
}
