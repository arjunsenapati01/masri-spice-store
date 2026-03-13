// api/orders.js — GET all orders / POST create new order
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') {
            const { rows: orders } = await sql`
        SELECT * FROM orders ORDER BY created_at DESC`;

            // Attach items to each order
            const ordersWithItems = await Promise.all(orders.map(async (order) => {
                const { rows: items } = await sql`
          SELECT * FROM order_items WHERE order_id = ${order.id}`;
                return { ...order, items };
            }));

            return res.status(200).json(ordersWithItems);
        }

        if (req.method === 'POST') {
            const { customer, items, subtotal, deliveryCharge, total, paymentMethod, paymentStatus } = req.body;
            if (!customer || !items || !items.length) {
                return res.status(400).json({ error: 'customer and items are required' });
            }

            const orderId = 'ORD' + Date.now();

            // Insert order
            await sql`
        INSERT INTO orders (id, customer, subtotal, delivery_charge, total, payment_method, payment_status, order_status)
        VALUES (
          ${orderId},
          ${JSON.stringify(customer)},
          ${subtotal},
          ${deliveryCharge},
          ${total},
          ${paymentMethod},
          ${paymentStatus},
          'Pending'
        )`;

            // Insert order items
            for (const item of items) {
                await sql`
          INSERT INTO order_items (order_id, product_id, name, weight, price, qty, image)
          VALUES (${orderId}, ${item.productId}, ${item.name}, ${item.weight}, ${item.price}, ${item.qty}, ${item.image || ''})`;
            }

            // Decrease stock for each item
            for (const item of items) {
                await sql`
          UPDATE products 
          SET stock = GREATEST(0, stock - ${item.qty})
          WHERE id = ${item.productId}`;
            }

            // Fetch the created order with items
            const { rows: orderRows } = await sql`SELECT * FROM orders WHERE id = ${orderId}`;
            const { rows: itemRows } = await sql`SELECT * FROM order_items WHERE order_id = ${orderId}`;

            return res.status(201).json({ ...orderRows[0], items: itemRows });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('Orders error:', err);
        return res.status(500).json({ error: err.message });
    }
}
