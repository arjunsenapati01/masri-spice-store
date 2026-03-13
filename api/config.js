// api/config.js — GET / PUT store configuration (delivery charges, Razorpay key)
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') {
            const { rows } = await sql`SELECT key, value FROM config`;
            const config = {};
            rows.forEach(r => { config[r.key] = r.value; });
            // Return structured config object
            return res.status(200).json({
                razorpayKeyId: config['razorpay_key_id'] || '',
                codDeliveryCharge: parseInt(config['cod_delivery_charge'] || '50'),
                prepaidDeliveryCharge: parseInt(config['prepaid_delivery_charge'] || '50'),
                freeShippingAbove: parseInt(config['free_shipping_above'] || '800'),
            });
        }

        if (req.method === 'PUT') {
            const { razorpayKeyId, codDeliveryCharge, prepaidDeliveryCharge, freeShippingAbove } = req.body;
            const updates = {
                razorpay_key_id: razorpayKeyId,
                cod_delivery_charge: String(codDeliveryCharge),
                prepaid_delivery_charge: String(prepaidDeliveryCharge),
                free_shipping_above: String(freeShippingAbove),
            };

            for (const [key, value] of Object.entries(updates)) {
                if (value !== undefined) {
                    await sql`
            INSERT INTO config (key, value) VALUES (${key}, ${value})
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
                }
            }

            return res.status(200).json({ ok: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error('Config error:', err);
        return res.status(500).json({ error: err.message });
    }
}
