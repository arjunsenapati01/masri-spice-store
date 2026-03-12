// api/order.js — GET single order / PUT update order status
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id is required' });

    try {
        if (req.method === 'GET') {
            const { rows: orderRows } = await sql`SELECT * FROM orders WHERE id = ${id}`;
            if (!orderRows.length) return res.status(404).json({ error: 'Order not found' });
            const { rows: items } = await sql`SELECT * FROM order_items WHERE order_id = ${id}`;
            return res.status(200).json({ ...orderRows[0], items });
        }

        if (req.method === 'PUT') {
            const { orderStatus } = req.body;
            if (!orderStatus) return res.status(400).json({ error: 'orderStatus is required' });
            const { rows } = await sql`
        UPDATE orders SET order_status = ${orderStatus} WHERE id = ${id} RETURNING *`;
            if (!rows.length) return res.status(404).json({ error: 'Order not found' });
            return res.status(200).json(rows[0]);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('Order error:', err);
        return res.status(500).json({ error: err.message });
    }
}
