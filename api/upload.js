// api/upload.js — Upload image to Vercel Blob, return public URL
import { put } from '@vercel/blob';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
        const filename = searchParams.get('filename') || ('product-' + Date.now() + '.jpg');

        // put() automatically uses process.env.BLOB_READ_WRITE_TOKEN
        const blob = await put(filename, req, {
            access: 'public'
        });

        return res.status(200).json({ url: blob.url });
    } catch (err) {
        console.error('Vercel Blob Upload Error:', err);
        // Provide clear error if token is missing
        if (err.message.includes('BLOB_READ_WRITE_TOKEN')) {
            return res.status(500).json({ error: 'Storage Not Connected: Please go to Vercel Dashboard -> Storage -> Connect Blob' });
        }
        return res.status(500).json({ error: 'Upload Error: ' + err.message });
    }
}
