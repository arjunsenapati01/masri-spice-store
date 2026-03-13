export default function handler(req, res) {
    res.status(200).json({
        message: 'API is working!',
        node_version: process.version,
        env_keys: Object.keys(process.env).filter(k => k.includes('POSTGRES') || k.includes('ADMIN') || k.includes('BLOB'))
    });
}
