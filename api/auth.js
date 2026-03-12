// api/auth.js — Admin PIN verification
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { pin } = req.body;
    const correctPin = process.env.ADMIN_PIN || '987654321';

    if (pin === correctPin) {
        return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ ok: false, error: 'Invalid PIN' });
}
