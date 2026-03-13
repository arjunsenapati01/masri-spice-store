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

        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            console.error('BLOB_READ_WRITE_TOKEN is missing');
            return res.status(500).json({ error: 'Storage configuration missing on server' });
        }

        // Stream the body directly to Vercel Blob
        const blob = await put(filename, req, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        return res.status(200).json({ url: blob.url });
    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ error: 'Server upload error: ' + err.message });
    }
}
