// api/product.js — GET / PUT / DELETE a single product by ?id=
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id is required' });

    try {
        if (req.method === 'GET') {
            const { rows } = await sql`SELECT * FROM products WHERE id = ${id}`;
            if (!rows.length) return res.status(404).json({ error: 'Product not found' });
            let p = rows[0];
            try {
                p.image = JSON.parse(p.image);
                if (!Array.isArray(p.image)) p.image = [p.image];
            } catch(e) {
                p.image = p.image ? [p.image] : [];
            }
            return res.status(200).json(p);
        }

        if (req.method === 'PUT') {
            const { name, description, weight, price, stock, image, badge, benefits } = req.body;
            // Build dynamic update — only update fields that are provided
            
            const n = name !== undefined ? name : null;
            const d = description !== undefined ? description : null;
            const w = weight !== undefined ? weight : null;
            const pr = price !== undefined ? price : null;
            const s = stock !== undefined ? stock : null;
            const img = image !== undefined ? JSON.stringify(Array.isArray(image) ? image : [image]) : null;
            const bnd = badge !== undefined ? badge : null;
            const ben = benefits !== undefined ? benefits : null;

            const { rows } = await sql`
        UPDATE products SET
          name        = COALESCE(${n}, name),
          description = COALESCE(${d}, description),
          weight      = COALESCE(${w}, weight),
          price       = COALESCE(${pr}, price),
          stock       = COALESCE(${s}, stock),
          image       = COALESCE(${img}, image),
          badge       = COALESCE(${bnd}, badge),
          benefits    = COALESCE(${ben}, benefits)
        WHERE id = ${id}
        RETURNING *`;
            if (!rows.length) return res.status(404).json({ error: 'Product not found' });
            let p = rows[0];
            try {
                p.image = JSON.parse(p.image);
                if (!Array.isArray(p.image)) p.image = [p.image];
            } catch(e) {
                p.image = p.image ? [p.image] : [];
            }
            return res.status(200).json(p);
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
